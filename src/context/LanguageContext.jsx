import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "../lib/i18n.js";

const LanguageContext = createContext({});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem("cafeteria-language") || "en",
  );

  useEffect(() => {
    localStorage.setItem("cafeteria-language", language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key) => translations[language]?.[key] || key,
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
