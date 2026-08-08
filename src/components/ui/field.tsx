"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type FieldProps = React.ComponentProps<"div"> & {
  render?: React.ReactNode;
};

function Field({ className, render, ...props }: FieldProps) {
  if (render) {
    return (
      <div className={cn("space-y-1.5", className)} {...props}>
        {render}
      </div>
    );
  }
  return <div className={cn("space-y-1.5", className)} {...props} />;
}

type FieldLabelProps = React.ComponentProps<typeof Slot> & {
  asChild?: boolean;
};

const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "label";
    return (
      <Comp ref={ref} className={cn("text-sm font-medium leading-none text-ink", className)} {...props} />
    );
  }
);
FieldLabel.displayName = "FieldLabel";

export { Field, FieldLabel };