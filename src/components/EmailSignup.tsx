import { useState } from "react";

export function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setStatus("error");
      setErrorMessage("Please enter your email address");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const result = await response.json();
      if (result.success) {
        setStatus("success");
        // Pinterest signup conversion
        if (typeof window !== "undefined" && "pintrk" in window) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).pintrk("track", "signup", {
            event_id: `signup-${Date.now()}`,
          });
        }
      } else {
        setStatus("error");
        setErrorMessage(
          result.error || "Something went wrong, please try again",
        );
      }
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong, please try again");
    }
  }

  return (
    <section id="signup" className="bg-beige/15 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        {status === "success" ? (
          <div className="rounded-2xl bg-white p-10 shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8A9A83"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-warm-dark">
              You&apos;re all set!
            </h2>
            <p className="mt-2 text-warm-gray">
              Thank you for joining! We'll send our best finds your way.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              Join the Journal
            </h2>
            <p className="mt-3 text-warm-gray">
              Thoughtfully curated home finds, timeless inspiration, and beautifully edited collections delivered to your inbox.
            </p>
            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") {
                    setStatus("idle");
                    setErrorMessage("");
                  }
                }}
                placeholder="Your email address"
                required
                disabled={status === "loading"}
                className="w-full rounded-full border border-beige/50 bg-white px-5 py-3 text-warm-dark shadow-sm outline-none placeholder:text-warm-gray/60 focus:border-beige disabled:opacity-50 sm:max-w-sm"
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-full bg-terracotta px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-terracotta-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Subscribing…
                  </span>
                ) : (
                  "Join the Journal"
                )}
              </button>
            </form>
            {status === "error" && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
            {status !== "error" && (
              <p className="mt-4 text-xs text-warm-gray/70">
                No spam, ever. Unsubscribe anytime.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
