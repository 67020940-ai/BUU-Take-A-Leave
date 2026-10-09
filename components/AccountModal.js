'use client';

import { useState, useRef } from 'react';
import { X, User, Mail, Phone, GraduationCap, Building2, ShieldCheck, Check, Save, Camera, Upload } from 'lucide-react';

export default function AccountModal({ isOpen, onClose, user }) {
  const [email, setEmail] = useState(user?.email || '67020381@go.buu.ac.th');
  const [phone, setPhone] = useState(user?.phone || '081-234-5678');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatar(url);
    }
  }

  const isTeacher = user?.role === 'teacher';
  const name = user?.name || (isTeacher ? 'ผศ.ดร.อาจารย์ ผู้สอน' : 'สมชาย สายเสมอ');
  const code = user?.studentCode || (isTeacher ? 'อาจารย์ประจำภาควิชา' : '67020381');
  const faculty = user?.faculty || 'คณะวิทยาการสารสนเทศ';
  const major = user?.major || (isTeacher ? 'สาขาวิทยาการคอมพิวเตอร์' : 'สาขาวิทยาการคอมพิวเตอร์');
  const statusLabel = isTeacher ? 'อาจารย์ประจำการ' : 'นิสิตปัจจุบัน';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        <div className="p-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">ข้อมูลบัญชีผู้ใช้</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">โปรไฟล์และข้อมูลการติดต่อส่วนบุคคล</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs text-neutral-700 dark:text-neutral-300">
          {/* Profile Picture Upload Section */}
          <div className="flex flex-col items-center justify-center space-y-2 pb-2">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center shadow-md">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black text-[#7749BC] dark:text-purple-300">
                    {name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[#7749BC] hover:bg-[#653ba6] text-white shadow-md active:scale-95 transition-all cursor-pointer"
                title="เปลี่ยนรูปโปรไฟล์"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              คลิกที่กล้องเพื่อเปลี่ยนรูปประจำตัว
            </p>
          </div>

          {/* Readonly Academic Info */}
          <div className="p-4 rounded-2xl bg-neutral-50/80 dark:bg-slate-800/50 border border-neutral-200/80 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">ชื่อ-นามสกุล</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">{isTeacher ? 'ตำแหน่ง' : 'รหัสนิสิต'}</span>
              <span className="font-mono font-bold text-[#7749BC] dark:text-purple-300">{code}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">คณะ</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">{faculty}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">{isTeacher ? 'ภาควิชา' : 'สาขาวิชา'}</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">{major}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">สถานะผู้ใช้งาน</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> {statusLabel}
              </span>
            </div>
          </div>

          {/* Editable Contact Info */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                อีเมลติดต่อ
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC]"
                  placeholder="name@go.buu.ac.th"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                เบอร์โทรศัพท์ติดต่อ
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC]"
                  placeholder="08x-xxx-xxxx"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ปิด
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/20 transition-all cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกแล้ว</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูล</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
