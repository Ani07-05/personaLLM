import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ResearchPhase = 'idle' | 'planning' | 'searching' | 'reading' | 'synthesizing' | 'writing' | 'done' | 'error';

export interface ResearchStep {
  phase: ResearchPhase;
  message: string;
  timestamp: number;
}

interface ResearchState {
  phase: ResearchPhase;
  steps: ResearchStep[];
  query: string | null;
  result: string | null;
  error: string | null;

  startResearch: (query: string) => void;
  addStep: (phase: ResearchPhase, message: string) => void;
  setResult: (result: string) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useResearchStore = create<ResearchState>()(
  immer((set) => ({
    phase: 'idle',
    steps: [],
    query: null,
    result: null,
    error: null,

    startResearch: (query) =>
      set((state) => {
        state.phase = 'planning';
        state.steps = [];
        state.query = query;
        state.result = null;
        state.error = null;
      }),

    addStep: (phase, message) =>
      set((state) => {
        state.phase = phase;
        state.steps.push({ phase, message, timestamp: Date.now() });
      }),

    setResult: (result) =>
      set((state) => {
        state.phase = 'done';
        state.result = result;
      }),

    setError: (error) =>
      set((state) => {
        state.phase = 'error';
        state.error = error;
      }),

    reset: () =>
      set((state) => {
        state.phase = 'idle';
        state.steps = [];
        state.query = null;
        state.result = null;
        state.error = null;
      }),
  }))
);
