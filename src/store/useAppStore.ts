import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  childName: string;
  studentId: string | null;
  hasSeenTutorial: boolean;
  setChildName: (name: string) => void;
  setStudentId: (id: string | null) => void;
  setHasSeenTutorial: (seen: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      childName: "",
      studentId: null,
      hasSeenTutorial: false,
      setChildName: (name) => set({ childName: name }),
      setStudentId: (id) => set({ studentId: id }),
      setHasSeenTutorial: (seen) => set({ hasSeenTutorial: seen }),
    }),
    {
      name: 'speller-bee-storage',
    }
  )
);
