import { useState } from 'react';

export type Toast = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export type ToasterToast = Toast & {
  id: string;
};

export function useToast() {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);

  const toast = ({ ...props }: Toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...props, id };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    return {
      id,
      dismiss: () => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
      },
      update: (props: ToasterToast) => {
        setToasts((prevToasts) =>
          prevToasts.map((toast) => (toast.id === id ? { ...toast, ...props } : toast))
        );
      },
    };
  };

  const dismiss = (toastId?: string) => {
    setToasts((prevToasts) => 
      toastId 
        ? prevToasts.filter((toast) => toast.id !== toastId)
        : []
    );
  };

  return {
    toast,
    dismiss,
    toasts,
  };
}