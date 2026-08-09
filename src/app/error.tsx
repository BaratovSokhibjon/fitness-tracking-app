"use client";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-none border border-sale/40 bg-sale/5 px-4 py-3">
        <p className="text-sm font-medium text-sale">Something went wrong</p>
        <p className="mt-1 text-sm text-mute">
          {error.message || "An unexpected error occurred."}
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
