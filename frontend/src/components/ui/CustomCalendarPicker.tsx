import React, { useState, useMemo, useEffect } from 'react';
import { formatDate, formatDateFull, todayAsInputDate } from '../../utils/format';

export interface CustomCalendarPickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (startDate: string, endDate: string, daysCount: number) => void;
  mode?: 'single' | 'range';
  onModeChange?: (mode: 'single' | 'range') => void;
  showModeToggle?: boolean;
  className?: string;
  title?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateString(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

function parseDateComponents(s: string): { year: number; month: number; day: number } {
  if (!s || !s.includes('-')) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }
  const [y, m, d] = s.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function calculateDaysCount(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 1;
  const p1 = parseDateComponents(startStr);
  const p2 = parseDateComponents(endStr);
  const d1 = new Date(p1.year, p1.month, p1.day).getTime();
  const d2 = new Date(p2.year, p2.month, p2.day).getTime();
  if (isNaN(d1) || isNaN(d2)) return 1;
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

function getNDaysAgo(days: number, refDateStr: string): string {
  const p = parseDateComponents(refDateStr);
  const dt = new Date(p.year, p.month, p.day);
  dt.setDate(dt.getDate() - (days - 1));
  return toDateString(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function getStartOfMonth(dateStr: string): string {
  const p = parseDateComponents(dateStr);
  return toDateString(p.year, p.month, 1);
}

function getPreviousMonthRange(dateStr: string): { start: string; end: string } {
  const p = parseDateComponents(dateStr);
  const prevMonthDate = new Date(p.year, p.month - 1, 1);
  const y = prevMonthDate.getFullYear();
  const m = prevMonthDate.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return {
    start: toDateString(y, m, 1),
    end: toDateString(y, m, lastDay),
  };
}

export function CustomCalendarPicker({
  startDate,
  endDate,
  onChange,
  mode,
  onModeChange,
  showModeToggle = false,
  className = '',
  title = 'Select Date or Period',
}: CustomCalendarPickerProps) {
  const today = todayAsInputDate();

  // Mode: single date vs date range
  const [internalMode, setInternalMode] = useState<'single' | 'range'>(mode || 'range');
  const activeMode = mode !== undefined ? mode : internalMode;

  const handleSwitchMode = (newMode: 'single' | 'range') => {
    setInternalMode(newMode);
    onModeChange?.(newMode);
    if (newMode === 'single') {
      const target = endDate || startDate || today;
      onChange(target, target, 1);
    } else {
      const refEnd = endDate || today;
      const newStart = getNDaysAgo(7, refEnd);
      onChange(newStart, refEnd, 7);
    }
  };

  // Active selection target in range mode: 'start' or 'end'
  const [activeTarget, setActiveTarget] = useState<'start' | 'end'>('start');

  // Month and Year visible on the calendar grid
  const initial = useMemo(() => parseDateComponents(endDate || startDate || today), [endDate, startDate, today]);
  const [visibleYear, setVisibleYear] = useState(initial.year);
  const [visibleMonth, setVisibleMonth] = useState(initial.month);

  // Sync visible month when startDate or endDate change from outside
  useEffect(() => {
    const targetDate = endDate || startDate;
    if (targetDate) {
      const p = parseDateComponents(targetDate);
      setVisibleYear(p.year);
      setVisibleMonth(p.month);
    }
  }, [endDate, startDate]);

  // Stepper input value
  const currentDays = useMemo(() => calculateDaysCount(startDate, endDate), [startDate, endDate]);
  const [daysInput, setDaysInput] = useState<string>(String(currentDays));

  useEffect(() => {
    setDaysInput(String(currentDays));
  }, [currentDays]);

  // Month navigation
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
    const p = parseDateComponents(today);
    setVisibleYear(p.year);
    setVisibleMonth(p.month);
  };

  // Build grid of days
  const monthGrid = useMemo(() => {
    const firstDayOfWeek = new Date(visibleYear, visibleMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();
    const prevMonthDays = new Date(visibleYear, visibleMonth, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Lead cells from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      const prevDate = new Date(visibleYear, visibleMonth - 1, dNum);
      const str = toDateString(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate());
      cells.push({
        dateStr: str,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: str === today,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const str = toDateString(visibleYear, visibleMonth, d);
      cells.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: str === today,
      });
    }

    // Trailing cells to fill week
    const remainder = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remainder; d++) {
      const nextDate = new Date(visibleYear, visibleMonth + 1, d);
      const str = toDateString(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
      cells.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: str === today,
      });
    }

    return cells;
  }, [visibleYear, visibleMonth, today]);

  // Click on a date cell
  const handleDateClick = (clickedDate: string) => {
    if (activeMode === 'single') {
      onChange(clickedDate, clickedDate, 1);
      return;
    }

    if (activeTarget === 'start') {
      let newStart = clickedDate;
      let newEnd = endDate;
      if (newStart > newEnd) {
        newEnd = newStart;
      }
      const days = calculateDaysCount(newStart, newEnd);
      onChange(newStart, newEnd, days);
      setActiveTarget('end'); // Auto-advance to picking end date
    } else {
      let newStart = startDate;
      let newEnd = clickedDate;
      if (newEnd < newStart) {
        newStart = newEnd;
      }
      const days = calculateDaysCount(newStart, newEnd);
      onChange(newStart, newEnd, days);
      setActiveTarget('start'); // Auto-advance back to start date
    }
  };

  // Direct days stepper adjustment
  const handleApplyDays = (days: number) => {
    const validDays = Math.max(1, Math.min(365, days));
    setDaysInput(String(validDays));
    const newStart = getNDaysAgo(validDays, today);
    onChange(newStart, today, validDays);
  };

  // Quick Preset Handlers for Range Mode
  const handleRangePreset = (preset: 'today' | 'yesterday' | '3days' | '7days' | '15days' | '30days' | 'month' | 'prevMonth') => {
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

  // Quick Preset Handlers for Single Date Mode
  const handleSinglePreset = (preset: 'today' | 'yesterday' | '2daysAgo' | '3daysAgo' | '7daysAgo' | 'monthStart') => {
    if (preset === 'today') {
      onChange(today, today, 1);
    } else if (preset === 'yesterday') {
      const y = getNDaysAgo(2, today);
      onChange(y, y, 1);
    } else if (preset === '2daysAgo') {
      const d = getNDaysAgo(3, today);
      onChange(d, d, 1);
    } else if (preset === '3daysAgo') {
      const d = getNDaysAgo(4, today);
      onChange(d, d, 1);
    } else if (preset === '7daysAgo') {
      const d = getNDaysAgo(8, today);
      onChange(d, d, 1);
    } else if (preset === 'monthStart') {
      const start = getStartOfMonth(today);
      onChange(start, start, 1);
    }
  };

  return (
    <div className={`custom-calendar-picker bg-parchment-50 rounded-2xl border-2 border-parchment-300 p-4 shadow-sm space-y-4 ${className}`}>
      {/* 0. Optional Mode Toggle Header */}
      {showModeToggle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-parchment-300">
          <span className="text-xs font-bold text-stone-800 font-serif flex items-center gap-1.5">
            <span>📅</span>
            <span>{title}</span>
          </span>
          <div className="flex bg-parchment-200/90 p-1 rounded-xl border border-parchment-300 self-start sm:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => handleSwitchMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'single'
                  ? 'bg-forest-900 text-gold-300 shadow-sm'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              📌 Single Day Bill
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('range')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'range'
                  ? 'bg-forest-900 text-gold-300 shadow-sm'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              🗓️ Multi-Day Period Bill
            </button>
          </div>
        </div>
      )}

      {/* 1. Header: Range Mode vs Single Mode */}
      {activeMode === 'range' ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-parchment-300">
          {/* Active Target Buttons: Click to select Start or End */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-serif">
              Select Billing Range (Click to choose date)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTarget('start')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activeTarget === 'start'
                    ? 'bg-forest-900 text-gold-300 border-forest-950 ring-2 ring-forest-700/50 shadow-sm'
                    : 'bg-white hover:bg-parchment-200 text-stone-700 border-parchment-300'
                }`}
              >
                <span>🟢 From:</span>
                <span className="font-mono">{formatDate(startDate) || startDate}</span>
                {activeTarget === 'start' && <span className="text-[10px] bg-forest-800 px-1 rounded text-gold-300">Picking</span>}
              </button>

              <span className="text-stone-400 font-bold">→</span>

              <button
                type="button"
                onClick={() => setActiveTarget('end')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activeTarget === 'end'
                    ? 'bg-forest-900 text-gold-300 border-forest-950 ring-2 ring-forest-700/50 shadow-sm'
                    : 'bg-white hover:bg-parchment-200 text-stone-700 border-parchment-300'
                }`}
              >
                <span>🔴 To:</span>
                <span className="font-mono">{formatDate(endDate) || endDate}</span>
                {activeTarget === 'end' && <span className="text-[10px] bg-forest-800 px-1 rounded text-gold-300">Picking</span>}
              </button>
            </div>
          </div>

          {/* Direct Days Stepper */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border-2 border-parchment-300 shadow-xs self-start md:self-auto">
            <span className="text-[11px] font-bold text-stone-600 pl-1.5">Days:</span>
            <button
              type="button"
              onClick={() => handleApplyDays(currentDays - 1)}
              disabled={currentDays <= 1}
              className="w-7 h-7 rounded-lg bg-parchment-100 hover:bg-parchment-200 active:bg-parchment-300 text-stone-800 font-bold flex items-center justify-center text-sm disabled:opacity-40 cursor-pointer"
              title="Subtract 1 Day"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max="365"
              value={daysInput}
              onChange={(e) => setDaysInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  const val = parseInt(daysInput, 10);
                  if (!isNaN(val) && val > 0) handleApplyDays(val);
                }
              }}
              className="w-12 text-center text-xs font-mono font-black text-forest-900 border border-parchment-300 rounded-md py-1 focus:outline-none focus:ring-1 focus:ring-forest-800"
            />
            <button
              type="button"
              onClick={() => handleApplyDays(currentDays + 1)}
              className="w-7 h-7 rounded-lg bg-parchment-100 hover:bg-parchment-200 active:bg-parchment-300 text-stone-800 font-bold flex items-center justify-center text-sm cursor-pointer"
              title="Add 1 Day"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => {
                const val = parseInt(daysInput, 10);
                if (!isNaN(val) && val > 0) handleApplyDays(val);
              }}
              className="text-[10px] font-bold bg-forest-900 text-gold-300 px-2.5 py-1.5 rounded-lg hover:bg-forest-950 transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      ) : (
        /* Single Date Mode Header */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-parchment-300">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 font-serif">
              Selected Bill Date:
            </span>
            <span className="font-mono font-black text-xs sm:text-sm text-forest-900 bg-white px-3 py-1 rounded-xl border border-parchment-300 shadow-xs">
              {formatDateFull(startDate)}
            </span>
            {startDate === today && (
              <span className="text-[10px] font-bold bg-forest-800 text-gold-300 px-2 py-0.5 rounded shadow-2xs">
                Today
              </span>
            )}
          </div>
          <span className="text-[10px] text-stone-500 font-medium">
            Tap any date on the calendar grid to change
          </span>
        </div>
      )}

      {/* 2. Quick Presets */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">
            Quick Presets
          </span>
          <span className="text-[10px] text-forest-900 font-bold bg-forest-100 px-2 py-0.5 rounded border border-forest-200">
            {activeMode === 'range'
              ? `Tap a date below to set ${activeTarget === 'start' ? '🟢 Start Date' : '🔴 End Date'}`
              : 'Tap any date below to set bill date instantly'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {activeMode === 'range' ? (
            <>
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
                  onClick={() => handleRangePreset(item.id as any)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    item.active
                      ? 'bg-forest-900 text-gold-300 border-forest-950 shadow-xs'
                      : 'bg-white hover:bg-parchment-200 text-stone-700 border-parchment-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </>
          ) : (
            /* Single mode presets */
            <>
              {[
                { id: 'today', label: 'Today', active: startDate === today },
                { id: 'yesterday', label: 'Yesterday', active: startDate === getNDaysAgo(2, today) },
                { id: '2daysAgo', label: '2 Days Ago', active: startDate === getNDaysAgo(3, today) },
                { id: '3daysAgo', label: '3 Days Ago', active: startDate === getNDaysAgo(4, today) },
                { id: '7daysAgo', label: '1 Week Ago', active: startDate === getNDaysAgo(8, today) },
                { id: 'monthStart', label: '1st of Month', active: startDate === getStartOfMonth(today) },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSinglePreset(item.id as any)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    item.active
                      ? 'bg-forest-900 text-gold-300 border-forest-950 shadow-xs'
                      : 'bg-white hover:bg-parchment-200 text-stone-700 border-parchment-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* 3. Interactive Visual Month Grid */}
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
              Jump to Today
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg hover:bg-parchment-200 text-stone-800 font-bold flex items-center justify-center transition-colors cursor-pointer text-base"
              title="Previous Month"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg hover:bg-parchment-200 text-stone-800 font-bold flex items-center justify-center transition-colors cursor-pointer text-base"
              title="Next Month"
            >
              ›
            </button>
          </div>
        </div>

        {/* Weekday Row */}
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

        {/* Day Cells Grid */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5">
          {monthGrid.map((cell) => {
            const isStart = cell.dateStr === startDate;
            const isEnd = cell.dateStr === endDate;
            const isSingle = isStart && (isEnd || activeMode === 'single');
            const inRange = activeMode === 'range' && startDate && endDate && cell.dateStr > startDate && cell.dateStr < endDate;

            let cellClass = 'relative h-9 flex items-center justify-center text-xs font-mono font-medium rounded-lg cursor-pointer transition-all ';

            if (!cell.isCurrentMonth) {
              cellClass += 'text-stone-300 hover:text-stone-600 ';
            } else {
              cellClass += 'text-stone-800 ';
            }

            if (isSingle) {
              cellClass += 'bg-forest-900 text-gold-300 font-black shadow-xs rounded-xl ring-2 ring-forest-700/60 z-10 ';
            } else if (activeMode === 'range' && isStart) {
              cellClass += 'bg-forest-900 text-gold-300 font-black rounded-l-xl rounded-r-none z-10 shadow-xs ring-1 ring-forest-800 ';
            } else if (activeMode === 'range' && isEnd) {
              cellClass += 'bg-forest-900 text-gold-300 font-black rounded-r-xl rounded-l-none z-10 shadow-xs ring-1 ring-forest-800 ';
            } else if (inRange) {
              cellClass += 'bg-forest-100/90 text-forest-950 font-bold rounded-none ';
            } else {
              cellClass += 'hover:bg-parchment-200 ';
            }

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => handleDateClick(cell.dateStr)}
                className={cellClass}
                title={`${cell.dateStr} ${activeMode === 'single' ? '(Click to select date)' : `(Click to set ${activeTarget === 'start' ? 'Start' : 'End'} Date)`}`}
              >
                <span>{cell.dayNumber}</span>
                {cell.isToday && !isStart && (!isEnd || activeMode === 'single') && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 bg-forest-700 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Direct Inputs for Typing or System Date Pick */}
      <div className={`grid gap-3 bg-parchment-100/60 p-3 rounded-xl border border-parchment-300 ${activeMode === 'range' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {activeMode === 'single' ? (
          <div>
            <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
              📅 Bill Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val) onChange(val, val, 1);
              }}
              className="w-full text-xs font-mono font-medium p-2 rounded-lg border border-parchment-400 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                🟢 Start Date (From)
              </label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const days = calculateDaysCount(val, endDate);
                    onChange(val, endDate, days);
                  }
                }}
                className="w-full text-xs font-mono font-medium p-2 rounded-lg border border-parchment-400 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                🔴 End Date (To)
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const days = calculateDaysCount(startDate, val);
                    onChange(startDate, val, days);
                  }
                }}
                className="w-full text-xs font-mono font-medium p-2 rounded-lg border border-parchment-400 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
          </>
        )}
      </div>

      {/* 5. Active Period / Date Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-forest-50 border border-forest-200 rounded-xl px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-forest-950">
            {activeMode === 'range' ? 'Selected Period:' : 'Selected Bill Date:'}
          </span>
          <span className="font-mono font-black text-forest-900">
            {activeMode === 'range'
              ? `${formatDateFull(startDate)} – ${formatDateFull(endDate)}`
              : formatDateFull(startDate)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold bg-forest-800 text-gold-300 px-2.5 py-0.5 rounded text-[11px]">
            {activeMode === 'range' ? `${currentDays} Days Total` : 'Single Day'}
          </span>
          {((activeMode === 'range' && (startDate !== today || endDate !== today)) ||
            (activeMode === 'single' && startDate !== today)) && (
            <button
              type="button"
              onClick={() => {
                if (activeMode === 'single') {
                  onChange(today, today, 1);
                } else {
                  handleRangePreset('today');
                }
              }}
              className="text-[11px] text-forest-800 hover:text-forest-950 underline font-bold cursor-pointer"
            >
              Reset to Today
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
