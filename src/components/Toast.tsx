import React from 'react';
import type { Toast as ToastType } from '../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-modal animate-in slide-in-from-bottom-5 duration-200 ${
              isSuccess
                ? 'bg-surface border-emerald-300 text-charcoal'
                : isError
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-surface border-border text-charcoal'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : isError ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-primary shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 text-charcoal-muted hover:text-charcoal rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
