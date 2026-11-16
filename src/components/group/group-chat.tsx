"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, MessageCircle, MoreVertical, X, Check } from "lucide-react";
import { sendGroupMessageAction, editGroupMessageAction, deleteGroupMessageAction } from "@/modules/group/actions";
import type { GroupDetail, GroupChatMessage } from "@/modules/group/types";
import { MessageContextMenu } from "./message-context-menu";
import { GroupInformation } from "./group-information";
import type { GroupMemberListItem } from "@/modules/group/types";
import styles from "./group.module.css";

type GroupChatProps = {
  group: GroupDetail;
  messages: GroupChatMessage[];
  currentUserId: number;
  members: GroupMemberListItem[];
  canManage: boolean;
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

export function GroupChat({ group, messages: initialMessages, currentUserId, members, canManage }: GroupChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [showMembers, setShowMembers] = useState(false);
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
            <Image src={group.photo} alt={group.name} width={46} height={46} unoptimized />
          ) : (
            getInitials(group.name)
          )}
        </div>
        <div className={styles.chatHeaderInfo}>
          <button type="button" className={styles.chatHeaderName} onClick={() => setShowMembers(true)}>{group.name}</button>
        </div>
      </div>

      {showMembers && <GroupInformation group={group} members={members} currentUserId={currentUserId} canManage={canManage} onClose={() => setShowMembers(false)} onUpdated={() => router.refresh()} />}

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
                <div className={`${styles.msgRow} ${isOwn ? styles.msgRowOwn : styles.msgRowOther}`}>
                <div className={`${styles.msgBubble} ${isOwn ? styles.msgOwn : styles.msgOther}`}>
                  {showSender && (
                    <span className={styles.msgSender}>{msg.senderName}</span>
                  )}
                  {editingId === msg.id ? (
                    <form
                      className={styles.editForm}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const content = editingText.trim();
                        if (!content) return;
                        startTransition(async () => {
                          const result = await editGroupMessageAction({ groupId: group.id, messageId: msg.id, content });
                          if (result.ok) {
                            setEditingId(null);
                            router.refresh();
                          }
                        });
                      }}
                    >
                      <textarea
                        className={styles.editTextarea}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        maxLength={2000}
                        autoFocus
                        rows={1}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = "auto";
                          target.style.height = `${target.scrollHeight}px`;
                        }}
                      />
                      <div className={styles.editActions}>
                        <button type="submit" className={styles.saveBtn} disabled={isPending}>
                          <Check size={14} /> Simpan
                        </button>
                        <button type="button" className={styles.cancelEditBtn} onClick={() => setEditingId(null)} disabled={isPending}>
                          <X size={14} /> Batal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>{msg.content}{msg.updatedAt && new Date(msg.updatedAt).getTime() !== new Date(msg.createdAt).getTime() ? <small className={styles.editedLabel}> (diedit)</small> : null}</>
                  )}
                  <span className={styles.msgTime}>{formatTime(msg.createdAt)}</span>
                </div>
                {isOwn && editingId !== msg.id && <div className={styles.msgActionRail}>
                  <button type="button" className={styles.msgActionsBtn} aria-label="Menu pesan" onClick={() => setMenuOpenId(menuOpenId === msg.id ? null : msg.id)}><MoreVertical size={16} /></button>
                  {menuOpenId === msg.id && <MessageContextMenu onEdit={() => { setEditingId(msg.id); setEditingText(msg.content); setMenuOpenId(null); }} onDelete={() => { setDeleteTarget(msg.id); setMenuOpenId(null); }} onClose={() => setMenuOpenId(null)} />}
                </div>}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {deleteTarget !== null && <div className={styles.confirmOverlay} role="dialog" aria-modal="true"><div className={styles.confirmModal}><h2>Hapus Pesan?</h2><p>Apakah Anda yakin ingin menghapus pesan ini? Pesan yang dihapus tidak akan ditampilkan lagi dalam percakapan.</p><div className={styles.confirmActions}><button type="button" className={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>Batal</button><button type="button" className={styles.dangerBtn} disabled={isPending} onClick={() => { const id = deleteTarget; startTransition(async () => { const result = await deleteGroupMessageAction({ groupId: group.id, messageId: id }); if (result.ok) setMessages((prev) => prev.filter((item) => item.id !== id)); setDeleteTarget(null); }); }}>Hapus Pesan</button></div></div></div>}

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
