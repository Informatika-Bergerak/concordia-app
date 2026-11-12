"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Calendar, Plus, RefreshCw } from "lucide-react";
import { mockEvents } from "@/modules/event/mock";
import { EVENT_FILTERS } from "@/modules/event/constants";
import type { EventItem } from "@/modules/event/types";
import { EventToolbar } from "./event-toolbar";
import { EventCard } from "./event-card";
import { CreateEventModal } from "./create-event-modal";
import { ManageEventModal } from "./manage-event-modal";
import { EditEventModal } from "./edit-event-modal";
import { EventDetailModal } from "./event-detail-modal";
import { CancelEventModal } from "./cancel-event-modal";
import { DeleteEventModal } from "./delete-event-modal";
import { ReportEventModal } from "./report-event-modal";
import styles from "./event.module.css";

type EventPageProps = {
  currentUser: {
    id: number;
    name: string;
    fotoProfil: string | null;
    jurusan: string | null;
    role: string;
  };
};

const STORAGE_KEY = "concordia_events_v1";

export function EventPage({ currentUser }: EventPageProps) {
  const [events, setEvents] = useState<EventItem[]>(() => {
    if (typeof window === "undefined") return mockEvents;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return mockEvents;
      }
    }
    return mockEvents;
  });

  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Modals state
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [modalManageOpen, setModalManageOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);
  const [cancellingEvent, setCancellingEvent] = useState<EventItem | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);
  const [reportingEvent, setReportingEvent] = useState<EventItem | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

  // Filtering logic
  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    const todayStr = new Date().toISOString().split("T")[0];

    return events.filter((evt) => {
      // Date filter match
      if (selectedDate) {
        if (!(evt.startDate <= selectedDate && evt.endDate >= selectedDate)) {
          return false;
        }
      }

      // Search query match
      if (q) {
        const matches = [
          evt.title,
          evt.description,
          evt.location,
          evt.creatorName,
          evt.category,
          evt.groupName || "",
        ].some((v) => v.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Filter category match
      switch (selectedFilter) {
        case "upcoming":
          return evt.status === "UPCOMING" && evt.startDate >= todayStr;
        case "nearest":
          return evt.startDate >= todayStr;
        case "online":
          return evt.isOnline;
        case "offline":
          return !evt.isOnline;
        case "joined":
          return evt.participants.includes(currentUser.id);
        case "created":
          return evt.creatorId === currentUser.id;
        case "interested":
          return evt.interested.includes(currentUser.id);
        default:
          return true;
      }
    });
  }, [events, query, selectedFilter, selectedDate, currentUser.id]);

  // Handlers
  function handleCreate(newEvent: EventItem) {
    setEvents((prev) => [newEvent, ...prev]);
    setModalCreateOpen(false);
    showToast("Event berhasil dibuat dan dipublikasikan!");
  }

  function handleUpdate(updated: EventItem) {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setEditingEvent(null);
    showToast("Event berhasil diperbarui!");
  }

  function handleCancelConfirm() {
    if (!cancellingEvent) return;
    setEvents((prev) =>
      prev.map((e) => (e.id === cancellingEvent.id ? { ...e, status: "CANCELLED" } : e))
    );
    setCancellingEvent(null);
    showToast("Event berhasil dibatalkan.");
  }

  function handleDeleteConfirm() {
    if (!deletingEvent) return;
    const deletedId = deletingEvent.id;
    const deletedTitle = deletingEvent.title;

    setEvents((prev) => prev.filter((e) => e.id !== deletedId));
    setDeletingEvent(null);

    // Preserve audit reports history in localStorage
    if (typeof window !== "undefined") {
      const savedReports = localStorage.getItem("concordia_reports_v1");
      if (savedReports) {
        try {
          const reports = JSON.parse(savedReports);
          const updatedReports = reports.map((r: any) => {
            if (r.title && r.title.includes(deletedTitle)) {
              return {
                ...r,
                description: `${r.description} — [Event Terkait "${deletedTitle}" Telah Dihapus dari Sistem]`,
              };
            }
            return r;
          });
          localStorage.setItem("concordia_reports_v1", JSON.stringify(updatedReports));
        } catch {}
      }
    }

    showToast("Event berhasil dihapus.");
  }

  function handleJoinToggle(event: EventItem) {
    const isJoined = event.participants.includes(currentUser.id);
    const updatedParticipants = isJoined
      ? event.participants.filter((id) => id !== currentUser.id)
      : [...event.participants, currentUser.id];

    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, participants: updatedParticipants } : e))
    );
    showToast(isJoined ? "Anda batal bergabung dari event." : "Berhasil bergabung ke event!");
  }

  function handleInterestedToggle(event: EventItem) {
    const isInterested = event.interested.includes(currentUser.id);
    const updatedInterested = isInterested
      ? event.interested.filter((id) => id !== currentUser.id)
      : [...event.interested, currentUser.id];

    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, interested: updatedInterested } : e))
    );
    showToast(isInterested ? "Status Interested dibatalkan." : "Event ditandai sebagai Interested.");
  }

  function handleShare(event: EventItem) {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: event.title,
          text: event.description,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${event.title} - ${shareUrl}`);
      showToast("Tautan event berhasil disalin ke clipboard!");
    }
  }

  return (
    <div className={styles.container}>
      <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#2E0404", margin: "0 0 4px" }}>Event Kampus</h1>
      <p style={{ color: "#8A0B0B", fontSize: "14px", margin: "0 0 20px" }}>
        Temukan, ikuti, dan selenggarakan berbagai kegiatan menarik di lingkungan Concordia.
      </p>

      {/* Toolbar */}
      <EventToolbar
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
        onCreateClick={() => setModalCreateOpen(true)}
        onManageClick={() => setModalManageOpen(true)}
        selectedDate={selectedDate}
        onSelectDate={(date) => setSelectedDate(date)}
        events={events}
      />

      {/* Active Date Filter Notice */}
      {selectedDate && (
        <div className={styles.activeFilterNotice}>
          <span>Menampilkan event pada tanggal {selectedDate}</span>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => setSelectedDate(null)}
            style={{ fontSize: "12px", padding: "4px 12px" }}
          >
            Hapus Filter Tanggal
          </button>
        </div>
      )}

      {/* Filter and Search Panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.searchBox}>
            <Search size={18} color="#8A0B0B" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari event berdasarkan nama, lokasi, kategori, atau pembuat..."
            />
          </div>

          <div className={styles.filterChips} role="group" aria-label="Filter Event">
            {EVENT_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={styles.chip}
                aria-pressed={selectedFilter === f.id}
                onClick={() => setSelectedFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                setQuery("");
                setSelectedFilter("all");
                setSelectedDate(null);
              }}
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}

      {/* Event List */}
      {filteredEvents.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar size={56} color="#CD5656" style={{ margin: "0 auto" }} />
          <h3 className={styles.emptyTitle}>Tidak ada event yang ditemukan</h3>
          <p className={styles.emptySub}>Coba ubah kata kunci pencarian, tanggal, atau filter yang digunakan.</p>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              setQuery("");
              setSelectedFilter("all");
              setSelectedDate(null);
            }}
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className={styles.eventGrid}>
          {filteredEvents.map((evt) => (
            <EventCard
              key={evt.id}
              event={evt}
              currentUserId={currentUser.id}
              onJoinToggle={handleJoinToggle}
              onInterestedToggle={handleInterestedToggle}
              onCardClick={(e) => setDetailEvent(e)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modalCreateOpen && (
        <CreateEventModal
          currentUser={currentUser}
          onClose={() => setModalCreateOpen(false)}
          onCreated={handleCreate}
        />
      )}

      {modalManageOpen && (
        <ManageEventModal
          events={events}
          currentUserId={currentUser.id}
          onClose={() => setModalManageOpen(false)}
          onEdit={(e) => setEditingEvent(e)}
          onCancel={(e) => setCancellingEvent(e)}
          onDelete={(e) => setDeletingEvent(e)}
          onShare={handleShare}
          onToggleInterested={handleInterestedToggle}
          showToast={showToast}
        />
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdated={handleUpdate}
        />
      )}

      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          currentUserId={currentUser.id}
          onClose={() => setDetailEvent(null)}
          onJoinToggle={handleJoinToggle}
          onInterestedToggle={handleInterestedToggle}
          onShare={handleShare}
          onReport={(e) => {
            setDetailEvent(null);
            setReportingEvent(e);
          }}
        />
      )}

      {cancellingEvent && (
        <CancelEventModal
          event={cancellingEvent}
          onClose={() => setCancellingEvent(null)}
          onConfirm={handleCancelConfirm}
        />
      )}

      {deletingEvent && (
        <DeleteEventModal
          event={deletingEvent}
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role}
          onClose={() => setDeletingEvent(null)}
          onConfirm={handleDeleteConfirm}
          showToast={showToast}
        />
      )}

      {reportingEvent && (
        <ReportEventModal
          event={reportingEvent}
          currentUser={currentUser}
          onClose={() => setReportingEvent(null)}
          onSubmitReport={(msg) => {
            setReportingEvent(null);
            showToast(msg);
          }}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className={styles.toast}>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
