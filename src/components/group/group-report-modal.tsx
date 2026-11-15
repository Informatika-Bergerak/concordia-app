"use client";
import { useState, useTransition } from "react";
import { createReportAction } from "@/modules/report/actions";
import styles from "./group.module.css";
const reasons = ["Konten tidak pantas","Spam atau promosi berlebihan","Penipuan","Pelecehan atau perundungan","Informasi menyesatkan","Pelanggaran lainnya"];
export function GroupReportModal({ groupId, groupName, onClose, onSuccess }: { groupId:number; groupName:string; onClose:()=>void; onSuccess:(message:string)=>void }) {
 const [reason,setReason]=useState(""),[details,setDetails]=useState(""),[pending,startTransition]=useTransition();
 const submit=()=>{ if(!reason)return; startTransition(async()=>{const result=await createReportAction({title:`Laporan grup: ${groupName}`,description:`Alasan: ${reason}${details.trim()?`\n\nKeterangan: ${details.trim()}`:""}`,location:`Grup ${groupName}`,category:"LAPORAN_GRUP",occurredAt:new Date().toISOString().slice(0,10),visibility:"PRIVATE",groupId});if(result.ok){onSuccess("Laporan berhasil dikirim");onClose();}}); };
 return <div className={styles.confirmOverlay} role="dialog" aria-modal="true"><div className={styles.reportModal}><h2>Laporkan Grup</h2><p>Bantu menjaga komunitas Concordia tetap aman dengan melaporkan grup yang melanggar aturan.</p><div className={styles.reportReasons}>{reasons.map(item=><label key={item}><input type="radio" name="group-report-reason" checked={reason===item} onChange={()=>setReason(item)}/><span>{item}</span></label>)}</div><textarea className={styles.infoTextarea} placeholder="Keterangan tambahan (opsional)" value={details} onChange={e=>setDetails(e.target.value)} maxLength={1000}/><div className={styles.confirmActions}><button className={styles.cancelBtn} onClick={onClose}>Batal</button><button className={styles.dangerBtn} disabled={!reason||pending} onClick={submit}>{pending?"Mengirim...":"Kirim Laporan"}</button></div></div></div>;
}
