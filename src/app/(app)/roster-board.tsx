"use client";

import { useRef, useState, useTransition } from "react";
import {
  createTeam,
  removeStudent,
  reseatStudent,
  seatStudent,
  unseatStudent,
} from "./roster-actions";

export type Member = { id: string; full_name: string };

export type TeamData = {
  id: string;
  name: string;
  code: string;
  capacity: number;
  members: Member[];
};

export type DivisionData = {
  code: "B" | "C";
  name: string;
  subtitle: string;
  colorVar: string;
  tintVar: string;
  teams: TeamData[];
  unseated: Member[];
};

function symbolFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0];
  const second = parts.length > 1 ? parts[1] : first.slice(1);
  const a = first[0]?.toUpperCase() ?? "";
  const b = (second[0] ?? "").toLowerCase();
  return `${a}${b}`;
}

export default function RosterBoard({
  divisions,
}: {
  divisions: DivisionData[];
}) {
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const totals = divisions.reduce(
    (acc, d) => {
      for (const t of d.teams) {
        acc.capacity += t.capacity;
        acc.seated += t.members.length;
      }
      return acc;
    },
    { seated: 0, capacity: 0 }
  );

  function openEditor(teamId: string) {
    setEditingTeam(teamId);
    setDraft("");
    setError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function cancelEditor() {
    setEditingTeam(null);
    setDraft("");
    setError(null);
  }

  function commitEditor(teamId: string) {
    const name = draft.trim();
    if (!name) {
      setError("Enter a name to seat this tile.");
      return;
    }
    startTransition(async () => {
      const result = await seatStudent(teamId, name);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEditingTeam(null);
      setDraft("");
      setError(null);
    });
  }

  function clearSeat(teamId: string, studentId: string) {
    setError(null);
    startTransition(async () => {
      const result = await unseatStudent(teamId, studentId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <main className="flex-1 bg-chart-ground px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="rounded-sm border border-chart-rule bg-chart-ground-raised px-6 py-6 sm:px-8 sm:py-8">
          <p className="font-mono text-xs tracking-[0.2em] text-chart-ink-muted uppercase">
            Team Roster
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-chart-ink sm:text-3xl">
            BASIS Cedar Park · Science Olympiad
          </h1>
          <p className="mt-1 text-sm text-chart-ink-muted">
            Division B (middle school) and Division C (high school), every team
            and every seat, at a glance.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-chart-rule pt-4 text-xs text-chart-ink-muted">
            <span className="font-mono tabular-nums text-chart-ink">
              {totals.seated} / {totals.capacity} seated
            </span>
            <LegendSwatch colorVar="--division-b" label="Division B" />
            <LegendSwatch colorVar="--division-c" label="Division C" />
            <LegendSwatch dashed label="Open slot" />
            <LegendSwatch solid label="Seated" />
          </div>

          {error && (
            <p className="mt-3 font-mono text-xs text-accent">{error}</p>
          )}
        </header>

        {divisions.map((division) => {
          const seatedInDivision = division.teams.reduce(
            (sum, t) => sum + t.members.length,
            0
          );
          const capacityInDivision = division.teams.reduce(
            (sum, t) => sum + t.capacity,
            0
          );

          return (
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
                  {seatedInDivision} / {capacityInDivision}
                </span>
              </div>

              {division.teams.length === 0 && (
                <p className="text-sm text-chart-ink-muted italic">
                  No teams in {division.name} yet.
                </p>
              )}

              <div className="flex flex-col gap-6">
                {division.teams.map((team) => (
                  <TeamRow
                    key={team.id}
                    division={division}
                    team={team}
                    isEditing={editingTeam === team.id}
                    draft={draft}
                    pending={pending}
                    inputRef={inputRef}
                    onDraftChange={setDraft}
                    onOpenEditor={openEditor}
                    onCancelEditor={cancelEditor}
                    onCommitEditor={commitEditor}
                    onClearSeat={clearSeat}
                  />
                ))}
              </div>

              <NewTeamForm division={division} />

              {division.unseated.length > 0 && (
                <UnseatedStudents
                  division={division}
                  students={division.unseated}
                  onError={setError}
                />
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

function LegendSwatch({
  colorVar,
  dashed,
  solid,
  label,
}: {
  colorVar?: string;
  dashed?: boolean;
  solid?: boolean;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={
          "inline-block h-3 w-3 rounded-[2px] " +
          (dashed
            ? "border border-dashed border-chart-rule bg-transparent"
            : solid
            ? "border border-chart-rule bg-chart-ink-muted/20"
            : "border")
        }
        style={
          colorVar
            ? {
                borderColor: `var(${colorVar})`,
                backgroundColor: `var(${colorVar})`,
              }
            : undefined
        }
      />
      {label}
    </span>
  );
}

function TeamRow({
  division,
  team,
  isEditing,
  draft,
  pending,
  inputRef,
  onDraftChange,
  onOpenEditor,
  onCancelEditor,
  onCommitEditor,
  onClearSeat,
}: {
  division: DivisionData;
  team: TeamData;
  isEditing: boolean;
  draft: string;
  pending: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onDraftChange: (v: string) => void;
  onOpenEditor: (teamId: string) => void;
  onCancelEditor: () => void;
  onCommitEditor: (teamId: string) => void;
  onClearSeat: (teamId: string, studentId: string) => void;
}) {
  const seatedCount = team.members.length;
  const openCount = Math.max(team.capacity - seatedCount, 0);
  // The tile the inline editor occupies (the first open slot).
  const editorSlot = seatedCount + 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xs font-medium text-chart-ink">
          {division.code}-{team.code}
        </span>
        <span className="text-sm text-chart-ink">{team.name}</span>
        <span className="font-mono text-xs tabular-nums text-chart-ink-muted">
          {seatedCount}/{team.capacity}
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
        {team.members.map((member, i) => {
          const slot = i + 1;
          const symbol = symbolFor(member.full_name);
          return (
            <div
              key={member.id}
              className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-sm border p-2"
              style={{
                borderColor: `var(${division.colorVar})`,
                backgroundColor: `var(${division.tintVar})`,
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ backgroundColor: `var(${division.colorVar})` }}
              />
              <div className="mt-1 flex items-start justify-between">
                <span className="font-mono text-[10px] text-chart-ink-muted">
                  {String(slot).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onClearSeat(team.id, member.id)}
                  aria-label={`Remove ${member.full_name} from ${division.name} ${team.name}`}
                  className="hidden h-4 w-4 items-center justify-center rounded-[2px] text-[10px] leading-none text-chart-ink-muted hover:bg-accent-tint hover:text-accent group-hover:flex group-focus-within:flex disabled:opacity-50"
                >
                  ×
                </button>
              </div>
              <span
                className="font-mono text-xl font-semibold"
                style={{ color: `var(${division.colorVar})` }}
              >
                {symbol}
              </span>
              <span className="truncate text-[11px] text-chart-ink">
                {member.full_name}
              </span>
            </div>
          );
        })}

        {Array.from({ length: openCount }).map((_, i) => {
          const slot = seatedCount + i + 1;
          const isEditorTile = isEditing && slot === editorSlot;

          if (isEditorTile) {
            return (
              <div
                key={`edit-${team.id}`}
                className="group relative flex aspect-square flex-col justify-between rounded-sm border-2 bg-chart-ground-raised p-2"
                style={{ borderColor: `var(${division.colorVar})` }}
              >
                <span className="font-mono text-[10px] text-chart-ink-muted">
                  {String(slot).padStart(2, "0")}
                </span>
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onCommitEditor(team.id);
                    if (e.key === "Escape") onCancelEditor();
                  }}
                  onBlur={() => onCancelEditor()}
                  placeholder="Name"
                  disabled={pending}
                  aria-label={`Seat a name for ${division.name} ${team.name}`}
                  className="w-full rounded-[2px] border border-chart-rule bg-white px-1.5 py-1 text-xs text-chart-ink outline-none focus-visible:outline-2 disabled:opacity-50"
                  style={{ outlineColor: `var(${division.colorVar})` }}
                />
              </div>
            );
          }

          if (slot === editorSlot) {
            return (
              <button
                key={`open-${team.id}-${slot}`}
                type="button"
                onClick={() => onOpenEditor(team.id)}
                aria-label={`Add a name for ${division.name} ${team.name}`}
                className="group flex aspect-square flex-col justify-between rounded-sm border border-dashed border-chart-rule p-2 text-left transition-colors hover:border-solid hover:bg-chart-ground-raised focus-visible:border-solid"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = `var(${division.colorVar})`)
                }
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
              >
                <span className="font-mono text-[10px] text-chart-ink-muted">
                  {String(slot).padStart(2, "0")}
                </span>
                <span className="self-center text-lg text-chart-rule group-hover:text-chart-ink-muted">
                  +
                </span>
                <span className="text-[11px] text-chart-ink-muted italic">
                  open
                </span>
              </button>
            );
          }

          return (
            <div
              key={`open-${team.id}-${slot}`}
              className="flex aspect-square flex-col justify-between rounded-sm border border-dashed border-chart-rule p-2"
            >
              <span className="font-mono text-[10px] text-chart-ink-muted">
                {String(slot).padStart(2, "0")}
              </span>
              <span className="self-center text-lg text-chart-rule">+</span>
              <span className="text-[11px] text-chart-ink-muted italic">
                open
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewTeamForm({ division }: { division: DivisionData }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTeam(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start font-mono text-xs text-chart-ink-muted underline-offset-2 hover:text-chart-ink hover:underline"
      >
        + team
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
          Team name
        </span>
        <input
          name="name"
          required
          placeholder={division.code === "B" ? "Team A" : "Varsity"}
          className="rounded-[2px] border border-chart-rule bg-white px-2 py-1 text-sm text-chart-ink outline-none focus-visible:outline-2"
          style={{ outlineColor: `var(${division.colorVar})` }}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[10px] text-chart-ink-muted uppercase">
          Code
        </span>
        <input
          name="code"
          required
          maxLength={6}
          placeholder={division.code === "B" ? "A" : "VAR"}
          className="w-20 rounded-[2px] border border-chart-rule bg-white px-2 py-1 font-mono text-sm text-chart-ink uppercase outline-none focus-visible:outline-2"
          style={{ outlineColor: `var(${division.colorVar})` }}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-[2px] px-3 py-1.5 text-sm font-medium text-chart-ground-raised disabled:opacity-60"
        style={{ backgroundColor: `var(${division.colorVar})` }}
      >
        {pending ? "Adding…" : "Add team"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-2 py-1.5 font-mono text-xs text-chart-ink-muted hover:text-chart-ink"
      >
        cancel
      </button>
      {error && (
        <p className="w-full font-mono text-xs text-accent">{error}</p>
      )}
    </form>
  );
}

// Students on the roster who aren't seated on any team (e.g. after unseating).
// Without this they'd be invisible in the UI.
function UnseatedStudents({
  division,
  students,
  onError,
}: {
  division: DivisionData;
  students: Member[];
  onError: (msg: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [picks, setPicks] = useState<Record<string, string>>({});

  function seat(studentId: string) {
    const teamId = picks[studentId];
    if (!teamId) {
      onError("Pick a team to seat this student on.");
      return;
    }
    onError(null);
    startTransition(async () => {
      const result = await reseatStudent(teamId, studentId);
      if ("error" in result) onError(result.error);
    });
  }

  function remove(studentId: string) {
    onError(null);
    startTransition(async () => {
      const result = await removeStudent(studentId);
      if ("error" in result) onError(result.error);
    });
  }

  return (
    <div className="rounded-sm border border-dashed border-chart-rule bg-chart-ground-raised p-3">
      <p className="font-mono text-[10px] tracking-wide text-chart-ink-muted uppercase">
        Unseated &mdash; {division.name}
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {students.map((student) => (
          <li key={student.id} className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-chart-ink">{student.full_name}</span>
            <select
              value={picks[student.id] ?? ""}
              disabled={pending || division.teams.length === 0}
              onChange={(e) =>
                setPicks((p) => ({ ...p, [student.id]: e.target.value }))
              }
              className="rounded-[2px] border border-chart-rule bg-white px-1.5 py-1 text-xs text-chart-ink outline-none focus-visible:outline-2 disabled:opacity-50"
              style={{ outlineColor: `var(${division.colorVar})` }}
            >
              <option value="">
                {division.teams.length === 0 ? "no teams" : "seat on…"}
              </option>
              {division.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {division.code}-{t.code} · {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending}
              onClick={() => seat(student.id)}
              className="rounded-[2px] px-2 py-1 font-mono text-[11px] text-chart-ground-raised disabled:opacity-60"
              style={{ backgroundColor: `var(${division.colorVar})` }}
            >
              seat
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(student.id)}
              aria-label={`Remove ${student.full_name} from the roster`}
              className="font-mono text-[11px] text-chart-ink-muted hover:text-accent disabled:opacity-50"
            >
              delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
