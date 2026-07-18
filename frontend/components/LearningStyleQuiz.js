"use client";

import { useState } from "react";

const QUESTIONS = [
  {
    q: "When you learn something new, you'd rather...",
    options: [
      { label: "See a picture, chart, or diagram of it", style: "visual" },
      { label: "Hear someone explain it out loud", style: "auditory" },
      { label: "Read a clear written explanation", style: "reading_writing" },
      { label: "Try it yourself hands-on", style: "kinesthetic" },
    ],
  },
  {
    q: "When you're stuck on a problem, you usually...",
    options: [
      { label: "Draw or sketch it out", style: "visual" },
      { label: "Talk it through with someone", style: "auditory" },
      { label: "Re-read your notes carefully", style: "reading_writing" },
      { label: "Try a few approaches by trial and error", style: "kinesthetic" },
    ],
  },
  {
    q: "You remember things best when they're...",
    options: [
      { label: "Shown with colors, maps, or images", style: "visual" },
      { label: "Explained in a story or discussion", style: "auditory" },
      { label: "Written down as a list or definition", style: "reading_writing" },
      { label: "Practiced physically or through examples", style: "kinesthetic" },
    ],
  },
  {
    q: "In class, you pay attention best when the teacher...",
    options: [
      { label: "Uses slides, diagrams, or visuals", style: "visual" },
      { label: "Tells stories or asks questions aloud", style: "auditory" },
      { label: "Gives handouts or writes on the board", style: "reading_writing" },
      { label: "Runs an activity or experiment", style: "kinesthetic" },
    ],
  },
  {
    q: "Pick the revision method that sounds most like you:",
    options: [
      { label: "Mind maps and highlighted diagrams", style: "visual" },
      { label: "Reciting answers out loud or in a group", style: "auditory" },
      { label: "Rewriting notes in your own words", style: "reading_writing" },
      { label: "Solving practice problems repeatedly", style: "kinesthetic" },
    ],
  },
];

const STYLE_LABELS = {
  visual: "Visual learner",
  auditory: "Auditory learner",
  reading_writing: "Reading & writing learner",
  kinesthetic: "Kinesthetic (hands-on) learner",
};

export default function LearningStyleQuiz({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  function select(qIndex, style) {
    const next = { ...answers, [qIndex]: style };
    setAnswers(next);
    if (Object.keys(next).length === QUESTIONS.length) {
      const counts = {};
      Object.values(next).forEach((s) => (counts[s] = (counts[s] || 0) + 1));
      const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner);
      onComplete(winner);
    }
  }

  if (result) {
    return (
      <div>
        <p style={{ marginBottom: 10 }}>Your diagnostic result:</p>
        <span className="style-badge">🎯 {STYLE_LABELS[result]}</span>
        <p className="muted" style={{ marginTop: 14, fontSize: "0.9rem" }}>
          Vidya will now shape every explanation around this style. You can
          retake this any time — learning styles aren't fixed for life.
        </p>
        <button
          className="btn-secondary"
          style={{ marginTop: 12 }}
          onClick={() => {
            setAnswers({});
            setResult(null);
          }}
        >
          Retake diagnostic
        </button>
      </div>
    );
  }

  return (
    <div>
      {QUESTIONS.map((item, qi) => (
        <div className="quiz-q" key={qi}>
          <p>
            {qi + 1}. {item.q}
          </p>
          <div className="quiz-options">
            {item.options.map((opt) => (
              <button
                key={opt.label}
                className={
                  "quiz-option" + (answers[qi] === opt.style ? " selected" : "")
                }
                onClick={() => select(qi, opt.style)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="muted" style={{ fontSize: "0.85rem" }}>
        {Object.keys(answers).length}/{QUESTIONS.length} answered
      </p>
    </div>
  );
}
