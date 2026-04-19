interface LoadingSpinnerProps {
  text?: string;
}

/**
 * Centraal laad-indicator. Gebruik dit overal waar async data wordt opgehaald.
 */
export default function LoadingSpinner({
  text = "Laden...",
}: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
      <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
