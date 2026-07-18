"use client";

export default function ProgressDashboard({ progress }) {
  const { topicsCovered, correct, incorrect } = progress;
  const total = correct + incorrect;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  function downloadReport() {
    const lines = [
      "Vidya AI — Learning Progress Report",
      "====================================",
      `Topics explored: ${topicsCovered.length}`,
      `Comprehension checks answered: ${total}`,
      `Accuracy: ${accuracy}%`,
      "",
      "Topics:",
      ...topicsCovered.map((t, i) => `${i + 1}. ${t}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vidya-progress-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="stat-grid">
        <div className="stat">
          <span className="val">{topicsCovered.length}</span>
          <span className="label">Topics explored</span>
        </div>
        <div className="stat">
          <span className="val">{total}</span>
          <span className="label">Checks answered</span>
        </div>
        <div className="stat">
          <span className="val">{accuracy}%</span>
          <span className="label">Accuracy</span>
        </div>
      </div>
      <div className="bar-track" aria-label="Accuracy bar">
        <div className="bar-fill" style={{ width: `${accuracy}%` }} />
      </div>
      <button
        className="btn-secondary"
        style={{ marginTop: 18 }}
        onClick={downloadReport}
      >
        Download report for a teacher or parent
      </button>
    </div>
  );
}
