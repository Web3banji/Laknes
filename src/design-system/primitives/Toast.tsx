import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Copy, Check, Send, Award, Wallet, ArrowUpRight } from 'lucide-react';
import { formatAddress } from '../../core/network/config';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  icon?: React.ReactNode;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  // Specific event helpers matching Prompt 4
  questCompleted: (questTitle: string) => void;
  addressCopied: (address: string) => void;
  walletConnected: (address: string) => void;
  txSubmitted: (txHash?: string) => void;
  txConfirmed: (txHash?: string) => void;
  txFailed: (reason?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 3500, icon }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration, icon };

      setToasts((prev) => {
        // Keep at most 3 visible at once to avoid crowding
        const updated = [...prev.slice(-2), newToast];
        return updated;
      });

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  // 1. Successful quest completion
  const questCompleted = useCallback(
    (questTitle: string) => {
      showToast({
        type: 'success',
        title: 'Quest Completed',
        message: `You completed "${questTitle}". Verification recorded.`,
        icon: <Award className="w-4 h-4 text-emerald-600 shrink-0" />,
      });
    },
    [showToast]
  );

  // 2. Copied address
  const addressCopied = useCallback(
    (address: string) => {
      showToast({
        type: 'info',
        title: 'Address Copied',
        message: `${formatAddress(address, 8, 6)} copied to clipboard.`,
        duration: 2500,
        icon: <Check className="w-4 h-4 text-neutral-800 shrink-0" />,
      });
    },
    [showToast]
  );

  // 3. Successful wallet connection
  const walletConnected = useCallback(
    (address: string) => {
      showToast({
        type: 'success',
        title: 'Wallet Connected',
        message: `Connected to Elysium Mainnet with ${formatAddress(address, 6, 4)}.`,
        icon: <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />,
      });
    },
    [showToast]
  );

  // 4. Transaction submitted
  const txSubmitted = useCallback(
    (txHash?: string) => {
      showToast({
        type: 'info',
        title: 'Transaction Submitted',
        message: txHash
          ? `Broadcasting to Elysium nodes (${formatAddress(txHash, 6, 4)})...`
          : 'Broadcasting transaction to Elysium consensus...',
        icon: <Send className="w-4 h-4 text-neutral-800 shrink-0" />,
      });
    },
    [showToast]
  );

  // 5. Transaction confirmed
  const txConfirmed = useCallback(
    (txHash?: string) => {
      showToast({
        type: 'success',
        title: 'Transaction Confirmed',
        message: txHash
          ? `Included on-chain: ${formatAddress(txHash, 6, 4)}.`
          : 'Successfully confirmed on Elysium Mainnet.',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
      });
    },
    [showToast]
  );

  // 6. Transaction failed
  const txFailed = useCallback(
    (reason?: string) => {
      showToast({
        type: 'error',
        title: 'Transaction Failed',
        message: reason || 'Execution reverted on-chain. Please verify gas balance.',
        duration: 5000,
        icon: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
      });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        questCompleted,
        addressCopied,
        walletConnected,
        txSubmitted,
        txConfirmed,
        txFailed,
      }}
    >
      {children}

      {/* Accessible, unobtrusive toast viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-60 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const defaultIcons = {
            success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
            error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
            info: <Info className="w-4 h-4 text-neutral-800 shrink-0" />,
          };

          return (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto flex items-start justify-between gap-3 p-3.5 bg-white rounded-xl border border-neutral-200/90 shadow-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5">{toast.icon || defaultIcons[toast.type]}</span>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-950">
                    {toast.title}
                  </h4>
                  {toast.message && (
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      {toast.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded cursor-pointer shrink-0 transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
