import { createFileRoute } from "@tanstack/react-router";
import { MathQuiz } from "@/components/MathQuiz";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mathiritual — Endless arithmetic on Ritual Chain" },
      { name: "description", content: "Prove your compute. Endless arithmetic quiz on Ritual Chain. Connect wallet, stake 0.0002 RITUAL, climb the daily and weekly on-chain leaderboards." },
      { property: "og:title", content: "Mathiritual" },
      { property: "og:description", content: "Endless arithmetic, on-chain proof-of-compute on Ritual Chain." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen bg-ritual-bg text-ritual-text overflow-hidden">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.55 0.12 150 / 0.15) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.55 0.12 150 / 0.15) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 90%)",
        }}
      />
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,222,128,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[820px] rounded-full bg-ritual-accent/10 blur-3xl" />

      <main className="relative mx-auto max-w-6xl px-5 py-10">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-ritual-accent text-ritual-deep grid place-items-center font-bold shadow-[0_0_24px_rgba(74,222,128,0.45)]">∑</div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Mathiritual</h1>
              <p className="text-xs text-ritual-text/60">Proof-of-Compute · Ritual Chain</p>
            </div>
          </div>
          <a
            href="https://explorer.ritualfoundation.org/address/0x205336D124145881e00dad29aAA9669F739684B2"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline text-xs text-ritual-text/60 hover:text-ritual-accent underline"
          >
            View contract ↗
          </a>
        </header>

        <section className="text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-ritual-accent/40 bg-ritual-accent/10 px-3 py-1 text-xs font-mono text-ritual-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-ritual-accent animate-pulse" />
            Live on Ritual Chain
          </span>
          <h2 className="mt-5 text-5xl sm:text-7xl font-black tracking-tight text-ritual-accent drop-shadow-[0_0_28px_rgba(74,222,128,0.45)]">
            MATHIRITUAL
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-ritual-text/70 leading-relaxed">
            Prove your compute. Answer arithmetic questions against a shrinking timer, build streaks, and commit your score on-chain as immutable proof-of-compute on Ritual Chain.
          </p>
        </section>

        <MathQuiz />

        <footer className="mt-12 text-center text-xs text-ritual-text/50">
          Chain ID 1979 · Fee 0.0002 RITUAL · Scores saved on-chain via events
        </footer>
      </main>
    </div>
  );
}
