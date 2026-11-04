import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll-reveal wrapper. Honours the visitor's reduced-motion preference by
 * rendering the content in place with no transform.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.21, 0.6, 0.35, 1] } },
  };

  return (
    <MotionTag
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-70px" }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}

/** Staggered container for grids and lists of Reveal children. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-70px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduce ? 0 : stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.21, 0.6, 0.35, 1] } },
};
