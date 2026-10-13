"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  highlight?: string[];
  as?: "h1" | "h2" | "p";
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function RevealText({ text, className, delay = 0, stagger = 0.06, highlight = [], as = "h1" }: Props) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const words = text.split(" ");

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => {
        const marked = highlight.includes(word.replace(/[^\w]/g, ""));
        const content: ReactNode = marked ? <span className="text-brand">{word}</span> : word;
        return (
          <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className="inline-block"
              initial={reduce ? false : { y: "105%", rotate: 4 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: delay + i * stagger }}
            >
              {content}
              {i < words.length - 1 && " "}
            </motion.span>
          </span>
        );
      })}
    </Tag>
  );
}
