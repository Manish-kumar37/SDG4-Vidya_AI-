"use client";

import { useEffect, useRef, useState } from "react";

const PAGE_W = 794; // ~ A4 at 96dpi
const PAGE_H = 1123;

let idCounter = 1;
function nextId() {
  return `item-${idCounter++}`;
}

const STORAGE_KEY = "vidya-ai-notebook-v1";

export default function Notebook() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [exporting, setExporting] = useState(false);

  const pageRef = useRef(null);
  const dragState = useRef(null); // { id, offsetX, offsetY, w, h }

  // Load any saved notebook on first mount, and bump idCounter past
  // whatever's already saved so new items never collide with old ones.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && Array.isArray(saved)) {
        setItems(saved);
        const maxNum = saved.reduce((max, it) => {
          const n = parseInt(String(it.id).replace("item-", ""), 10);
          return Number.isFinite(n) ? Math.max(max, n) : max;
        }, 0);
        idCounter = maxNum + 1;
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Save on every change, once the initial load has finished (so we don't
  // immediately overwrite saved data with an empty array on first render).
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  // Drag is tracked on the WINDOW, not just the page div, so it always ends
  // cleanly even if the mouse is released outside the notebook page — this
  // is what previously caused items to "jump" on the next click.
  useEffect(() => {
    function onWindowMouseMove(e) {
      if (!dragState.current || !pageRef.current) return;
      const pageRect = pageRef.current.getBoundingClientRect();
      const { id, offsetX, offsetY, w, h } = dragState.current;
      let x = e.clientX - pageRect.left - offsetX;
      let y = e.clientY - pageRect.top - offsetY;
      x = Math.max(0, Math.min(x, PAGE_W - w));
      y = Math.max(0, Math.min(y, PAGE_H - h));
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, x, y } : it))
      );
    }
    function onWindowMouseUp() {
      dragState.current = null;
    }
    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };
  }, []);

  function addTextBox() {
    setItems((prev) => [
      ...prev,
      {
        id: nextId(),
        type: "text",
        x: 40,
        y: 40 + prev.length * 20,
        w: 260,
        h: 120,
        content: "Type your notes here…",
      },
    ]);
  }

  function addImage(img) {
    setItems((prev) => [
      ...prev,
      {
        id: nextId(),
        type: "image",
        x: 320,
        y: 40 + prev.length * 20,
        w: 220,
        h: 220,
        fullUrl: img.fullUrl,
        alt: img.alt,
        credit: img.credit,
        creditUrl: img.creditUrl,
      },
    ]);
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function updateContent(id, content) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, content } : it))
    );
  }

  function updateItemSize(id, h) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, h } : it))
    );
  }

  function onMouseDownItem(e, item) {
    if (e.target.dataset.role === "delete") return;
    const pageRect = pageRef.current.getBoundingClientRect();
    dragState.current = {
      id: item.id,
      offsetX: e.clientX - pageRect.left - item.x,
      offsetY: e.clientY - pageRect.top - item.y,
      w: item.w,
      h: item.h,
    };
  }

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    setResults([]);
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(
        `${backendUrl}/api/image-search?query=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.detail || "Image search failed.");
      } else {
        setResults(data.results || []);
      }
    } catch {
      setSearchError("Couldn't reach the backend for image search.");
    } finally {
      setSearching(false);
    }
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(pageRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fffdf7",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [PAGE_W, PAGE_H],
      });
      pdf.addImage(imgData, "JPEG", 0, 0, PAGE_W, PAGE_H);
      pdf.save("my-notebook-page.pdf");
    } catch (e) {
      alert("Couldn't export PDF. Try removing any images and adding them again if this keeps happening.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 14,
          alignItems: "center",
        }}
      >
        <button className="btn-secondary" onClick={addTextBox}>
          + Add note
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            placeholder="Search an image, e.g. 'water cycle'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            style={{
              border: "1.5px solid rgba(27,58,75,0.2)",
              borderRadius: 10,
              padding: "8px 12px",
              fontFamily: "inherit",
              minWidth: 220,
            }}
          />
          <button className="btn-secondary" onClick={search} disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
        <button
          className="btn-primary"
          onClick={exportPdf}
          disabled={exporting || items.length === 0}
          style={{ marginLeft: "auto" }}
        >
          {exporting ? "Exporting…" : "Download as PDF"}
        </button>
      </div>

      {searchError && (
        <p className="muted" style={{ color: "var(--maroon)", fontSize: "0.85rem" }}>
          {searchError}
        </p>
      )}

      {results.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
            gap: 8,
            marginBottom: 16,
            maxWidth: 500,
          }}
        >
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => addImage(r)}
              title={`Add photo by ${r.credit}`}
              style={{
                padding: 0,
                border: "1.5px solid rgba(27,58,75,0.15)",
                borderRadius: 8,
                overflow: "hidden",
                background: "none",
              }}
            >
              <img
                src={r.thumbUrl}
                alt={r.alt}
                style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }}
              />
            </button>
          ))}
        </div>
      )}

      <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 10 }}>
        Drag notes and photos anywhere on the page below. Photos are free-to-use
        via Unsplash and keep their photographer credit for the PDF.
      </p>

      <div
        style={{
          overflowX: "auto",
          border: "1px solid rgba(27,58,75,0.15)",
          borderRadius: 8,
          background: "#e9e4d6",
          padding: 16,
        }}
      >
        <div
          ref={pageRef}
          style={{
            position: "relative",
            width: PAGE_W,
            height: PAGE_H,
            background: "#fffdf7",
            backgroundImage:
              "repeating-linear-gradient(#fffdf7 0px, #fffdf7 27px, rgba(27,58,75,0.12) 28px)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
            margin: "0 auto",
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              onMouseDown={(e) => onMouseDownItem(e, item)}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                width: item.w,
                cursor: "grab",
              }}
            >
              <button
                data-role="delete"
                onClick={() => removeItem(item.id)}
                style={{
                  position: "absolute",
                  top: -10,
                  right: -10,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "1px solid rgba(27,58,75,0.3)",
                  background: "#fff",
                  fontSize: "0.75rem",
                  lineHeight: 1,
                  zIndex: 2,
                }}
                aria-label="Remove"
              >
                ✕
              </button>

              {item.type === "text" ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateContent(item.id, e.currentTarget.innerText)}
                  style={{
                    minHeight: item.h,
                    padding: 10,
                    background: "rgba(232,163,61,0.18)",
                    border: "1px dashed var(--marigold)",
                    borderRadius: 6,
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9rem",
                    color: "var(--ink)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {item.content}
                </div>
              ) : (
                <figure style={{ margin: 0 }}>
                  <img
                    src={item.fullUrl}
                    alt={item.alt}
                    crossOrigin="anonymous"
                    onLoad={(e) => {
                      const ratio =
                        e.currentTarget.naturalHeight / e.currentTarget.naturalWidth;
                      updateItemSize(item.id, Math.round(item.w * ratio));
                    }}
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: 6,
                      border: "3px solid #fff",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      display: "block",
                    }}
                  />
                  <figcaption
                    style={{
                      fontSize: "0.65rem",
                      color: "rgba(27,58,75,0.6)",
                      marginTop: 3,
                    }}
                  >
                    Photo: {item.credit} / Unsplash
                  </figcaption>
                </figure>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}