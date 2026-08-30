export default function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex-1 bg-chart-ground px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-sm border border-chart-rule bg-chart-ground-raised px-6 py-6 sm:px-8 sm:py-8">
          <h1 className="text-2xl font-semibold text-chart-ink sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-chart-ink-muted">{description}</p>
        </header>
        <p className="mt-8 font-mono text-xs tracking-wide text-chart-ink-muted uppercase">
          Not built yet
        </p>
      </div>
    </main>
  );
}
