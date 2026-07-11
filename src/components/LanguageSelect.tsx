import React from 'react';
import { useAppState } from '../store';
import { translations } from '../i18n';

export const LanguageSelect = () => {
  const { setLang } = useAppState();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F4F2] text-[#1A1A1A] sm:border-8 sm:border-[#1A1A1A] p-4 relative z-10 w-full animate-fade-in" dir="ltr">
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Mantec Logo" className="w-24 sm:w-40 mb-4 sm:mb-8 object-contain drop-shadow-[6px_6px_0px_#FF3B30] sm:drop-shadow-[8px_8px_0px_#FF3B30]" />
      <h1 className="text-4xl sm:text-7xl font-black mb-2 sm:mb-4 uppercase tracking-tight text-center">Mantec <span className="text-[#FF3B30] text-2xl sm:text-5xl align-top block sm:inline mt-2 sm:mt-0">v4.0</span></h1>
      <p className="text-base sm:text-2xl font-bold mb-8 sm:mb-16 opacity-80 uppercase tracking-widest text-center border-b-2 sm:border-b-4 border-[#1A1A1A] pb-2 sm:pb-4">Pure Logical Reasoner</p>
      
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-xs sm:max-w-none justify-center">
        <button 
          onClick={() => setLang('fa')}
          className="px-8 py-4 sm:px-12 sm:py-6 bg-white border-4 border-[#1A1A1A] text-[#1A1A1A] text-xl sm:text-3xl font-black hover:bg-[#1A1A1A] hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] sm:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 uppercase w-full sm:w-auto text-center font-[Vazirmatn]"
        >
          فارسی
        </button>
        <button 
          onClick={() => setLang('en')}
          className="px-8 py-4 sm:px-12 sm:py-6 bg-white border-4 border-[#1A1A1A] text-[#1A1A1A] text-xl sm:text-3xl font-black hover:bg-[#1A1A1A] hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] sm:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 uppercase w-full sm:w-auto text-center"
        >
          English
        </button>
      </div>
    </div>
  );
};
