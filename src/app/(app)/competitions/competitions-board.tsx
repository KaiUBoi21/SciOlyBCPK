"use client";

import { useState, useTransition } from "react";
import {
  createCompetition,
  deleteResult,
  logResult,
  type ResultInput,
} from "./competitions-actions";

export type ResultRow = {
  id: string;
  eventName: string;
  teamLabel: string;
  placement: number | null;
  points: number | null;
  notes: string;
};

export type CompetitionData = {
  id: string;
  name: string;
  heldOn: string | null;
  location: string;
  results: ResultRow[];
};

type EventOption = { id: string; name: string };
type TeamOption = { id: string; name: string; code: string };

export type DivisionData = {
  code: "B" | "C";
  name: string;
  subtitle: string;
  colorVar: string;
  events: EventOption[];
  teams: TeamOption[];
  competitions: CompetitionData[];
};

export default function CompetitionsBoard({
  divisions,
}: {
  divisions: DivisionData[];
}) {
  const [error, setError] = useState<string | null>(null);

  const anyCompetitions = divisions.some((d) => d.competitions.length > 0);

  return (
    <main className="flex-1 bg-chart-ground px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="rounded-sm border border-chart-rule bg-chart-ground-raised px-6 py-6 sm:px-8 sm:py-8">
          <p className="font-mono text-xs tracking-[0.2em] text-chart-ink-muted uppercase">
            Competition Scores
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-chart-ink sm:text-3xl">
            How each team placed
          </h1>
          <p className="mt-1 text-sm text-chart-ink-muted">
            One row per event result at a meet &mdash; placement and points for
            each team.
          </p>
          {error && (
            <p className="mt-3 font-mono text-xs text-accent">{error}</p>
          )}
        </header>

        {!anyCompetitions && (
          <p className="text-sm text-chart-ink-muted italic">
            No competitions logged yet &mdash; add one under a division below.
          </p>
        )}

        {divisions.map((division) => (
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
                {division.competitions.length} meets
              </span>
            </div>

            {division.competitions.map((competition) => (
              <CompetitionCard
                key={competition.id}
                division={division}
                competition={competition}
                onError={setError}
              />
            ))}

            <NewCompetitionForm division={division} onError={setError} />
          </section>
        ))}
      </div>
    </main>
  );
}

