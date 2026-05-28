import { useEffect, useRef, useState } from "react";
import { CONTRACT_ADDRESS, FEE_WEI, QUIZ_ABI, connectWallet, ensureRitualChain, getWalletClient, publicClient } from "@/lib/ritual";
import { generateProblem, type Problem } from "@/lib/quiz";
import { Leaderboard } from "./Leaderboard";

type Phase = "idle" | "starting" | "playing" | "over" | "saving" | "saved";

export function MathQuiz() {
  const [address, setAddress] = useState<string | null>(null);
  const [discord, setDiscord] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveTx, setSaveTx] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === "playing" && inputRef.current) inputRef.current.focus();
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

  async function handleStart() {
    setError(null);
    if (!address) { setError("Connect your wallet first."); return; }
    const name = discord.trim();
    if (!name) { setError("Enter your Discord username."); return; }
    if (name.length > 64) { setError("Discord username too long."); return; }
    try {
      setPhase("starting");
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
      setScore(0);
      setProblem(generateProblem(0));
      setInput("");
      setPhase("playing");
      setMessage(null);
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "Transaction failed");
      setPhase("idle");
      setMessage(null);
    }
  }

  function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!problem) return;
    const parsed = Number(input.trim());
    if (!Number.isFinite(parsed)) return;
    if (parsed === problem.answer) {
      const next = score + 1;
      setScore(next);
      setInput("");
      setProblem(generateProblem(next));
    } else {
      setPhase("over");
      setMessage(`Wrong! The answer was ${problem.answer}.`);
    }
  }

  function handleStop() {
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
    setProblem(null);
    setInput("");
    setSaveTx(null);
    setMessage(null);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_22rem] gap-6">
      <div className="rounded-2xl border border-ritual-line bg-ritual-card/70 p-6 backdrop-blur min-h-[26rem] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ritual-text">Ritual Math</h2>
            <p className="text-xs text-ritual-text/60">Endless arithmetic. One miss ends the run.</p>
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
              Starting a game requires a one-time signature for <strong className="text-ritual-accent">0.0002 RITUAL</strong>.
              Answer as many problems as you can. Miss one or hit Stop — you can then save your score on-chain.
            </div>
            <button
              onClick={handleStart}
              disabled={!address || !discord.trim()}
              className="mt-2 self-start rounded-full bg-ritual-accent px-5 py-2.5 font-semibold text-ritual-deep transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            >
              Start quiz
            </button>
          </div>
        )}

        {phase === "starting" && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-ritual-text/80 text-sm">{message ?? "Preparing…"}</p>
          </div>
        )}

        {phase === "playing" && problem && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="text-xs text-ritual-text/60">Score: <span className="font-mono text-ritual-accent">{score}</span></div>
            <div className="text-5xl md:text-6xl font-bold text-ritual-text tracking-tight tabular-nums">
              {problem.text} = ?
            </div>
            <form onSubmit={submitAnswer} className="flex gap-2 w-full max-w-sm">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                className="flex-1 rounded-lg bg-ritual-deep border border-ritual-line px-3 py-3 text-center text-xl text-ritual-text outline-none focus:border-ritual-accent"
              />
              <button type="submit" className="rounded-lg bg-ritual-accent px-4 font-semibold text-ritual-deep hover:opacity-90">
                Submit
              </button>
            </form>
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
            </div>
            {message && <p className="text-sm text-ritual-text/70">{message}</p>}

            {phase === "saved" ? (
              <>
                <p className="text-sm text-ritual-accent">Saved on-chain ✓</p>
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
