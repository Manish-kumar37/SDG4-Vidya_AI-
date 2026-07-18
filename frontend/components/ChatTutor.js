"use client";

import { useEffect, useRef, useState } from "react";

const LANG_SPEECH_CODE = { en: "en-IN", hi: "hi-IN", gu: "gu-IN" };

export default function ChatTutor({
  style,
  level,
  language,
  lowBandwidth,
  onQuizResult,
  onTopicLogged,
}) {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text:
        "Namaste! I'm Vidya, your AI tutor. Ask me about any topic you're studying — I'll explain it in the way that suits you best.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingCheck, setPendingCheck] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function speak(text) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANG_SPEECH_CODE[language] || "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  async function send(overrideText, lastAnswerCorrect = null) {
    const text = overrideText ?? input;
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      const history = messages
        .filter((m, i) => !(i === 0 && m.role === "bot"))
        .map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        }));

      const res = await fetch(`${backendUrl}/api/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          style,
          level,
          language,
          lowBandwidth,
          lastAnswerCorrect,
          history,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: `⚠️ ${data.error || "Something went wrong."}` },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
        setPendingCheck(/quick check:/i.test(data.reply));
        if (onTopicLogged) onTopicLogged(text);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "⚠️ Couldn't reach the tutor. Check your connection or API keys.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function markCheck(correct) {
    setPendingCheck(false);
    if (onQuizResult) onQuizResult(correct);
    send(
      correct
        ? "I got the quick check right."
        : "I wasn't sure / got the quick check wrong.",
      correct
    );
  }

  return (
    <div>
      <div className="chat-window" ref={scrollRef}>
        {messages.map((m, i) => (
          <div className={"msg " + m.role} key={i}>
            {m.text}
            {m.role === "bot" && (
              <button
                className="speak-btn"
                onClick={() => speak(m.text)}
                aria-label="Read this response aloud"
              >
                🔊 Listen
              </button>
            )}
          </div>
        ))}
        {loading && <div className="msg bot">Thinking…</div>}
      </div>

      {pendingCheck && (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button className="pill-btn" onClick={() => markCheck(true)}>
            ✅ I got it right
          </button>
          <button className="pill-btn" onClick={() => markCheck(false)}>
            ❌ Not quite / unsure
          </button>
        </div>
      )}

      <div className="chat-input-row">
        <textarea
          rows={2}
          placeholder="Ask about any topic, e.g. 'Explain photosynthesis' or 'How do I factor quadratics?'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button className="btn-primary" onClick={() => send()} disabled={loading}>
          Ask
        </button>
      </div>
    </div>
  );
}
