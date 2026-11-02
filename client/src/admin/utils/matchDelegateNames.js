// Titles, spacing and punctuation vary between lists ("Ms.Nandita Dash", "Dr KB Yuktha"), so they are ignored.
const nameKey = (name) => String(name || "")
  .normalize("NFKC")
  .toLowerCase()
  .trim()
  .replace(/^((mr|mrs|ms|miss|dr|prof)\b\.?\s*)+/, "")
  .replace(/[^\p{L}\p{N}]/gu, "");

// Exact matches only: a mail must never go to a similar name, so anything unclear comes back with a problem to resolve.
export function matchDelegateNames(text, delegates) {
  const seen = new Set();
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.split("\t").find((cell) => cell.trim())?.trim())
    .filter(Boolean)
    .map((listed) => {
      const key = nameKey(listed);
      const found = delegates.filter((d) => nameKey(d.fullName) === key || nameKey(d.submission?.nameOnId) === key);
      if (!key || !found.length) return { listed, problem: "Not found" };
      if (found.length > 1) return { listed, problem: `${found.length} delegates match this name` };
      const [delegate] = found;
      if (seen.has(delegate.id)) return { listed, delegate, problem: "Listed twice" };
      seen.add(delegate.id);
      if (!delegate.submission) return { listed, delegate, problem: "Has not submitted an ID" };
      if (!delegate.email) return { listed, delegate, problem: "No email address" };
      if (delegate.collegeIdUpdateSentAt) return { listed, delegate, problem: "Already sent this mail" };
      return { listed, delegate, problem: null };
    });
}
