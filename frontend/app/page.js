"use client";

import { useEffect, useState } from "react";
import LearningStyleQuiz from "../components/LearningStyleQuiz";
import ChatTutor from "../components/ChatTutor";
import ProgressDashboard from "../components/ProgressDashboard";
import Notebook from "../components/Notebook";

const STORAGE_KEY = "vidya-ai-progress-v1";

export default function Home() {
  const [mode, setMode] = useState("notebook"); // "notebook" | "slate"
  const [dyslexia, setDyslexia] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [language, setLanguage] = useState("en");
  const [lowBandwidth, setLowBandwidth] = useState(false);

  const [style, setStyle] = useState("reading_writing");
  const [level, setLevel] = useState("beginner");

  const [progress, setProgress] = useState({
    topicsCovered: [],
    correct: 0,
    incorrect: 0,
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) setProgress(saved);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    document.body.setAttribute("data-mode", mode);
  }, [mode]);
  useEffect(() => {
    document.body.setAttribute("data-dyslexia", String(dyslexia));
  }, [dyslexia]);
  useEffect(() => {
    document.body.setAttribute("data-contrast", String(contrast));
  }, [contrast]);

  function handleQuizResult(correct) {
    setProgress((p) => ({
      ...p,
      correct: p.correct + (correct ? 1 : 0),
      incorrect: p.incorrect + (correct ? 0 : 1),
    }));
    // gently auto-adjust difficulty
    setLevel((cur) => {
      if (correct && cur === "beginner") return "intermediate";
      if (correct && cur === "intermediate") return "advanced";
      if (!correct && cur === "advanced") return "intermediate";
      if (!correct && cur === "intermediate") return "beginner";
      return cur;
    });
  }

  function handleTopicLogged(topicText) {
    setProgress((p) => {
      if (p.topicsCovered.includes(topicText)) return p;
      return { ...p, topicsCovered: [...p.topicsCovered, topicText] };
    });
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            Vidya AI <small>SDG 4 · Quality Education</small>
          </div>
          <div className="controls">
            <button
              className={"pill-btn" + (mode === "notebook" ? " active" : "")}
              onClick={() => setMode("notebook")}
            >
              📓 Notebook mode
            </button>
            <button
              className={"pill-btn" + (mode === "slate" ? " active" : "")}
              onClick={() => setMode("slate")}
            >
              🖤 Slate mode
            </button>
            <select
              className="pill-btn"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Response language"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="gu">ગુજરાતી</option>
            </select>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="chalk-texture" />
        <div className="wrap">
          <span className="eyebrow">AI automation and Intelligent solutions · IBM SkillsBuild × BharatCare CSRbox × AICTE</span>
          <h1>
            One AI tutor. <em>Every</em> kind of student.
          </h1>
          <p className="lede muted">
            Vidya is an adaptive AI learning companion built for SDG 4. It
            diagnoses how a student learns best, teaches in that style, checks
            understanding after every idea, speaks in the student's own
            language, and works just as well on a slow connection as a fast
            one — because quality education shouldn't depend on which school,
            device, or ability a student has.
          </p>
          <div className="hero-actions">
            <a href="#diagnose" className="btn-primary">
              Try the diagnostic
            </a>
            <a href="#tutor" className="btn-secondary">
              Talk to the tutor
            </a>
            <a href="#notebook" className="btn-secondary">
              Open my notebook
            </a>
          </div>
          <div className="badge-row">
            <span className="tag">VARK-adaptive explanations</span>
            <span className="tag">Multilingual (EN / HI / GU)</span>
            <span className="tag">Low-bandwidth mode</span>
            <span className="tag">Dyslexia-friendly + TTS</span>
            <span className="tag">Auto difficulty adjustment</span>
            <span className="tag">IBM Granite via watsonx.ai</span>
          </div>
        </div>
      </section>

      <section className="wrap">
        <h2 className="section-title">How Vidya adapts to a student</h2>
        <p className="section-sub muted">
          The same four-step loop runs every time a student asks a question —
          it's what turns a generic chatbot into a real tutor.
        </p>
        <div className="steps">
          <div className="step">
            <span className="num">01</span>
            <h3>Diagnose</h3>
            <p>A 5-question check finds the student's learning style and starting level.</p>
          </div>
          <div className="step">
            <span className="num">02</span>
            <h3>Explain</h3>
            <p>The AI reshapes its explanation — visuals, stories, text, or hands-on examples.</p>
          </div>
          <div className="step">
            <span className="num">03</span>
            <h3>Check</h3>
            <p>Every answer ends with one quick comprehension question, not a wall of text.</p>
          </div>
          <div className="step">
            <span className="num">04</span>
            <h3>Adjust</h3>
            <p>Right answers raise the difficulty; wrong ones re-teach the idea differently.</p>
          </div>
        </div>
      </section>

      <section className="wrap" id="diagnose">
        <h2 className="section-title">Step 1 · Learning style diagnostic</h2>
        <p className="section-sub muted">
          Answer five short questions so the tutor knows how to teach you.
        </p>
        <div className="card">
          <LearningStyleQuiz onComplete={setStyle} />
        </div>
      </section>

      <section className="wrap" id="tutor">
        <h2 className="section-title">Step 2 · Talk to your tutor</h2>
        <p className="section-sub muted">
          Currently teaching a <strong>{level}</strong>-level{" "}
          <strong>{style.replace("_", " & ")}</strong> learner
          {lowBandwidth ? " in low-bandwidth mode" : ""}.
        </p>
        <div className="grid-2">
          <div className="card">
            <ChatTutor
              style={style}
              level={level}
              language={language}
              lowBandwidth={lowBandwidth}
              onQuizResult={handleQuizResult}
              onTopicLogged={handleTopicLogged}
            />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>
              Accessibility & access
            </h3>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              These are real constraints for students across India, not
              cosmetic settings — a student on a shared 2G phone needs a
              different experience than one on a laptop.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={lowBandwidth}
                  onChange={(e) => setLowBandwidth(e.target.checked)}
                />
                Low-bandwidth mode (short answers, less data)
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={dyslexia}
                  onChange={(e) => setDyslexia(e.target.checked)}
                />
                Dyslexia-friendly font & spacing
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={contrast}
                  onChange={(e) => setContrast(e.target.checked)}
                />
                High-contrast mode (low vision)
              </label>
            </div>
            <p className="muted" style={{ fontSize: "0.85rem", marginTop: 14 }}>
              Every tutor response also has a 🔊 Listen button, powered by the
              browser's built-in text-to-speech — no extra cost, and it works
              in Hindi and Gujarati too.
            </p>
          </div>
        </div>
      </section>

      <section className="wrap">
        <h2 className="section-title">Step 3 · Progress, for the student and the teacher</h2>
        <p className="section-sub muted">
          A quiet dashboard, not a leaderboard — the goal is self-awareness,
          not competition.
        </p>
        <div className="card">
          <ProgressDashboard progress={progress} />
        </div>
      </section>

      <section className="wrap" id="notebook">
        <h2 className="section-title">Step 4 · My Notebook</h2>
        <p className="section-sub muted">
          Build a visual study page — write notes, pull in free photos, drag
          them into place, and download the page as a PDF. No printer,
          scissors, or glue stick needed.
        </p>
        <div className="card">
          <Notebook />
        </div>
      </section>

      <footer className="wrap muted">
        <p>
          Built for the IBM SkillsBuild × 1M1B × AICTE "AI for Sustainability"
          virtual internship — addressing UN SDG 4 (Quality Education) by
          making adaptive, one-on-one tutoring available regardless of
          learning style, language, disability, or bandwidth.
        </p>
      </footer>
    </>
  );
}
