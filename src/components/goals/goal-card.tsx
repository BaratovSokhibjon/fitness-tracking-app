"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGoal, updateGoal, deleteGoal } from "@/actions/goals";
import { percent } from "@/lib/utils";

type GoalData = {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  type: string;
  isActive: boolean;
};

const goalTypes = [
  { value: "WEIGHT", label: "Weight" },
  { value: "EXERCISE", label: "Exercise" },
  { value: "NUTRITION", label: "Nutrition" },
  { value: "SLEEP", label: "Sleep" },
  { value: "STEPS", label: "Steps" },
  { value: "OTHER", label: "Other" },
];

export function GoalForm({
  onDone,
  goal,
  defaultType = "WEIGHT",
}: {
  onDone: () => void;
  goal?: GoalData;
  defaultType?: string;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [targetValue, setTargetValue] = useState(goal?.targetValue?.toString() ?? "");
  const [currentValue, setCurrentValue] = useState(goal?.currentValue?.toString() ?? "0");
  const [unit, setUnit] = useState(goal?.unit ?? "kg");
  const [type, setType] = useState(goal?.type ?? defaultType);

  async function handleSubmit() {
    if (!name || !targetValue) return;
    const data = {
      name,
      targetValue: parseFloat(targetValue),
      currentValue: parseFloat(currentValue) || 0,
      unit,
      type: type as "WEIGHT" | "EXERCISE" | "NUTRITION" | "SLEEP" | "STEPS" | "OTHER",
    };
    if (goal) {
      await updateGoal(goal.id, data);
    } else {
      await createGoal(data);
    }
    onDone();
  }

  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="goal-name">Name</Label>
        <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Target Weight" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="goal-target">Target</Label>
          <Input id="goal-target" type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="goal-current">Current</Label>
          <Input id="goal-current" type="number" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="goal-unit">Unit</Label>
          <Input id="goal-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg" />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {goalTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={!name || !targetValue}>
          {goal ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function GoalCard({ goal }: { goal: GoalData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const pct = goal.targetValue > 0 ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) : 0;

  async function handleDelete() {
    if (!confirm(`Delete goal "${goal.name}"?`)) return;
    await deleteGoal(goal.id);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            {goal.name}
            <Badge variant="secondary">{goal.type}</Badge>
          </CardTitle>
          <CardDescription>
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </CardDescription>
        </div>
        <div className="flex gap-1">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <PencilSimple className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Goal</DialogTitle>
              </DialogHeader>
              <GoalForm goal={goal} onDone={() => { setOpen(false); router.refresh(); }} />
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={percent(goal.currentValue, goal.targetValue)} />
        <p className="mt-1 text-right text-xs text-muted-foreground">{Math.round(pct)}% complete</p>
      </CardContent>
    </Card>
  );
}
