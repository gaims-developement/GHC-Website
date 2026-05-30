import { motion, useReducedMotion } from "framer-motion";

export default function PartnershipReveal({ children }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="partnership-page-reveal"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 44, filter: "blur(10px)" }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: shouldReduceMotion ? 0.1 : 1.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
