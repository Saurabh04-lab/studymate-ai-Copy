import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimitInstance = null;

function getRateLimiter() {
  if (ratelimitInstance) {
    return ratelimitInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    const redis = new Redis({
      url,
      token,
    });

    ratelimitInstance = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: false,
    });

    return ratelimitInstance;
  } catch (error) {
    console.error("Failed to initialize rate limiter:", error?.message || error);
    return null;
  }
}

function getClientIp(request) {
  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.trim()) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return "127.0.0.1";
}

const MODEL_ID = "gemini-3.5-flash-lite";

const VALID_MODES = ["summary", "quiz", "flashcards"];

const MODE_PROMPTS = {
  summary: `You are an expert study assistant. Summarize the following notes in simple, clear language.
Structure your response cleanly with:
1. Executive Overview / Main Takeaway
2. Key Concepts & Core Principles
3. Important Definitions & Terminology
4. High-Yield Exam Revision Points

STUDY NOTES:
`,
  quiz: `You are an expert study assistant. Based ONLY on the following study notes, generate exactly five (5) high-yield multiple-choice questions (MCQs).
Respond with ONLY a valid JSON object matching this exact schema:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correctAnswer": "A",
      "explanation": "Clear explanation of why this answer is correct."
    }
  ]
}

STRICT REQUIREMENTS:
- Generate exactly 5 questions.
- Each question MUST have exactly four options keyed as "A", "B", "C", and "D".
- "correctAnswer" MUST be exactly one of: "A", "B", "C", or "D".
- Output raw JSON only. Do NOT include markdown code fences, preambles, or conversational text.

STUDY NOTES:
`,
  flashcards: `You are an expert study assistant. Based ONLY on the following study notes, generate exactly eight (8) high-yield active recall flashcards.
Respond with ONLY a valid JSON object matching this exact schema:
{
  "cards": [
    {
      "front": "Clear question, prompt, or core concept",
      "back": "Accurate, concise answer or explanation"
    }
  ]
}

STRICT REQUIREMENTS:
- Generate exactly 8 flashcards.
- Ensure both "front" and "back" are non-empty strings.
- Output raw JSON only. Do NOT include markdown code fences, preambles, or conversational text.

STUDY NOTES:
`,
};

