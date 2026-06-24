import React from 'react';
import { useAppState } from '../store';
import { translations } from '../i18n';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';

export const HistoryView = () => {
  const { lang, history, removeHistoryItem, clearHistory } = useAppState();
  const t = translations[lang!];
  const isFa = lang === 'fa';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in w-full">
      <div className="mb-8 flex justify-between items-center gap-4">
        <Link to="/" className="text-[#1A1A1A] hover:text-[#FF3B30] flex items-center gap-2 font-black uppercase tracking-wider transition-colors">
          {isFa ? <ArrowRight size={24} strokeWidth={3} /> : <ArrowLeft size={24} strokeWidth={3} />} {t.back}
        </Link>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="text-white bg-[#FF3B30] border-4 border-[#1A1A1A] px-4 py-2 hover:bg-white hover:text-[#1A1A1A] transition-colors flex items-center gap-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            <Trash2 size={20} strokeWidth={3} /> {t.delete} All
          </button>
        )}
      </div>

      <h2 className="text-4xl sm:text-5xl font-black text-[#1A1A1A] mb-8 uppercase tracking-tight">{t.history}</h2>

      {history.length === 0 ? (
        <div className="text-[#1A1A1A] font-black text-xl sm:text-2xl uppercase tracking-wider p-12 bg-white border-4 border-[#1A1A1A] text-center shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
          {t.historyEmpty}
        </div>
      ) : (
        <div className="space-y-10">
          {history.map((item) => (
            <div key={item.id} className="bg-white p-6 sm:p-8 border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] relative">
              <div className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A] mb-6 border-b-4 border-[#1A1A1A] pb-2 inline-block">
                {new Date(item.timestamp).toLocaleString(isFa ? 'fa-IR' : 'en-US')}
              </div>
              <p className="line-clamp-3 text-lg sm:text-xl font-medium text-[#1A1A1A] mb-8 leading-relaxed opacity-90">{item.text}</p>
              
              <div className="bg-[#E8F5E9] p-6 border-4 border-[#1A1A1A]">
                <span className="font-black text-xl mb-4 block uppercase flex items-center gap-3">
                  <span className="bg-[#1A1A1A] text-white px-3 py-1 text-lg">{item.fallacies.length}</span> Errors Found
                </span>
                <ul className="list-disc list-inside space-y-2 text-[#FF3B30]" style={{ fontFamily: isFa ? '"RedPenFont", "Aref Ruqaa", cursive' : '"Caveat", cursive', fontSize: '1.5rem' }}>
                  {item.fallacies.map((f, i) => (
                    <li key={i} className="font-bold">{f.errorName}</li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => removeHistoryItem(item.id)}
                className={`absolute top-6 ${isFa ? 'left-6' : 'right-6'} text-[#1A1A1A] hover:text-[#FF3B30] transition-colors`}
              >
                <Trash2 size={24} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
