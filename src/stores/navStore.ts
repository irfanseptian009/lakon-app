import { create } from 'zustand';

export type Workspace = 'daily' | 'travel' | 'work';

export const WS_START: Record<Workspace, string> = {
  daily: 'today',
  travel: 'home',
  work: 'whome',
};

interface NavState {
  ws: Workspace;
  tab: string;
  settingsOpen: boolean;
  setWs: (ws: Workspace) => void;
  setTab: (tab: string) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useNav = create<NavState>((set) => ({
  ws: 'daily',
  tab: WS_START.daily,
  settingsOpen: false,
  setWs: (ws) => set({ ws, tab: WS_START[ws] }),
  setTab: (tab) => set({ tab }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
