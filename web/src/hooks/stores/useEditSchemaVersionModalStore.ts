import { create } from 'zustand';

type EditSchemaVersionModalStore = {
  showEditSchemaVersionModal: boolean;
  setShowEditSchemaVersionModal: (show: boolean) => void;
};

export const useEditSchemaVersionModalStore = create<EditSchemaVersionModalStore>((set) => ({
  showEditSchemaVersionModal: false,
  setShowEditSchemaVersionModal: (show) => set({ showEditSchemaVersionModal: show }),
}));
