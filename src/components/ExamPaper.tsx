import React from 'react';
import { Fallacy } from '../types';
import { translations } from '../i18n';

interface ExamPaperProps {
  text: string;
  fallacies: Fallacy[];
  lang: 'fa' | 'en';
}

export const ExamPaper = React.forwardRef<HTMLDivElement, ExamPaperProps>(
  ({ text, fallacies, lang }, ref) => {
    const t = translations[lang];
    const isFa = lang === 'fa';
    
    // Split the text roughly by periods to interleave corrections, or just list corrections at the bottom
    // We will render the full text, and highlight flawed strings as requested. Best approach
    // is to render the original text, and under each flawed quote, display the red cursive correction.

    return (
      <div 
        ref={ref} 
        className="w-[800px] p-12 bg-white text-black relative"
        style={{
          // Ruled paper background effect
          backgroundImage: 'linear-gradient(transparent, transparent 31px, #cbd5e1 31px, #cbd5e1 32px)',
          backgroundSize: '100% 32px',
          lineHeight: '32px',
          minHeight: '1100px',
          fontFamily: isFa ? '"Vazirmatn", sans-serif' : 'Arial, sans-serif'
        }}
      >
        <div className="absolute top-4 left-8 border-4 border-red-500 rounded-full w-24 h-24 flex items-center justify-center -rotate-12 opacity-80 pointer-events-none">
          <div className="text-red-600 font-bold text-lg text-center" style={{ fontFamily: isFa ? '"RedPenFont", "Aref Ruqaa", cursive' : '"Caveat", cursive' }}>
            {t.teacherMark}<br/>
            {new Date().toLocaleDateString(isFa ? 'fa-IR' : 'en-US')}
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8 text-blue-900" style={{ lineHeight: '32px' }}>
          {t.appTitle} - {lang === 'fa' ? 'نتیجه بررسی' : 'Analysis Result'}
        </h1>

        <div className="text-xl text-blue-800 whitespace-pre-wrap mt-8" style={{ lineHeight: '32px', fontFamily: isFa ? 'Tahoma, Arial' : 'Arial' }}>
          {/* We will just list the original text, then corrections under a line */}
          <div className="mb-12">
            <span className="font-bold underline">Original Text:</span> <br />
            <span className="leading-8">{text}</span>
          </div>

          <div className="mt-8 border-t-2 border-dashed border-red-400 pt-8">
            <span className="font-bold text-red-600 underline text-2xl uppercase">Errors / Corrections:</span>
            {fallacies.length === 0 ? (
              <div className="text-red-500 mt-4 font-bold text-2xl" style={{ fontFamily: isFa ? '"RedPenFont", "Aref Ruqaa", cursive' : '"Caveat", cursive' }}>
                {t.noErrors}
              </div>
            ) : (
              fallacies.map((f, i) => (
                <div key={i} className="mt-6 mb-6">
                  <div className="text-blue-700 bg-blue-50 px-2 rounded inline-block">
                    "{f.quote}"
                  </div>
                  <div className="text-red-600 text-2xl mt-2" style={{ fontFamily: isFa ? '"RedPenFont", "Aref Ruqaa", cursive' : '"Caveat", cursive' }}>
                    ✘ [{f.errorName}]: {f.explanation}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
);
