import { create } from 'zustand';

type DeleteSchemaVersionModalStore = {
  showDeleteSchemaVersionModal: boolean;
  setShowDeleteSchemaVersionModal: (show: boolean) => void;
};

export const useDeleteSchemaVersionModalStore = create<DeleteSchemaVersionModalStore>((set) => ({
  showDeleteSchemaVersionModal: false,
  setShowDeleteSchemaVersionModal: (show) => set({ showDeleteSchemaVersionModal: show }),
}));
