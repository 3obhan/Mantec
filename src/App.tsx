import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppStateProvider, useAppState } from './store';
import { LanguageSelect } from './components/LanguageSelect';
import { Home } from './components/Home';
import { Analyze } from './components/Analyze';
import { HistoryView } from './components/History';
import { Spiritual } from './components/Spiritual';

const LayoutWrapper = ({ children, dir }: { children: React.ReactNode, dir: 'rtl' | 'ltr' }) => {
  const { lang, setLang } = useAppState();
  return (
    <div className="min-h-screen bg-[#F4F4F2] text-[#1A1A1A] flex flex-col font-sans sm:border-8 sm:border-[#1A1A1A]" dir={dir}>
      <header className="h-20 border-b-4 border-[#1A1A1A] bg-white flex items-center justify-between px-4 sm:px-8 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <img src="/logo.jpeg" alt="Mantak Logo" className="w-10 h-10 object-contain" />
          <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase hidden sm:block">Logic Analyzer <span className="text-[#FF3B30] whitespace-nowrap">v4.0</span></h1>
          <h1 className="text-xl font-black tracking-tight uppercase sm:hidden">Mantak</h1>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#E8F5E9] border border-[#2E7D32] rounded-full" dir="ltr">
            <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-[#2E7D32] uppercase">System Optimized</span>
          </div>
          <div className="flex bg-[#EEEEEE] p-1 border border-[#1A1A1A]" dir="ltr">
            <button onClick={() => setLang('en')} className={`px-4 py-1 text-xs font-bold ${lang === 'en' ? 'bg-[#1A1A1A] text-white' : ''}`}>EN</button>
            <button onClick={() => setLang('fa')} className={`px-4 py-1 text-xs font-bold ${lang === 'fa' ? 'bg-[#1A1A1A] text-white' : ''}`}>FA</button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-auto bg-[#F4F4F2] p-4 sm:p-8">
        {children}
      </main>

      <footer className="h-16 border-t-4 border-[#1A1A1A] bg-white flex items-center px-4 sm:px-8 justify-between shrink-0 hidden sm:flex z-10 relative" dir="ltr">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">Logic Engine</span>
            <span className="text-xs font-mono font-bold">v9.1.0-STABLE</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">Inference Mode</span>
            <span className="text-xs font-mono font-bold uppercase">{navigator.onLine ? 'Neural Hybrid' : 'Offline Backup'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold border-r border-[#1A1A1A] pr-4 uppercase tracking-wider">PDF Export Ready</span>
          <div className="w-8 h-8 rounded-full border-2 border-[#1A1A1A] border-dashed flex items-center justify-center text-[10px] font-bold text-[#1A1A1A]">M</div>
        </div>
      </footer>
    </div>
  );
};

const AppContent = () => {
  const { lang } = useAppState();

  if (!lang) {
    return <LanguageSelect />;
  }

  return (
    <LayoutWrapper dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/history" element={<HistoryView />} />
        <Route path="/spiritual" element={<Spiritual />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LayoutWrapper>
  );
};

export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppStateProvider>
  );
}

