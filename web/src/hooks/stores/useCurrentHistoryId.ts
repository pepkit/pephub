import { create } from 'zustand';

type ProjectHistoryStore = {
  currentHistoryId: number | null;
  setCurrentHistoryId: (projectHistoryId: number | null) => void;
};

export const useCurrentHistoryId = create<ProjectHistoryStore>((set) => ({
  currentHistoryId: null,
  setCurrentHistoryId: (historyId: number | null) => set({ currentHistoryId: historyId }),
}));
