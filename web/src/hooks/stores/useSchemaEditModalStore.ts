import { create } from 'zustand';

type SchemaEditModalStore = {
  showSchemaEditModal: boolean;
  setShowSchemaEditModal: (show: boolean) => void;
};

export const useSchemaEditModalStore = create<SchemaEditModalStore>((set) => ({
  showSchemaEditModal: false,
  setShowSchemaEditModal: (show) => set({ showSchemaEditModal: show }),
}));
