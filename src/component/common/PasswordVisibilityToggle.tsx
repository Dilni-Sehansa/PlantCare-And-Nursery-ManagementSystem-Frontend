type PasswordVisibilityToggleProps = {
  visible: boolean;
  onToggle: () => void;
};

const PasswordVisibilityToggle = ({
  visible,
  onToggle,
}: PasswordVisibilityToggleProps) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={visible ? "Hide password" : "Show password"}
    aria-pressed={visible}
    className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-green-700 focus:outline-none"
  >
    {visible ? (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1.1-1.3 2.5-2.7 3.8M6.2 6.2C3.9 7.7 2.7 10 2.5 12c.5 1.2 1.8 3.2 4.4 4.8A10.5 10.5 0 0012 19c1.2 0 2.3-.2 3.3-.6"
        />
      </svg>
    ) : (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"
        />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )}
  </button>
);

export default PasswordVisibilityToggle;
