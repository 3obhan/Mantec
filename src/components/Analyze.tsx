import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../store';
import { translations } from '../i18n';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, ServerCrash } from 'lucide-react';
import { runOfflineAnalysis } from '../offlineAnalyzer';
import { Fallacy } from '../types';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';

export const Analyze = () => {
  const { lang, addHistory } = useAppState();
  const t = translations[lang!];
  const isFa = lang === 'fa';
  
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Fallacy[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isExporting, setIsExporting] = useState(false);
  const [stampSrc, setStampSrc] = useState<string>('');

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preloadAndResizeSeal = async () => {
      const paths = [
        '/seal.png',
        'seal.png',
        './seal.png',
        `${window.location.origin}/seal.png`
      ];

      for (const path of paths) {
        try {
          console.log(`Attempting to fetch and resize seal from: ${path}`);
          const res = await fetch(path, { credentials: 'omit' });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          const blob = await res.blob();
          
          // Step 1: Read blob to full Base64
          const fullBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          // Step 2: Load into Image to get natural dimensions and draw/resize on canvas
          const resizedBase64 = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const maxDim = 350; // High quality but lightweight (approx. 30-50KB)
              let width = img.naturalWidth;
              let height = img.naturalHeight;
              
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                try {
                  resolve(canvas.toDataURL('image/png'));
                } catch (err) {
                  reject(err);
                }
              } else {
                reject(new Error('Canvas context is null'));
              }
            };
            img.onerror = () => reject(new Error('Failed to load image element'));
            img.src = fullBase64;
          });

          if (resizedBase64 && resizedBase64.length > 500) {
            setStampSrc(resizedBase64);
            console.log(`Seal successfully loaded, resized, and set! Size: ${Math.round(resizedBase64.length / 1024)} KB`);
            return;
          }
        } catch (err) {
          console.warn(`Failed to load/resize seal from ${path}:`, err);
        }
      }
      console.error('All seal image preload and resize attempts failed.');
    };

    preloadAndResizeSeal();
  }, []);

  const getSafeUUID = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError(t.errorRequired);
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    if (!navigator.onLine) {
      setIsOffline(true);
      const offlineResult = runOfflineAnalysis(text, lang as 'fa' | 'en');
      setResult(offlineResult);
      addHistory({
        id: getSafeUUID(),
        timestamp: new Date().toISOString(),
        text,
        fallacies: offlineResult,
        lang: lang as 'fa'|'en'
      });
      setLoading(false);
      return;
    }

    try {
      const apiUrl = new URL('/api/analyze', window.location.origin).toString();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
        credentials: 'omit'
      });
      
      const contentType = response.headers.get('content-type') || '';
      
      if (!response.ok) {
        let errorMsg = `Server error (Status ${response.status})`;
        if (contentType.includes('application/json')) {
          try {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
          } catch (_) {}
        } else {
          try {
            const textData = await response.text();
            if (textData && textData.length < 150) {
              errorMsg = textData;
            }
          } catch (_) {}
        }
        throw new Error(errorMsg);
      }
      
      if (!contentType.includes('application/json')) {
        throw new Error('Invalid response format from server. Expected JSON, but received HTML or plain text. Please verify that your backend or Cloudflare Pages Function is deployed and running.');
      }
      
      const data = await response.json();
      
      setResult(data.analysis);
      addHistory({
        id: getSafeUUID(),
        timestamp: new Date().toISOString(),
        text,
        fallacies: data.analysis,
        lang: lang as 'fa'|'en'
      });
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "Failed to analyze";
      
      // Check for known Safari/WebKit fetch/cookie pattern bugs or generic failures to enable a smooth UX fallback
      const isPatternError = errMsg.includes("The string did not match the expected pattern") || 
                             errMsg.includes("did not match the expected pattern");
                             
      if (isPatternError) {
        console.log("Safari fetch pattern mismatch detected. Safely falling back to local offline logic.");
        const offlineResult = runOfflineAnalysis(text, lang as 'fa' | 'en');
        setResult(offlineResult);
        addHistory({
          id: getSafeUUID(),
          timestamp: new Date().toISOString(),
          text,
          fallacies: offlineResult,
          lang: lang as 'fa'|'en'
        });
        setIsOffline(true);
        setError("سیستم به دلیل محدودیت فنی مرورگر، به طور خودکار به بخش تحلیلگر آفلاین متصل شد تا نتیجه را نمایش دهد.");
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 150));
    
    try {
      const dataUrl = await domtoimage.toJpeg(printRef.current, { 
        quality: 1.0,
        bgcolor: '#F4F4F2',
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      // Standard page base width of 210mm
      const pdfWidth = 210;
      
      // Calculate actual height maintaining exact aspect ratio
      const tempPdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = tempPdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Create final PDF with custom dimensions so the entire paper and stamp are captured without any clipping or cutoffs
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Mantak_Analysis_${new Date().getTime()}.pdf`);
    } catch (err: any) {
      console.error("PDF Export Error", err);
      alert(`Error generating PDF: ${err.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-2 sm:p-6 animate-fade-in w-full">
      <div className="mb-6 sm:mb-8 flex items-center">
        <Link to="/" className="text-[#1A1A1A] hover:text-[#FF3B30] flex items-center gap-2 font-black uppercase tracking-wider transition-colors">
          {isFa ? <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} /> : <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />} {t.back}
        </Link>
      </div>

      <h2 className="text-3xl sm:text-5xl font-black text-[#1A1A1A] mb-6 sm:mb-8 uppercase tracking-tight">{t.analyze}</h2>

      {isOffline && (
        <div className="bg-[#1A1A1A] text-white border-4 border-[#1A1A1A] p-4 mb-6 sm:mb-8 flex items-start gap-4 shadow-[4px_4px_0px_0px_#FF3B30]">
          <ServerCrash className="shrink-0 mt-0.5 text-[#FF3B30] w-6 h-6 sm:w-8 sm:h-8" strokeWidth={3} />
          <p className="font-bold text-sm sm:text-base">{t.offlineWarning}</p>
        </div>
      )}

      <textarea
        className="w-full min-h-[200px] sm:min-h-[300px] p-4 sm:p-6 border-4 border-[#1A1A1A] bg-white focus:bg-[#E8F5E9] focus:outline-none focus:ring-0 mb-6 sm:mb-8 resize-y text-base sm:text-l md:text-xl font-medium shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] sm:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-colors placeholder:text-gray-400 placeholder:font-bold"
        placeholder={t.analyzePlaceholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        dir={isFa ? 'rtl' : 'ltr'}
      />

      {error && <div className="bg-[#FF3B30] text-white font-bold p-4 border-4 border-[#1A1A1A] mb-6 sm:mb-8 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">{error}</div>}

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="px-8 py-3.5 sm:px-10 sm:py-4 bg-[#1A1A1A] text-white text-lg sm:text-xl border-4 border-[#1A1A1A] font-black uppercase tracking-widest hover:bg-white hover:text-[#1A1A1A] disabled:opacity-50 disabled:hover:bg-[#1A1A1A] disabled:hover:text-white transition-colors w-full sm:w-auto shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] sm:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 focus:outline-none"
      >
        {loading ? t.analyzing : t.analyzeBtn}
      </button>

      {result !== null && (
        <div className="mt-12 sm:mt-16 bg-white border-4 border-[#1A1A1A] p-4 sm:p-10 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] sm:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] mb-12">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 gap-6">
            <h3 className="text-3xl font-black uppercase tracking-tight">Analysis Output</h3>
            <button 
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-3 px-8 py-3 bg-[#1A1A1A] text-white border-4 border-[#1A1A1A] font-black uppercase tracking-wider hover:bg-white hover:text-[#1A1A1A] transition-colors shadow-[4px_4px_0px_0px_#FF3B30] hover:shadow-none hover:translate-x-1 hover:translate-y-1 focus:outline-none"
            >
              <Download size={24} strokeWidth={3} /> {t.exportPdf}
            </button>
          </div>
          
          <div className="overflow-auto border-4 border-[#1A1A1A] relative max-h-[600px] bg-[#F4F4F2]" dir={isFa ? 'rtl' : 'ltr'}>
             {/* Rendered directly at actual width and scaled cleanly for preview */}
             <div className="w-[840px] overflow-hidden p-4">
                <ExamPaperContent ref={printRef} text={text} fallacies={result} lang={lang as 'fa'|'en'} t={t} isFa={isFa} isExporting={isExporting} stampSrc={stampSrc} />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ExamPaperProps { text: string; fallacies: Fallacy[]; lang: 'fa'|'en'; t: any; isFa: boolean; isExporting?: boolean; stampSrc?: string; }

const ExamPaperContent = React.forwardRef<HTMLDivElement, ExamPaperProps>(({ text, fallacies, lang, t, isFa, isExporting = false, stampSrc = '' }, ref) => {
  // Helper to convert any English digits in a string to Persian digits
  const toPersianDigits = (str: string) => {
    return str.replace(/[0-9]/g, (w) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(w, 10)]);
  };

  const getDisplayDate = () => {
    try {
      const today = new Date();
      if (isFa) {
        const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        let formatted = formatter.format(today);
        formatted = formatted.replace('ه‍.ش.', '').replace('هجری شمسی', '').trim();
        return toPersianDigits(formatted);
      } else {
        const formatter = new Intl.DateTimeFormat('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        return formatter.format(today);
      }
    } catch (e) {
      return isFa ? "۲ تیر ۱۴۰۵" : "Jun 24, 2026";
    }
  };

  const getDisplayTime = () => {
    try {
      const today = new Date();
      const formatter = new Intl.DateTimeFormat(isFa ? 'fa-IR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return isFa ? toPersianDigits(formatter.format(today)) : formatter.format(today);
    } catch (e) {
      return isFa ? "۱۴:۳۵" : "14:35";
    }
  };

  return (
    <div 
      ref={ref} 
      className="w-[800px] p-12 pb-64 bg-white text-black relative border-8 border-double border-blue-900"
      dir={isFa ? 'rtl' : 'ltr'}
      style={{
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 35px, #93c5fd 35px, #93c5fd 36px)',
        backgroundSize: '100% 36px',
        backgroundPosition: '0 18px',
        minHeight: '1120px',
        fontFamily: '"Vazirmatn", sans-serif'
      }}
    >
      {/* Official Administrative Header with Date/Time */}
      <div className="flex justify-between items-start border-b-2 border-blue-900 pb-4 mb-8 text-blue-900" style={{ fontFamily: '"Vazirmatn", sans-serif' }}>
        {/* Center/Left Logo placeholder */}
        <div className="flex flex-col items-center">
          <img src="/logo.jpeg" alt="Logo" className="w-12 h-12 object-contain opacity-30 rounded" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
        </div>

        {/* Top-Left Metadata Block (Date and Time in General Font) */}
        <div className="flex flex-col gap-1 items-start text-blue-900 pl-2 font-bold text-sm" style={{ minWidth: '140px', fontFamily: '"GeneralFont", "Vazirmatn", sans-serif' }} dir="rtl">
          <div className="flex items-center gap-1">
            <span>{isFa ? 'تاریخ:' : 'Date:'}</span>
            <span className="mr-1">{getDisplayDate()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{isFa ? 'ساعت:' : 'Time:'}</span>
            <span className="mr-1">{getDisplayTime()}</span>
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-extrabold text-center mb-10 text-blue-900 mt-4 leading-relaxed tracking-wide">
        {t.appTitle} - {lang === 'fa' ? 'نتیجه منطق‌سنجی' : 'Logical Analysis'}
      </h1>

      {/* Styled to resemble hand writing with BIC blue pen */}
      <div className="text-2xl text-blue-800 whitespace-pre-wrap mt-10" style={{ lineHeight: '36px', fontFamily: '"Vazirmatn", sans-serif', fontWeight: 500 }}>
        <div className="mb-14 p-4 bg-blue-50/50 rounded-lg border-2 border-dashed border-blue-200">
          <span className="font-black text-xl text-blue-900 underline block mb-3">{isFa ? 'متن ارسالی کاربر:' : 'Submitted Text:'}</span>
          {text}
        </div>

        <div className="mt-14 pt-6 border-t-4 border-dotted border-red-400">
          {fallacies.length === 0 ? (
            <div className="text-red-600 mt-8 text-3xl font-bold text-center" style={{ fontFamily: isFa ? '"RedPenFont", "Aref Ruqaa", cursive' : '"Caveat", cursive' }}>
              {t.noErrors}
            </div>
          ) : (
            fallacies.map((f, i) => (
              <div key={i} className="mt-8 mb-10 pb-6 border-b-2 border-gray-100 last:border-b-0">
                <div className="bg-blue-50/70 border-r-4 border-blue-600 pr-3 pl-3 py-1 font-semibold text-xl text-blue-900 inline-block rounded mb-3">
                  "{f.quote}"
                </div>
                {/* Legible font pairing: Bold Vazirmatn for the label, cursive beautiful font for explanation with generous spacing */}
                <div className="mt-2 text-red-600">
                  <span className="font-extrabold text-lg bg-red-100 text-red-800 px-2 py-0.5 rounded ml-2 uppercase" style={{ fontFamily: '"Vazirmatn", sans-serif' }}>
                    {f.errorName}
                  </span>
                  <div className="text-3xl mt-4 leading-loose pr-2" style={{ fontFamily: isFa ? '"RedPenFont", "Aref Ruqaa", cursive' : '"Caveat", cursive', fontWeight: 700 }}>
                    {f.explanation}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Formal Stamp at the Bottom - displaying the user's clean, authentic seal image with no overlaid text */}
        <div className="absolute bottom-10 left-16 flex flex-col items-center select-none">
          <div className="w-52 h-52 relative">
            <img 
              src={stampSrc || "/seal.png"} 
              alt="Teacher Seal" 
              crossOrigin="anonymous"
              className="w-full h-full object-contain" 
            />
          </div>
        </div>
      </div>
    </div>
  );
});
