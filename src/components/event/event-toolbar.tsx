"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Plus, Settings, SlidersHorizontal, Search } from "lucide-react";
import type { EventItem } from "@/modules/event/types";
import { EventCalendarDropdown } from "./event-calendar-dropdown";
import styles from "./event.module.css";

type EventToolbarProps = {
  showFilters: boolean;
  onToggleFilters: () => void;
  onCreateClick: () => void;
  onManageClick: () => void;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  events: EventItem[];
};

export function EventToolbar({
  showFilters,
  onToggleFilters,
  onCreateClick,
  onManageClick,
  selectedDate,
  onSelectDate,
  events,
}: EventToolbarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft} style={{ position: "relative" }} ref={calendarRef}>
        <button
          type="button"
          className={`${styles.iconBtn} ${selectedDate ? styles.active : ""}`}
          style={{
            background: selectedDate ? "#B80E0E" : "#F4DBDB",
            color: selectedDate ? "#ffffff" : "#B80E0E",
            borderColor: "#E49F9F",
          }}
          onClick={() => setCalendarOpen((v) => !v)}
          aria-pressed={selectedDate !== null}
          aria-label="Filter berdasarkan tanggal kalender"
          title={selectedDate ? `Filter tanggal: ${selectedDate}` : "Pilih Tanggal Kalender"}
        >
          <Calendar size={22} />
        </button>

        {calendarOpen && (
          <EventCalendarDropdown
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            onClose={() => setCalendarOpen(false)}
            events={events}
          />
        )}

        <button type="button" className={styles.btnPrimary} onClick={onCreateClick}>
          <Plus size={18} /> Buat Event
        </button>
        <button type="button" className={styles.btnSecondary} onClick={onManageClick}>
          <Settings size={16} /> Kelola Event
        </button>
      </div>

      <div className={styles.toolbarRight}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-pressed={showFilters}
          aria-label="Filter dan Pencarian Event"
          onClick={onToggleFilters}
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>
    </div>
  );
}
