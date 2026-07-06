import React, { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

const STORAGE_KEY = "pcw_install_dismissed";

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't hide if dismissed — let user manually see it or request again
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    // Also show banner after 3 seconds if install is available and not dismissed
    const timer = setTimeout(() => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Banner will auto-show when event fires
      }
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-2xl animate-in slide-in-from-bottom-4 fade-in"
      style={{
        background: "linear-gradient(135deg, #1a0a2e 0%, #0f0f0f 100%)",
        border: "1px solid rgba(139,61,255,0.5)",
        boxShadow: "0 0 40px rgba(139,61,255,0.25)",
      }}
    >
      {/* Logo */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0"
        style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}
      >
        <span className="text-sm font-black text-white">PCW</span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <p className="text-white font-bold text-base">Install PCW Academy</p>
        <p className="text-gray-400 text-sm mt-1">Quick access to your training schedule and notes</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
        <button
          onClick={handleInstall}
          disabled={installing}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold flex-shrink-0 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)", color: "#fff" }}
        >
          <Download className="w-4 h-4" />
          {installing ? "Installing..." : "Install"}
        </button>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="flex items-center justify-center px-3 py-2.5 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}