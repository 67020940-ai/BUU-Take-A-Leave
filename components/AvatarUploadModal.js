'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Camera, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { getUserAvatarKey } from '@/lib/ui';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

export default function AvatarUploadModal({ isOpen, onClose, user, onAvatarUpdated }) {
  const [mounted, setMounted] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(user?.avatar || null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const storageKey = getUserAvatarKey(user);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync current avatar when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      // Check localStorage first, then fallback to user.avatar
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          setCurrentAvatar(stored);
        } else if (user?.avatar) {
          setCurrentAvatar(user.avatar);
        } else {
          setCurrentAvatar(null);
        }
      } catch {
        setCurrentAvatar(user?.avatar || null);
      }
    }
  }, [isOpen, storageKey, user]);

  // Clean up preview object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen || !mounted) return null;

  function validateFile(file) {
    if (!file) return 'กรุณาเลือกไฟล์รูปภาพ';

    // File type validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) || !ALLOWED_MIME.includes(file.type)) {
      return 'รูปแบบไฟล์ไม่ถูกต้อง อนุญาตเฉพาะไฟล์ .jpg, .jpeg, .png, .webp เท่านั้น';
    }

    // File size validation (max 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return `ขนาดไฟล์เกินกำหนด (${(file.size / (1024 * 1024)).toFixed(2)}MB) อนุญาตสูงสุดไม่เกิน 5MB`;
    }

    return null;
  }

  function handleFileSelect(file) {
    if (!file) return;

    setErrorMessage('');
    setSuccessMessage('');

    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Set selected file and create live preview
    setSelectedFile(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreview = URL.createObjectURL(file);
    setPreviewUrl(newPreview);
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!isUploading) setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  async function optimizeImageForUpload(file) {
    if (typeof window === 'undefined' || !window.Image || !document.createElement) {
      return file;
    }

    return new Promise((resolve) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            try {
              const MAX_DIM = 800;
              let width = img.width;
              let height = img.height;

              if (width <= MAX_DIM && height <= MAX_DIM && file.size <= 250 * 1024) {
                resolve(file);
                return;
              }

              if (width > height) {
                if (width > MAX_DIM) {
                  height = Math.round((height * MAX_DIM) / width);
                  width = MAX_DIM;
                }
              } else {
                if (height > MAX_DIM) {
                  width = Math.round((width * MAX_DIM) / height);
                  height = MAX_DIM;
                }
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);

              const isPng = file.type === 'image/png';
              const mime = isPng ? 'image/png' : 'image/jpeg';
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    resolve(file);
                    return;
                  }
                  const newExt = isPng ? '.png' : '.jpg';
                  const baseName = file.name.replace(/\.[^/.]+$/, '');
                  const optimizedFile = new File([blob], `${baseName}${newExt}`, { type: mime });
                  resolve(optimizedFile);
                },
                mime,
                0.88
              );
            } catch {
              resolve(file);
            }
          };
          img.onerror = () => resolve(file);
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
      } catch {
        resolve(file);
      }
    });
  }

  async function handleUpload() {
    if (!selectedFile || isUploading) return;

    // Check internet connection
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorMessage('ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบสัญญาณเครือข่ายแล้วลองใหม่อีกครั้ง');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const fileToUpload = await optimizeImageForUpload(selectedFile);
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('เซสชันการใช้งานหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
        }
        throw new Error(data?.error || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }

      const newAvatarUrl = data.avatar;

      // 1. Update localStorage for instant offline & page reload preservation
      try {
        if (newAvatarUrl) {
          localStorage.setItem(storageKey, newAvatarUrl);
        }
      } catch {}

      // 2. Dispatch event to immediately update all avatar components across the entire app
      window.dispatchEvent(
        new CustomEvent('buu_avatar_updated', {
          detail: { key: storageKey, avatar: newAvatarUrl },
        })
      );

      // 3. Callback to parent component
      if (onAvatarUpdated) {
        onAvatarUpdated(newAvatarUrl);
      }

      setCurrentAvatar(newAvatarUrl);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      setSuccessMessage('อัปโหลดและอัปเดตรูปโปรไฟล์สำเร็จเรียบร้อยแล้ว');

      // Close modal smoothly after brief success feedback
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Upload avatar error:', err);
      setErrorMessage(err.message || 'ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    if (isUploading) return;

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/avatar', {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'ไม่สามารถลบรูปโปรไฟล์ได้');
      }

      try {
        localStorage.removeItem(storageKey);
      } catch {}

      window.dispatchEvent(
        new CustomEvent('buu_avatar_updated', {
          detail: { key: storageKey, avatar: null },
        })
      );

      if (onAvatarUpdated) {
        onAvatarUpdated(null);
      }

      setCurrentAvatar(null);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      setSuccessMessage('ลบรูปโปรไฟล์และคืนค่าเริ่มต้นสำเร็จ');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการลบรูปภาพ');
    } finally {
      setIsUploading(false);
    }
  }

  const userDisplayName = user?.name || 'ผู้ใช้งาน';
  const userInitials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  const displayAvatar = previewUrl || currentAvatar;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto flex flex-col">
        {/* Modal Header */}
        <div className="shrink-0 px-6 py-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                เปลี่ยนรูปโปรไฟล์
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                อัปโหลดรูปภาพใหม่ที่ผูกกับบัญชีผู้ใช้
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isUploading}
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-neutral-700 dark:text-neutral-300">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <div className="text-xs font-semibold">{successMessage}</div>
            </div>
          )}

          {/* Avatar Preview Section */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center shadow-lg relative">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-[#7749BC] dark:text-purple-300">
                    {userInitials || <ImageIcon className="w-8 h-8 opacity-60" />}
                  </span>
                )}

                {/* Loading Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1 animate-in fade-in">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
                    <span className="text-[10px] font-bold">กำลังอัปโหลด...</span>
                  </div>
                )}
              </div>

              {previewUrl && (
                <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-bounce">
                  ตัวอย่างใหม่
                </div>
              )}
            </div>

            <p className="mt-3 text-xs font-bold text-neutral-800 dark:text-neutral-200">
              {userDisplayName}
            </p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              {user?.email || 'บัญชีผู้ใช้งาน'}
            </p>
          </div>

          {/* Drag & Drop File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleInputChange}
              disabled={isUploading}
              className="hidden"
            />
            <div className="w-10 h-10 mx-auto rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              คลิกเพื่อเลือกรูป หรือลากไฟล์มาวางที่นี่
            </p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
              รองรับไฟล์ .jpg, .jpeg, .png, .webp (ขนาดสูงสุดไม่เกิน 5MB)
            </p>
            {selectedFile && (
              <div className="mt-2 text-xs font-semibold text-[#7749BC] dark:text-purple-400 bg-purple-100/60 dark:bg-purple-950/60 py-1 px-3 rounded-lg inline-block max-w-full truncate">
                ไฟล์ที่เลือก: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="shrink-0 px-6 py-4 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-neutral-50/40 dark:bg-slate-900/40">
          <div>
            {currentAvatar && !previewUrl && !isUploading && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ใช้รูปเริ่มต้น</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
              className="px-5 py-2 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white font-bold flex items-center gap-2 shadow-md shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>อัปโหลดรูปภาพ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
