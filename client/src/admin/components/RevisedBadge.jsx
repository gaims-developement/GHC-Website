// "Revised v2" marker for an abstract the author has re-submitted after a revision request (version > 1).
export default function RevisedBadge({ version }) {
  const v = Number(version || 1);
  if (v <= 1) return null;
  return (
    <span
      title={`The author submitted a revised abstract (version ${v}). The document shown is the latest version.`}
      style={{
        display: "inline-block",
        marginTop: "0.3rem",
        padding: "0.12rem 0.55rem",
        borderRadius: "999px",
        background: "#eef2ff",
        color: "#4338ca",
        border: "1px solid #c7d2fe",
        fontSize: "0.72rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      ✏️ Revised v{v}
    </span>
  );
}
