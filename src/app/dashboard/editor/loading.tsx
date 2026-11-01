export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col bg-ink" role="status" aria-label="Loading builder">
      <div className="h-14 border-b border-line" />
      <div className="grid flex-1 grid-cols-1 gap-0 lg:grid-cols-[300px_1fr_340px]">
        <div className="skeleton m-3 hidden lg:block" /><div className="skeleton m-3" /><div className="skeleton m-3 hidden lg:block" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
