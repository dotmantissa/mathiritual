// Mathiritual quiz generator.
// 10 tiers, difficulty rises every 5 questions. Timer shrinks 1s every 4 questions
// from 20s, floored at 6s. Scoring includes time bonus and compounding streak bonus.

export type Problem = {
  text: string;
  answer: number;
  choices: number[];
  timeLimit: number;
  tier: number;
  tierName: string;
  index: number;
};

export const TIER_NAMES = [
  "Warm-Up",
  "Easy",
  "Moderate",
  "Steady",
  "Challenging",
  "Tough",
  "Hard",
  "Intense",
  "Brutal",
  "Extreme",
] as const;

export const MAX_TIER = TIER_NAMES.length - 1;

export function tierForIndex(index: number): number {
  return Math.min(Math.floor(index / 5), MAX_TIER);
}

export function tierNameForIndex(index: number): string {
  return TIER_NAMES[tierForIndex(index)];
}

// Starts at 20s, -1s every 4 questions, floor 6s.
export function timeForIndex(index: number): number {
  return Math.max(20 - Math.floor(index / 4), 6);
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildChoices(answer: number, tier: number): number[] {
  const spread = Math.max(3, Math.min(5 + tier * 3, 80));
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < 4 && guard++ < 80) {
    const delta = rand(1, spread) * (Math.random() < 0.5 ? -1 : 1);
    const v = answer + delta;
    if (v !== answer) set.add(v);
  }
  const arr = Array.from(set);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateProblem(index: number): Problem {
  const tier = tierForIndex(index);
  const tierName = TIER_NAMES[tier];

  // Op pool widens with tier
  const ops: string[] = ["+", "-"];
  if (tier >= 1) ops.push("+", "-"); // weight basics early
  if (tier >= 2) ops.push("*");
  if (tier >= 4) ops.push("/");
  if (tier >= 6) ops.push("*", "/"); // more weight on harder ops

  const op = ops[rand(0, ops.length - 1)];
  const cap = Math.min(8 + tier * 12, 9999);

  let a = rand(1, cap);
  let b = rand(1, cap);
  let answer = 0;
  let text = "";

  switch (op) {
    case "+":
      answer = a + b;
      text = `${a} + ${b}`;
      break;
    case "-":
      if (b > a) [a, b] = [b, a];
      answer = a - b;
      text = `${a} − ${b}`;
      break;
    case "*": {
      const small = rand(2, Math.min(8 + tier * 2, 99));
      const big = rand(2, Math.min(12 + tier * 6, 999));
      answer = small * big;
      text = `${small} × ${big}`;
      break;
    }
    case "/": {
      const divisor = rand(2, Math.min(10 + tier * 2, 60));
      const quotient = rand(2, Math.min(15 + tier * 4, 500));
      const dividend = divisor * quotient;
      answer = quotient;
      text = `${dividend} ÷ ${divisor}`;
      break;
    }
  }

  // Add a trailing term at higher tiers
  if (tier >= 5 && Math.random() < 0.5) {
    const c = rand(1, Math.min(20 + tier * 3, 300));
    if (Math.random() < 0.5) {
      text = `${text} + ${c}`;
      answer = answer + c;
    } else {
      text = `${text} − ${c}`;
      answer = answer - c;
    }
  }

  return {
    text,
    answer,
    choices: buildChoices(answer, tier),
    timeLimit: timeForIndex(index),
    tier,
    tierName,
    index,
  };
}

// Score for a single correct answer.
// base: 10 * (tier+1)
// time bonus: ratio of time remaining × base (compounding pressure reward)
// streak multiplier: 1 + streak * 0.1 (compounds with longer streaks)
export function pointsForAnswer(
  problem: Problem,
  timeLeftSec: number,
  streakAfter: number
): number {
  const base = 10 * (problem.tier + 1);
  const timeRatio = Math.max(0, Math.min(1, timeLeftSec / problem.timeLimit));
  const timeBonus = Math.round(base * timeRatio);
  const streakMult = 1 + Math.min(streakAfter, 50) * 0.1;
  return Math.round((base + timeBonus) * streakMult);
}
