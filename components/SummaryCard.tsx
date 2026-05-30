import { StarRating } from "@/components/StarRating";

type ParsedSummary = {
  overallSentiment: "positive" | "neutral" | "needs_improvement";
  sentimentScore: number;
  averageRating: number;
  strengthsSummary: string;
  improvementsSummary: string;
  actionableAdvice: string[];
  standoutQuote: string;
};

type SummaryCardProps = {
  formTitle: string;
  summaryText: string;
  status?: string;
  errorMessage?: string | null;
  fresh?: boolean;
  onRetry?: () => void;
};

const badgeClass = {
  positive: "bg-emerald-100 text-emerald-800 border-emerald-200",
  neutral: "bg-amber-100 text-amber-800 border-amber-200",
  needs_improvement: "bg-rose-100 text-rose-800 border-rose-200",
};

export function SummaryCard({ formTitle, summaryText, status = "GENERATED", errorMessage, fresh, onRetry }: SummaryCardProps) {
  if (status === "FAILED") {
    return (
      <article className="rounded-lg border border-rose-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{formTitle}</p>
            <h3 className="text-lg font-semibold text-slate-950">Summary generation failed</h3>
            <p className="mt-1 text-sm text-slate-600">{errorMessage ?? "Summary generation failed — retry"}</p>
          </div>
          {onRetry ? (
            <button onClick={onRetry} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white">
              Retry
            </button>
          ) : null}
        </div>
      </article>
    );
  }

  let data: ParsedSummary;
  try {
    data = JSON.parse(summaryText) as ParsedSummary;
  } catch {
    return (
      <div className="rounded-lg border border-rose-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-rose-600">Summary data is corrupted. Please retry.</p>
      </div>
    );
  }
  const sentimentLabel = data.overallSentiment.replace("_", " ");

  return (
    <article className={`glass-card rounded-[1.75rem] border border-slate-200/80 p-6 ${fresh ? "animate-border-pulse" : ""}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{formTitle}</p>
          <h3 className="text-2xl font-semibold text-slate-950">Your AI feedback summary</h3>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClass[data.overallSentiment]}`}>
          {sentimentLabel}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <StarRating value={Math.round(data.averageRating)} readOnly />
        <span className="text-sm font-medium text-slate-600">{data.averageRating.toFixed(1)} average rating</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Strengths</h4>
          <p className="mt-2 text-sm leading-6 text-slate-700">{data.strengthsSummary}</p>
        </section>
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Improvements</h4>
          <p className="mt-2 text-sm leading-6 text-slate-700">{data.improvementsSummary}</p>
        </section>
      </div>

      <section className="mt-5">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Actionable advice</h4>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {data.actionableAdvice.map((advice) => (
            <li key={advice} className="rounded-2xl bg-slate-50 px-3 py-2">
              {advice}
            </li>
          ))}
        </ul>
      </section>

      <blockquote className="mt-5 border-l-4 border-emerald-400 bg-emerald-50 p-4 text-sm italic text-slate-700">
        “{data.standoutQuote}”
      </blockquote>
    </article>
  );
}
