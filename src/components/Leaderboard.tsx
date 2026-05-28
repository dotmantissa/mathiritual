import { useEffect, useState } from "react";
import { fetchScores, type ScoreEntry } from "@/lib/ritual";

type Window = "daily" | "weekly";

export function Leaderboard() {
  const [tab, setTab] = useState<Window>("daily");
  const [rows, setRows] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    const seconds = tab === "daily" ? 86400 : 86400 * 7;
    fetchScores(seconds)
      .then((r) => { if (!cancelled) setRows(r); })
      .catch((e) => { if (!cancelled) setErr(e?.message ?? "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab]);

  return (
    <div className="rounded-2xl border border-ritual-line bg-ritual-card/60 p-5 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ritual-text">Leaderboard</h2>
        <div className="flex gap-1 rounded-full bg-ritual-deep p-1">
          {(["daily", "weekly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs rounded-full transition ${
                tab === t ? "bg-ritual-accent text-ritual-deep font-semibold" : "text-ritual-text/70 hover:text-ritual-text"
              }`}
            >
              {t === "daily" ? "Daily" : "Weekly"}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-ritual-text/60">Loading from Ritual chain…</p>}
      {err && <p className="text-sm text-red-300">{err}</p>}
      {!loading && !err && rows.length === 0 && (
        <p className="text-sm text-ritual-text/60">No scores yet — be the first.</p>
      )}
      {!loading && rows.length > 0 && (
        <ol className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          {rows.map((r, i) => (
            <li
              key={r.txHash}
              className="flex items-center justify-between gap-3 rounded-lg bg-ritual-deep/60 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-6 text-center font-mono ${i < 3 ? "text-ritual-accent font-bold" : "text-ritual-text/50"}`}>
          {rows.map((r, i) => (
            <li
              key={r.txHash}
              className="flex items-center justify-between gap-3 rounded-lg bg-ritual-deep/60 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-6 text-center font-mono ${i < 3 ? "text-ritual-accent font-bold" : "text-ritual-text/50"}`}>
                  {i + 1}
                </span>
                <span className="truncate text-ritual-text">{r.discord}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-ritual-text/50 font-mono">
                  {r.questions} Q
                </span>
                <span className="font-mono font-semibold text-ritual-accent">{r.score}</span>
              </div>
            </li>
          ))}
