"use client";

import { useState, useTransition } from "react";
import { deleteScore, logScore, type ScoreInput } from "./practice-actions";

export type Score = {
  id: string;
  pairing_id: string;
  taken_on: string;
  raw_score: number | null;
  max_score: number | null;
  placement: number | null;
  notes: string;
};

export type PairingData = {
  id: string;
  division: "B" | "C";
  teamLabel: string;
  teamName: string;
  eventName: string;
  partners: string[];
  scores: Score[];
};

export type DivisionData = {
  code: "B" | "C";
  name: string;
  subtitle: string;
  colorVar: string;
  pairings: PairingData[];
};

const todayISO = () => new Date().toISOString().slice(0, 10);

function pct(s: Score): number | null {
  if (s.raw_score === null || s.max_score === null || s.max_score <= 0) {
    return null;
  }
  return (s.raw_score / s.max_score) * 100;
}

export default function PracticeBoard({
  divisions,
}: {
  divisions: DivisionData[];
}) {
  const [error, setError] = useState<string | null>(null);

  const anyPairings = divisions.some((d) => d.pairings.length > 0);

  return (
    <main className="flex-1 bg-chart-ground px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="rounded-sm border border-chart-rule bg-chart-ground-raised px-6 py-6 sm:px-8 sm:py-8">
          <p className="font-mono text-xs tracking-[0.2em] text-chart-ink-muted uppercase">
            Practice Scores
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-chart-ink sm:text-3xl">
            How each pairing is trending
          </h1>
          <p className="mt-1 text-sm text-chart-ink-muted">
            One row per practice attempt. The line tracks percent score
            (raw &divide; max) over time for each event pairing.
          </p>
          {error && (
            <p className="mt-3 font-mono text-xs text-accent">{error}</p>
          )}
        </header>

        {!anyPairings && (
          <p className="text-sm text-chart-ink-muted italic">
            No pairings yet &mdash; create them on the Pairings page, then log
            scores here.
          </p>
        )}

        {divisions.map(
          (division) =>
            division.pairings.length > 0 && (
              <section key={division.code} className="flex flex-col gap-4">
                <div
                  className="flex items-baseline justify-between gap-3 border-b-2 pb-2"
                  style={{ borderColor: `var(${division.colorVar})` }}
                >
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-lg font-semibold text-chart-ink">
                      {division.name}
                    </h2>
                    <span className="text-sm text-chart-ink-muted">
                      {division.subtitle}
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-chart-ink-muted">
                    {division.pairings.length} pairings
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {division.pairings.map((pairing) => (
                    <PairingCard
                      key={pairing.id}
                      pairing={pairing}
                      colorVar={division.colorVar}
                      onError={setError}
                    />
                  ))}
                </div>
              </section>
            )
        )}
      </div>
    </main>
  );
}

