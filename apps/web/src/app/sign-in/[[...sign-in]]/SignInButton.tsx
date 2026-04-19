"use client";

import { useFormStatus } from "react-dom";

/** Inner submit button — reads pending state from the enclosing <form>. */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="
        w-full flex items-center justify-center gap-2
        bg-primary-500 hover:bg-primary-600
        disabled:bg-primary-400 disabled:cursor-not-allowed
        text-white font-semibold
        px-6 py-4 rounded-xl
        transition-colors duration-150
        text-base shadow-sm
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500
      "
      aria-busy={pending}
    >
      {pending ? (
        <>
          {/* Spinner */}
          <svg
            className="animate-spin h-5 w-5 text-white flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Verbinden…</span>
        </>
      ) : (
        <>
          <span>Inloggen met BeleggenCoach</span>
          {/* Arrow icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </>
      )}
    </button>
  );
}

/** Wraps the server action in a <form> so SubmitButton can read pending state. */
export function SignInButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  return (
    <form action={action} className="w-full">
      <SubmitButton />
    </form>
  );
}
