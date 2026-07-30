import { createContext } from 'react';

export const AppContext = createContext({
  session: null,
  profile: null,
  language: 'en',
  setLanguage: () => {},
  fetchProfile: () => {},
  handleLogout: () => {},
  refreshAppKeys: () => {},
  appKeysSource: 'System',
});
