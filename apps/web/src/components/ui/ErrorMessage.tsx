interface ErrorMessageProps {
  message: string;
}

/**
 * Foutmelding voor API-fouten en andere runtime-fouten.
 * Gebruik rode kleur ENKEL voor echte fouten — niet voor waarschuwingen.
 */
export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
      <strong>⚠️ Fout:</strong> {message}
    </div>
  );
}
