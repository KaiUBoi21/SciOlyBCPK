"use client";

import { useState, useTransition } from "react";
import { setPairing } from "./pairings-actions";

export type Member = { id: string; full_name: string };

type EventData = { id: string; name: string };

// Events that run three competitors per team rather than the usual two.
const THREE_PERSON_EVENTS = new Set(["Experimental Design", "Codebusters"]);

type TeamData = {
  id: string;
  name: string;
  code: string;
  members: Member[];
  // event_id -> [student1_id, student2_id | null, student3_id | null]
  pairings: Record<string, [string, string | null, string | null]>;
};

export type DivisionData = {
  code: "B" | "C";
  name: string;
  subtitle: string;
  colorVar: string;
  events: EventData[];
  teams: TeamData[];
};

export default function PairingsBoard({
  divisions,
}: {
  divisions: DivisionData[];
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="flex-1 bg-chart-ground px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="rounded-sm border border-chart-rule bg-chart-ground-raised px-6 py-6 sm:px-8 sm:py-8">
          <p className="font-mono text-xs tracking-[0.2em] text-chart-ink-muted uppercase">
            Event Pairings
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-chart-ink sm:text-3xl">
            Who&rsquo;s on each event
          </h1>
          <p className="mt-1 text-sm text-chart-ink-muted">
            One partner pairing (1&ndash;2 students, or 3 for Experimental Design
            and Codebusters) per event, per team. Partners are drawn from that
            team&rsquo;s roster. Changes save as you pick.
          </p>
          {error && (
            <p className="mt-3 font-mono text-xs text-accent">{error}</p>
          )}
        </header>

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
            </div>

            {division.teams.length === 0 && (
              <p className="text-sm text-chart-ink-muted italic">
                No teams in {division.name} yet &mdash; add them on the roster.
              </p>
            )}

            {division.teams.map((team) => (
              <TeamPairings
                key={team.id}
                division={division}
                team={team}
                onError={setError}
              />
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}

function TeamPairings({
  division,
  team,
  onError,
}: {
  division: DivisionData;
  team: TeamData;
  onError: (msg: string | null) => void;
}) {
  const [selections, setSelections] = useState<
    Record<string, [string, string, string]>
  >(() => {
    const initial: Record<string, [string, string, string]> = {};
    for (const event of division.events) {
      const pair = team.pairings[event.id];
      initial[event.id] = [pair?.[0] ?? "", pair?.[1] ?? "", pair?.[2] ?? ""];
    }
    return initial;
  });
  const [pending, startTransition] = useTransition();

  const assignedCount = division.events.filter(
    (e) => selections[e.id]?.[0]
  ).length;

  function change(eventId: string, slot: 0 | 1 | 2, studentId: string) {
    const next = [...selections[eventId]] as [string, string, string];
    next[slot] = studentId;
    setSelections((s) => ({ ...s, [eventId]: next }));
    onError(null);
    startTransition(async () => {
      const result = await setPairing(team.id, eventId, next);
      if ("error" in result) onError(result.error);
    });
  }

  return (
    <div className="rounded-sm border border-chart-rule bg-chart-ground-raised">
      <div className="flex items-baseline gap-2 border-b border-chart-rule px-4 py-3">
        <span className="font-mono text-xs font-medium text-chart-ink">
          {division.code}-{team.code}
        </span>
        <span className="text-sm text-chart-ink">{team.name}</span>
        <span className="font-mono text-xs tabular-nums text-chart-ink-muted">
          {assignedCount}/{division.events.length} events
        </span>
      </div>

      {team.members.length === 0 ? (
        <p className="px-4 py-4 text-sm text-chart-ink-muted italic">
          Seat students on this team from the roster to start pairing.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-[10px] tracking-wide text-chart-ink-muted uppercase">
              <th className="px-4 py-2 font-medium">Event</th>
              <th className="px-4 py-2 font-medium">Partner 1</th>
              <th className="px-4 py-2 font-medium">Partner 2</th>
              <th className="px-4 py-2 font-medium">Partner 3</th>
            </tr>
          </thead>
          <tbody>
            {division.events.map((event) => {
              const [p1, p2, p3] = selections[event.id] ?? ["", "", ""];
              const threePerson = THREE_PERSON_EVENTS.has(event.name);
              return (
                <tr
                  key={event.id}
                  className="border-t border-chart-rule/60 align-middle"
                >
                  <td className="px-4 py-1.5 text-chart-ink">{event.name}</td>
                  <td className="px-4 py-1.5">
                    <PartnerSelect
                      members={team.members}
                      value={p1}
                      exclude={[p2, p3]}
                      pending={pending}
                      colorVar={division.colorVar}
                      onChange={(v) => change(event.id, 0, v)}
                    />
                  </td>
                  <td className="px-4 py-1.5">
                    <PartnerSelect
                      members={team.members}
                      value={p2}
                      exclude={[p1, p3]}
                      pending={pending}
                      colorVar={division.colorVar}
                      onChange={(v) => change(event.id, 1, v)}
                    />
                  </td>
                  <td className="px-4 py-1.5">
                    {threePerson ? (
                      <PartnerSelect
                        members={team.members}
                        value={p3}
                        exclude={[p1, p2]}
                        pending={pending}
                        colorVar={division.colorVar}
                        onChange={(v) => change(event.id, 2, v)}
                      />
                    ) : (
                      <span className="font-mono text-xs text-chart-ink-muted">
                        &mdash;
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PartnerSelect({
  members,
  value,
  exclude,
  pending,
  colorVar,
  onChange,
}: {
  members: Member[];
  value: string;
  exclude: string[];
  pending: boolean;
  colorVar: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-44 rounded-[2px] border border-chart-rule bg-white px-1.5 py-1 text-xs text-chart-ink outline-none focus-visible:outline-2 disabled:opacity-50"
      style={{ outlineColor: `var(${colorVar})` }}
    >
      <option value="">&mdash;</option>
      {members.map((m) => (
        <option key={m.id} value={m.id} disabled={exclude.includes(m.id)}>
          {m.full_name}
        </option>
      ))}
    </select>
  );
}
