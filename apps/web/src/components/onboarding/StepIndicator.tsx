import clsx from "clsx";

interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  const progress = Math.round((current / (steps.length - 1)) * 100);

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step labels */}
      <div className="flex justify-between">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div
              className={clsx(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                i < current
                  ? "bg-primary-500 text-white"
                  : i === current
                  ? "bg-primary-100 text-primary-700 ring-2 ring-primary-400"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={clsx(
                "text-xs hidden sm:block",
                i === current ? "text-primary-600 font-semibold" : "text-gray-400"
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
