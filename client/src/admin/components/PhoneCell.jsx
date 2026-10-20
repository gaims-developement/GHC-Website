import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

// A phone number (tap to call) with a small copy button beside it. The two sit side by side and never wrap
// or overlap; the number keeps its full width.
export default function PhoneCell({ phone }) {
  const [copied, setCopied] = useState(false);
  const value = String(phone || "").trim();

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!value) return <span style={{ color: "#9ca3af" }}>-</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API unavailable (e.g. http): fall back to a temporary text area.
      const area = document.createElement("textarea");
      area.value = value;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}>
      <a href={`tel:${value.replace(/[^\d+]/g, "")}`} style={{ color: "#374151", flexShrink: 0 }}>{value}</a>
      <button
        type="button"
        onClick={copy}
        title={copied ? "Copied" : "Copy phone number"}
        aria-label={copied ? "Copied" : `Copy phone number ${value}`}
        style={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "24px",
          height: "24px",
          padding: 0,
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          background: copied ? "#ecfdf5" : "#fff",
          color: copied ? "#059669" : "#6b7280",
          cursor: "pointer",
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </span>
  );
}
