"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-2",
        month_caption: "flex justify-center pt-4 relative items-center",
        caption_label: "text-sm font-medium text-ink",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-1 top-1 h-7 w-7 p-0 text-mute rounded-none"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-1 top-1 h-7 w-7 p-0 text-mute rounded-none"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-mute rounded-none w-8 text-xs font-medium uppercase",
        week: "flex w-full mt-1",
        day: "p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal text-mute [&_svg]:size-4 rounded-none"
        ),
        selected: "bg-ink text-canvas focus:bg-ink focus:text-canvas",
        today: "border border-hairline text-ink",
        outside: "text-mute opacity-50",
        disabled: "text-mute opacity-50",
        range_start: "bg-ink text-canvas",
        range_end: "bg-ink text-canvas",
        range_middle: "aria-selected:bg-soft-cloud aria-selected:text-ink",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <CaretLeft className="h-4 w-4" />
          ) : (
            <CaretRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };