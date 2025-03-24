import { create } from 'zustand';

type CreateSchemaVersionModalStore = {
  showCreateSchemaVersionModal: boolean;
  setShowCreateSchemaVersionModal: (show: boolean) => void;
};

export const useCreateSchemaVersionModalStore = create<CreateSchemaVersionModalStore>((set) => ({
  showCreateSchemaVersionModal: false,
  setShowCreateSchemaVersionModal: (show) => set({ showCreateSchemaVersionModal: show }),
}));
