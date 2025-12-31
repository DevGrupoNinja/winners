import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export interface DateRange {
    start: string;
    end: string;
}

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    min?: string;
    max?: string;
    excludedRanges?: DateRange[];  // Ranges that are already occupied by siblings
    placeholder?: string;
    label?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, min, max, excludedRanges = [], placeholder = "Selecione uma data", label }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Parse value to date or use current date
    const initialDate = value ? new Date(value + 'T00:00:00') : new Date(); // Append time to force local time parsing or avoid timezone shifts if just date
    // Actually safer to handle YYYY-MM-DD strings manually to avoid timezone issues:
    const parseDate = (d: string) => {
        const [y, m, dstr] = d.split('-').map(Number);
        return new Date(y, m - 1, dstr);
    };

    const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


    const displayDate = value ? new Date(parseDate(value)).toLocaleDateString('pt-BR') : '';

    // Helper to check if a date is in any excluded range
    const isDateExcluded = (dateStr: string): boolean => {
        for (const range of excludedRanges) {
            if (dateStr >= range.start && dateStr <= range.end) {
                return true;
            }
        }
        return false;
    };

    // Helper to find next available date
    const findNextAvailableDate = (startDate: Date): Date => {
        let current = new Date(startDate);
        const maxIterations = 365; // Prevent infinite loop
        let iterations = 0;

        while (iterations < maxIterations) {
            const isoDate = formatDate(current);

            // Check all constraints
            const isInRange = (!min || isoDate >= min) && (!max || isoDate <= max);
            const isNotExcluded = !isDateExcluded(isoDate);

            if (isInRange && isNotExcluded) {
                return current;
            }

            // Move to next day
            current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
            iterations++;
        }

        // Fallback to min or today
        return min ? parseDate(min) : new Date();
    };

    // Calculate smart initial view date
    const calculateInitialViewDate = () => {
        if (value) return parseDate(value);

        const today = formatDate(new Date());
        const todayDate = new Date();

        // Check if today is valid (within bounds and not excluded)
        const isTodayInRange = (!min || today >= min) && (!max || today <= max);
        const isTodayExcluded = isDateExcluded(today);

        if (isTodayInRange && !isTodayExcluded) {
            return todayDate;
        }

        // Find first available date starting from min or today
        const startSearch = min && min > today ? parseDate(min) : todayDate;
        return findNextAvailableDate(startSearch);
    };

    // Calendar state
    const [viewDate, setViewDate] = useState(calculateInitialViewDate());
    const containerRef = useRef<HTMLDivElement>(null);

    // Update viewDate when modal opens or constraints change
    useEffect(() => {
        if (isOpen) {
            setViewDate(calculateInitialViewDate());
        }
    }, [isOpen, min, max, excludedRanges]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const isoDate = formatDate(newDate);

        // Check constraints
        if (min && isoDate < min) return;
        if (max && isoDate > max) return;

        onChange(isoDate);
        setIsOpen(false);
    };

    // Generate calendar grid
    const renderCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysCount = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const days = [];

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} />);
        }

        // Days
        for (let day = 1; day <= daysCount; day++) {
            const currentDayDate = new Date(year, month, day);
            const isoDay = formatDate(currentDayDate);

            let isDisabled = false;
            let disabledReason = '';

            // Check min/max constraints
            if (min && isoDay < min) {
                isDisabled = true;
                disabledReason = 'Antes do limite mínimo';
            }
            if (max && isoDay > max) {
                isDisabled = true;
                disabledReason = 'Depois do limite máximo';
            }

            // Check if date falls within any excluded range
            for (const range of excludedRanges) {
                if (isoDay >= range.start && isoDay <= range.end) {
                    isDisabled = true;
                    disabledReason = 'Período ocupado';
                    break;
                }
            }

            const isSelected = value === isoDay;
            const isToday = isoDay === formatDate(new Date());

            days.push(
                <button
                    key={day}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); !isDisabled && handleDateClick(day); }}
                    disabled={isDisabled}
                    title={isDisabled ? disabledReason : ''}
                    className={`
                        w-8 h-8 md:w-9 md:h-9 text-xs md:text-sm font-medium rounded-full flex items-center justify-center transition-all
                        ${isSelected ? 'bg-brand-orange text-white shadow-md shadow-orange-200 scale-105' : ''}
                        ${!isSelected && !isDisabled ? 'hover:bg-slate-100 text-slate-700' : ''}
                        ${isDisabled ? 'text-slate-300 cursor-not-allowed opacity-50 bg-slate-50 line-through' : ''}
                        ${isToday && !isSelected ? 'border border-brand-orange text-brand-orange' : ''}
                    `}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{label}</label>}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-2xl 
                    flex items-center justify-between cursor-pointer transition-all hover:bg-white
                    ${isOpen ? 'ring-2 ring-brand-orange/20 border-brand-orange bg-white' : ''}
                `}
            >
                <span className={`font-bold text-base md:text-lg ${value ? 'text-slate-700' : 'text-slate-400'}`}>
                    {value ? displayDate : placeholder}
                </span>
                <CalendarIcon size={20} className="text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 p-4 bg-white border border-slate-100 rounded-3xl shadow-xl w-[300px] md:w-[320px] left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={(e) => { e.preventDefault(); handlePrevMonth(); }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-bold text-slate-700 text-sm md:text-base capitalize">
                            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </span>
                        <button onClick={(e) => { e.preventDefault(); handleNextMonth(); }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 mb-2">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                            <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                        {renderCalendarDays()}
                    </div>
                </div>
            )}
        </div>
    );
};
