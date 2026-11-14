"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ImagePlus, LoaderCircle, Music2, Plus, Send, X } from "lucide-react";
import { uploadFile } from "@/lib/uploads/client";
import { UPLOAD_RULES } from "@/lib/uploads/config";
import { createPostAction } from "@/modules/forum/actions";
import styles from "./composer.module.css";

const MAX_POST_LENGTH = 2000;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export function Composer() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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
        image: uploadedImage,
        audio: uploadedAudio,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setText("");
      setImage(null);
      setAudio(null);
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
            {!imagePreview && (
              <h2 id="composer-title" className={styles.visuallyHidden}>
                Buat Postingan
              </h2>
            )}

            {imagePreview && (
              <div className={styles.imagePreview}>
                {/* The object URL is created from the validated local image file. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Pratinjau gambar postingan" />
                <button
                  type="button"
                  className={styles.removeImage}
                  onClick={removeImage}
                  aria-label="Hapus gambar"
                >
                  <X size={22} aria-hidden="true" />
                </button>
              </div>
            )}

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

              <div className={styles.actionRail}>
                <input
                  ref={imageInputRef}
                  className={styles.hiddenInput}
                  type="file"
                  accept={UPLOAD_RULES.image.mimes.join(",")}
                  onChange={(event) => handleFileChange(event, "image")}
                />
                <button
                  type="button"
                  className={styles.mediaButton}
                  onClick={() => imageInputRef.current?.click()}
                  aria-label="Tambahkan gambar"
                  disabled={submitting}
                >
                  <ImagePlus size={30} aria-hidden="true" />
                </button>

                <input
                  ref={audioInputRef}
                  className={styles.hiddenInput}
                  type="file"
                  accept="audio/*"
                  onChange={(event) => handleFileChange(event, "audio")}
                />
                <button
                  type="button"
                  className={styles.mediaButton}
                  onClick={() => audioInputRef.current?.click()}
                  aria-label="Tambahkan audio"
                  disabled={submitting}
                >
                  <Music2 size={30} aria-hidden="true" />
                </button>
                <button
                  type="submit"
                  className={styles.send}
                  aria-label="Kirim postingan"
                  disabled={submitting}
                >
                  {submitting ? (
                    <LoaderCircle className={styles.spinner} size={24} aria-hidden="true" />
                  ) : (
                    <Send size={28} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {(image || audio) && (
              <p
                className={`${styles.attachments} ${imagePreview ? styles.photoAttachments : ""}`}
              >
                {image && `Gambar: ${image.name}`}
                {image && audio && " · "}
                {audio && `Audio: ${audio.name}`}
              </p>
            )}

            {error && (
              <p id="composer-error" className={styles.error} role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className={styles.notice} role="status">
                {notice}
              </p>
            )}

          </form>
        </div>
      )}
    </>
  );
}
