import { create } from "zustand";

export interface IntegrationsState {
  slackConnected: boolean;
  gmailConnected: boolean;
  jiraConnected: boolean;
  notionConnected: boolean;
  setSlackConnected: (connected: boolean) => void;
  setGmailConnected: (connected: boolean) => void;
  setJiraConnected: (connected: boolean) => void;
  setNotionConnected: (connected: boolean) => void;
}

export const useIntegrationsStore = create<IntegrationsState>((set) => ({
  slackConnected: false,
  gmailConnected: false,
  jiraConnected: false,
  notionConnected: false,
  setSlackConnected: (connected) => set({ slackConnected: connected }),
  setGmailConnected: (connected) => set({ gmailConnected: connected }),
  setJiraConnected: (connected) => set({ jiraConnected: connected }),
  setNotionConnected: (connected) => set({ notionConnected: connected }),
}));
