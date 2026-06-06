import { useState, useEffect } from "react";

interface Props {
  reportId: string;
}

export default function StarRating({ reportId }: Props) {
  const key = `koalafied_rating_${reportId}`;
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const n = parseInt(localStorage.getItem(key) ?? "0");
      if (n >= 1 && n <= 5) { setRating(n); setSaved(true); }
    } catch {}
  }, [key]);

  function handleRate(n: number) {
    if (saved) return;
    setRating(n);
    setSaved(true);
    try { localStorage.setItem(key, String(n)); } catch {}
  }

  return (
    <div style={{ textAlign: "center", marginBottom: "16px" }}>
      <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "10px" }}>
        {saved ? "Thanks for the feedback!" : "How helpful was this report?"}
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: "4px" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handleRate(n)}
            onMouseEnter={() => !saved && setHover(n)}
            onMouseLeave={() => !saved && setHover(0)}
            aria-label={`Rate ${n} star${n !== 1 ? "s" : ""}`}
            style={{
              background: "none",
              border: "none",
              cursor: saved ? "default" : "pointer",
              fontSize: "30px",
              lineHeight: 1,
              padding: "2px",
              color: n <= (hover || rating) ? "#f59e0b" : "#d1d5db",
              transition: "color 0.1s",
            }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
