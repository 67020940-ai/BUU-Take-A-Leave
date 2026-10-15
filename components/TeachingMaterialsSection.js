'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  ExternalLink,
  Trash2,
  Plus,
  Loader2,
  FolderOpen,
  Calendar,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Image as ImageIcon,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';

function getFileIcon(ext) {
  const cleanExt = (ext || '').toLowerCase().replace('.', '');
  if (cleanExt === 'pdf') {
    return {
      icon: <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      label: 'PDF',
    };
  }
  if (['pptx', 'ppt'].includes(cleanExt)) {
    return {
      icon: <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      label: 'SLIDE',
    };
  }
  if (['docx', 'doc', 'txt'].includes(cleanExt)) {
    return {
      icon: <FileCode className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      label: 'DOC',
    };
  }
  if (['xlsx', 'xls'].includes(cleanExt)) {
    return {
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      label: 'SHEET',
    };
  }
  if (['zip', 'rar', '7z'].includes(cleanExt)) {
    return {
      icon: <FileArchive className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      label: 'ZIP',
    };
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(cleanExt)) {
    return {
      icon: <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      badge: 'bg-purple-100 text-[#7749BC] dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      label: 'IMAGE',
    };
  }
  return {
    icon: <FileText className="w-4 h-4 text-neutral-500" />,
    badge: 'bg-neutral-100 text-neutral-600 dark:bg-slate-800 dark:text-neutral-300 border-neutral-200 dark:border-slate-700',
    label: cleanExt.toUpperCase() || 'FILE',
  };
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function TeachingMaterialsSection({
  courseId,
  courseCode,
  courseName,
  isTeacher = false,
  targetWeek = null,
  showUploadModalOnly = false,
}) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [week, setWeek] = useState(targetWeek ? String(targetWeek) : '0');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const fetchKey = courseId || courseCode;

  // Load materials from database
  async function loadMaterials() {
    if (!fetchKey) return;
    try {
      const url = targetWeek
        ? `/api/teaching-materials?courseId=${encodeURIComponent(fetchKey)}&week=${targetWeek}`
        : `/api/teaching-materials?courseId=${encodeURIComponent(fetchKey)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.materials)) {
          setMaterials(data.materials);
        }
      }
    } catch (err) {
      console.warn('Load materials error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMaterials();
  }, [fetchKey, targetWeek]);

  // Handle Download
  async function handleDownload(material) {
    if (!material?.fileUrl) return;
    setDownloadingId(material.id);
    try {
      const res = await fetch(material.fileUrl);
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = material.fileName || `${material.title}.${material.fileType || 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // Fallback: stream through /api/download
      const proxyUrl = `/api/download?url=${encodeURIComponent(material.fileUrl)}&name=${encodeURIComponent(material.fileName || material.title)}`;
      const a = document.createElement('a');
      a.href = proxyUrl;
      a.setAttribute('download', material.fileName || material.title);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingId(null);
    }
  }

  // Handle Delete
  async function handleDelete(materialId) {
    if (!confirm('คุณต้องการลบเอกสารประกอบการสอนนี้หรือไม่?')) return;
    setDeletingId(materialId);
    try {
      const res = await fetch(`/api/teaching-materials?id=${materialId}`, { method: 'DELETE' });
      if (res.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      } else {
        const data = await res.json();
        alert(data.error || 'ลบเอกสารไม่สำเร็จ');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบเอกสาร');
    } finally {
      setDeletingId(null);
    }
  }

  // Handle File Submit
  async function handleUploadSubmit(e) {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('กรุณาเลือกไฟล์ที่ต้องการอัปโหลด');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('courseId', fetchKey);
      form.append('title', title.trim() || selectedFile.name);
      if (description.trim()) form.append('description', description.trim());
      if (week && week !== '0') form.append('week', week);

      const res = await fetch('/api/teaching-materials', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อัปโหลดไฟล์ไม่สำเร็จ');

      setUploadSuccess('อัปโหลดเอกสารประกอบการสอนสำเร็จเรียบร้อยแล้ว');
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload materials list
      await loadMaterials();

      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccess('');
      }, 800);
    } catch (err) {
      setUploadError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-[#7749BC] dark:text-purple-400" />
          <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100">
            เอกสารและสื่อประกอบการสอน ({materials.length} ไฟล์)
          </h4>
        </div>

        {isTeacher && (
          <button
            type="button"
            onClick={() => {
              setUploadError('');
              setUploadSuccess('');
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>อัปโหลดเอกสารใหม่</span>
          </button>
        )}
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-neutral-200/80 dark:border-slate-800 flex items-center justify-center text-xs text-neutral-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#7749BC]" />
          <span>กำลังโหลดสื่อการสอน...</span>
        </div>
      ) : materials.length === 0 ? (
        <div className="p-5 text-center rounded-2xl bg-neutral-50/80 dark:bg-slate-900/40 border border-neutral-200/80 dark:border-slate-800 space-y-1.5">
          <FileText className="w-7 h-7 text-neutral-300 dark:text-neutral-600 mx-auto" />
          <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
            ยังไม่มีเอกสารประกอบการสอนในขณะนี้
          </p>
          <p className="text-[11px] text-neutral-400">
            {isTeacher
              ? 'คลิกปุ่ม "อัปโหลดเอกสารใหม่" เพื่อเริ่มเพิ่มสื่อและเอกสารให้นิสิต'
              : 'อาจารย์ผู้สอนยังไม่ได้อัปโหลดเอกสารสำหรับรายวิชานี้'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {materials.map((m) => {
            const meta = getFileIcon(m.fileType || m.fileName?.split('.').pop());
            const isDeleting = deletingId === m.id;
            const isDownloading = downloadingId === m.id;

            return (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200/80 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900/60 shadow-xs flex flex-col justify-between gap-2.5 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-slate-800 shrink-0">
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${meta.badge}`}>
                        {meta.label}
                      </span>
                      {m.week ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-300">
                          สัปดาห์ที่ {m.week}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-[#7749BC] dark:text-purple-300">
                          เอกสารทั่วไป
                        </span>
                      )}
                    </div>
                    <h5 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate mt-1" title={m.title}>
                      {m.title}
                    </h5>
                    <p className="text-[11px] font-mono text-neutral-400 truncate">
                      {m.fileName} • {formatBytes(m.fileSize)}
                    </p>
                    {m.description && (
                      <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                        {m.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: View, Download, Delete */}
                <div className="pt-2 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-neutral-400 truncate">
                    อัปโหลดโดย {m.uploadedBy?.name || 'อาจารย์ผู้สอน'}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-slate-700 hover:bg-neutral-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1 transition-colors"
                      title="เปิดดูในแท็บใหม่"
                    >
                      <ExternalLink className="w-3 h-3 text-[#7749BC] dark:text-purple-400" />
                      <span>เปิดดู</span>
                    </a>

                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => handleDownload(m)}
                      className="px-2.5 py-1 rounded-lg bg-[#7749BC] hover:bg-[#653ba6] text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      title="ดาวน์โหลดไฟล์ลงเครื่อง"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                      <span>ดาวน์โหลด</span>
                    </button>

                    {isTeacher && (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer disabled:opacity-50"
                        title="ลบเอกสาร"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal (For Teacher) */}
      {showUploadModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowUploadModal(false)}
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-slate-800 bg-neutral-50/80 dark:bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center shadow-xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                    อัปโหลดสื่อและเอกสารประกอบการสอน
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    {courseCode || fetchKey} {courseName ? `• ${courseName}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
              {uploadSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  ชื่อหัวข้อ / ชื่อเอกสาร <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น สไลด์บรรยายบทที่ 3 (Use Case Diagram)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] shadow-xs"
                  required
                />
              </div>

              {/* Week Selector */}
              <div>
                <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  ผูกกับสัปดาห์ที่สอน
                </label>
                <select
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] shadow-xs cursor-pointer"
                >
                  <option value="0">เอกสารทั่วไปประจำรายวิชา (Syllabus, เกณฑ์คะแนน ฯลฯ)</option>
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={String(w)}>
                      สัปดาห์ที่ {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  คำอธิบายเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เช่น ใบงานสำหรับทำในห้องเรียน ส่งภายในเวลา 16:00 น."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] shadow-xs resize-none"
                />
              </div>

              {/* Drag & Drop File Zone */}
              <div>
                <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  ไฟล์เอกสาร / สื่อการสอน <span className="text-rose-500">*</span>
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isUploading) setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (isUploading) return;
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  onClick={() => {
                    if (!isUploading) fileInputRef.current?.click();
                  }}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-[#7749BC] bg-purple-50/50 dark:bg-purple-950/40 scale-[1.01]'
                      : 'border-neutral-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-neutral-50/60 dark:bg-slate-800/40'
                  } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.zip,.rar,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <div className="w-9 h-9 mx-auto rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center mb-1.5">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-neutral-800 dark:text-neutral-200">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    รองรับ PDF, PPTX, DOCX, XLSX, ZIP, รูปภาพ (ขนาดสูงสุด 50MB)
                  </p>
                  {selectedFile && (
                    <div className="mt-2.5 text-xs font-semibold text-[#7749BC] dark:text-purple-400 bg-purple-100/60 dark:bg-purple-950/60 py-1.5 px-3 rounded-xl inline-block max-w-full truncate">
                      ไฟล์ที่เลือก: {selectedFile.name} ({formatBytes(selectedFile.size)})
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-5 py-2 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white font-bold flex items-center gap-2 shadow-md shadow-purple-900/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังอัปโหลดไปยังคลาวด์...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>ยืนยันการอัปโหลด</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
