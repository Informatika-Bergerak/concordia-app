"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { CalendarPlus, ImagePlus, ListChecks, LoaderCircle, MapPin, Music2, Plus, Smile, Tag, X } from "lucide-react";
import { uploadFile } from "@/lib/uploads/client";
import { UPLOAD_RULES } from "@/lib/uploads/config";
import { createPostAction } from "@/modules/forum/actions";
import styles from "./composer.module.css";

const MAX_POST_LENGTH = 2000;
const MAX_MENTIONS = 10;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const EMOJIS = ["😀", "😂", "😍", "😢", "😡", "👍", "🎉", "❤️"];

type ComposerEvent = { title: string; date: string; time: string; location: string; url?: string };
type MentionCandidate = { id: number; name: string; username: string; photo: string | null };
type ComposerProps = { user: { name: string; fotoProfil?: string | null }; events?: ComposerEvent[] };

export function Composer({ user, events = [] }: ComposerProps) {
  const [open, setOpen] = useState(false);
  const [showTag, setShowTag] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIds, setMentionIds] = useState<number[]>([]);
  const [selectedMentions, setSelectedMentions] = useState<MentionCandidate[]>([]);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionCandidate[]>([]);
  const [location, setLocation] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [selectedEvent, setSelectedEvent] = useState<ComposerEvent | null>(null);
  const [showEvents, setShowEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mentionInputRef = useRef<HTMLInputElement>(null);
  const mentionPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!showTag) {
      setMentionSuggestions([]);
      return;
    }
    const query = mentionQuery.trim();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/mentions${query ? `?q=${encodeURIComponent(query)}` : ""}`);
        if (response.ok) setMentionSuggestions((await response.json()).users as MentionCandidate[]);
      } catch {
        setMentionSuggestions([]);
      }
    }, query ? 180 : 0);
    return () => window.clearTimeout(timer);
  }, [mentionQuery, showTag]);

  useEffect(() => {
    if (!showTag) return;

    function handleOutsidePointerDown(event: PointerEvent) {
      if (!mentionPickerRef.current?.contains(event.target as Node)) {
        setShowTag(false);
        setMentionQuery("");
        setMentionSuggestions([]);
      }
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [showTag]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    textareaRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeComposer();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function openComposer() {
    setError(null);
    setNotice(null);
    setOpen(true);
  }

  function closeComposer() {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
    kind: "image" | "audio",
  ) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (kind === "image") {
      const rule = UPLOAD_RULES.image;
      if (!rule.mimes.includes(file.type)) {
        setError(`Format gambar harus ${rule.label}.`);
        event.target.value = "";
        return;
      }
      if (file.size > rule.maxBytes) {
        setError(`Ukuran gambar maksimal ${rule.maxBytes / 1024 / 1024} MB.`);
        event.target.value = "";
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      if (!file.type.startsWith("audio/")) {
        setError("File yang dipilih harus berupa audio.");
        event.target.value = "";
        return;
      }
      if (file.size > MAX_AUDIO_BYTES) {
        setError("Ukuran audio maksimal 10 MB.");
        event.target.value = "";
        return;
      }
      setAudio(file);
    }

    setError(null);
    setNotice(null);
  }

  function removeImage() {
    setImage(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const trimmedText = text.trim();
    if (!trimmedText) {
      setError("Tulis sesuatu sebelum mengirim postingan.");
      textareaRef.current?.focus();
      return;
    }

    if (trimmedText.length > MAX_POST_LENGTH) {
      setError(`Postingan maksimal ${MAX_POST_LENGTH} karakter.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const [uploadedImage, uploadedAudio] = await Promise.all([
        image ? uploadFile(image, "forum") : Promise.resolve(null),
        audio ? uploadFile(audio, "forum") : Promise.resolve(null),
      ]);

      const result = await createPostAction({
        text: trimmedText,
        mentionUserIds: mentionIds,
        image: uploadedImage,
        audio: uploadedAudio,
        location: location ? { label: location } : null,
        event: selectedEvent,
        poll: showPoll ? { question: pollQuestion, options: pollOptions } : null,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setText("");
      setImage(null);
      setAudio(null);
      setMentionQuery("");
      setMentionIds([]);
      setSelectedMentions([]);
      setMentionSuggestions([]);
      setShowTag(false);
      setLocation("");
      setSelectedEvent(null);
      setShowPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setImagePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
      setNotice("Postingan berhasil dikirim.");
      window.setTimeout(closeComposer, 500);
      window.location.reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal mengirim postingan, coba lagi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className={styles.card} aria-label="Buat postingan">
        <div className={styles.triggerIdentity}>{user.name}</div>
        <button type="button" className={styles.trigger} onClick={openComposer}>
          Apa yang anda pikirkan ?...
        </button>
        <button
          ref={triggerRef}
          type="button"
          className={styles.add}
          onClick={openComposer}
          aria-label="Buat postingan"
        >
          <Plus size={22} aria-hidden="true" />
        </button>
      </section>

      {open && (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeComposer();
          }}
        >
          <form
            className={`${styles.modal} ${imagePreview ? styles.photoModal : ""}`}
            onSubmit={handleSubmit}
            role="dialog"
            aria-modal="true"
            aria-label={imagePreview ? "Buat postingan dengan gambar" : "Buat postingan"}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.composerTitle}>Buat Postingan</div>
            <div className={styles.identityRow}>
              {user.fotoProfil ? <img src={user.fotoProfil} alt="" className={styles.identityAvatar} /> : <span className={styles.identityAvatarFallback}>{user.name.charAt(0).toUpperCase()}</span>}
              <strong>{user.name}</strong>
            </div>

            <div className={styles.composerBody}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setError(null);
                  setNotice(null);
                }}
                placeholder="Apa yang anda pikirkan ?..."
                maxLength={MAX_POST_LENGTH}
                aria-label="Isi postingan"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "composer-error" : undefined}
              />
            </div>

            {imagePreview && (
              <div className={styles.imagePreview}>
                {/* The object URL is created from the validated local image file. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Pratinjau gambar postingan" />
                <button type="button" className={styles.removeImage} onClick={removeImage} aria-label="Hapus gambar"><X size={22} aria-hidden="true" /></button>
              </div>
            )}

            <div className={styles.tagRow}>
              <Tag size={30} aria-hidden="true" />
              <div ref={mentionPickerRef} className={styles.mentionPicker}>
                {selectedMentions.map((mention) => (
                  <span className={styles.selectedTag} key={mention.id}>
                    @{mention.name}
                    <button type="button" onClick={() => { setMentionIds((current) => current.filter((id) => id !== mention.id)); setSelectedMentions((current) => current.filter((item) => item.id !== mention.id)); }} aria-label={`Hapus tag ${mention.name}`} disabled={submitting}><X size={16} aria-hidden="true" /></button>
                  </span>
                ))}
                {showTag && mentionIds.length < MAX_MENTIONS ? (
                  <input ref={mentionInputRef} className={styles.tagInput} value={mentionQuery} onChange={(event) => setMentionQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape" || event.key === "Enter") { event.preventDefault(); setShowTag(false); setMentionSuggestions([]); } }} placeholder="Cari orang untuk ditag" maxLength={40} autoFocus />
                ) : (
                  <button type="button" className={styles.tagButton} onClick={() => { setShowTag(true); window.setTimeout(() => mentionInputRef.current?.focus(), 0); }} disabled={submitting}>add a tag</button>
                )}
                {showTag && mentionSuggestions.length > 0 && <div className={styles.mentionSuggestions}>{mentionSuggestions.filter((candidate) => !mentionIds.includes(candidate.id)).map((candidate) => <button type="button" key={candidate.id} onClick={() => { if (mentionIds.length >= MAX_MENTIONS) return; setMentionIds((current) => [...current, candidate.id]); setSelectedMentions((current) => [...current, candidate]); setMentionQuery(""); setMentionSuggestions([]); mentionInputRef.current?.focus(); }}><span>{candidate.name}<small>@{candidate.username}</small></span></button>)}</div>}
              </div>
            </div>

            <div className={styles.footerBar}>
              <div className={styles.toolbar}>
                {showEmoji && <div className={styles.emojiPicker}>{EMOJIS.map((emoji) => <button type="button" key={emoji} onClick={() => { setText((value) => `${value}${emoji}`); setShowEmoji(false); }}>{emoji}</button>)}</div>}
                <input ref={imageInputRef} className={styles.hiddenInput} type="file" accept={UPLOAD_RULES.image.mimes.join(",")} onChange={(event) => handleFileChange(event, "image")} />
                <input ref={audioInputRef} className={styles.hiddenInput} type="file" accept="audio/*" onChange={(event) => handleFileChange(event, "audio")} />
                <button type="button" className={styles.mediaButton} onClick={() => setShowEmoji((value) => !value)} aria-label="Tambahkan emotikon" disabled={submitting}><Smile size={25} aria-hidden="true" /></button>
                <button type="button" className={styles.mediaButton} onClick={() => imageInputRef.current?.click()} aria-label="Tambahkan gambar" disabled={submitting}><ImagePlus size={25} aria-hidden="true" /></button>
                <button type="button" className={styles.mediaButton} onClick={() => audioInputRef.current?.click()} aria-label="Tambahkan audio" disabled={submitting}><Music2 size={25} aria-hidden="true" /></button>
                <button type="button" className={styles.mediaButton} onClick={() => { const value = window.prompt("Lokasi postingan"); if (value !== null) setLocation(value.trim()); }} aria-label="Tambahkan lokasi" disabled={submitting}><MapPin size={25} aria-hidden="true" /></button>
                <button type="button" className={`${styles.mediaButton} ${showPoll ? styles.mediaButtonActive : ""}`} onClick={() => setShowPoll((value) => !value)} aria-label="Tambahkan polling" disabled={submitting}><ListChecks size={25} aria-hidden="true" /></button>
                <button type="button" className={`${styles.mediaButton} ${selectedEvent ? styles.mediaButtonActive : ""}`} onClick={() => setShowEvents((value) => !value)} aria-label="Tambahkan event" disabled={submitting}><CalendarPlus size={25} aria-hidden="true" /></button>
                {showPoll && <div className={styles.attachmentPanel}><input value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} placeholder="Pertanyaan polling" maxLength={180} />{pollOptions.map((option, index) => <input key={index} value={option} onChange={(event) => setPollOptions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Pilihan ${index + 1}`} maxLength={80} />)}{pollOptions.length < 4 && <button type="button" onClick={() => setPollOptions((current) => [...current, ""])}>Tambah pilihan</button>}</div>}
                {showEvents && events.length > 0 && <div className={styles.attachmentPanel}>{events.map((event) => <button type="button" key={`${event.title}-${event.date}`} onClick={() => { setSelectedEvent(event); setShowEvents(false); }}>{event.title}</button>)}</div>}
              </div>
              <button type="submit" className={styles.send} aria-label="Kirim postingan" disabled={submitting}>{submitting ? <LoaderCircle className={styles.spinner} size={21} aria-hidden="true" /> : "Post"}</button>
            </div>

            {(image || audio) && <p className={styles.attachments}>{image && `Gambar: ${image.name}`}{image && audio && " · "}{audio && `Audio: ${audio.name}`}</p>}
            {error && <p id="composer-error" className={styles.error} role="alert">{error}</p>}
            {notice && <p className={styles.notice} role="status">{notice}</p>}

          </form>
        </div>
      )}
    </>
  );
}
