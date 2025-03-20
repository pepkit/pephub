import { create } from 'zustand';

type SchemaVersionModalStore = {
  showSchemaVersionModal: boolean;
  setShowSchemaVersionModal: (show: boolean) => void;
};

export const useSchemaVersionModalStore = create<SchemaVersionModalStore>((set) => ({
  showSchemaVersionModal: false,
  setShowSchemaVersionModal: (show) => set({ showSchemaVersionModal: show }),
}));
