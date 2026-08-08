"use client";

import * as React from "react";
import { Minus, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  onCommit?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  suffix?: string;
}

function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return v;
  if (min !== -Infinity && v < min) return min;
  if (max !== Infinity && v > max) return max;
  return v;
}

function roundTo(v: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

function parseInput(text: string, decimals: number): number | null {
  if (text === "" || text === "-" || text === "." || text === "-.") return null;
  const n = Number(text);
  if (Number.isNaN(n)) return null;
  return roundTo(n, decimals);
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onValueChange,
      onCommit,
      min = -Infinity,
      max = Infinity,
      step = 1,
      decimals = 0,
      suffix,
      className,
      id,
      placeholder,
      disabled,
      "aria-label": ariaLabel,
      inputMode,
      ...props
    },
    ref
  ) => {
    const [text, setText] = React.useState<string>(value == null ? "" : String(value));

    // Keep internal text in sync when the external value changes (e.g. server refresh).
    React.useEffect(() => {
      setText(value == null ? "" : String(value));
    }, [value]);

    function commit(textValue: string) {
      const parsed = parseInput(textValue, decimals);
      if (parsed == null) {
        // Never coerce an empty field to min; report empty.
        onValueChange(null);
        onCommit?.(null);
        setText("");
        return;
      }
      const clamped = clamp(parsed, min, max);
      const rounded = roundTo(clamped, decimals);
      onValueChange(rounded);
      onCommit?.(rounded);
      setText(String(rounded));
    }

    function stepBy(dir: 1 | -1) {
      const base = parseInput(text, decimals);
      const current = base == null ? 0 : base;
      const next = roundTo(clamp(current + dir * step, min, max), decimals);
      onValueChange(next);
      onCommit?.(next);
      setText(String(next));
    }

    return (
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 shrink-0 rounded-md p-0"
          onClick={() => stepBy(-1)}
          disabled={disabled}
          aria-label={ariaLabel ? `${ariaLabel} decrease` : undefined}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="relative flex-1">
          <Input
            ref={ref}
            id={id}
            type="text"
            inputMode={inputMode ?? (decimals > 0 ? "decimal" : "numeric")}
            className={cn("h-8 text-center font-mono tabular-nums", suffix && "pr-7", className)}
            value={text}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => {
              setText(e.target.value);
              // Live-update when the text parses; keep empty/partial as pending.
              const parsed = parseInput(e.target.value, decimals);
              onValueChange(parsed);
            }}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "ArrowUp") {
                e.preventDefault();
                stepBy(1);
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                stepBy(-1);
              }
            }}
            {...props}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 shrink-0 rounded-md p-0"
          onClick={() => stepBy(1)}
          disabled={disabled}
          aria-label={ariaLabel ? `${ariaLabel} increase` : undefined}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
