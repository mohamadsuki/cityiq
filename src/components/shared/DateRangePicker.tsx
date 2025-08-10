import * as React from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({ value, onChange, placeholder = "בחר טווח תאריכים", className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const label = value?.from
    ? value.to
      ? `${format(value.from, "d.M.yyyy", { locale: he })} - ${format(value.to, "d.M.yyyy", { locale: he })}`
      : format(value.from, "d.M.yyyy", { locale: he })
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[260px] justify-start text-right font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="ml-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
