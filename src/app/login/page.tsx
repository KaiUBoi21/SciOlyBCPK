import LoginForm from "./login-form";

export const metadata = {
  title: "Sign in — BASIS Cedar Park Science Olympiad",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const checkEmail = params.checkEmail === "1";
  const initialError =
    typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="flex flex-1 items-center justify-center bg-chart-ground px-4 py-12">
      <div className="w-full max-w-sm">
        <header className="mb-6">
          <p className="font-mono text-xs tracking-[0.2em] text-chart-ink-muted uppercase">
            Team Hub
          </p>
          <h1 className="mt-2 text-xl font-semibold text-chart-ink">
            BASIS Cedar Park · Science Olympiad
          </h1>
        </header>
        <LoginForm checkEmail={checkEmail} initialError={initialError} />
      </div>
    </main>
  );
}
