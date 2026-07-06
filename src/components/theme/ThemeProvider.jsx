import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const themes = {
  "pcw-dark": {
    name: "PCW Dark",
    colors: {
      "--bg-primary": "#0a0a0a",
      "--bg-secondary": "#0f0f0f",
      "--bg-tertiary": "#1a1a1a",
      "--text-primary": "#ffffff",
      "--text-secondary": "#a0a0a0",
      "--accent-primary": "#8b3dff",
      "--accent-secondary": "#dc2626",
    },
  },
  "pcw-neon": {
    name: "PCW Neon",
    colors: {
      "--bg-primary": "#0a0014",
      "--bg-secondary": "#12001f",
      "--bg-tertiary": "#1a0030",
      "--text-primary": "#ffffff",
      "--text-secondary": "#c0a0ff",
      "--accent-primary": "#ff00ff",
      "--accent-secondary": "#00ffff",
    },
  },
  "performance": {
    name: "Performance Center",
    colors: {
      "--bg-primary": "#0d1117",
      "--bg-secondary": "#161b22",
      "--bg-tertiary": "#21262d",
      "--text-primary": "#f0f6fc",
      "--text-secondary": "#8b949e",
      "--accent-primary": "#238636",
      "--accent-secondary": "#1f6feb",
    },
  },
  "classic-white": {
    name: "Classic White",
    colors: {
      "--bg-primary": "#ffffff",
      "--bg-secondary": "#f5f5f5",
      "--bg-tertiary": "#e5e5e5",
      "--text-primary": "#1a1a1a",
      "--text-secondary": "#666666",
      "--accent-primary": "#8b3dff",
      "--accent-secondary": "#dc2626",
    },
  },
  "high-contrast": {
    name: "High Contrast",
    colors: {
      "--bg-primary": "#000000",
      "--bg-secondary": "#000000",
      "--bg-tertiary": "#1a1a1a",
      "--text-primary": "#ffffff",
      "--text-secondary": "#ffff00",
      "--accent-primary": "#00ff00",
      "--accent-secondary": "#ff0000",
    },
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("pcw-dark");

  useEffect(() => {
    // Load saved theme
    const loadTheme = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.theme) {
          setTheme(user.theme);
        }
      } catch (e) {
        // Use default
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    // Apply theme CSS variables
    const themeConfig = themes[theme];
    if (themeConfig) {
      Object.entries(themeConfig.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
      
      // Apply dark/light mode class to html element for Tailwind
      if (theme === "classic-white") {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        document.body.style.backgroundColor = themeConfig.colors["--bg-primary"];
        document.body.style.color = themeConfig.colors["--text-primary"];
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        document.body.style.backgroundColor = themeConfig.colors["--bg-primary"];
        document.body.style.color = themeConfig.colors["--text-primary"];
      }
    }
  }, [theme]);

  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    try {
      await base44.auth.updateMe({ theme: newTheme });
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 mb-2">Theme</p>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(themes).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className={`p-3 rounded-lg border transition-all text-left ${
              theme === key
                ? "border-purple-500 bg-purple-900/20"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ background: config.colors["--accent-primary"] }}
              />
              <div
                className="w-4 h-4 rounded-full"
                style={{ background: config.colors["--accent-secondary"] }}
              />
            </div>
            <p className="text-xs text-white">{config.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}