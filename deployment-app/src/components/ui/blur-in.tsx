"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface BlurInProps {
  word: string;
  className?: string;
  variant?: {
    hidden: { filter: string; opacity: number };
    visible: { filter: string; opacity: number };
  };
  duration?: number;
}
const BlurIn = ({ word, className, variant, duration = 1 }: BlurInProps) => {
  const defaultVariants = {
    hidden: { filter: "blur(10px)", opacity: 0 },
    visible: { filter: "blur(0px)", opacity: 1 },
  };
  const combinedVariants = variant || defaultVariants;

  return (
    <motion.p
      initial="hidden"
      animate="visible"
      transition={{ duration }}
      variants={combinedVariants}
      className={cn(
        "font-display text-center text-xl font-bold tracking-[-0.02em] drop-shadow-sm md:leading-[5rem]",
        className,
      )}
    >
      {word}
    </motion.p>
  );
};

export default BlurIn;
