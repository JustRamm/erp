import React from "react";
import { motion } from "framer-motion";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.995,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: [0.25, 1, 0.5, 1],
    },
  },
  out: {
    opacity: 0,
    y: -8,
    scale: 0.995,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
};

export default function PageTransition({ children, className = "" }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
