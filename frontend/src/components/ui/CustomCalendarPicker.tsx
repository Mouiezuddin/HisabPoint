import React, { useState, useMemo } from 'react';
import { formatDateFull, todayAsInputDate } from '../../utils/format';

export interface CustomCalendarPickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (startDate: string, endDate: string, daysCount: number) => void;
  className?: string;
  allowPastOnly?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function calculateDaysCount(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 1;
  const d1 = parseDateString(startStr).getTime();
  const d2 = parseDateString(endStr).getTime();
  if (isNaN(d1) || isNaN(d2)) return 1;
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

function getNDaysAgo(days: number, fromDateStr = todayAsInputDate()): string {
  const dt = parseDateString(fromDateStr);
  dt.setDate(dt.getDate() - (days - 1));
  return toDateString(dt);
}

function getStartOfMonth(dateStr = todayAsInputDate()): string {
  const dt = parseDateString(dateStr);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-01`;
}

function getPreviousMonthRange(dateStr = todayAsInputDate()): { start: string; end: string } {
  const dt = parseDateString(dateStr);
  const prevMonthDate = new Date(dt.getFullYear(), dt.getMonth() - 1, 1);
  const year = prevMonthDate.getFullYear();
  const month = prevMonthDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    start: `${year}-${pad(month + 1)}-01`,
    end: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  };
}

export function CustomCalendarPicker({
  startDate,
  endDate,
  onChange,
  className = '',
}: CustomCalendarPickerProps) {
  const today = todayAsInputDate();

  // Navigation state for the visible month/year
  const initialDate = endDate ? parseDateString(endDate) : new Date();
  const [visibleYear, setVisibleYear] = useState(initialDate.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(initialDate.getMonth()); // 0-11

  // In-progress range selection click state
  const [pickingStart, setPickingStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Stepper / Direct Number of Days input state
  const currentDays = useMemo(() => calculateDaysCount(startDate, endDate), [startDate, endDate]);
  const [daysInputValue, setDaysInputValue] = useState<string>(String(currentDays));

  // Keep days input in sync when startDate/endDate change from outside
  React.useEffect(() => {
    setDaysInputValue(String(currentDays));
  }, [currentDays]);

  // Navigate visible month
  const prevMonth = () => {
    if (visibleMonth === 0) {
      setVisibleMonth(11);
      setVisibleYear((y) => y - 1);
    } else {
      setVisibleMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (visibleMonth === 11) {
      setVisibleMonth(0);
      setVisibleYear((y) => y + 1);
    } else {
      setVisibleMonth((m) => m + 1);
    }
  };

  const jumpToToday = () => {
    const now = new Date();
    setVisibleYear(now.getFullYear());
    setVisibleMonth(now.getMonth());
  };

  // Generate days for visible month
  const monthGrid = useMemo(() => {
    const firstDayIndex = new Date(visibleYear, visibleMonth, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Empty lead cells from previous month
    const prevMonthDays = new Date(visibleYear, visibleMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      const prevDate = new Date(visibleYear, visibleMonth - 1, dNum);
      const str = toDateString(prevDate);
      cells.push({
        dateStr: str,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: str === today,
      });
    }

    // Current month cells
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const curDate = new Date(visibleYear, visibleMonth, d);
      const str = toDateString(curDate);
      cells.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: str === today,
      });
    }

    // Trailing cells to fill last week
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(visibleYear, visibleMonth + 1, d);
      const str = toDateString(nextDate);
      cells.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: str === today,
      });
    }

    return cells;
  }, [visibleYear, visibleMonth, today]);

  // Handle cell click for range selection
  const handleCellClick = (cellDate: string) => {
    if (!pickingStart) {
      // First click: sets tentative start
      setPickingStart(cellDate);
    } else {
      // Second click: completes range
      let s = pickingStart;
      let e = cellDate;
      if (s > e) {
        // Swap if clicked in reverse
        const temp = s;
        s = e;
        e = temp;
      }
      const days = calculateDaysCount(s, e);
      setPickingStart(null);
      setHoverDate(null);
      onChange(s, e, days);
    }
  };

  // Direct days stepper handlers ("Works on our opinion")
  const applyCustomDays = (numDays: number) => {
    const valid = Math.max(1, Math.min(365, numDays));
    const newStart = getNDaysAgo(valid, today);
    setDaysInputValue(String(valid));
    setPickingStart(null);
    onChange(newStart, today, valid);
  };

  const handleDaysInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(daysInputValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      applyCustomDays(parsed);
    }
  };

  // Quick Preset Handlers
  const handlePreset = (preset: 'today' | 'yesterday' | '3days' | '7days' | '15days' | '30days' | 'month' | 'prevMonth') => {
    setPickingStart(null);
    if (preset === 'today') {
      onChange(today, today, 1);
    } else if (preset === 'yesterday') {
      const y = getNDaysAgo(2, today);
      onChange(y, y, 1);
    } else if (preset === '3days') {
      onChange(getNDaysAgo(3, today), today, 3);
    } else if (preset === '7days') {
      onChange(getNDaysAgo(7, today), today, 7);
    } else if (preset === '15days') {
      onChange(getNDaysAgo(15, today), today, 15);
    } else if (preset === '30days') {
      onChange(getNDaysAgo(30, today), today, 30);
    } else if (preset === 'month') {
      const start = getStartOfMonth(today);
      onChange(start, today, calculateDaysCount(start, today));
    } else if (preset === 'prevMonth') {
      const { start, end } = getPreviousMonthRange(today);
      onChange(start, end, calculateDaysCount(start, end));
    }
  };

  // Determine effective range for visual cell rendering
  const effectiveStart = pickingStart || startDate;
  const effectiveEnd = pickingStart
    ? (hoverDate || pickingStart)
    : endDate;

  const [rangeStart, rangeEnd] = useMemo(() => {
    if (!effectiveStart && !effectiveEnd) return ['', ''];
    if (!effectiveEnd) return [effectiveStart, effectiveStart];
    if (effectiveStart > effectiveEnd) return [effectiveEnd, effectiveStart];
    return [effectiveStart, effectiveEnd];
  }, [effectiveStart, effectiveEnd]);

  return (
    <div className={`custom-calendar-picker bg-parchment-50 rounded-2xl border-2 border-parchment-300 p-4 shadow-sm space-y-4 ${className}`}>
      {/* Top Bar: Direct Opinion / Days Selection Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-parchment-300">
        <div>
          <span className="text-xs font-bold text-stone-900 font-serif flex items-center gap-1.5">
            <span>🗓️</span>
            <span>Custom Billing Calendar</span>
          </span>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Click start & end dates below or type any custom number of days.
          </p>
        </div>

        {/* Days Stepper: type or increment number of days */}
        <form onSubmit={handleDaysInputSubmit} className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-parchment-300 shadow-xs">
          <span className="text-[11px] font-bold text-stone-600 pl-2">Days:</span>
          <button
            type="button"
            onClick={() => applyCustomDays(currentDays - 1)}
            disabled={currentDays <= 1}
            className="w-7 h-7 rounded-lg bg-parchment-100 hover:bg-parchment-200 active:bg-parchment-300 text-stone-800 font-bold flex items-center justify-center text-sm disabled:opacity-40 cursor-pointer"
            title="Decrease 1 Day"
          >
            −
          </button>
          <input
            type="number"
            min="1"
            max="365"
            value={daysInputValue}
            onChange={(e) => setDaysInputValue(e.target.value)}
            onBlur={() => {
              const val = parseInt(daysInputValue, 10);
              if (!isNaN(val) && val > 0 && val !== currentDays) {
                applyCustomDays(val);
              } else {
                setDaysInputValue(String(currentDays));
              }
            }}
            className="w-12 text-center text-xs font-mono font-black text-forest-900 border border-parchment-300 rounded-md py-1 focus:outline-none focus:ring-1 focus:ring-forest-800"
          />
          <button
            type="button"
            onClick={() => applyCustomDays(currentDays + 1)}
            className="w-7 h-7 rounded-lg bg-parchment-100 hover:bg-parchment-200 active:bg-parchment-300 text-stone-800 font-bold flex items-center justify-center text-sm cursor-pointer"
            title="Increase 1 Day"
          >
            +
          </button>
          <button
            type="submit"
            className="text-[10px] font-bold bg-forest-900 text-gold-300 px-2 py-1.5 rounded-lg hover:bg-forest-950 transition-colors"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Quick Opinion Presets */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">
            Quick Options
          </span>
          {pickingStart && (
            <span className="text-[10px] text-amber-800 font-bold animate-pulse">
              👉 Click end date to finish range
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'today', label: 'Today (1d)', active: startDate === today && endDate === today },
            { id: 'yesterday', label: 'Yesterday', active: startDate === getNDaysAgo(2, today) && endDate === getNDaysAgo(2, today) },
            { id: '3days', label: '3 Days', active: currentDays === 3 && endDate === today },
            { id: '7days', label: '7 Days', active: currentDays === 7 && endDate === today },
            { id: '15days', label: '15 Days', active: currentDays === 15 && endDate === today },
            { id: '30days', label: '30 Days', active: currentDays === 30 && endDate === today },
            { id: 'month', label: 'This Month', active: startDate === getStartOfMonth(today) && endDate === today },
            { id: 'prevMonth', label: 'Last Month', active: false },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePreset(item.id as any)}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                item.active
                  ? 'bg-forest-900 text-gold-300 border-forest-950 shadow-xs'
                  : 'bg-white hover:bg-parchment-200/80 text-stone-700 border-parchment-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-xl border border-parchment-300 p-3 shadow-xs">
        {/* Month Navigator Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black font-serif text-stone-900">
              {MONTH_NAMES[visibleMonth]} {visibleYear}
            </span>
            <button
              type="button"
              onClick={jumpToToday}
              className="text-[10px] font-bold text-forest-800 hover:text-forest-950 bg-forest-50 px-2 py-0.5 rounded border border-forest-200 cursor-pointer"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg hover:bg-parchment-200 text-stone-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
              title="Previous Month"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 rounded-lg hover:bg-parchment-200 text-stone-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
              title="Next Month"
            >
              ›
            </button>
          </div>
        </div>

        {/* Weekday Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {WEEKDAY_NAMES.map((w, idx) => (
            <div
              key={w}
              className={`text-[10px] font-bold uppercase tracking-wider py-1 ${
                idx === 0 || idx === 6 ? 'text-rose-600' : 'text-stone-500'
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Month Day Cells */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5">
          {monthGrid.map((cell) => {
            const isStart = cell.dateStr === rangeStart;
            const isEnd = cell.dateStr === rangeEnd;
            const isSingle = isStart && isEnd;
            const inRange = rangeStart && rangeEnd && cell.dateStr > rangeStart && cell.dateStr < rangeEnd;

            let cellClass = 'relative h-8 flex items-center justify-center text-xs font-mono font-medium rounded-lg cursor-pointer transition-colors ';

            if (!cell.isCurrentMonth) {
              cellClass += 'text-stone-300 hover:text-stone-500 ';
            } else {
              cellClass += 'text-stone-800 ';
            }

            if (isSingle) {
              cellClass += 'bg-forest-900 text-gold-300 font-black shadow-xs rounded-xl z-10 ';
            } else if (isStart) {
              cellClass += 'bg-forest-900 text-gold-300 font-black rounded-l-xl rounded-r-none z-10 shadow-xs ';
            } else if (isEnd) {
              cellClass += 'bg-forest-900 text-gold-300 font-black rounded-r-xl rounded-l-none z-10 shadow-xs ';
            } else if (inRange) {
              cellClass += 'bg-forest-100 text-forest-950 font-bold rounded-none ';
            } else {
              cellClass += 'hover:bg-parchment-200/80 ';
            }

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => handleCellClick(cell.dateStr)}
                onMouseEnter={() => pickingStart && setHoverDate(cell.dateStr)}
                className={cellClass}
                title={cell.dateStr}
              >
                <span>{cell.dayNumber}</span>
                {cell.isToday && !isStart && !isEnd && (
                  <span className="absolute bottom-1 w-1 h-1 bg-forest-700 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Range Display Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-forest-50 border border-forest-200 rounded-xl px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-forest-950">Active Period:</span>
          <span className="font-mono font-black text-forest-900">
            {formatDateFull(startDate)} – {formatDateFull(endDate)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold bg-forest-800 text-gold-300 px-2 py-0.5 rounded text-[11px]">
            {currentDays} {currentDays === 1 ? 'Day' : 'Days'} Total
          </span>
          {(startDate !== today || endDate !== today) && (
            <button
              type="button"
              onClick={() => handlePreset('today')}
              className="text-[11px] text-forest-800 hover:text-forest-950 underline font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
