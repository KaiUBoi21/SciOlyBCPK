"use client";

import { useState, useTransition } from "react";
import { addLink, deleteLink } from "./test-bank-actions";

export type LinkRow = {
  id: string;
  eventName: string | null;
  title: string;
  url: string;
  source: string;
};

type EventOption = { id: string; name: string };

export type DivisionData = {
  code: "B" | "C";
  name: string;
  subtitle: string;
  colorVar: string;
  events: EventOption[];
  links: LinkRow[];
};

export default function TestBankBoard({
  divisions,
}: {
  divisions: DivisionData[];
}) {
  const [error, setError] = useState<string | null>(null);

  const anyLinks = divisions.some((d) => d.links.length > 0);

  return (
    <main className="flex-1 bg-chart-ground px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="rounded-sm border border-chart-rule bg-chart-ground-raised px-6 py-6 sm:px-8 sm:py-8">
          <p className="font-mono text-xs tracking-[0.2em] text-chart-ink-muted uppercase">
            Test Bank
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-chart-ink sm:text-3xl">
            Practice tests &amp; materials
          </h1>
          <p className="mt-1 text-sm text-chart-ink-muted">
            Links out to practice tests and materials (Google Drive, soinc.org,
            &hellip;), grouped by division and event.
          </p>
          {error && (
            <p className="mt-3 font-mono text-xs text-accent">{error}</p>
          )}
        </header>

        {!anyLinks && (
          <p className="text-sm text-chart-ink-muted italic">
            No links yet &mdash; add one under a division below.
          </p>
        )}

        {divisions.map((division) => (
          <DivisionSection
            key={division.code}
            division={division}
            onError={setError}
          />
        ))}
      </div>
    </main>
  );
}

function DivisionSection({
  division,
  onError,
}: {
  division: DivisionData;
  onError: (msg: string | null) => void;
}) {
  const groups: { name: string; links: LinkRow[] }[] = [];
  for (const event of division.events) {
    const links = division.links.filter((l) => l.eventName === event.name);
    if (links.length > 0) groups.push({ name: event.name, links });
  }
  const unfiled = division.links.filter((l) => l.eventName === null);
  if (unfiled.length > 0) groups.push({ name: "Unfiled", links: unfiled });

  return (
    <section className="flex flex-col gap-4">
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
          {division.links.length} links
        </span>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-chart-ink-muted italic">
          No links for {division.name} yet.
        </p>
      )}

      {groups.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <div
              key={group.name}
              className="rounded-sm border border-chart-rule bg-chart-ground-raised"
            >
              <div className="border-b border-chart-rule px-4 py-2 font-mono text-xs font-medium text-chart-ink">
                {group.name}
              </div>
              <ul className="divide-y divide-chart-rule/50">
                {group.links.map((link) => (
                  <li
                    key={link.id}
                    className="flex items-start justify-between gap-2 px-4 py-2"
                  >
                    <div className="min-w-0">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm underline-offset-2 hover:underline"
                        style={{ color: `var(${division.colorVar})` }}
                      >
                        {link.title}
                      </a>
                      {link.source && (
                        <p className="truncate text-[11px] text-chart-ink-muted">
                          {link.source}
                        </p>
                      )}
                    </div>
                    <DeleteLinkButton
                      linkId={link.id}
                      title={link.title}
                      onError={onError}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <NewLinkForm division={division} onError={onError} />
    </section>
  );
}

function DeleteLinkButton({
  linkId,
  title,
  onError,
}: {
  linkId: string;
  title: string;
  onError: (msg: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        onError(null);
        startTransition(async () => {
          const result = await deleteLink(linkId);
          if ("error" in result) onError(result.error);
        });
      }}
      aria-label={`Delete ${title}`}
      className="shrink-0 text-chart-ink-muted hover:text-accent disabled:opacity-50"
    >
      &times;
    </button>
  );
}

function NewLinkForm({
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
      const result = await addLink(formData);
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
        + link
      </button>
    );
  }

  const field =
    "rounded-[2px] border border-chart-rule bg-white px-2 py-1 text-sm text-chart-ink outline-none focus-visible:outline-2";

  return (
    <form
      action={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-sm border border-chart-rule bg-chart-ground-raised p-3"
    >
      <input type="hidden" name="division" value={division.code} />
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[10px] text-chart-ink-muted uppercase">
          Event
        </span>
        <select
          name="event_id"
          className={`${field} max-w-44`}
          style={{ outlineColor: `var(${division.colorVar})` }}
        >
          <option value="">Unfiled</option>
          {division.events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[10px] text-chart-ink-muted uppercase">
          Title
        </span>
        <input
          name="title"
          required
          placeholder="2023 Regionals test"
          className={field}
          style={{ outlineColor: `var(${division.colorVar})` }}
        />
      </label>
      <label className="flex flex-1 flex-col gap-1">
        <span className="font-mono text-[10px] text-chart-ink-muted uppercase">
          URL
        </span>
        <input
          name="url"
          required
          type="url"
          placeholder="https://drive.google.com/…"
          className={`${field} w-full`}
          style={{ outlineColor: `var(${division.colorVar})` }}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[10px] text-chart-ink-muted uppercase">
          Source
        </span>
        <input
          name="source"
          placeholder="MIT Invitational"
          className={field}
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
