import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-3 py-0.5 text-xs font-medium leading-6 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border border-hairline bg-canvas text-ink",
        secondary: "border-transparent bg-linen text-ink",
        destructive: "border-transparent bg-sale text-canvas",
        outline: "border border-hairline text-ink",
        success: "border-transparent bg-success text-canvas",
        warning: "border-transparent bg-cloud text-mute",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
