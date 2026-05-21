import React, { createContext, useContext, useState } from "react";
import Toast, { ToastType } from "../components/Toast";

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextData {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextData>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "", type: "info" });

  const showToast = (message: string, type: ToastType = "info", duration?: number) => {
    setToast({ visible: true, message, type, duration });
  };

  const hideToast = () => setToast((prev) => ({ ...prev, visible: false }));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
