import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

export function showToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = (message, type = 'success') => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    const handler = (e) => addToast(e.detail.message, e.detail.type || 'warning');
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, []);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  const icons = { success: <CheckCircle2 size={18} className="text-emerald-600" />, error: <XCircle size={18} className="text-red-500" />, warning: <ShieldAlert size={18} className="text-amber-600" /> };
  const bg = { success: 'border-emerald-200 bg-emerald-50 text-emerald-800', error: 'border-red-200 bg-red-50 text-red-700', warning: 'border-amber-200 bg-amber-50 text-amber-800' };

  return (
    <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-slide-in ${bg[t.type] || bg.success}`}>
          {icons[t.type] || icons.success}
          <p className="flex-1 text-sm font-semibold">{t.message}</p>
          <button className="shrink-0 opacity-60 hover:opacity-100" onClick={() => remove(t.id)}><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}