function PairingCard({
  pairing,
  colorVar,
  onError,
}: {
  pairing: PairingData;
  colorVar: string;
  onError: (msg: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const points = pairing.scores
    .map((s) => ({ taken_on: s.taken_on, value: pct(s) }))
    .filter((p): p is { taken_on: string; value: number } => p.value !== null);
  const latest = points.at(-1)?.value ?? null;

  function handleLog(input: ScoreInput) {
    onError(null);
    startTransition(async () => {
      const result = await logScore(pairing.id, input);
      if ("error" in result) onError(result.error);
      else setOpen(false);
    });
  }

  function handleDelete(scoreId: string) {
    onError(null);
    startTransition(async () => {
      const result = await deleteScore(scoreId);
      if ("error" in result) onError(result.error);
    });
  }

  return (
    <div className="flex flex-col rounded-sm border border-chart-rule bg-chart-ground-raised">
      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-medium text-chart-ink">
              {pairing.teamLabel}
            </span>
            <span className="text-sm font-medium text-chart-ink">
              {pairing.eventName}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-chart-ink-muted">
            {pairing.partners.length > 0
              ? pairing.partners.join(" & ")
              : "no partners assigned"}
          </p>
        </div>
        <span
          className="font-mono text-lg font-semibold tabular-nums"
          style={{ color: latest !== null ? `var(${colorVar})` : undefined }}
        >
          {latest !== null ? `${Math.round(latest)}%` : "—"}
        </span>
      </div>

      <div className="px-4 py-3">
        {points.length >= 2 ? (
          <Sparkline points={points.map((p) => p.value)} colorVar={colorVar} />
        ) : (
          <p className="py-3 text-center font-mono text-[11px] text-chart-ink-muted">
            {points.length === 1
              ? "one attempt logged · need 2+ for a trend"
              : "no percent scores yet"}
          </p>
        )}
      </div>

      {pairing.scores.length > 0 && (
        <table className="w-full border-t border-chart-rule text-xs">
          <tbody>
            {pairing.scores.map((s) => (
              <tr key={s.id} className="border-b border-chart-rule/50">
                <td className="px-4 py-1.5 font-mono tabular-nums text-chart-ink-muted">
                  {s.taken_on}
                </td>
                <td className="px-2 py-1.5 tabular-nums text-chart-ink">
                  {s.raw_score !== null && s.max_score !== null
                    ? `${s.raw_score}/${s.max_score}`
                    : s.raw_score !== null
                    ? `${s.raw_score}`
                    : "—"}
                </td>
                <td className="px-2 py-1.5 tabular-nums text-chart-ink-muted">
                  {s.placement !== null ? `#${s.placement}` : ""}
                </td>
                <td className="max-w-24 truncate px-2 py-1.5 text-chart-ink-muted">
                  {s.notes}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleDelete(s.id)}
                    aria-label={`Delete score from ${s.taken_on}`}
                    className="text-chart-ink-muted hover:text-accent disabled:opacity-50"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="border-t border-chart-rule px-4 py-2">
        {open ? (
          <LogScoreForm
            colorVar={colorVar}
            pending={pending}
            onSubmit={handleLog}
            onCancel={() => setOpen(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-mono text-xs text-chart-ink-muted underline-offset-2 hover:text-chart-ink hover:underline"
          >
            + log score
          </button>
        )}
      </div>
    </div>
  );
}

function LogScoreForm({
  colorVar,
  pending,
  onSubmit,
  onCancel,
}: {
  colorVar: string;
  pending: boolean;
  onSubmit: (input: ScoreInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ScoreInput>({
    taken_on: todayISO(),
    raw_score: "",
    max_score: "",
    placement: "",
    notes: "",
  });

  const field =
    "rounded-[2px] border border-chart-rule bg-white px-1.5 py-1 text-xs text-chart-ink outline-none focus-visible:outline-2";
  const set = (k: keyof ScoreInput) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="flex flex-wrap items-end gap-2 py-1"
    >
      <label className="flex flex-col gap-0.5">
        <span className="font-mono text-[9px] text-chart-ink-muted uppercase">
          Date
        </span>
        <input
          type="date"
          required
          value={form.taken_on}
          onChange={(e) => set("taken_on")(e.target.value)}
          className={field}
          style={{ outlineColor: `var(${colorVar})` }}
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="font-mono text-[9px] text-chart-ink-muted uppercase">
          Raw
        </span>
        <input
          inputMode="decimal"
          value={form.raw_score}
          onChange={(e) => set("raw_score")(e.target.value)}
          className={`${field} w-16`}
          style={{ outlineColor: `var(${colorVar})` }}
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="font-mono text-[9px] text-chart-ink-muted uppercase">
          Max
        </span>
        <input
          inputMode="decimal"
          value={form.max_score}
          onChange={(e) => set("max_score")(e.target.value)}
          className={`${field} w-16`}
          style={{ outlineColor: `var(${colorVar})` }}
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="font-mono text-[9px] text-chart-ink-muted uppercase">
          Place
        </span>
        <input
          inputMode="numeric"
          value={form.placement}
          onChange={(e) => set("placement")(e.target.value)}
          className={`${field} w-14`}
          style={{ outlineColor: `var(${colorVar})` }}
        />
      </label>
      <label className="flex flex-1 flex-col gap-0.5">
        <span className="font-mono text-[9px] text-chart-ink-muted uppercase">
          Note
        </span>
        <input
          value={form.notes}
          onChange={(e) => set("notes")(e.target.value)}
          className={`${field} w-full`}
          style={{ outlineColor: `var(${colorVar})` }}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-[2px] px-2.5 py-1 text-xs font-medium text-chart-ground-raised disabled:opacity-60"
        style={{ backgroundColor: `var(${colorVar})` }}
      >
        {pending ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-1.5 py-1 font-mono text-[11px] text-chart-ink-muted hover:text-chart-ink"
      >
        cancel
      </button>
    </form>
  );
}

function Sparkline({
  points,
  colorVar,
}: {
  points: number[];
  colorVar: string;
}) {
  const w = 260;
  const h = 44;
  const pad = 5;
  const x = (i: number) => pad + (i / (points.length - 1)) * (w - 2 * pad);
  const y = (v: number) => h - pad - (v / 100) * (h - 2 * pad);
  const d = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-full" role="img">
      <line
        x1={pad}
        x2={w - pad}
        y1={y(50)}
        y2={y(50)}
        stroke="var(--chart-rule)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <path d={d} fill="none" stroke={`var(${colorVar})`} strokeWidth={1.5} />
      {points.map((v, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(v)}
          r={2}
          fill={`var(${colorVar})`}
        />
      ))}
    </svg>
  );
}
