import { create } from "zustand";

export interface IntegrationsState {
  slackConnected: boolean;
  gmailConnected: boolean;
  setSlackConnected: (connected: boolean) => void;
  setGmailConnected: (connected: boolean) => void;
}

export const useIntegrationsStore = create<IntegrationsState>((set) => ({
  slackConnected: false,
  gmailConnected: false,
  setSlackConnected: (connected) => set({ slackConnected: connected }),
  setGmailConnected: (connected) => set({ gmailConnected: connected }),
}));
