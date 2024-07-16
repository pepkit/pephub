import { create } from 'zustand';

type ProjectPageView = 'samples' | 'subsamples' | 'config';
type ProjectPageViewStore = {
  pageView: ProjectPageView;
  setPageView: (pageView: ProjectPageView) => void;
};

export const useProjectPageView = create<ProjectPageViewStore>((set) => ({
  pageView: 'samples',
  setPageView: (pageView: ProjectPageView) => set({ pageView }),
}));
