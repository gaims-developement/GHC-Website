import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import PartnershipOrbit from "./PartnershipOrbit";

export default function RevealOverlay({ show }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="reveal-overlay"
          aria-hidden="true"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: "-18%" }}
          transition={{ duration: shouldReduceMotion ? 0.12 : 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="reveal-overlay__field"
            initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0, opacity: 0.92 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={{ duration: shouldReduceMotion ? 0.12 : 0.64, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.div
            className="reveal-overlay__portal"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1 }}
            animate={shouldReduceMotion ? { opacity: 0 } : { opacity: [0, 0, 1], scale: [1, 1, 8] }}
            transition={{ times: [0, 0.86, 1], duration: 3.85, ease: [0.16, 1, 0.3, 1] }}
          />
          <div className="reveal-overlay__particles">
            {Array.from({ length: 18 }).map((_, index) => (
              <span key={index} style={{ "--i": index }} />
            ))}
          </div>
          <PartnershipOrbit />
          <motion.h1
            className="reveal-overlay__title"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 0, scale: 0.6, filter: "blur(14px)", letterSpacing: "0.34em" }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [0, 1, 1, 1, 0.95], y: [0, 0, -40, -40, -40], scale: [0.6, 1.25, 1.25, 0.55, 0.55], filter: ["blur(14px)", "blur(0px)", "blur(0px)", "blur(0px)", "blur(0px)"], letterSpacing: ["0.34em", "0.22em", "0.22em", "0.16em", "0.16em"] }}
            transition={{ times: [0, 0.23, 0.36, 0.48, 1], duration: shouldReduceMotion ? 0.12 : 3.45, ease: [0.19, 1, 0.22, 1] }}
          >
            PARTNERSHIP
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
