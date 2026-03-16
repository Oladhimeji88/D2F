import { devLogin } from "../../src/lib/api";

export default async function LoginPage() {
  const user = await devLogin();

  return (
    <div className="space-y-6">
      <section className="panel p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Dev Login</p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">Development access enabled</h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
          Authentication is intentionally simplified for this MVP. The API provisions a local demo user and the dashboard uses that account for capture and plugin workflows.
        </p>
      </section>
      <section className="panel p-6">
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Name</dt>
            <dd className="mt-2 text-lg font-medium text-ink">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Email</dt>
            <dd className="mt-2 text-lg font-medium text-ink">{user.email}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
