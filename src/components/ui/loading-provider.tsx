"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

type LoadingContextType = {
  isLoading: boolean;
  loadingMessage: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
};

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  loadingMessage: "Loading...",
  startLoading: () => {},
  stopLoading: () => {},
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const pathname = usePathname();

  // If path changes to login, sign up, or home, make sure we clear the loading overlay
  useEffect(() => {
    const publicPaths = ["/login", "/signup", "/request-reset", "/reset-password", "/"];
    if (publicPaths.includes(pathname)) {
      const frame = requestAnimationFrame(() => {
        setIsLoading(false);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [pathname]);

  // Set a safety timeout so the loader doesn't get stuck indefinitely
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 15000); // 15s max safety window
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const startLoading = (msg = "Loading...") => {
    setLoadingMessage(msg);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage, startLoading, stopLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-xl transition-all duration-300">
          <div className="relative flex flex-col items-center space-y-6 rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] max-w-sm w-full mx-4">
            {/* Spinning/pulsing aura */}
            <div className="absolute -inset-10 -z-10 animate-pulse rounded-full bg-blue-500/10 blur-3xl"></div>
            
            {/* Elegant Custom Spinner */}
            <div className="relative h-20 w-20">
              {/* Inner glowing circle */}
              <div className="absolute inset-1.5 rounded-full border border-blue-500/10 bg-slate-950/30"></div>
              {/* Background ring */}
              <div className="absolute inset-0 rounded-full border-[3px] border-slate-800"></div>
              {/* Spinning gradient ring */}
              <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500 border-r-indigo-400 animate-spin"></div>
            </div>

            {/* Title & Message */}
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold tracking-wide text-white animate-pulse">
                {loadingMessage}
              </h3>
              <p className="text-xs text-slate-400">
                Please wait while we prepare your workspace
              </p>
            </div>

            {/* Accent light decoration */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  return useContext(LoadingContext);
}
