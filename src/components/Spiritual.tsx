import React, { useState } from 'react';
import { useAppState } from '../store';
import { translations } from '../i18n';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';

export const Spiritual = () => {
  const { lang } = useAppState();
  const t = translations[lang!];
  const isFa = lang === 'fa';
  
  const [msg, setMsg] = useState('');

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-6 animate-fade-in w-full text-center mt-4 sm:mt-12">
      <div className="mb-6 sm:mb-10 flex items-center justify-start">
        <Link to="/" className="text-[#1A1A1A] hover:text-[#2E7D32] flex items-center gap-2 font-black uppercase tracking-wider transition-colors">
          {isFa ? <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} /> : <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />} {t.back}
        </Link>
      </div>

      <div className="bg-white border-4 border-[#1A1A1A] p-4 sm:p-10 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] sm:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] mb-8 sm:mb-12">
        <HeartIcon className="w-16 h-16 sm:w-24 sm:h-24 text-[#1A1A1A] mx-auto mb-4 sm:mb-8 stroke-[3]" />
        <h2 className="text-3xl sm:text-5xl font-black text-[#1A1A1A] mb-4 sm:mb-6 uppercase tracking-tight">{t.spiritual}</h2>
        <p className="text-sm sm:text-xl font-bold text-[#1A1A1A] mb-6 sm:mb-10 leading-relaxed uppercase tracking-wide opacity-80">
          {t.spiritualDesc}
        </p>

        <textarea
          className="w-full h-32 sm:h-48 p-4 sm:p-6 bg-[#F4F4F2] border-4 border-[#1A1A1A] focus:bg-white focus:outline-none focus:ring-0 mb-6 sm:mb-8 text-base sm:text-xl font-medium shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] sm:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-colors placeholder:text-gray-400"
          placeholder={lang === 'fa' ? "نظر یا پیام خود را بنویسید..." : "Write your message..."}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          dir={isFa ? 'rtl' : 'ltr'}
        />

        <a 
          href={`mailto:${t.spiritualTargetEmail}?subject=Mantak Spiritual Impact&body=${encodeURIComponent(msg)}`}
          className="inline-flex items-center justify-center gap-3 px-6 py-3 sm:px-10 sm:py-4 bg-[#1A1A1A] text-white border-4 border-[#1A1A1A] font-black text-lg sm:text-xl uppercase tracking-widest hover:bg-white hover:text-[#1A1A1A] transition-colors shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] sm:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 w-full sm:w-auto"
        >
          <Mail className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={3} />
          {t.send}
        </a>
      </div>
    </div>
  );
};

const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
)
