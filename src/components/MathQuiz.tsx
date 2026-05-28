import { useEffect, useRef, useState } from "react";
import { CONTRACT_ADDRESS, FEE_WEI, QUIZ_ABI, connectWallet, ensureRitualChain, getWalletClient, publicClient } from "@/lib/ritual";
import { generateProblem, pointsForAnswer, type Problem } from "@/lib/quiz";
import { Leaderboard } from "./Leaderboard";

type Phase =
  | "idle"
  | "paying"
  | "ready"   // paid, waiting for "Begin"
  | "playing"
  | "over"
  | "saving"
  | "saved";

export function MathQuiz() {
  const [address, setAddress] = useState<string | null>(null);
  const [discord, setDiscord] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [questionNo, setQuestionNo] = useState(0); // index of current question
  const [score, setScore] = useState(0);           // accumulated points
  const [streak, setStreak] = useState(0);
  const [lastGain, setLastGain] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveTx, setSaveTx] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  // Countdown timer
  useEffect(() => {
    if (phase !== "playing" || !problem) return;
    setTimeLeft(problem.timeLimit);
    setPicked(null);
    startedAtRef.current = Date.now();
    tickRef.current = window.setInterval(() => {
      const left = problem.timeLimit - (Date.now() - startedAtRef.current) / 1000;
      if (left <= 0) {
        window.clearInterval(tickRef.current!);
        setTimeLeft(0);
        setPhase("over");
        setStreak(0);
        setMessage(`Time's up! The answer was ${problem.answer}.`);
      } else {
        setTimeLeft(left);
      }
    }, 100) as unknown as number;
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [phase, problem]);

  async function handleConnect() {
    try {
      setError(null);
      const a = await connectWallet();
      setAddress(a);
    } catch (e: any) {
      setError(e?.message ?? "Failed to connect");
    }
  }

  async function handlePay() {
    setError(null);
    if (!address) { setError("Connect your wallet first."); return; }
    const name = discord.trim();
    if (!name) { setError("Enter your Discord username."); return; }
    if (name.length > 64) { setError("Discord username too long."); return; }
    try {
      setPhase("paying");
      setMessage("Confirm the 0.0002 RITUAL transaction in your wallet…");
      await ensureRitualChain();
      const wallet = getWalletClient();
      const hash = await wallet.writeContract({
        account: address as `0x${string}`,
        address: CONTRACT_ADDRESS,
        abi: QUIZ_ABI,
        functionName: "startGame",
        args: [name],
        value: FEE_WEI,
      });
      setMessage("Waiting for confirmation…");
      await publicClient.waitForTransactionReceipt({ hash });
      setMessage(null);
      setPhase("ready");
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "Transaction failed");
      setPhase("idle");
      setMessage(null);
    }
  }

  function handleBegin() {
    setScore(0);
    setStreak(0);
    setLastGain(null);
    setQuestionNo(0);
    setProblem(generateProblem(0));
    setMessage(null);
    setPhase("playing");
  }

  function pickChoice(value: number) {
    if (!problem || picked !== null) return;
    setPicked(value);
    if (value === problem.answer) {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const remaining = Math.max(0, problem.timeLimit - elapsed);
      const newStreak = streak + 1;
      const gained = pointsForAnswer(problem, remaining, newStreak);
      if (tickRef.current) window.clearInterval(tickRef.current);
      window.setTimeout(() => {
        setScore((s) => s + gained);
        setStreak(newStreak);
        setLastGain(gained);
        const nextIndex = questionNo + 1;
        setQuestionNo(nextIndex);
        setProblem(generateProblem(nextIndex));
      }, 220);
    } else {
      if (tickRef.current) window.clearInterval(tickRef.current);
      window.setTimeout(() => {
        setPhase("over");
        setStreak(0);
        setMessage(`Wrong! The answer was ${problem.answer}.`);
      }, 350);
    }
  }

  function handleStop() {
    if (tickRef.current) window.clearInterval(tickRef.current);
    setPhase("over");
    setMessage("You stopped the run.");
  }

  async function handleSave() {
    if (!address) return;
    try {
      setError(null);
      setPhase("saving");
      const wallet = getWalletClient();
      const hash = await wallet.writeContract({
        account: address as `0x${string}`,
        address: CONTRACT_ADDRESS,
        abi: QUIZ_ABI,
        functionName: "submitScore",
        args: [discord.trim(), BigInt(score)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setSaveTx(hash);
      setPhase("saved");
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "Save failed");
      setPhase("over");
    }
  }

  function handlePlayAgain() {
    setPhase("idle");
    setScore(0);
    setStreak(0);
    setLastGain(null);
    setQuestionNo(0);
    setProblem(null);
    setSaveTx(null);
    setMessage(null);
  }

  const timePct = problem ? Math.max(0, Math.min(100, (timeLeft / problem.timeLimit) * 100)) : 0;
  const timeColor = timePct > 50 ? "bg-ritual-accent" : timePct > 25 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className="grid lg:grid-cols-[1fr_22rem] gap-6">
      <div className="rounded-2xl border border-ritual-line bg-ritual-card/70 p-6 backdrop-blur min-h-[28rem] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ritual-text">Quiz Arena</h2>
            <p className="text-xs text-ritual-text/60">Endless arithmetic. Streaks compound. Timer shrinks.</p>
          </div>
          {address ? (
            <span className="text-xs font-mono px-2 py-1 rounded-full bg-ritual-accent/15 text-ritual-accent">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          ) : (
            <button onClick={handleConnect} className="text-xs px-3 py-1.5 rounded-full bg-ritual-accent text-ritual-deep font-semibold hover:opacity-90">
              Connect wallet
            </button>
          )}
        </div>

        {phase === "idle" && (
          <div className="flex flex-col gap-4 mt-2">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-ritual-text/60">Discord username</span>
              <input
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                placeholder="yourname"
                className="mt-1 w-full rounded-lg bg-ritual-deep border border-ritual-line px-3 py-2 text-ritual-text outline-none focus:border-ritual-accent"
              />
            </label>
            <div className="text-sm text-ritual-text/70 leading-relaxed">
              Pay a one-time <strong className="text-ritual-accent">0.0002 RITUAL</strong> fee to unlock your run.
              After it confirms you'll hit <strong className="text-ritual-accent">Begin</strong> to start.
              You start with <strong className="text-ritual-accent">20 seconds</strong> — the clock shrinks every 4 questions, floored at 6s.
              Difficulty climbs through 10 tiers, scoring compounds with streaks and time bonuses.
            </div>
            <button
              onClick={handlePay}
              disabled={!address || !discord.trim()}
              className="mt-2 self-start rounded-full bg-ritual-accent px-5 py-2.5 font-semibold text-ritual-deep transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            >
              Pay 0.0002 RITUAL
            </button>
          </div>
        )}

        {phase === "paying" && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-ritual-text/80 text-sm">{message ?? "Processing…"}</p>
          </div>
        )}

        {phase === "ready" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <p className="text-xs uppercase tracking-wide text-ritual-accent">Payment confirmed</p>
            <h3 className="text-2xl font-semibold text-ritual-text">Ready, <span className="text-ritual-accent">{discord.trim()}</span>?</h3>
            <p className="text-sm text-ritual-text/70 max-w-sm">
              The first question lands the moment you press Begin. Stay sharp — streaks compound your score.
            </p>
            <button
              onClick={handleBegin}
              className="rounded-full bg-ritual-accent px-8 py-3 text-lg font-bold text-ritual-deep shadow-[0_0_28px_rgba(74,222,128,0.45)] hover:opacity-90"
            >
              Begin
            </button>
          </div>
        )}

        {phase === "playing" && problem && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-ritual-text/60">
              <span>Q <span className="font-mono text-ritual-text text-sm">#{problem.index + 1}</span></span>
              <span>Tier <span className="font-mono text-ritual-accent text-sm">{problem.tierName}</span></span>
              <span>Streak <span className="font-mono text-ritual-text text-sm">×{streak}</span></span>
              <span>Score <span className="font-mono text-ritual-accent text-sm">{score}</span></span>
              <span>Time <span className="font-mono text-ritual-accent text-sm">{timeLeft.toFixed(1)}s</span></span>
            </div>

            <div className="w-full max-w-md h-1.5 rounded-full bg-ritual-deep overflow-hidden">
              <div className={`h-full transition-[width,background-color] duration-100 ${timeColor}`} style={{ width: `${timePct}%` }} />
            </div>

            <div className="text-5xl md:text-6xl font-bold text-ritual-text tracking-tight tabular-nums">
              {problem.text} = ?
            </div>

            {lastGain !== null && picked === null && (
              <div className="text-xs font-mono text-ritual-accent">+{lastGain} pts</div>
            )}

            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {problem.choices.map((c) => {
                const isPicked = picked === c;
                const isCorrect = picked !== null && c === problem.answer;
                const isWrong = isPicked && c !== problem.answer;
                return (
                  <button
                    key={c}
                    onClick={() => pickChoice(c)}
                    disabled={picked !== null}
                    className={`rounded-xl border px-4 py-4 text-xl font-semibold font-mono tabular-nums transition
                      ${isCorrect ? "bg-ritual-accent text-ritual-deep border-ritual-accent" :
                        isWrong ? "bg-red-500/20 border-red-400 text-red-200" :
                        "bg-ritual-deep/60 border-ritual-line text-ritual-text hover:border-ritual-accent hover:bg-ritual-deep"}
                      disabled:cursor-not-allowed`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            <button onClick={handleStop} className="text-xs text-ritual-text/60 hover:text-ritual-text underline">
              Stop run
            </button>
          </div>
        )}

        {(phase === "over" || phase === "saving" || phase === "saved") && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-ritual-text/60">Final score</p>
              <p className="text-6xl font-bold text-ritual-accent tabular-nums">{score}</p>
              <p className="mt-1 text-xs text-ritual-text/60">
                {questionNo} {questionNo === 1 ? "question" : "questions"} answered
              </p>
            </div>
            {message && <p className="text-sm text-ritual-text/70">{message}</p>}

            {phase === "saved" ? (
              <>
                <p className="text-sm text-ritual-accent">Saved on-chain ✓ (overwrites your previous score)</p>
                {saveTx && (
                  <a
                    href={`https://explorer.ritualfoundation.org/tx/${saveTx}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-ritual-text/60 underline break-all"
                  >
                    {saveTx}
                  </a>
                )}
                <button onClick={handlePlayAgain} className="mt-2 rounded-full bg-ritual-accent px-5 py-2.5 font-semibold text-ritual-deep hover:opacity-90">
                  Play again
                </button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleSave}
                  disabled={phase === "saving" || score === 0}
                  className="rounded-full bg-ritual-accent px-5 py-2.5 font-semibold text-ritual-deep disabled:opacity-40 hover:opacity-90"
                >
                  {phase === "saving" ? "Saving…" : "Save score on-chain"}
                </button>
                <button
                  onClick={handlePlayAgain}
                  className="rounded-full border border-ritual-line px-5 py-2.5 text-ritual-text hover:bg-ritual-deep"
                >
                  Skip & play again
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      </div>

      <div key={reloadKey}>
        <Leaderboard />
      </div>
    </div>
  );
}
