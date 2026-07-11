import React, { createContext, useContext, useState, useEffect } from 'react';
import { AnalysisResult } from './types';

interface AppStateContextType {
  lang: 'fa' | 'en' | null;
  setLang: (l: 'fa' | 'en') => void;
  history: AnalysisResult[];
  addHistory: (item: AnalysisResult) => void;
  clearHistory: () => void;
  removeHistoryItem: (id: string) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [lang, setLangState] = useState<'fa' | 'en' | null>(() => {
    return (localStorage.getItem('mantak_lang') as 'fa' | 'en') || null;
  });
  
  const [history, setHistory] = useState<AnalysisResult[]>(() => {
    const saved = localStorage.getItem('mantak_history');
    return saved ? JSON.parse(saved) : [];
  });

  const setLang = (l: 'fa' | 'en') => {
    setLangState(l);
    localStorage.setItem('mantak_lang', l);
  };

  const addHistory = (item: AnalysisResult) => {
    setHistory(prev => {
      const newHistory = [item, ...prev];
      localStorage.setItem('mantak_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('mantak_history');
  };

  const removeHistoryItem = (id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(h => h.id !== id);
      localStorage.setItem('mantak_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  return (
    <AppStateContext.Provider value={{ lang, setLang, history, addHistory, clearHistory, removeHistoryItem }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
};
