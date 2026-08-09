"use client";

import * as React from "react";
import {
  NumberField,
  Group,
  Button,
  Input,
} from "react-aria-components";
import { Minus, Plus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "onBlur" | "onFocus"> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  onCommit?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  suffix?: string;
  compact?: boolean;
}

function roundTo(v: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
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
      compact = false,
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
    const commitRef = React.useRef(onCommit);
    commitRef.current = onCommit;

    // Always-current parsed value so blur commits the latest typed number,
    // not a stale prop from before the last keystroke.
    const currentRef = React.useRef<number | null>(value);
    currentRef.current = value;

    const formatOptions: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    };

    return (
      <NumberField
        value={value ?? NaN}
        onChange={(v) => {
          const parsed = Number.isNaN(v) ? null : roundTo(v, decimals);
          currentRef.current = parsed;
          onValueChange(parsed);
        }}
        minValue={min === -Infinity ? undefined : min}
        maxValue={max === Infinity ? undefined : max}
        step={step}
        formatOptions={formatOptions}
        isDisabled={disabled}
        className="w-full"
      >
        <Group
          className={cn(
            "relative inline-flex h-8 min-w-0 items-center overflow-hidden rounded-md border border-hairline bg-canvas text-base transition-colors outline-none data-focus-within:border-ink data-focus-within:ring-2 data-focus-within:ring-cloud data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 md:text-sm",
            compact ? "w-auto" : "w-full"
          )}
        >
          {!compact && (
            <Button
              slot="decrement"
              className={cn(
                "-ms-px flex aspect-square h-[inherit] items-center justify-center rounded-l-md border border-hairline bg-linen text-mute transition-colors hover:bg-cloud hover:text-ink data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50"
              )}
            >
              <Minus className="h-4 w-4" />
              <span className="sr-only">Decrement</span>
            </Button>
          )}
          <Input
            ref={ref}
            id={id}
            inputMode={inputMode ?? (decimals > 0 ? "decimal" : "numeric")}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className={cn(
              "w-full grow px-2.5 py-1 font-mono text-sm tabular-nums outline-none placeholder:text-mute",
              !compact && "text-center",
              suffix && "pr-7",
              className
            )}
            onBlur={() => {
              commitRef.current?.(currentRef.current);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              }
              props.onKeyDown?.(e);
            }}
            {...props}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {suffix}
            </span>
          )}
          {!compact && (
            <Button
              slot="increment"
              className={cn(
                "-me-px flex aspect-square h-[inherit] items-center justify-center rounded-r-md border border-hairline bg-linen text-mute transition-colors hover:bg-cloud hover:text-ink data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50"
              )}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Increment</span>
            </Button>
          )}
        </Group>
      </NumberField>
    );
  }
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
