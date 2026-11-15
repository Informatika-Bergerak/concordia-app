"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Users, MessageCircle, MoreVertical } from "lucide-react";
import { sendGroupMessageAction, editGroupMessageAction, deleteGroupMessageAction } from "@/modules/group/actions";
import type { GroupDetail, GroupChatMessage } from "@/modules/group/types";
import styles from "./group.module.css";

type GroupChatProps = {
  group: GroupDetail;
  messages: GroupChatMessage[];
  currentUserId: number;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function GroupChat({ group, messages: initialMessages, currentUserId }: GroupChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Scroll ke bawah saat mount
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, []);

  // Update messages if initialMessages changes (after revalidation)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSend = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const content = text.trim();
      if (!content) return;

      // Optimistic update
      const tempMessage: GroupChatMessage = {
        id: Date.now(),
        content,
        createdAt: new Date(),
        senderId: currentUserId,
        senderName: "Kamu",
        updatedAt: null,
        deletedAt: null,
      };
      setMessages((prev) => [...prev, tempMessage]);
      setText("");
      inputRef.current?.focus();

      startTransition(async () => {
        const result = await sendGroupMessageAction({
          groupId: group.id,
          content,
        });
        if (!result.ok) {
          // Rollback optimistic update on error
          setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
          setText(content);
        }
        router.refresh();
      });
    },
    [text, currentUserId, group.id, router],
  );

  return (
    <div className={styles.chatPage}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <Link href="/grup" className={styles.backBtn} aria-label="Kembali ke daftar grup">
          <ArrowLeft size={20} />
        </Link>
        <div className={styles.chatAvatar}>
          {group.photo ? (
            <img src={group.photo} alt={group.name} />
          ) : (
            getInitials(group.name)
          )}
        </div>
        <div className={styles.chatHeaderInfo}>
          <h1 className={styles.chatHeaderName}>{group.name}</h1>
          <p className={styles.chatHeaderMembers}>
            <Users size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
            {group.memberCount} anggota
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.messagesEmpty}>
            <MessageCircle size={40} />
            <p>Belum ada pesan di grup ini.</p>
            <p>Mulai percakapan sekarang!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.senderId === currentUserId;
            const showDate =
              i === 0 || !isSameDay(messages[i - 1].createdAt, msg.createdAt);
            // Show sender name only for other's messages, and only when sender changes
            const showSender =
              !isOwn &&
              (i === 0 ||
                messages[i - 1].senderId !== msg.senderId ||
                !isSameDay(messages[i - 1].createdAt, msg.createdAt));

            return (
              <div key={msg.id}>
                {showDate && (
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 11,
                      color: "var(--ink-muted)",
                      padding: "8px 0",
                      fontWeight: 700,
                    }}
                  >
                    {formatDateSeparator(msg.createdAt)}
                  </div>
                )}
                <div
                  className={`${styles.msgBubble} ${isOwn ? styles.msgOwn : styles.msgOther}`}
                >
                  {showSender && (
                    <span className={styles.msgSender}>{msg.senderName}</span>
                  )}
                  {editingId === msg.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); const content = editingText.trim(); if (!content) return; startTransition(async () => { const result = await editGroupMessageAction({ groupId: group.id, messageId: msg.id, content }); if (result.ok) { setEditingId(null); router.refresh(); } }); }}>
                      <input value={editingText} onChange={(e) => setEditingText(e.target.value)} maxLength={2000} autoFocus />
                      <button type="submit">Simpan</button>
                      <button type="button" onClick={() => setEditingId(null)}>Batal</button>
                    </form>
                  ) : (
                    <>{msg.content}{msg.updatedAt && new Date(msg.updatedAt).getTime() !== new Date(msg.createdAt).getTime() ? <small> (diedit)</small> : null}</>
                  )}
                  {isOwn && editingId !== msg.id && (
                    <span className={styles.msgActions}>
                      <button type="button" aria-label="Menu pesan" onClick={() => { if (window.confirm("Hapus pesan ini?")) startTransition(async () => { const result = await deleteGroupMessageAction({ groupId: group.id, messageId: msg.id }); if (result.ok) setMessages((prev) => prev.filter((item) => item.id !== msg.id)); }); }}><MoreVertical size={14} /></button>
                      <button type="button" onClick={() => { setEditingId(msg.id); setEditingText(msg.content); }}>Edit</button>
                    </span>
                  )}
                  <span className={styles.msgTime}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className={styles.chatInput} onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Ketik pesan..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          autoComplete="off"
          aria-label="Tulis pesan"
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!text.trim() || isPending}
          aria-label="Kirim pesan"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
