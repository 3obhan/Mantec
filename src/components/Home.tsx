import React from 'react';
import { useAppState } from '../store';
import { translations } from '../i18n';
import { Link } from 'react-router-dom';
import { PenTool, Library, Heart, Coins } from 'lucide-react';

export const Home = () => {
  const { lang } = useAppState();
  if (!lang) return null;
  
  const t = translations[lang];

  const getNum = (num: string) => {
    if (lang !== 'fa') return num;
    return num
      .replace(/0/g, '۰')
      .replace(/1/g, '۱')
      .replace(/2/g, '۲')
      .replace(/3/g, '۳')
      .replace(/4/g, '۴');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-10 animate-fade-in flex flex-col items-center justify-center w-full my-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 sm:gap-8 w-full">
        <Link to="/analyze" className="group bg-white border-2 sm:border-4 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white p-4 sm:p-8 flex flex-row sm:flex-col justify-between items-center sm:items-stretch min-h-[76px] sm:min-h-[240px] hover:text-white transition-all duration-300 cursor-pointer shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] sm:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] outline-none focus:bg-[#1A1A1A] focus:text-white">
          {/* Mobile view */}
          <div className="flex items-center gap-4 sm:hidden">
            <PenTool className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-lg font-black leading-none">{t.analyze}</span>
          </div>
          <div className="text-xl font-black opacity-40 group-hover:opacity-75 leading-none sm:hidden">{getNum('01')}</div>

          {/* Desktop view */}
          <div className="hidden sm:flex justify-between items-start">
            <div className="text-6xl font-black opacity-10 group-hover:opacity-20 transition-opacity">{getNum('01')}</div>
            <PenTool className="w-12 h-12 transition-transform group-hover:scale-110" />
          </div>
          <div className="hidden sm:block mt-8 pt-8 border-t-4 border-transparent group-hover:border-white transition-colors">
            <h2 className="text-4xl font-bold mb-2">{t.analyze}</h2>
            <p className="text-sm font-bold opacity-70 uppercase tracking-widest">{lang === 'fa' ? 'تحلیل منطقی متن' : 'Logical Text Analysis'}</p>
          </div>
        </Link>
        
        <Link to="/history" className="group bg-white border-2 sm:border-4 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white p-4 sm:p-8 flex flex-row sm:flex-col justify-between items-center sm:items-stretch min-h-[76px] sm:min-h-[240px] hover:text-white transition-all duration-300 cursor-pointer shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] sm:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] outline-none focus:bg-[#1A1A1A] focus:text-white">
          {/* Mobile view */}
          <div className="flex items-center gap-4 sm:hidden">
            <Library className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-lg font-black leading-none">{t.history}</span>
          </div>
          <div className="text-xl font-black opacity-40 group-hover:opacity-75 leading-none sm:hidden">{getNum('02')}</div>

          {/* Desktop view */}
          <div className="hidden sm:flex justify-between items-start">
            <div className="text-6xl font-black opacity-10 group-hover:opacity-20 transition-opacity">{getNum('02')}</div>
            <Library className="w-12 h-12 transition-transform group-hover:scale-110" />
          </div>
          <div className="hidden sm:block mt-8 pt-8 border-t-4 border-transparent group-hover:border-white transition-colors">
            <h2 className="text-4xl font-bold mb-2">{t.history}</h2>
            <p className="text-sm font-bold opacity-70 uppercase tracking-widest">{lang === 'fa' ? 'بایگانی و سوابق' : 'Archives & Records'}</p>
          </div>
        </Link>

        <Link to="/spiritual" className="group bg-white border-2 sm:border-4 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white p-4.5 sm:p-8 flex flex-row sm:flex-col justify-between items-center sm:items-stretch min-h-[76px] sm:min-h-[240px] hover:text-white transition-all duration-300 cursor-pointer shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] sm:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] outline-none focus:bg-[#1A1A1A] focus:text-white">
          {/* Mobile view */}
          <div className="flex items-center gap-4 sm:hidden">
            <Heart className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-lg font-black leading-none">{t.spiritual}</span>
          </div>
          <div className="text-xl font-black opacity-40 group-hover:opacity-75 leading-none sm:hidden">{getNum('03')}</div>

          {/* Desktop view */}
          <div className="hidden sm:flex justify-between items-start">
            <div className="text-6xl font-black opacity-10 group-hover:opacity-20 transition-opacity">{getNum('03')}</div>
            <Heart className="w-12 h-12 transition-transform group-hover:scale-110" />
          </div>
          <div className="hidden sm:block mt-8 pt-8 border-t-4 border-transparent group-hover:border-white transition-colors">
            <h2 className="text-4xl font-bold mb-2">{t.spiritual}</h2>
            <p className="text-sm font-bold opacity-70 uppercase tracking-widest">{lang === 'fa' ? 'بازخورد مستقیم' : 'Direct Feedback'}</p>
          </div>
        </Link>

        <a href={t.paypalLink} target="_blank" rel="noopener noreferrer" className="group bg-white border-2 sm:border-4 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white p-4.5 sm:p-8 flex flex-row sm:flex-col justify-between items-center sm:items-stretch min-h-[76px] sm:min-h-[240px] hover:text-white transition-all duration-300 cursor-pointer shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] sm:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] outline-none focus:bg-[#1A1A1A] focus:text-white">
          {/* Mobile view */}
          <div className="flex items-center gap-4 sm:hidden">
            <Coins className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-lg font-black leading-none">{t.material}</span>
          </div>
          <div className="text-xl font-black opacity-40 group-hover:opacity-75 leading-none sm:hidden">{getNum('04')}</div>

          {/* Desktop view */}
          <div className="hidden sm:flex justify-between items-start">
            <div className="text-6xl font-black opacity-10 group-hover:opacity-20 transition-opacity">{getNum('04')}</div>
            <Coins className="w-12 h-12 transition-transform group-hover:scale-110" />
          </div>
          <div className="hidden sm:block mt-8 pt-8 border-t-4 border-transparent group-hover:border-white transition-colors">
            <h2 className="text-4xl font-bold mb-2">{t.material}</h2>
            <p className="text-sm font-bold opacity-70 uppercase tracking-widest">{lang === 'fa' ? 'پشتیبانی مالی' : 'Financial Support'}</p>
          </div>
        </a>
      </div>
    </div>
  );
};
