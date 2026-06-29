import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CookiePreferences {
  essential: true; // Always on
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

interface CookieConsentContextType {
  preferences: CookiePreferences | null;
  showBanner: boolean;
  preferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (analytics: boolean, marketing: boolean) => void;
}

const STORAGE_KEY = "cookie-consent";

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPreferences(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
  };

  const acceptAll = () => {
    persist({ essential: true, analytics: true, marketing: true, timestamp: new Date().toISOString() });
    setPreferencesOpen(false);
  };

  const rejectAll = () => {
    persist({ essential: true, analytics: false, marketing: false, timestamp: new Date().toISOString() });
    setPreferencesOpen(false);
  };

  const savePreferences = (analytics: boolean, marketing: boolean) => {
    persist({ essential: true, analytics, marketing, timestamp: new Date().toISOString() });
    setPreferencesOpen(false);
  };

  return (
    <CookieConsentContext.Provider
      value={{
        preferences,
        showBanner: preferences === null,
        preferencesOpen,
        openPreferences: () => setPreferencesOpen(true),
        closePreferences: () => setPreferencesOpen(false),
        acceptAll,
        rejectAll,
        savePreferences,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
};
