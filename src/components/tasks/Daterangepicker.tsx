"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateRangePickerProps {
  from: string; // "YYYY-MM-DD" or ""
  to: string; // "YYYY-MM-DD" or ""
  onChange: (from: string, to: string) => void;
  placeholder?: string;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatLabel(from: string, to: string): string {
  if (!from) return "";
  const fmt = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${MONTHS[parseInt(m) - 1].slice(0, 3)} ${parseInt(day)}, ${y}`;
  };
  if (!to || to === from) return fmt(from);
  return `${fmt(from)} – ${fmt(to)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Filter by date",
  className,
}: DateRangePickerProps) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const [openLeft, setOpenLeft] = useState(false);

  // Sync external changes
  useEffect(() => {
    setStart(from);
    setEnd(to);
  }, [from, to]);

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceOnRight = window.innerWidth - rect.right;
      setOpenLeft(spaceOnRight < 300); // 300 = popover width
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const selectDay = (key: string) => {
    if (!start || (start && end)) {
      // First click — set start
      setStart(key);
      setEnd("");
    } else {
      // Second click — set end (swap if needed)
      if (key < start) {
        setEnd(start);
        setStart(key);
      } else if (key === start) {
        // Single date selected — apply immediately
        setEnd("");
        onChange(key, "");
        setOpen(false);
      } else {
        setEnd(key);
      }
    }
  };

  const apply = () => {
    onChange(start, end);
    setOpen(false);
  };

  const clear = () => {
    setStart("");
    setEnd("");
    onChange("", "");
    setOpen(false);
  };

  // Build calendar days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  const todayKey = toKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const effectiveEnd = end || hovered || start;

  const rangeStart =
    start && effectiveEnd
      ? start <= effectiveEnd
        ? start
        : effectiveEnd
      : start;
  const rangeEnd =
    start && effectiveEnd
      ? start <= effectiveEnd
        ? effectiveEnd
        : start
      : start;

  const getDayClass = (key: string, isOtherMonth: boolean) => {
    const isStart = key === rangeStart;
    const isEnd = key === rangeEnd && rangeEnd !== rangeStart;
    const inRange =
      rangeStart && rangeEnd && key > rangeStart && key < rangeEnd;
    const isToday = key === todayKey;
    const isSingle =
      key === rangeStart && (!rangeEnd || rangeEnd === rangeStart);

    return cn(
      "relative flex items-center justify-center text-xs h-8 w-full cursor-pointer select-none transition-colors",
      isOtherMonth && "text-muted-foreground/40",
      !isOtherMonth &&
        !isStart &&
        !isEnd &&
        !inRange &&
        "hover:bg-accent hover:text-accent-foreground rounded-md",
      isToday && !isStart && !isEnd && !inRange && "font-semibold text-primary",
      isSingle && "bg-primary text-primary-foreground rounded-md",
      isStart &&
        !isSingle &&
        "bg-primary text-primary-foreground rounded-l-md rounded-r-none",
      isEnd && "bg-primary text-primary-foreground rounded-r-md rounded-l-none",
      inRange && "bg-primary/15 text-primary rounded-none",
    );
  };

  const hasValue = !!from;
  const label = formatLabel(from, to);

  return (
    <div className={cn("relative", className)} ref={ref}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-md border text-sm transition-colors",
          "bg-background hover:bg-accent",
          hasValue
            ? "border-primary text-primary"
            : "border-input text-muted-foreground",
        )}
      >
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span className="whitespace-nowrap">
          {hasValue ? label : placeholder}
        </span>
        {hasValue && (
          <span
            className="ml-1 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          className={cn(
            "absolute top-full mt-2 z-50 w-72",
            "bg-background border border-border rounded-xl shadow-lg p-4",
            openLeft ? "right-0" : "left-0", // ✅ auto-flip
          )}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day name headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Prev month days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => {
              const day = prevMonthDays - firstDayOfMonth + 1 + i;
              const key = toKey(viewYear, viewMonth - 1, day);
              return (
                <div
                  key={`prev-${i}`}
                  className={getDayClass(key, true)}
                  onClick={() => selectDay(key)}
                  onMouseEnter={() => start && !end && setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {day}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const key = toKey(viewYear, viewMonth, day);
              return (
                <div
                  key={`cur-${day}`}
                  className={getDayClass(key, false)}
                  onClick={() => selectDay(key)}
                  onMouseEnter={() => start && !end && setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {day}
                </div>
              );
            })}

            {/* Next month days */}
            {Array.from({ length: 42 - firstDayOfMonth - daysInMonth }).map(
              (_, i) => {
                const day = i + 1;
                const key = toKey(viewYear, viewMonth + 1, day);
                return (
                  <div
                    key={`next-${i}`}
                    className={getDayClass(key, true)}
                    onClick={() => selectDay(key)}
                    onMouseEnter={() => start && !end && setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {day}
                  </div>
                );
              },
            )}
          </div>

          {/* Hint */}
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {!start
              ? "Click to select start date"
              : !end
                ? "Click to select end date, or apply for single day"
                : `${formatLabel(start, end)}`}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7"
              onClick={clear}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="text-xs h-7"
              onClick={apply}
              disabled={!start}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