function CompetitionCard({
  division,
  competition,
  onError,
}: {
  division: DivisionData;
  competition: CompetitionData;
  onError: (msg: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleLog(input: ResultInput) {
    onError(null);
    startTransition(async () => {
      const result = await logResult(competition.id, input);
      if ("error" in result) onError(result.error);
      else setOpen(false);
    });
  }

  function handleDelete(scoreId: string) {
    onError(null);
    startTransition(async () => {
      const result = await deleteResult(scoreId);
      if ("error" in result) onError(result.error);
    });
  }

  return (
    <div className="rounded-sm border border-chart-rule bg-chart-ground-raised">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-chart-rule px-4 py-3">
        <span className="text-sm font-medium text-chart-ink">
          {competition.name}
        </span>
        {competition.heldOn && (
          <span className="font-mono text-xs tabular-nums text-chart-ink-muted">
            {competition.heldOn}
          </span>
        )}
        {competition.location && (
          <span className="text-xs text-chart-ink-muted">
            &middot; {competition.location}
          </span>
        )}
        <span className="ml-auto font-mono text-xs tabular-nums text-chart-ink-muted">
          {competition.results.length} results
        </span>
      </div>

      {competition.results.length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left font-mono text-[10px] tracking-wide text-chart-ink-muted uppercase">
              <th className="px-4 py-2 font-medium">Event</th>
              <th className="px-2 py-2 font-medium">Team</th>
              <th className="px-2 py-2 font-medium">Place</th>
              <th className="px-2 py-2 font-medium">Points</th>
              <th className="px-2 py-2 font-medium">Note</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {competition.results.map((r) => (
              <tr key={r.id} className="border-t border-chart-rule/60">
                <td className="px-4 py-1.5 text-chart-ink">{r.eventName}</td>
                <td className="px-2 py-1.5 font-mono tabular-nums text-chart-ink-muted">
                  {r.teamLabel}
                </td>
                <td className="px-2 py-1.5 tabular-nums text-chart-ink">
                  {r.placement !== null ? `#${r.placement}` : "—"}
                </td>
                <td className="px-2 py-1.5 tabular-nums text-chart-ink">
                  {r.points !== null ? r.points : "—"}
                </td>
                <td className="max-w-24 truncate px-2 py-1.5 text-chart-ink-muted">
                  {r.notes}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleDelete(r.id)}
                    aria-label={`Delete ${r.eventName} result for ${r.teamLabel}`}
                    className="text-chart-ink-muted hover:text-accent disabled:opacity-50"
                  >
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="border-t border-chart-rule px-4 py-2">
        {open ? (
          <LogResultForm
            division={division}
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
            + log result
          </button>
        )}
      </div>
    </div>
  );
}

function LogResultForm({
  division,
  pending,
  onSubmit,
  onCancel,
}: {
  division: DivisionData;
  pending: boolean;
  onSubmit: (input: ResultInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ResultInput>({
    event_id: "",
    team_id: "",
    placement: "",
    points: "",
    notes: "",
  });

  const field =
    "rounded-[2px] border border-chart-rule bg-white px-1.5 py-1 text-xs text-chart-ink outline-none focus-visible:outline-2";
  const set = (k: keyof ResultInput) => (v: string) =>
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
          Event
        </span>
        <select
          required
          value={form.event_id}
          onChange={(e) => set("event_id")(e.target.value)}
          className={`${field} max-w-44`}
          style={{ outlineColor: `var(${division.colorVar})` }}
        >
          <option value="">&mdash;</option>
          {division.events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="font-mono text-[9px] text-chart-ink-muted uppercase">
          Team
        </span>
        <select
          required
          value={form.team_id}
          onChange={(e) => set("team_id")(e.target.value)}
          className={`${field} max-w-40`}
          style={{ outlineColor: `var(${division.colorVar})` }}
        >
          <option value="">&mdash;</option>
          {division.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {division.code}-{t.code} · {t.name}
            </option>
          ))}
        </select>
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
          style={{ outlineColor: `var(${division.colorVar})` }}
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="font-mono text-[9px] text-chart-ink-muted uppercase">
          Points
        </span>
        <input
          inputMode="decimal"
          value={form.points}
          onChange={(e) => set("points")(e.target.value)}
          className={`${field} w-16`}
          style={{ outlineColor: `var(${division.colorVar})` }}
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
          style={{ outlineColor: `var(${division.colorVar})` }}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-[2px] px-2.5 py-1 text-xs font-medium text-chart-ground-raised disabled:opacity-60"
        style={{ backgroundColor: `var(${division.colorVar})` }}
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

function NewCompetitionForm({
  division,
  onError,
}: {
  division: DivisionData;
  onError: (msg: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    onError(null);
    startTransition(async () => {
      const result = await createCompetition(formData);
      if ("error" in result) onError(result.error);
      else setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start font-mono text-xs text-chart-ink-muted underline-offset-2 hover:text-chart-ink hover:underline"
      >
        + competition
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-sm border border-chart-rule bg-chart-ground-raised p-3"
    >
      <input type="hidden" name="division" value={division.code} />
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[10px] text-chart-ink-muted uppercase">
          Name
        </span>
        <input
          name="name"
          required
          placeholder="Regional Tournament"
          className="rounded-[2px] border border-chart-rule bg-white px-2 py-1 text-sm text-chart-ink outline-none focus-visible:outline-2"
          style={{ outlineColor: `var(${division.colorVar})` }}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[10px] text-chart-ink-muted uppercase">
          Date
        </span>
        <input
          type="date"
          name="held_on"
          className="rounded-[2px] border border-chart-rule bg-white px-2 py-1 text-sm text-chart-ink outline-none focus-visible:outline-2"
          style={{ outlineColor: `var(${division.colorVar})` }}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[10px] text-chart-ink-muted uppercase">
          Location
        </span>
        <input
          name="location"
          placeholder="UT Austin"
          className="rounded-[2px] border border-chart-rule bg-white px-2 py-1 text-sm text-chart-ink outline-none focus-visible:outline-2"
          style={{ outlineColor: `var(${division.colorVar})` }}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-[2px] px-3 py-1.5 text-sm font-medium text-chart-ground-raised disabled:opacity-60"
        style={{ backgroundColor: `var(${division.colorVar})` }}
      >
        {pending ? "Adding…" : "Add"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-2 py-1.5 font-mono text-xs text-chart-ink-muted hover:text-chart-ink"
      >
        cancel
      </button>
    </form>
  );
}
