import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext({ pushToast: () => {} });
let toastId = 0;

const typeClasses = {
  info: "bg-slate-900 text-slate-50 border-slate-800",
  success: "bg-emerald-600 text-white border-emerald-500",
  warning: "bg-amber-500 text-white border-amber-400",
  error: "bg-red-600 text-white border-red-500"
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const pushToast = (message, type = "info", duration = 3500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const value = useMemo(() => ({ pushToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-[320px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`border shadow-lg rounded-lg px-4 py-3 text-sm ${typeClasses[t.type] || typeClasses.info}`}
          >
            <div className="flex items-start gap-2">
              <span className="font-semibold capitalize">{t.type}</span>
              <span className="flex-1 text-left">{t.message}</span>
              <button
                aria-label="Close"
                className="text-xs opacity-70 hover:opacity-100"
                onClick={() => removeToast(t.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
