"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "studymate-history";

// Sample demonstration notes for quick one-click testing
const SAMPLE_NOTES = `Cellular Respiration and Energy Production in Biology
Photosynthesis and cellular respiration are complementary biochemical pathways. Cellular respiration is the set of metabolic reactions that convert biochemical energy from nutrients (such as glucose) into adenosine triphosphate (ATP), releasing waste products.

The process consists of three major stages:
1. Glycolysis: Takes place in the cytoplasm. Breaks down 1 glucose molecule (6 carbons) into 2 molecules of pyruvate (3 carbons each). Yields a net of 2 ATP and 2 NADH without requiring oxygen.
2. The Citric Acid Cycle (Krebs Cycle): Occurs inside the mitochondrial matrix. Converts acetyl-CoA derived from pyruvate into carbon dioxide, yielding 2 ATP, 6 NADH, and 2 FADH2 per glucose molecule.
3. Oxidative Phosphorylation & Electron Transport Chain: Located on the inner mitochondrial membrane. Electrons from NADH and FADH2 move through protein complexes, pumping protons across the membrane to create an electrochemical gradient. ATP Synthase uses this proton motive force (chemiosmosis) to synthesize approximately 28 to 32 ATP molecules. Oxygen acts as the terminal electron acceptor, forming water.`;

// Mode definitions
const STUDY_MODES = [
  {
    id: "summary",
    name: "Summary",
    icon: "📝",
    description: "Key concepts & overview",
    badge: "Concise",
  },
  {
    id: "quiz",
    name: "Quiz",
    icon: "🎯",
    description: "Active recall practice",
    badge: "Practice",
  },
  {
    id: "flashcards",
    name: "Flashcards",
    icon: "🗂️",
    description: "Flip cards for retention",
    badge: "Spaced",
  },
];

