import { create } from 'zustand';

type SchemaVersionNumberStore = {
  schemaVersionNumber: string | undefined;
  setSchemaVersionNumber: (semanticVersion: string | undefined) => void;
};

export const useSchemaVersionNumber = create<SchemaVersionNumberStore>((set) => ({
  schemaVersionNumber: undefined,
  setSchemaVersionNumber: (semanticVersion: string | undefined) => set({ schemaVersionNumber: semanticVersion }),
}));
