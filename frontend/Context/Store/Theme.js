import React, { createContext, useMemo, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ThemeContext = createContext({
  mode: "light",
  isDark: false,
  setMode: () => {},
  toggleMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("app_theme_mode");
        if (stored === "dark" || stored === "light") {
          setMode(stored);
        }
      } catch (_e) {}
    })();
  }, []);

  const setPersistedMode = async (nextMode) => {
    setMode(nextMode);
    try {
      await AsyncStorage.setItem("app_theme_mode", nextMode);
    } catch (_e) {}
  };

  const value = useMemo(() => ({
    mode,
    isDark: mode === "dark",
    setMode: setPersistedMode,
    toggleMode: () => setPersistedMode(mode === "dark" ? "light" : "dark"),
  }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
