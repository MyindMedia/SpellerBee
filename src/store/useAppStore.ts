import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  childName: string;
  parentId: string | null; // If logged in as parent
  hasSeenTutorial: boolean;
  setChildName: (name: string) => void;
  setParentId: (id: string | null) => void;
  setHasSeenTutorial: (seen: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      childName: "",
      parentId: null,
      hasSeenTutorial: false,
      setChildName: (name) => set({ childName: name }),
      setParentId: (id) => set({ parentId: id }),
      setHasSeenTutorial: (seen) => set({ hasSeenTutorial: seen }),
    }),
    {
      name: 'speller-bee-storage',
    }
  )
);
