import { create } from 'zustand';

type StandardizeModalStore = {
  showStandardizeMetadataModal: boolean;
  setShowStandardizeMetadataModal: (show: boolean) => void;
};

export const useStandardizeModalStore = create<StandardizeModalStore>((set) => ({
  showStandardizeMetadataModal: false,
  setShowStandardizeMetadataModal: (show) => set({ showStandardizeMetadataModal: show }),
}));
