'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Camera,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Phone,
  Mail,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  Sparkles,
  UserCheck,
  Shield,
} from 'lucide-react';
import { getUserAvatarKey } from '@/lib/ui';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

export function calculateAcademicYearFromStudentId(studentId) {
  if (!studentId) return 'ชั้นปีที่ 1';
  const match = String(studentId).trim().match(/^(\d{2})/);
  if (!match) return 'ชั้นปีที่ 1';
  const entryYear = parseInt(match[1], 10);
  const diff = 69 - entryYear + 1; // 2569
  if (diff <= 1) return 'ชั้นปีที่ 1';
  if (diff === 2) return 'ชั้นปีที่ 2';
  if (diff === 3) return 'ชั้นปีที่ 3';
  if (diff === 4) return 'ชั้นปีที่ 4';
  return 'ชั้นปีที่ 5+';
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  initialTab = 'profile',
  onUserUpdated,
  onAvatarUpdated,
}) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'avatar'

  // Form Fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    studentId: '',
    personnelId: '',
    faculty: 'คณะวิทยาการสารสนเทศ',
    department: 'ภาควิชาสารสนเทศศึกษา',
    academicYear: 'ชั้นปีที่ 3',
    advisorName: '',
    bio: '',
  });

  // Avatar State
  const [currentAvatar, setCurrentAvatar] = useState(user?.avatar || null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Saving Status
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const editedFieldsRef = useRef(new Set());

  const storageKey = getUserAvatarKey(user);
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';

  const studentYearCalculated = useMemo(() => {
    return calculateAcademicYearFromStudentId(formData.studentId || user?.studentId || user?.email);
  }, [formData.studentId, user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch or initialize profile data whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    editedFieldsRef.current.clear();
    setErrorMessage('');
    setSuccessMessage('');
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    // Initialize from user prop
    const nameParts = (user?.name || '').trim().split(' ');
    const initialFirst = user?.firstName || nameParts[0] || '';
    const initialLast = user?.lastName || nameParts.slice(1).join(' ') || '';

    setFormData({
      firstName: initialFirst,
      lastName: initialLast,
      phone: user?.phone || '',
      studentId: user?.studentId || (isStudent ? user?.id?.replace('student-', '') : '') || '',
      personnelId: user?.personnelId || (isTeacher ? user?.id : '') || '',
      faculty: user?.faculty || 'คณะวิทยาการสารสนเทศ',
      department: user?.department || user?.major || 'ภาควิชาสารสนเทศศึกษา',
      academicYear: user?.academicYear || 'ชั้นปีที่ 3',
      advisorName: user?.advisorName || (isStudent ? 'ดร.ธีรเดช มานะกุล' : ''),
      bio: user?.bio || '',
    });

    // Check localStorage avatar first
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setCurrentAvatar(stored);
      else if (user?.avatar) setCurrentAvatar(user.avatar);
      else setCurrentAvatar(null);
    } catch {
      setCurrentAvatar(user?.avatar || null);
    }

    // Fetch freshest data from DB
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          const u = data.user;
          const uParts = (u.name || '').trim().split(' ');
          setFormData((prev) => {
            const next = { ...prev };
            const edited = editedFieldsRef.current;
            if (!edited.has('firstName')) next.firstName = u.firstName || uParts[0] || prev.firstName;
            if (!edited.has('lastName')) next.lastName = u.lastName || uParts.slice(1).join(' ') || prev.lastName;
            if (!edited.has('phone')) next.phone = u.phone || prev.phone;
            if (!edited.has('studentId')) next.studentId = u.studentId || prev.studentId;
            if (!edited.has('personnelId')) next.personnelId = u.personnelId || prev.personnelId;
            if (!edited.has('faculty')) next.faculty = u.faculty || prev.faculty;
            if (!edited.has('department')) next.department = u.department || u.major || prev.department;
            if (!edited.has('academicYear')) next.academicYear = u.academicYear || prev.academicYear;
            if (!edited.has('advisorName')) next.advisorName = u.advisorName || prev.advisorName;
            if (!edited.has('bio')) next.bio = u.bio || prev.bio;
            return next;
          });
          if (u.avatar) {
            setCurrentAvatar(u.avatar);
            try {
              localStorage.setItem(storageKey, u.avatar);
            } catch {}
          }
        }
      })
      .catch(() => {});
  }, [isOpen, storageKey, user, isStudent, isTeacher]);

  if (!isOpen || !mounted) return null;

  function handleInputChange(e) {
    const { name, value } = e.target;
    editedFieldsRef.current.add(name);
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // --- Avatar handling ---
  function validateFile(file) {
    if (!file) return 'กรุณาเลือกไฟล์รูปภาพ';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) || !ALLOWED_MIME.includes(file.type)) {
      return 'รูปแบบไฟล์ไม่ถูกต้อง อนุญาตเฉพาะไฟล์ .jpg, .jpeg, .png, .webp เท่านั้น';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `ขนาดไฟล์เกินกำหนด (${(file.size / (1024 * 1024)).toFixed(2)}MB) อนุญาตสูงสุดไม่เกิน 5MB`;
    }
    return null;
  }

  function handleFileSelect(file) {
    if (!file) return;
    setErrorMessage('');
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleAvatarUpload() {
    if (!selectedFile || isUploadingAvatar) return;
    setIsUploadingAvatar(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const form = new FormData();
      form.append('file', selectedFile);

      const res = await fetch('/api/avatar', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อัปโหลดรูปภาพไม่สำเร็จ');

      const newAvatarUrl = data.avatar;
      setCurrentAvatar(newAvatarUrl);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      try {
        localStorage.setItem(storageKey, newAvatarUrl);
      } catch {}

      window.dispatchEvent(
        new CustomEvent('buu_avatar_updated', {
          detail: { key: storageKey, avatar: newAvatarUrl },
        })
      );
      if (onAvatarUpdated) onAvatarUpdated(newAvatarUrl);

      setSuccessMessage('อัปเดตรูปโปรไฟล์สำเร็จเรียบร้อยแล้ว');
    } catch (err) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    if (isUploadingAvatar) return;
    setIsUploadingAvatar(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/avatar', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ลบรูปโปรไฟล์ไม่สำเร็จ');

      try {
        localStorage.removeItem(storageKey);
      } catch {}

      window.dispatchEvent(
        new CustomEvent('buu_avatar_updated', {
          detail: { key: storageKey, avatar: null },
        })
      );
      if (onAvatarUpdated) onAvatarUpdated(null);

      setCurrentAvatar(null);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setSuccessMessage('คืนค่ารูปโปรไฟล์เริ่มต้นเรียบร้อยแล้ว');
    } catch (err) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการลบรูปภาพ');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  // --- Save full profile ---
  async function handleSaveProfile(e) {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // If there is an unsaved selected avatar image, upload it first
      let avatarToSave = currentAvatar;
      if (selectedFile) {
        const form = new FormData();
        form.append('file', selectedFile);
        const avatarRes = await fetch('/api/avatar', { method: 'POST', body: form });
        const avatarData = await avatarRes.json();
        if (avatarRes.ok && avatarData.avatar) {
          avatarToSave = avatarData.avatar;
          setCurrentAvatar(avatarToSave);
          setSelectedFile(null);
          try {
            localStorage.setItem(storageKey, avatarToSave);
          } catch {}
          window.dispatchEvent(
            new CustomEvent('buu_avatar_updated', {
              detail: { key: storageKey, avatar: avatarToSave },
            })
          );
        }
      }

      const payload = {
        ...formData,
        academicYear: isStudent ? studentYearCalculated : formData.academicYear,
        avatar: avatarToSave,
      };

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกข้อมูลไม่สำเร็จ');

      setSuccessMessage('บันทึกข้อมูลส่วนตัวลงฐานข้อมูลเรียบร้อยแล้ว');

      // Dispatch global user updated event
      window.dispatchEvent(
        new CustomEvent('buu_user_updated', {
          detail: data.user,
        })
      );

      if (onUserUpdated) onUserUpdated(data.user);

      // Auto close after brief display
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('Save profile error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  }

  const userDisplayName =
    [formData.firstName, formData.lastName].filter(Boolean).join(' ') ||
    user?.name ||
    'ผู้ใช้งาน';

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
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="shrink-0 px-6 py-4 border-b border-neutral-100 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7749BC] text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>จัดการข้อมูลส่วนตัว (User Profile)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {isStudent ? 'นิสิต' : isTeacher ? 'อาจารย์' : 'ผู้ดูแลระบบ'}
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                แก้ไขข้อมูลส่วนตัว ข้อมูลการศึกษา และรูปประจำตัวในระบบ
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving || isUploadingAvatar}
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="shrink-0 px-6 pt-3 border-b border-neutral-200/80 dark:border-slate-800 flex items-center gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-[#7749BC] text-[#7749BC] dark:text-purple-300'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>ข้อมูลส่วนตัวและสังกัด</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('avatar')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'avatar'
                ? 'border-[#7749BC] text-[#7749BC] dark:text-purple-300'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>รูปโปรไฟล์</span>
            {previewUrl && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-neutral-700 dark:text-neutral-300">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <div className="text-xs font-semibold">{successMessage}</div>
            </div>
          )}

          {/* TAB 1: Profile Information (Read-Only Showcase) */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Profile summary card */}
              <div className="p-4 rounded-2xl bg-neutral-50/80 dark:bg-slate-800/50 border border-neutral-200/80 dark:border-slate-800 flex items-center gap-4">
                <div
                  onClick={() => setActiveTab('avatar')}
                  className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#7749BC] bg-purple-100 dark:bg-purple-950/80 text-[#7749BC] dark:text-purple-300 font-bold flex items-center justify-center shrink-0 cursor-pointer shadow-xs group relative"
                  title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
                >
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{userInitials}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {userDisplayName}
                    </h4>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                      {formData.studentId || formData.personnelId || user?.id || '-'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{user?.email || '-'}</span>
                  </p>
                </div>
              </div>

              {/* 1. Personal Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#7749BC]" />
                  <span>ข้อมูลทั่วไป</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                      ชื่อจริง
                    </label>
                    <div className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/60 text-xs font-semibold text-neutral-900 dark:text-neutral-100 shadow-2xs">
                      {formData.firstName || '-'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                      นามสกุล
                    </label>
                    <div className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/60 text-xs font-semibold text-neutral-900 dark:text-neutral-100 shadow-2xs">
                      {formData.lastName || '-'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                      เบอร์โทรศัพท์ติดต่อ
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <div className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/60 text-xs font-medium text-neutral-900 dark:text-neutral-100 shadow-2xs">
                        {formData.phone || 'ยังไม่ได้ระบุ'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                      อีเมลมหาวิทยาลัย (ล็อกอิน)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <div className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/60 text-xs font-mono text-neutral-700 dark:text-neutral-300 shadow-2xs">
                        {user?.email || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Academic / Faculty Details */}
              <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#7749BC]" />
                  <span>{isStudent ? 'ข้อมูลการศึกษาและสังกัด' : 'ข้อมูลตำแหน่งและสังกัด'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                      {isStudent ? 'รหัสนิสิต' : 'รหัสบุคลากร / อาจารย์'}
                    </label>
                    <div className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/60 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 shadow-2xs">
                      {isStudent ? (formData.studentId || user?.studentId || '-') : (formData.personnelId || user?.personnelId || user?.id || '-')}
                    </div>
                  </div>

                  {isStudent ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                          ชั้นปีการศึกษา
                        </label>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-normal">
                          (คำนวณจากรหัสนิสิต)
                        </span>
                      </div>
                      <div className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/60 text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between shadow-2xs select-none">
                        <span>{studentYearCalculated}</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 text-[10px] font-bold">
                          อัตโนมัติ
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                        ตำแหน่งทางวิชาการ
                      </label>
                      <div className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/60 text-xs font-medium text-neutral-900 dark:text-neutral-100 shadow-2xs">
                        {formData.bio || 'อาจารย์ประจำ'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                      คณะ
                    </label>
                    <div className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/60 text-xs font-medium text-neutral-900 dark:text-neutral-100 shadow-2xs">
                      {formData.faculty || 'คณะวิทยาการสารสนเทศ'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                      สาขาวิชา / ภาควิชา
                    </label>
                    <div className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/60 text-xs font-medium text-neutral-900 dark:text-neutral-100 shadow-2xs">
                      {formData.department || 'ภาควิชาสารสนเทศศึกษา'}
                    </div>
                  </div>
                </div>

                {isStudent && (
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                      อาจารย์ที่ปรึกษา (Advisor)
                    </label>
                    <div className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/60 text-xs font-medium text-neutral-900 dark:text-neutral-100 shadow-2xs">
                      {formData.advisorName || 'ดร.ธีรเดช มานะกุล'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Avatar Upload */}
          {activeTab === 'avatar' && (
            <div className="space-y-5">
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
                        {userInitials}
                      </span>
                    )}

                    {isUploadingAvatar && (
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
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isUploadingAvatar) setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (isUploadingAvatar) return;
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                onClick={() => {
                  if (!isUploadingAvatar) fileInputRef.current?.click();
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#7749BC] bg-purple-50/50 dark:bg-purple-950/40 scale-[1.01]'
                    : 'border-neutral-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-neutral-50/60 dark:bg-slate-800/40'
                } ${isUploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  disabled={isUploadingAvatar}
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
                  <div className="mt-3 text-xs font-semibold text-[#7749BC] dark:text-purple-400 bg-purple-100/60 dark:bg-purple-950/60 py-1.5 px-3 rounded-xl inline-block max-w-full truncate">
                    ไฟล์ที่เลือก: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </div>
                )}
              </div>

              {/* Reset Avatar Button */}
              {currentAvatar && !previewUrl && !isUploadingAvatar && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline inline-flex items-center gap-1.5 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ใช้รูปโปรไฟล์เริ่มต้น</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-neutral-50/70 dark:bg-slate-900/60">
          <button
            type="button"
            disabled={isSaving || isUploadingAvatar}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer text-xs"
          >
            ยกเลิก
          </button>

          <div className="flex items-center gap-2">
            {activeTab === 'avatar' && selectedFile && (
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={handleAvatarUpload}
                className="px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-950 hover:bg-purple-200 text-[#7749BC] dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>อัปโหลดรูปภาพ</span>
              </button>
            )}

            {activeTab === 'profile' ? (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-900/20 transition-all cursor-pointer"
              >
                <span>ปิดหน้าต่าง</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveProfile}
                className="px-5 py-2 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-900/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึกข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>บันทึกรูปโปรไฟล์</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
