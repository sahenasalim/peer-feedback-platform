"use client";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
};

export function StarRating({ value, onChange, readOnly = false }: StarRatingProps) {
  return (
    <div className="flex gap-1" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`text-2xl leading-none transition ${star <= value ? "text-amber-400" : "text-slate-300"} ${
            readOnly ? "" : "hover:scale-110 hover:text-amber-400"
          }`}
          aria-label={`${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
