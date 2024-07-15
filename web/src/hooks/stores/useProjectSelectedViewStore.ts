import { create } from 'zustand';

type ProjectSelectedViewStore = {
  view: string | undefined;
  setView: (pageView: string | undefined) => void;
};

export const useProjectSelectedView = create<ProjectSelectedViewStore>((set) => ({
  view: undefined,
  setView: (view: string | undefined) => set({ view }),
}));
