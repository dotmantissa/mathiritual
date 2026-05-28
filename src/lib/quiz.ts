// Progressive arithmetic quiz problem generator.
// Difficulty grows with the question index. No upper bound.

export type Problem = {
  text: string;
  answer: number;
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateProblem(index: number): Problem {
  // Tier 0..N — every 3 correct answers, difficulty increases.
  const tier = Math.floor(index / 3);

  // Pick operations available at this tier.
  const ops: string[] = ["+", "-"];
  if (tier >= 2) ops.push("*");
  if (tier >= 5) ops.push("/");

  const op = ops[rand(0, ops.length - 1)];

  // Number range grows with tier.
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
      // Keep multiplication digestible: smaller of two factors capped.
      const small = rand(2, Math.min(12 + tier, 99));
      const big = rand(2, Math.min(20 + tier * 4, 999));
      answer = small * big;
      text = `${small} × ${big}`;
      break;
    }
    case "/": {
      // Ensure clean integer division.
      const divisor = rand(2, Math.min(12 + tier, 50));
      const quotient = rand(2, Math.min(20 + tier * 3, 500));
      const dividend = divisor * quotient;
      answer = quotient;
      text = `${dividend} ÷ ${divisor}`;
      break;
    }
  }

  // Occasionally combine two operations once tier >= 4
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

  return { text, answer };
}
