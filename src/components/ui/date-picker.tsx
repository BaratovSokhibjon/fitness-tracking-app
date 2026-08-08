"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarDots } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
}: {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex h-10 w-full justify-start px-4 text-base font-normal"
        >
          <CalendarDots className="h-4 w-4 text-mute" />
          {date ? format(date, "PPP") : <span className="text-mute">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} defaultMonth={date} autoFocus />
      </PopoverContent>
    </Popover>
  );
}