import { createContext, useCallback, useContext, useState } from 'react';
import { Text, View } from 'react-native';

import { useNavBarSpace } from '@/hooks/useNavBarSpace';

type ToastMessage = { id: number; text: string };

type ToastContextValue = {
  show: (text: string) => void;
};

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  // The floating nav is absolutely positioned, so it reserves no layout. The
  // toast has to clear it the same way every scrolling body does.
  const navBarSpace = useNavBarSpace();

  const show = useCallback((text: string) => {
    const id = ++nextId;
    setToast({ id, text });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <View className="absolute left-4 right-4 items-center" style={{ bottom: navBarSpace + 8, pointerEvents: 'none' }}>
          <View className="rounded-lg bg-card px-4 py-3 shadow-lg">
            <Text className="text-card-foreground">{toast.text}</Text>
          </View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
