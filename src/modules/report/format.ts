const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

/** Tanggal kejadian (kolom DATE, disimpan tanpa zona waktu). */
export const formatReportDate = (iso: string) => dateFormat.format(new Date(iso));

/** Waktu perubahan status, ditampilkan dalam WIB. */
export const formatReportDateTime = (iso: string) => `${dateTimeFormat.format(new Date(iso))} WIB`;
