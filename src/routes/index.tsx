import { createFileRoute } from "@tanstack/react-router";
import { MathQuiz } from "@/components/MathQuiz";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ritual Math — Endless arithmetic on Ritual" },
      { name: "description", content: "Endless arithmetic quiz on Ritual network. Connect wallet, stake 0.0002 RITUAL, climb the daily and weekly on-chain leaderboards." },
      { property: "og:title", content: "Ritual Math" },
      { property: "og:description", content: "Endless arithmetic quiz on Ritual network." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-ritual-bg text-ritual-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(110,231,183,0.12),transparent_60%)]" />
      <main className="relative mx-auto max-w-6xl px-5 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-ritual-accent text-ritual-deep grid place-items-center font-bold">∑</div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Ritual Math</h1>
              <p className="text-xs text-ritual-text/60">Endless arithmetic · on Ritual chain</p>
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
        <MathQuiz />
        <footer className="mt-10 text-center text-xs text-ritual-text/50">
          Chain ID 1979 · Fee 0.0002 RITUAL · Scores saved on-chain via events
        </footer>
      </main>
    </div>
  );
}
