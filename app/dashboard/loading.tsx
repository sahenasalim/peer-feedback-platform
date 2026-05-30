export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 space-y-5">
      <div className="h-36 rounded-[2rem] bg-slate-100 animate-pulse" />
      <div className="h-6 w-48 rounded-full bg-slate-100 animate-pulse" />
      <div className="grid gap-5 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-[1.75rem] bg-slate-100 animate-pulse" />
        ))}
      </div>
      <div className="h-6 w-36 rounded-full bg-slate-100 animate-pulse" />
      <div className="h-48 rounded-[1.75rem] bg-slate-100 animate-pulse" />
    </main>
  );
}