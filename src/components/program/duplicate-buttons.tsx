"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { duplicateProgram } from "@/actions/program";
import { duplicateWorkout } from "@/actions/workout";

export function DuplicateProgramButton({ programId, label = "Duplicate" }: { programId: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    setBusy(true);
    setError(null);
    try {
      await duplicateProgram(programId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Duplicate failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handle} disabled={busy}>
        <Copy className="h-4 w-4" />
        {busy ? "Duplicating…" : label}
      </Button>
      {error && <span className="text-xs text-sale">{error}</span>}
    </span>
  );
}

export function DuplicateWorkoutButton({ workoutId, label = "Duplicate" }: { workoutId: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    setBusy(true);
    setError(null);
    try {
      await duplicateWorkout(workoutId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Duplicate failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handle} disabled={busy}>
        <Copy className="h-4 w-4" />
        {busy ? "Duplicating…" : label}
      </Button>
      {error && <span className="text-xs text-sale">{error}</span>}
    </span>
  );
}