// Safe JSON extractor that handles raw JSON or markdown code-fenced JSON
function extractJson(text) {
  if (!text || typeof text !== "string") return null;

  const trimmed = text.trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Extract from markdown code fence ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // 3. Find outermost curly braces { ... }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

// Validate Quiz structured data
function validateQuizData(rawObj) {
  if (!rawObj || typeof rawObj !== "object") return null;
  if (!Array.isArray(rawObj.questions) || rawObj.questions.length === 0) {
    return null;
  }

  const validatedQuestions = [];

  for (const item of rawObj.questions) {
    if (!item || typeof item !== "object") return null;

    const questionText =
      typeof item.question === "string" ? item.question.trim() : "";
    if (!questionText) return null;

    let optionsObj = null;

    if (
      item.options &&
      typeof item.options === "object" &&
      !Array.isArray(item.options)
    ) {
      const optA = String(item.options.A || "").trim();
      const optB = String(item.options.B || "").trim();
      const optC = String(item.options.C || "").trim();
      const optD = String(item.options.D || "").trim();

      if (optA && optB && optC && optD) {
        optionsObj = { A: optA, B: optB, C: optC, D: optD };
      }
    } else if (Array.isArray(item.options) && item.options.length >= 4) {
      optionsObj = {
        A: String(item.options[0] || "").trim(),
        B: String(item.options[1] || "").trim(),
        C: String(item.options[2] || "").trim(),
        D: String(item.options[3] || "").trim(),
      };
    }

    if (!optionsObj) return null;

    let correctAnswer = String(item.correctAnswer || "")
      .trim()
      .toUpperCase();

    // Map 0, 1, 2, 3 to A, B, C, D if model used indices
    if (["0", "1", "2", "3"].includes(correctAnswer)) {
      correctAnswer = ["A", "B", "C", "D"][parseInt(correctAnswer, 10)];
    }

    if (!["A", "B", "C", "D"].includes(correctAnswer)) {
      return null;
    }

    const explanation =
      typeof item.explanation === "string" && item.explanation.trim()
        ? item.explanation.trim()
        : `The correct answer is Option ${correctAnswer}.`;

    validatedQuestions.push({
      question: questionText,
      options: optionsObj,
      correctAnswer,
      explanation,
    });
  }

  if (validatedQuestions.length === 0) return null;

  return { questions: validatedQuestions };
}

// Validate Flashcards structured data
function validateFlashcardData(rawObj) {
  if (!rawObj || typeof rawObj !== "object") return null;
  if (!Array.isArray(rawObj.cards) || rawObj.cards.length === 0) {
    return null;
  }

  const validatedCards = [];

  for (const item of rawObj.cards) {
    if (!item || typeof item !== "object") return null;

    const front = typeof item.front === "string" ? item.front.trim() : "";
    const back = typeof item.back === "string" ? item.back.trim() : "";

    if (!front || !back) return null;

    validatedCards.push({ front, back });
  }

  if (validatedCards.length === 0) return null;

  return { cards: validatedCards };
}

// Convert structured quiz to clean readable text for Copy/Download
function formatQuizToText(quizData) {
  let text = `Practice Quiz (${quizData.questions.length} Questions)\n`;
  text += `${"=".repeat(40)}\n\n`;

  quizData.questions.forEach((q, idx) => {
    text += `Question ${idx + 1}: ${q.question}\n`;
    text += `  A) ${q.options.A}\n`;
    text += `  B) ${q.options.B}\n`;
    text += `  C) ${q.options.C}\n`;
    text += `  D) ${q.options.D}\n`;
    text += `Correct Answer: Option ${q.correctAnswer}\n`;
    text += `Explanation: ${q.explanation}\n\n`;
  });

  return text.trim();
}

// Convert structured flashcards to clean readable text for Copy/Download
function formatFlashcardsToText(flashcardData) {
  let text = `Flashcard Deck (${flashcardData.cards.length} Cards)\n`;
  text += `${"=".repeat(40)}\n\n`;

  flashcardData.cards.forEach((c, idx) => {
    text += `Card ${idx + 1}:\n`;
    text += `  Front: ${c.front}\n`;
    text += `  Back:  ${c.back}\n\n`;
  });

  return text.trim();
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const { notes, mode } = body || {};

    // 1. Validate study mode
    if (
      !mode ||
      typeof mode !== "string" ||
      !VALID_MODES.includes(mode.toLowerCase())
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid study mode. Must be one of: summary, quiz, flashcards.",
        },
        { status: 400 }
      );
    }

    const selectedMode = mode.toLowerCase();

    // 2. Validate notes: reject empty or whitespace-only
    if (!notes || typeof notes !== "string" || !notes.trim()) {
      return NextResponse.json(
        { error: "Study notes are required." },
        { status: 400 }
      );
    }

    // 3. Validate notes length: reject notes longer than 15,000 characters
    if (notes.length > 15000) {
      return NextResponse.json(
        { error: "Study notes cannot exceed 15,000 characters." },
        { status: 400 }
      );
    }

    // 4. Distributed Rate Limiting (maximum 10 requests per IP in rolling 60s window)
    const clientIp = getClientIp(request);
    let rateLimitResult;

    try {
      const limiter = getRateLimiter();
      if (!limiter) {
        return NextResponse.json(
          {
            error:
              "Rate limiting service is unavailable. Please try again later.",
          },
          { status: 503 }
        );
      }

      rateLimitResult = await limiter.limit(clientIp);
    } catch (rlError) {
      console.error(
        "Rate limiting check failed:",
        rlError?.message || rlError
      );
      return NextResponse.json(
        {
          error:
            "Rate limiting service is unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    if (!rateLimitResult.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      );

      return NextResponse.json(
        {
          error: `Rate limit exceeded. Too many requests. Please try again in ${retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    // 5. Validate API key presence
    const apiKey = process.env.GEMINI_API_KEY;
    if (
      !apiKey ||
      !apiKey.trim() ||
      apiKey === "PASTE_YOUR_ACTUAL_KEY_HERE"
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini API key is not configured. Please add your GEMINI_API_KEY to .env.local.",
        },
        { status: 500 }
      );
    }

    // 6. Initialize GoogleGenAI SDK
    const ai = new GoogleGenAI({ apiKey });

    // 6. Build prompt combining mode instructions and student notes
    const prompt = `${MODE_PROMPTS[selectedMode]}\n${notes.trim()}`;

    // 7. Call Gemini model
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        maxOutputTokens: 1800,
        temperature: 0.4,
      },
    });

    const generatedText = response?.text || "";

    if (!generatedText) {
      return NextResponse.json(
        { error: "No content was generated by the model. Please try again." },
        { status: 502 }
      );
    }

    // 8. Process structured data for quiz and flashcards
    let structuredData = null;
    let readableResult = generatedText;

    if (selectedMode === "quiz") {
      const parsedJson = extractJson(generatedText);
      const validatedQuiz = validateQuizData(parsedJson);

      if (validatedQuiz) {
        structuredData = validatedQuiz;
        readableResult = formatQuizToText(validatedQuiz);
      }
    } else if (selectedMode === "flashcards") {
      const parsedJson = extractJson(generatedText);
      const validatedFlashcards = validateFlashcardData(parsedJson);

      if (validatedFlashcards) {
        structuredData = validatedFlashcards;
        readableResult = formatFlashcardsToText(validatedFlashcards);
      }
    }

    // 9. Return both readable text and structured data (or null if unavailable)
    return NextResponse.json({
      result: readableResult,
      data: structuredData,
    });
  } catch (error) {
    // Log error on server without leaking raw keys or secrets
    console.error("Gemini API generation error:", error?.message || error);

    let clientMessage = "Failed to generate study material. Please try again.";
    let statusCode = 500;

    if (error?.status === 400) {
      clientMessage =
        "Invalid request or API key is invalid. Please verify your Gemini API key in .env.local.";
      statusCode = 400;
    } else if (error?.status === 403) {
      clientMessage =
        "Access forbidden. Please verify your Gemini API key permissions.";
      statusCode = 403;
    } else if (error?.status === 404) {
      clientMessage = `Model "${MODEL_ID}" was not found or is unavailable for this API key.`;
      statusCode = 404;
    } else if (error?.status === 429) {
      clientMessage =
        "Gemini API rate limit exceeded. Please wait a moment and try again.";
      statusCode = 429;
    } else if (error?.status === 503) {
      clientMessage =
        "Gemini service is temporarily unavailable. Please try again shortly.";
      statusCode = 503;
    }

    return NextResponse.json({ error: clientMessage }, { status: statusCode });
  }
}
