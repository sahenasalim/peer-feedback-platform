"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <div className="rounded-[2rem] border border-rose-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-600">An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}