"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, RotateCcw } from "lucide-react";
import type { EventItem } from "@/modules/event/types";
import styles from "./event.module.css";

type EventCalendarDropdownProps = {
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onClose: () => void;
  events: EventItem[];
};

export function EventCalendarDropdown({
  selectedDate,
  onSelectDate,
  onClose,
  events,
}: EventCalendarDropdownProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(
    selectedDate ? parseInt(selectedDate.split("-")[0]) : today.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? parseInt(selectedDate.split("-")[1]) - 1 : today.getMonth()
  );

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const daysOfWeek = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  // Calculate days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Get starting day index (Monday = 0, Sunday = 6)
  let startDayIndex = firstDayOfMonth.getDay() - 1;
  if (startDayIndex === -1) startDayIndex = 6; // Sunday

  const calendarDays = [];
  // Previous month padding
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    calendarDays.push({ dayNum, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calendarDays.push({ dayNum: i, dateStr, isCurrentMonth: true });
  }

  // Next month padding to fill 42 cells (6 rows)
  const totalCells = Math.ceil(calendarDays.length / 7) * 7;
  const nextMonthCells = totalCells - calendarDays.length;
  for (let i = 1; i <= nextMonthCells; i++) {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calendarDays.push({ dayNum: i, dateStr, isCurrentMonth: false });
  }

  // Check if date has events
  function dateHasEvents(dateStr: string) {
    return events.some(
      (evt) => evt.status !== "CANCELLED" && evt.startDate <= dateStr && evt.endDate >= dateStr
    );
  }

  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className={styles.calendarDropdownOverlay}>
      <div className={styles.calendarDropdownContent}>
        <div className={styles.calendarHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarIcon size={18} color="#B80E0E" />
            <span style={{ fontWeight: 700, fontSize: "16px", color: "#2E0404" }}>
              Filter Berdasarkan Tanggal
            </span>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className={styles.calendarNav}>
          <button type="button" className={styles.calendarNavBtn} onClick={handlePrevMonth} aria-label="Bulan sebelumnya">
            <ChevronLeft size={16} />
          </button>
          <span className={styles.calendarNavTitle}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button type="button" className={styles.calendarNavBtn} onClick={handleNextMonth} aria-label="Bulan berikutnya">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className={styles.calendarWeekdays}>
          {daysOfWeek.map((d) => (
            <div key={d} className={styles.calendarWeekday}>
              {d}
            </div>
          ))}
        </div>

        <div className={styles.calendarGrid}>
          {calendarDays.map((cd, idx) => {
            const isSelected = selectedDate === cd.dateStr;
            const isToday = todayStr === cd.dateStr;
            const hasEvt = dateHasEvents(cd.dateStr);

            return (
              <button
                key={idx}
                type="button"
                className={`
                  ${styles.calendarDayBtn}
                  ${!cd.isCurrentMonth ? styles.dimDay : ""}
                  ${isSelected ? styles.selectedDay : ""}
                  ${isToday && !isSelected ? styles.todayDay : ""}
                `}
                onClick={() => {
                  onSelectDate(cd.dateStr);
                  onClose();
                }}
              >
                <span>{cd.dayNum}</span>
                {hasEvt && <span className={styles.eventIndicatorDot} />}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #F4DBDB" }}>
          <button
            type="button"
            className={styles.resetCalendarBtn}
            onClick={() => {
              onSelectDate(null);
              onClose();
            }}
          >
            <RotateCcw size={15} /> Reset Filter Tanggal
          </button>
        </div>
      </div>
    </div>
  );
}
