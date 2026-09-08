import React, { useState } from 'react';
import { ShieldCheck, X, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctPin: string;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  correctPin,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === (correctPin || '1234').trim()) {
      setError('');
      setPin('');
      onSuccess();
    } else {
      setError('รหัส Admin PIN ไม่ถูกต้อง!');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h3 className="text-xl font-bold mb-1">เข้าสู่ระบบผู้ดูแล (Admin)</h3>
          <p className="text-xs text-slate-400 mb-5">
            กรุณาระบุรหัสผ่าน Admin PIN เพื่อเข้าสู่แผงควบคุม
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError('');
              }}
              autoFocus
              placeholder="••••"
              className="w-full rounded-2xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />

            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-bold text-white shadow-lg transition"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
