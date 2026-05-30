import { motion, useReducedMotion } from "framer-motion";

const orbitWords = [
  "COLLABORATE",
  "SPONSOR",
  "NETWORK",
  "INNOVATE",
  "GROW",
  "ACADEMIA",
  "HEALTHCARE",
  "GLOBAL",
  "LEADERSHIP",
  "COMMUNITY",
  "IMPACT",
  "ALLIANCE",
  "FUTURE",
  "RESEARCH",
];

export default function PartnershipOrbit() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="partnership-orbit"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0 }}
      animate={shouldReduceMotion ? { opacity: 0.7 } : { opacity: 1, scale: 1 }}
      transition={{ delay: shouldReduceMotion ? 0 : 1.24, duration: shouldReduceMotion ? 0.1 : 0.72, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden="true"
    >
      <motion.span
        className="partnership-orbit__ring"
        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
      <motion.span
        className="partnership-orbit__ring partnership-orbit__ring--inner"
        animate={shouldReduceMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      {orbitWords.map((word, index) => {
        const angle = (360 / orbitWords.length) * index;
        const clockwise = index % 2 === 0 ? 1 : -1;
        const orbitInset = `${8 + (index % 3) * 7}%`;

        return (
          <motion.span
            className={`partnership-orbit__word-track ${clockwise > 0 ? "is-clockwise" : "is-counter"}`}
            key={word}
            style={{ "--angle": `${angle}deg`, "--orbit-inset": orbitInset, "--duration": `${15 + (index % 4) * 2}s` }}
            initial={shouldReduceMotion ? { opacity: 0.65 } : { opacity: 0, filter: "blur(10px)" }}
            animate={shouldReduceMotion ? { opacity: 0.65 } : { opacity: [0, 1, 0.9], filter: "blur(0px)" }}
            transition={{ delay: shouldReduceMotion ? 0 : 1.38 + index * 0.075, duration: shouldReduceMotion ? 0.1 : 1.4, repeat: shouldReduceMotion ? 0 : Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
          >
            <span className="partnership-orbit__word">{word}</span>
          </motion.span>
        );
      })}
    </motion.div>
  );
}