// Inline Markdown formatter for headings, lists, bold text, and code
function renderFormattedInline(text) {
  if (!text) return "";
  const parts = text.split(/(\*\*[^*]+?\*\*|`[^`]+?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="bg-slate-900 border border-slate-800 text-indigo-300 px-1 py-0.5 rounded text-[11px] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function MarkdownViewer({ content }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={index} className="h-1.5" />;
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={index}
              className="text-sm font-semibold text-indigo-300 pt-2 pb-0.5 border-b border-slate-800/60"
            >
              {renderFormattedInline(trimmed.replace(/^###\s+/, ""))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3
              key={index}
              className="text-base font-bold text-white pt-2.5 pb-1 border-b border-slate-800"
            >
              {renderFormattedInline(trimmed.replace(/^##\s+/, ""))}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={index} className="text-lg font-bold text-white pt-2 pb-1">
              {renderFormattedInline(trimmed.replace(/^#\s+/, ""))}
            </h2>
          );
        }

        if (/^[-*•]\s+/.test(trimmed)) {
          const itemText = trimmed.replace(/^[-*•]\s+/, "");
          return (
            <div key={index} className="flex items-start gap-2 pl-2">
              <span className="text-indigo-400 font-bold leading-tight">•</span>
              <div className="flex-1 text-slate-300">
                {renderFormattedInline(itemText)}
              </div>
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)/);
        if (numMatch) {
          return (
            <div key={index} className="flex items-start gap-2 pl-2 mt-1">
              <span className="text-indigo-400 font-mono text-xs font-semibold">
                {numMatch[1]}
              </span>
              <div className="flex-1 text-slate-200">
                {renderFormattedInline(numMatch[2])}
              </div>
            </div>
          );
        }

        return (
          <p key={index} className="text-slate-300">
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Interactive Quiz Component
function InteractiveQuizView({ data }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const questions = data?.questions || [];
  const totalQuestions = questions.length;

  const handleSelectOption = (questionIndex, optionKey) => {
    // Prevent changing answer after question has been answered
    if (selectedAnswers[questionIndex] !== undefined) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionKey,
    }));
  };

  const handleRetake = () => {
    setSelectedAnswers({});
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = questions.filter(
    (q, idx) => selectedAnswers[idx] === q.correctAnswer
  ).length;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Quiz Header Bar */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#090f1d] border border-slate-800">
        <div>
          <span className="text-xs font-semibold text-white">
            Practice Quiz ({totalQuestions} Questions)
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Select an option for immediate feedback and explanations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {answeredCount > 0 && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                correctCount === totalQuestions
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                  : "bg-indigo-950/50 text-indigo-300 border-indigo-800/50"
              }`}
            >
              Score: {correctCount}/{totalQuestions} (
              {Math.round((correctCount / totalQuestions) * 100)}%)
            </span>
          )}
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={handleRetake}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              ↺ Retake Quiz
            </button>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((q, qIndex) => {
          const selectedOption = selectedAnswers[qIndex];
          const hasAnswered = selectedOption !== undefined;
          const isCorrect = hasAnswered && selectedOption === q.correctAnswer;

          const optionsList = [
            { key: "A", text: q.options?.A || "" },
            { key: "B", text: q.options?.B || "" },
            { key: "C", text: q.options?.C || "" },
            { key: "D", text: q.options?.D || "" },
          ];

          return (
            <div
              key={qIndex}
              className="p-3.5 rounded-lg bg-[#070c18] border border-slate-800/80 flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-white text-xs sm:text-sm leading-snug">
                  {qIndex + 1}. {q.question}
                </span>
                {hasAnswered && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0 ${
                      isCorrect
                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
                        : "bg-rose-950/60 text-rose-300 border border-rose-800/50"
                    }`}
                  >
                    {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-1.5">
                {optionsList.map(({ key, text }) => {
                  const isSelected = selectedOption === key;
                  const isTheCorrectOption = q.correctAnswer === key;

                  let btnStyle =
                    "bg-[#090f1e] border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-[#0c1426]";

                  if (hasAnswered) {
                    if (isSelected && isCorrect) {
                      btnStyle =
                        "bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/30";
                    } else if (isSelected && !isCorrect) {
                      btnStyle =
                        "bg-rose-950/60 border-rose-500 text-rose-200 ring-1 ring-rose-500/30";
                    } else if (!isSelected && isTheCorrectOption) {
                      btnStyle =
                        "bg-emerald-950/30 border-emerald-700/60 text-emerald-300";
                    } else {
                      btnStyle =
                        "bg-[#090f1e]/60 border-slate-800/50 text-slate-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectOption(qIndex, key)}
                      disabled={hasAnswered}
                      className={`text-left px-3 py-2 rounded-md border text-xs transition-all flex items-center justify-between cursor-pointer disabled:cursor-default focus-visible:ring-1 focus-visible:ring-indigo-500 ${btnStyle}`}
                    >
                      <span className="flex items-start gap-2">
                        <strong className="font-mono text-[11px] text-slate-400">
                          {key})
                        </strong>
                        <span className="leading-snug">{text}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Answer & Explanation (revealed only after student answers) */}
              {hasAnswered && (
                <div className="mt-1 p-2.5 rounded-md bg-[#090f1e] border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                  <div className="font-semibold text-indigo-300 mb-0.5">
                    💡 Correct Answer: Option {q.correctAnswer}
                  </div>
                  <p className="text-slate-400">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Interactive Flashcards Component (One card at a time with Flip, Next, Prev, Flip All, Reset Deck)
function InteractiveFlashcardsView({ data }) {
  const cards = data?.cards || [];
  const totalCards = cards.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedMap, setFlippedMap] = useState({});

  if (totalCards === 0) return null;

  const currentCard = cards[currentIndex] || cards[0];
  const isCurrentFlipped = !!flippedMap[currentIndex];

  const handleFlipCurrent = () => {
    setFlippedMap((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleResetDeck = () => {
    setCurrentIndex(0);
    setFlippedMap({});
  };

  const areAllFlipped =
    cards.length > 0 && cards.every((_, i) => flippedMap[i]);

  const handleToggleFlipAll = () => {
    const nextState = {};
    const target = !areAllFlipped;
    cards.forEach((_, i) => {
      nextState[i] = target;
    });
    setFlippedMap(nextState);
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Flashcard Header Bar */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#090f1d] border border-slate-800">
        <div>
          <span className="text-xs font-semibold text-white">
            Flashcard Deck ({totalCards} Cards)
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Card {currentIndex + 1} of {totalCards}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleFlipAll}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={
              areAllFlipped
                ? "Reset all cards to front"
                : "Flip all cards to back"
            }
          >
            {areAllFlipped ? "↺ Reset All to Front" : "🔄 Flip All"}
          </button>
          <button
            type="button"
            onClick={handleResetDeck}
            className="text-xs px-2 py-1 rounded bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Return to card 1 with front visible"
          >
            Reset Deck
          </button>
        </div>
      </div>

      {/* Active Card Display - Keyboard accessible and flippable */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Flashcard ${currentIndex + 1} of ${totalCards}, showing ${
          isCurrentFlipped ? "answer" : "question"
        }. Press Enter or Space to flip.`}
        onClick={handleFlipCurrent}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleFlipCurrent();
          }
        }}
        className={`p-6 sm:p-8 rounded-xl border transition-all duration-200 cursor-pointer min-h-[220px] sm:min-h-[260px] flex flex-col justify-between select-none shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220] ${
          isCurrentFlipped
            ? "bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/30"
            : "bg-[#070c18] border-slate-800 hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Card {currentIndex + 1} of {totalCards}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
              isCurrentFlipped
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            {isCurrentFlipped ? "Back / Answer" : "Front / Question"}
          </span>
        </div>

        <div className="my-auto py-2">
          <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
            {isCurrentFlipped ? currentCard.back : currentCard.front}
          </p>
        </div>

        <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 mt-4">
          <span className="text-indigo-400 font-medium">
            {isCurrentFlipped
              ? "↺ Click or press Enter/Space to view question"
              : "↺ Click or press Enter/Space to reveal answer"}
          </span>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              handleFlipCurrent();
            }}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Flip
          </button>
        </div>
      </div>

      {/* Navigation: Prev / Touch-friendly Dots / Next */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-0.5">
          {cards.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className="p-1.5 rounded-full flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
              title={`Go to Card ${i + 1}`}
              aria-label={`Go to Card ${i + 1} of ${totalCards}`}
            >
              <span
                className={`h-2 rounded-full transition-all block ${
                  i === currentIndex
                    ? "bg-indigo-400 w-4"
                    : flippedMap[i]
                    ? "bg-indigo-700 w-2"
                    : "bg-slate-700 hover:bg-slate-600 w-2"
                }`}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex === totalCards - 1}
          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [notes, setNotes] = useState("");
  const [selectedMode, setSelectedMode] = useState("summary");
  const [validationError, setValidationError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [isStorageReady, setIsStorageReady] = useState(false);

  // Character and word count
  const characterCount = notes.length;
  const wordCount = notes.trim() === "" ? 0 : notes.trim().split(/\s+/).length;

  // Load saved history from localStorage on initial client mount
  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEY)
          : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          queueMicrotask(() => {
            setSessions(parsed);
            setIsStorageReady(true);
          });
          return;
        }
      }
    } catch (err) {
      console.error("Failed to load study history from localStorage:", err);
    }
    queueMicrotask(() => {
      setIsStorageReady(true);
    });
  }, []);

  // Save history to localStorage whenever sessions change, but ONLY after initial load completes
  useEffect(() => {
    if (!isStorageReady) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (err) {
      console.error("Failed to save study history to localStorage:", err);
    }
  }, [sessions, isStorageReady]);

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    if (validationError) setValidationError("");
    if (apiError) setApiError("");
  };

  const handleLoadSample = () => {
    setNotes(SAMPLE_NOTES);
    setValidationError("");
    setApiError("");
  };

  const handleClearNotes = () => {
    setNotes("");
    setValidationError("");
    setApiError("");
  };

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to generate
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isGenerating) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Real backend generation handler connecting to /api/generate with 30s timeout
  const handleGenerate = async () => {
    const trimmedNotes = notes.trim();

    if (!trimmedNotes) {
      setValidationError(
        "Please enter or paste your class notes in the box above before generating study materials."
      );
      return;
    }

    setValidationError("");
    setApiError("");
    setIsGenerating(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: trimmedNotes,
          mode: selectedMode,
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.error ||
          `Generation failed with status ${response.status}. Please try again.`;
        setApiError(message);
        return;
      }

      if (!data?.result) {
        setApiError(
          "No study material was returned by the AI. Please verify your notes and try again."
        );
        return;
      }

      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Extract a clean title from the notes
      const firstLine = trimmedNotes
        .split("\n")[0]
        .trim()
        .replace(/^[#*\-•\d.]+\s*/, "");
      const sessionTitle =
        firstLine.length > 0 && firstLine.length <= 50
          ? firstLine
          : `${selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} Session`;

      const resultPayload = {
        mode: selectedMode,
        timestamp,
        result: data.result,
        data: data.data || null,
        title: sessionTitle,
      };

      setGeneratedResult(resultPayload);

      // Persist to Study History
      const newEntry = {
        id: Date.now(),
        title: sessionTitle,
        notes: trimmedNotes,
        mode: selectedMode,
        result: data.result,
        data: data.data || null,
        savedAt: new Date().toISOString(),
        timestamp,
        characters: trimmedNotes.length,
      };

      setSessions((prev) => [newEntry, ...prev]);
    } catch (err) {
      console.error("Network or generation error:", err);
      if (err.name === "AbortError") {
        setApiError(
          "The generation request timed out after 30 seconds. Please check your network connection and try again."
        );
      } else {
        setApiError(
          "Unable to connect to the server. Please ensure the development server is running and check your connection."
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setIsGenerating(false);
    }
  };

  // Plain text representation for copy and download (defensive for strings and legacy objects)
  const getFormattedText = () => {
    if (!generatedResult) return "";

    // 1. If result is a non-empty string, return it directly
    if (
      typeof generatedResult.result === "string" &&
      generatedResult.result.trim()
    ) {
      return generatedResult.result;
    }

    // 2. Defensive handling for object-shaped results (legacy history or structured data)
    const dataObj =
      (generatedResult.data && typeof generatedResult.data === "object"
        ? generatedResult.data
        : null) ||
      (generatedResult.result && typeof generatedResult.result === "object"
        ? generatedResult.result
        : null);

    if (!dataObj) return "";

    const mode = generatedResult.mode || "study";
    const header = `StudyMate AI - ${mode.toUpperCase()} Study Sheet\n${"=".repeat(
      40
    )}\n\n`;

    // A. Quiz Object
    if (Array.isArray(dataObj.questions) && dataObj.questions.length > 0) {
      let text = header;
      text += `Practice Quiz (${dataObj.questions.length} Questions)\n\n`;
      dataObj.questions.forEach((q, idx) => {
        text += `Question ${idx + 1}: ${q.question || "Untitled Question"}\n`;
        if (q.options && typeof q.options === "object") {
          if (Array.isArray(q.options)) {
            q.options.forEach((opt, optIdx) => {
              text += `  ${String.fromCharCode(65 + optIdx)}) ${opt}\n`;
            });
          } else {
            ["A", "B", "C", "D"].forEach((key) => {
              if (q.options[key]) {
                text += `  ${key}) ${q.options[key]}\n`;
              }
            });
          }
        }
        if (q.correctAnswer) {
          text += `Correct Answer: Option ${q.correctAnswer}\n`;
        } else if (q.correctIndex !== undefined) {
          text += `Correct Answer: Option ${String.fromCharCode(
            65 + Number(q.correctIndex)
          )}\n`;
        }
        if (q.explanation) {
          text += `Explanation: ${q.explanation}\n`;
        }
        text += `\n`;
      });
      return text.trim();
    }

    // B. Flashcards Object
    if (Array.isArray(dataObj.cards) && dataObj.cards.length > 0) {
      let text = header;
      text += `Flashcard Deck (${dataObj.cards.length} Cards)\n\n`;
      dataObj.cards.forEach((c, idx) => {
        text += `Card ${idx + 1}${c.topic ? ` [${c.topic}]` : ""}:\n`;
        text += `  Front: ${c.front || ""}\n`;
        text += `  Back:  ${c.back || ""}\n\n`;
      });
      return text.trim();
    }

    // C. Legacy Summary Object (title, overview, keyConcepts, definitions)
    if (
      dataObj.title ||
      dataObj.overview ||
      dataObj.keyConcepts ||
      dataObj.definitions
    ) {
      let text = header;
      if (dataObj.title) text += `${dataObj.title}\n\n`;
      if (dataObj.overview) text += `OVERVIEW:\n${dataObj.overview}\n\n`;
      if (
        Array.isArray(dataObj.keyConcepts) &&
        dataObj.keyConcepts.length > 0
      ) {
        text += `KEY CONCEPTS:\n`;
        dataObj.keyConcepts.forEach((c) => {
          text += `• ${c.title || ""}: ${c.description || ""}\n`;
        });
        text += `\n`;
      }
      if (
        Array.isArray(dataObj.definitions) &&
        dataObj.definitions.length > 0
      ) {
        text += `DEFINITIONS:\n`;
        dataObj.definitions.forEach((d) => {
          text += `• ${d.term || ""}: ${d.definition || ""}\n`;
        });
        text += `\n`;
      }
      return text.trim();
    }

    // Safe fallback: never output "[object Object]"
    try {
      return JSON.stringify(dataObj, null, 2);
    } catch {
      return "";
    }
  };

  const handleCopy = () => {
    const textToCopy = getFormattedText();
    if (!textToCopy) return;
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const textToDownload = getFormattedText();
    if (!textToDownload) return;
    const blob = new Blob([textToDownload], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `studymate-${generatedResult.mode}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectSession = (session) => {
    if (session.notes) setNotes(session.notes);
    if (session.mode) setSelectedMode(session.mode);
    if (session.result) {
      setGeneratedResult({
        mode: session.mode,
        timestamp:
          session.timestamp ||
          (session.savedAt
            ? new Date(session.savedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Saved"),
        result: session.result,
        data: session.data || null,
        title: session.title,
      });
    }
    setValidationError("");
    setApiError("");
  };

  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleClearHistory = () => {
    setSessions([]);
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Subtle top ambient radial gradient for clean depth */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgba(99,102,241,0.08),transparent)]" />

      <div className="relative flex flex-col min-h-screen">
        {/* Navigation / Header */}
        <header className="border-b border-slate-800/80 bg-[#080d1a]/85 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
                🎓
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm sm:text-base tracking-tight text-white">
                  StudyMate AI
                </span>
                <span className="hidden sm:inline text-xs text-slate-400 font-normal">
                  Your personal AI study assistant
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Gemini Active
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Hero Section */}
          <section className="mb-6 sm:mb-8 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              Study smarter.{" "}
              <span className="text-indigo-400">Remember more.</span>
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Transform unstructured lecture notes, readings, or slides into
              concise summaries, active-recall quizzes, and spaced-repetition
              flashcards powered by Google Gemini.
            </p>
          </section>

          {/* Interactive Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* Left Column: Input, Mode Controls & History */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              {/* Card 1: Mode Selector */}
              <div className="bg-[#0b1220] border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Study Mode
                  </label>
                  <span className="text-[11px] text-indigo-400 font-medium">
                    {STUDY_MODES.find((m) => m.id === selectedMode)?.name} Mode
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {STUDY_MODES.map((mode) => {
                    const isSelected = selectedMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSelectedMode(mode.id)}
                        disabled={isGenerating}
                        aria-pressed={isSelected}
                        className={`text-left p-2.5 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                          isSelected
                            ? "bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/30"
                            : "bg-[#090f1d] border-slate-800/80 hover:border-slate-700 hover:bg-[#0c1426] text-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-sm">{mode.icon}</span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                          )}
                        </div>
                        <div>
                          <div
                            className={`font-semibold text-xs ${
                              isSelected ? "text-white" : "text-slate-300"
                            }`}
                          >
                            {mode.name}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                            {mode.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: Notes Input Area */}
              <div className="bg-[#0b1220] border border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Class Notes
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      disabled={isGenerating}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 transition-colors font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Paste Sample Notes
                    </button>
                    {notes && (
                      <button
                        type="button"
                        onClick={handleClearNotes}
                        disabled={isGenerating}
                        className="text-xs px-2 py-1 rounded-md bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Textarea with enforced maxLength */}
                <div className="relative">
                  <textarea
                    id="class-notes-input"
                    rows={10}
                    maxLength={15000}
                    value={notes}
                    onChange={handleNotesChange}
                    onKeyDown={handleKeyDown}
                    disabled={isGenerating}
                    placeholder="Paste lecture notes, textbook excerpts, or study material here... (Press Ctrl+Enter to generate)"
                    aria-label="Class study notes input"
                    className={`w-full bg-[#070c18] text-slate-100 placeholder-slate-500 rounded-lg p-3 text-xs sm:text-sm font-normal border transition-all duration-150 focus:outline-none resize-y leading-relaxed font-sans disabled:opacity-70 disabled:cursor-not-allowed ${
                      validationError
                        ? "border-rose-500/80 ring-1 ring-rose-500/30"
                        : characterCount >= 13500
                        ? "border-amber-500/70 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                        : "border-slate-800/90 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30"
                    }`}
                  />
                </div>

                {/* Counter & Warning Indicator */}
                <div className="mt-2.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono px-2 py-0.5 rounded border text-[11px] transition-colors ${
                          characterCount >= 15000
                            ? "bg-rose-950/60 border-rose-800/80 text-rose-300"
                            : characterCount >= 13500
                            ? "bg-amber-950/50 border-amber-800/60 text-amber-300"
                            : "bg-slate-900/80 border-slate-800 text-slate-300"
                        }`}
                      >
                        {characterCount.toLocaleString()} / 15,000 characters
                      </span>
                      {wordCount > 0 && (
                        <span className="text-slate-500 text-[11px]">
                          ({wordCount.toLocaleString()} words)
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] ${
                        characterCount >= 15000
                          ? "text-rose-400 font-medium"
                          : characterCount >= 13500
                          ? "text-amber-400 font-medium"
                          : "text-slate-500"
                      }`}
                    >
                      {characterCount >= 15000
                        ? "Maximum limit reached (15,000 max)"
                        : characterCount >= 13500
                        ? `Approaching limit (${(
                            15000 - characterCount
                          ).toLocaleString()} left)`
                        : characterCount === 0
                        ? "Awaiting notes"
                        : characterCount < 100
                        ? "Brief notes"
                        : "Ready to generate (Ctrl+Enter)"}
                    </span>
                  </div>

                  {validationError && (
                    <div
                      role="alert"
                      className="p-2.5 rounded-lg bg-rose-950/25 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2"
                    >
                      <span className="text-sm leading-none">⚠️</span>
                      <p className="leading-snug">{validationError}</p>
                    </div>
                  )}

                  {apiError && (
                    <div
                      role="alert"
                      className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2"
                    >
                      <span className="text-sm leading-none mt-0.5">⚠️</span>
                      <div className="flex-1">
                        <strong className="block text-rose-200">
                          Generation Error
                        </strong>
                        <p className="leading-snug mt-0.5 text-rose-300/90">
                          {apiError}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Prominent Generate Button */}
                <button
                  type="button"
                  id="generate-button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  aria-label="Generate study material from notes"
                  className="mt-3.5 w-full py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <svg
                        className="animate-spin h-3.5 w-3.5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                      <span>Generating with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Generate Study Material</span>
                      <span className="text-[11px] bg-white/15 px-2 py-0.5 rounded capitalize">
                        {selectedMode}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Study History Section */}
              <div className="bg-[#0b1220] border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🕒</span>
                    <h3 className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">
                      Study History
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {sessions.length} Saved
                    </span>
                    {sessions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer focus-visible:outline-none"
                        title="Clear all saved sessions"
                        aria-label="Clear all saved study history sessions"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {sessions.length === 0 ? (
                  <div className="p-3 rounded-lg bg-[#070c18] border border-dashed border-slate-800/80 text-center">
                    <div className="text-xs font-medium text-slate-400">
                      No saved sessions yet
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 max-w-sm mx-auto leading-relaxed">
                      Generated study sessions will appear here automatically
                      and can be restored with one click.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSession(s)}
                        className="p-2 rounded-lg bg-[#070c18] border border-slate-800/80 hover:border-slate-700/80 transition-colors cursor-pointer flex items-center justify-between text-xs group focus-visible:ring-1 focus-visible:ring-indigo-500"
                        title="Click to reload this study session"
                      >
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                          <span className="text-xs flex-shrink-0">
                            {s.mode === "summary"
                              ? "📝"
                              : s.mode === "quiz"
                              ? "🎯"
                              : "🗂️"}
                          </span>
                          <div className="overflow-hidden">
                            <div className="font-medium text-slate-200 group-hover:text-white line-clamp-1 text-xs transition-colors">
                              {s.title}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {s.timestamp ||
                                (s.savedAt
                                  ? new Date(s.savedAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Saved")}{" "}
                              •{" "}
                              {(
                                s.characters ||
                                s.notes?.length ||
                                0
                              ).toLocaleString()}{" "}
                              chars
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] uppercase font-semibold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40">
                            {s.mode}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(s.id, e)}
                            className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors text-xs cursor-pointer"
                            title="Remove from history"
                            aria-label={`Remove ${s.title} from history`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Output & Results Panel */}
            <div className="lg:col-span-6">
              <div className="bg-[#0b1220] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-sm min-h-[540px] flex flex-col">
                {/* Results Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📊</span>
                    <div>
                      <h2 className="text-xs sm:text-sm font-semibold text-slate-200">
                        Generated Study Material
                      </h2>
                      <p className="text-[10px] text-slate-400">
                        {generatedResult
                          ? `Ready • Generated at ${generatedResult.timestamp}`
                          : "Awaiting your notes"}
                      </p>
                    </div>
                  </div>

                  {generatedResult && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopy}
                        aria-label={
                          copied
                            ? "Study material copied to clipboard"
                            : "Copy generated material to clipboard"
                        }
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none"
                      >
                        <span aria-hidden="true">{copied ? "✓" : "📋"}</span>
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </button>
                      <span className="sr-only" aria-live="polite">
                        {copied ? "Study material copied to clipboard" : ""}
                      </span>

                      <button
                        type="button"
                        onClick={handleDownload}
                        aria-label="Download study notes as plain text file"
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none"
                        title="Download as .txt study sheet"
                      >
                        📥 Download
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGeneratedResult(null);
                          setApiError("");
                        }}
                        aria-label="Reset results panel"
                        className="text-xs px-2 py-1 rounded-md bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>

                {/* Loading State */}
                {isGenerating && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center my-auto">
                    <div className="w-9 h-9 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                    <div className="text-sm font-semibold text-white">
                      Generating with Gemini AI...
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Analyzing your notes and crafting structured{" "}
                      <span className="text-indigo-300 font-medium capitalize">
                        {selectedMode}
                      </span>{" "}
                      materials.
                    </p>
                  </div>
                )}

                {/* Friendly Empty State */}
                {!generatedResult && !isGenerating && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6 my-auto">
                    <div className="w-11 h-11 rounded-xl bg-indigo-950/40 border border-indigo-800/30 flex items-center justify-center text-xl mb-3 shadow-inner">
                      📚
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-200 mb-1">
                      Your study material will appear here
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
                      Paste notes on the left, pick a mode, and click{" "}
                      <strong className="text-slate-300 font-medium">
                        Generate Study Material
                      </strong>{" "}
                      to transform your notes with Gemini AI.
                    </p>

                    {/* Feature guide cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full text-left">
                      <div className="p-2.5 rounded-lg bg-[#070c18] border border-slate-800/80">
                        <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1 mb-0.5">
                          <span>📝</span> Summary
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Bullet points, key terms & topic overview.
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#070c18] border border-slate-800/80">
                        <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1 mb-0.5">
                          <span>🎯</span> Quiz
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Practice questions with answer feedback.
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#070c18] border border-slate-800/80">
                        <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1 mb-0.5">
                          <span>🗂️</span> Flashcards
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Interactive flip cards to drill recall.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results Display */}
                {generatedResult && !isGenerating && (
                  <div className="flex-1 flex flex-col gap-3">
                    {/* Live AI Status Bar */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                          Gemini AI •{" "}
                          <span className="capitalize">
                            {generatedResult.mode}
                          </span>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {generatedResult.timestamp}
                      </span>
                    </div>

                    {/* Interactive Component or Resilient Markdown Fallback Container */}
                    <div className="p-3.5 sm:p-4 rounded-lg bg-[#070c18] border border-slate-800/80 flex-1 overflow-y-auto max-h-[620px]">
                      {generatedResult.mode === "quiz" &&
                      generatedResult.data?.questions?.length > 0 ? (
                        <InteractiveQuizView data={generatedResult.data} />
                      ) : generatedResult.mode === "flashcards" &&
                        generatedResult.data?.cards?.length > 0 ? (
                        <InteractiveFlashcardsView
                          data={generatedResult.data}
                        />
                      ) : (
                        <MarkdownViewer content={generatedResult.result} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/70 bg-[#080d1a] py-4 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              <span className="font-medium text-slate-400">StudyMate AI</span> •
              Frontend Portfolio Suite
            </div>
            <div>Built with Next.js App Router & Tailwind CSS</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
