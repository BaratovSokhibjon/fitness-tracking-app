import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <div className="rounded-none border px-4 py-8 text-center">
        <p className="font-mono text-4xl font-semibold tabular-nums text-ink">404</p>
        <p className="mt-2 text-sm text-mute">This page doesn&apos;t exist.</p>
      </div>
      <div className="flex justify-center">
        <Button asChild>
          <Link href="/">Back to Today</Link>
        </Button>
      </div>
    </div>
  );
}
