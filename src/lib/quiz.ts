// Progressive arithmetic quiz problem generator.
// Difficulty grows with the question index. No upper bound.

export type Problem = {
  text: string;
  answer: number;
  choices: number[];
  timeLimit: number; // seconds allowed to answer
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Time limit shrinks as tier grows: 15s -> min 4s.
function timeForTier(tier: number): number {
  return Math.max(15 - tier, 4);
}

function buildChoices(answer: number, tier: number): number[] {
  const spread = Math.max(3, Math.min(5 + tier * 2, 50));
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < 4 && guard++ < 50) {
    const delta = rand(1, spread) * (Math.random() < 0.5 ? -1 : 1);
    const v = answer + delta;
    if (v !== answer) set.add(v);
  }
  // Shuffle
  const arr = Array.from(set);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateProblem(index: number): Problem {
  const tier = Math.floor(index / 3);

  const ops: string[] = ["+", "-"];
  if (tier >= 2) ops.push("*");
  if (tier >= 5) ops.push("/");

  const op = ops[rand(0, ops.length - 1)];
  const cap = Math.min(10 + tier * 8, 9999);

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
      const small = rand(2, Math.min(12 + tier, 99));
      const big = rand(2, Math.min(20 + tier * 4, 999));
      answer = small * big;
      text = `${small} × ${big}`;
      break;
    }
    case "/": {
      const divisor = rand(2, Math.min(12 + tier, 50));
      const quotient = rand(2, Math.min(20 + tier * 3, 500));
      const dividend = divisor * quotient;
      answer = quotient;
      text = `${dividend} ÷ ${divisor}`;
      break;
    }
  }

  if (tier >= 4 && Math.random() < 0.35) {
    const c = rand(1, Math.min(20 + tier * 2, 200));
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
    timeLimit: timeForTier(tier),
  };
}
