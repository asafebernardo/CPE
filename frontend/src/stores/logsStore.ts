import { create } from 'zustand';
import type { LogEntryDto } from '@aerobrry/shared';

interface LogsState {
  entries: LogEntryDto[];
  total: number;
  setEntries: (entries: LogEntryDto[], total: number) => void;
  addEntry: (entry: LogEntryDto) => void;
}

export const useLogsStore = create<LogsState>((set) => ({
  entries: [],
  total: 0,
  setEntries: (entries, total) => set({ entries, total }),
  addEntry: (entry) =>
    set((state) => ({
      entries: [entry, ...state.entries].slice(0, 100),
      total: state.total + 1,
    })),
}));
