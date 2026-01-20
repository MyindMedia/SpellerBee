import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  childName: string;
  hasSeenTutorial: boolean;
  setChildName: (name: string) => void;
  setHasSeenTutorial: (seen: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      childName: "",
      hasSeenTutorial: false,
      setChildName: (name) => set({ childName: name }),
      setHasSeenTutorial: (seen) => set({ hasSeenTutorial: seen }),
    }),
    {
      name: 'speller-bee-storage',
    }
  )
);
