export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel flex flex-col items-start gap-3 p-6">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="max-w-2xl text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}
