"use client";

import * as React from "react";
import { format } from "date-fns";
import { CaretDown } from "@phosphor-icons/react";

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
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            data-empty={!date}
            className="flex h-10 w-full justify-between px-4 text-base font-normal text-left data-[empty=true]:text-mute"
          >
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
            <CaretDown data-icon="inline-end" className="h-4 w-4" />
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} defaultMonth={date} autoFocus />
      </PopoverContent>
    </Popover>
  );
}
