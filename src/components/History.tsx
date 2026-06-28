import React, { useState } from 'react';
import { useAppState } from '../store';
import { translations } from '../i18n';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Trash2, BookOpen, ChevronDown, ChevronUp, Scale, Brain } from 'lucide-react';

export const HistoryView = () => {
  const { lang, history, removeHistoryItem, clearHistory } = useAppState();
  const t = translations[lang!];
  const isFa = lang === 'fa';
  const [showHandbook, setShowHandbook] = useState(false);

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

      {/* Fallacy Handbook section */}
      <div className="mb-10 animate-fade-in">
        <button
          onClick={() => setShowHandbook(!showHandbook)}
          className="flex items-center justify-between w-full p-4 bg-white border-4 border-[#1A1A1A] hover:bg-gray-50 text-[#1A1A1A] font-black text-base sm:text-lg transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] outline-none focus:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-900 shrink-0" strokeWidth={2.5} />
            <span className="text-right">
              {isFa ? "نمونه‌ها" : "Handbook of Logical Fallacies & Errors (Reference Examples)"}
            </span>
          </div>
          {showHandbook ? <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" strokeWidth={2.5} /> : <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" strokeWidth={2.5} />}
        </button>

        {showHandbook && (
          <div className="mt-4 bg-white border-4 border-[#1A1A1A] p-4 sm:p-8 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] text-[#1A1A1A]" dir={isFa ? 'rtl' : 'ltr'}>
            <p className="font-bold text-sm sm:text-base mb-6 leading-relaxed opacity-80 border-b-2 border-gray-200 pb-4">
              {isFa 
                ? "سیستم منطک بر پایه عقل محض بنا شده و هرگونه ایراد عقلی، خطای شناختی، انحراف مفهومی و مغالطه منطقی صوری یا غیرصوری را بدون محدودیت در متن شناسایی می‌کند. موارد زیر صرفاً چند نمونه بارز برای راهنمایی شماست:" 
                : "The Mantak system is designed to detect any logical, rational, conceptual, or cognitive error without limitation. Below are some key reference examples for your guidance:"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Layer 1: Pure Reason */}
              <div className="border-2 border-[#1A1A1A] p-4 bg-[#F9F9FA] relative rounded-lg">
                <div className="absolute -top-4 right-4 bg-blue-900 text-white px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider border-2 border-[#1A1A1A] rounded">
                  {isFa ? "لایه ۱: عقل محض و منطق صوری" : "Layer 1: Pure Reason & Formal Logic"}
                </div>
                <div className="mt-4 flex items-center gap-2 mb-4 text-blue-900">
                  <Brain className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                  <h4 className="font-black text-lg sm:text-xl">{isFa ? "آشفتگی عقلی" : "Rational Boundaries"}</h4>
                </div>
                <div className="space-y-6">
                  <div>
                    <span className="font-black text-xs sm:text-sm bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-[#1A1A1A] inline-block mb-1.5">
                      {isFa ? "خطای دسته‌بندی" : "Category Mistake"}
                    </span>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed">
                      {isFa 
                        ? "نسبت دادن ویژگی‌های فیزیکی یا ذهنی به مفاهیمی که منطقاً نمی‌توانند دارا باشند." 
                        : "Attributing physical or mental qualities to concepts that cannot logically hold them."}
                    </p>
                    <span className="text-[11px] sm:text-xs font-bold text-red-600 block mt-1 leading-relaxed">
                      {isFa ? "💡 مثال: «چشمم تصمیم گرفت دستم را حرکت دهد.» (فقط ذهن تصمیم می‌گیرد، چشم یک حسگر غیرارادی است.)" : "💡 Example: 'My eye decided to reach for the cup.' (Only the mind/brain decides; the eye is just an involuntary sensor.)"}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <span className="font-black text-xs sm:text-sm bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-[#1A1A1A] inline-block mb-1.5">
                      {isFa ? "تناقض‌های عقلی و مادی" : "Logical Absurdities"}
                    </span>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed">
                      {isFa 
                        ? "ادعاهایی که با خود ناسازگارند یا قوانین بنیادی فیزیک یا تعاریف پایه‌ای را نقض می‌کنند." 
                        : "Claims conflicting with themselves, violating physical laws, or basic semantic definitions."}
                    </p>
                    <span className="text-[11px] sm:text-xs font-bold text-red-600 block mt-1 leading-relaxed">
                      {isFa ? "💡 مثال: «این جسم همزمان تماماً سیاه و تماماً سفید است.» یا «دیروز فردا را دیدم.»" : "💡 Example: 'This object is entirely black and entirely white at the same time.'"}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <span className="font-black text-xs sm:text-sm bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-[#1A1A1A] inline-block mb-1.5">
                      {isFa ? "قیاس نامعتبر / بی‌ربطی منطقی" : "Invalid Syllogisms"}
                    </span>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed">
                      {isFa 
                        ? "چیدن صغری و کبری به گونه‌ای که نتیجه به دست آمده از مقدمات سرچشمه نگیرد." 
                        : "Drawing conclusions that do not flow or follow logically from the premises (Non-sequitur)."}
                    </p>
                    <span className="text-[11px] sm:text-xs font-bold text-red-600 block mt-1 leading-relaxed">
                      {isFa ? "💡 مثال: «فلزات هادی هستند؛ آب مایع است؛ پس فردا باران می‌بارد.»" : "💡 Example: 'Metals conduct electricity; water is liquid; therefore it will rain tomorrow.'"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Layer 2: Common Fallacies */}
              <div className="border-2 border-[#1A1A1A] p-4 bg-[#FAF9F9] relative rounded-lg">
                <div className="absolute -top-4 right-4 bg-red-600 text-white px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider border-2 border-[#1A1A1A] rounded">
                  {isFa ? "لایه ۲: مغالطات منطقی متداول" : "Layer 2: Common Logical Fallacies"}
                </div>
                <div className="mt-4 flex items-center gap-2 mb-4 text-red-600">
                  <Scale className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                  <h4 className="font-black text-lg sm:text-xl">{isFa ? "آشفتگی نقلی" : "Rhetorical Fallacies"}</h4>
                </div>
                <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1">
                  <div>
                    <span className="font-black text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded border border-[#1A1A1A] inline-block mb-1">
                      {isFa ? "مغالطه پهلوان‌پنبه (Strawman)" : "Strawman Fallacy"}
                    </span>
                    <p className="text-xs font-medium leading-relaxed">
                      {isFa ? "تحریف یا اغراق در سخن طرف مقابل برای ساده‌تر کردن حمله به آن." : "Caricaturing or distorting an opponent's stance to make it easier to knock down."}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <span className="font-black text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded border border-[#1A1A1A] inline-block mb-1">
                      {isFa ? "مغالطه توسل به شخص (Ad Hominem)" : "Ad Hominem"}
                    </span>
                    <p className="text-xs font-medium leading-relaxed">
                      {isFa ? "حمله به شخصیت یا سابقه گوینده به جای نقد و ارزیابی استدلال او." : "Attacking the speaker's personal character or history instead of their logical point."}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <span className="font-black text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded border border-[#1A1A1A] inline-block mb-1">
                      {isFa ? "مصادره به مطلوب / دور (Circular Reasoning)" : "Circular Reasoning"}
                    </span>
                    <p className="text-xs font-medium leading-relaxed">
                      {isFa ? "آوردن خود ادعا به عنوان دلیل اثبات آن در یک چرخه تکراری." : "Assuming the very conclusion you are trying to prove within the starting premise."}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <span className="font-black text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded border border-[#1A1A1A] inline-block mb-1">
                      {isFa ? "مغالطه تعمیم شتاب‌زده (Hasty Generalization)" : "Hasty Generalization"}
                    </span>
                    <p className="text-xs font-medium leading-relaxed">
                      {isFa ? "حکم کلی صادر کردن بر اساس حجم ناچیز یا نمونه‌های غیرمعتبر." : "Making sweeping conclusions based on an insufficient, tiny, or biased sample."}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <span className="font-black text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded border border-[#1A1A1A] inline-block mb-1">
                      {isFa ? "مغالطه دوراهی کاذب (False Dilemma)" : "False Dilemma"}
                    </span>
                    <p className="text-xs font-medium leading-relaxed">
                      {isFa ? "مجبور کردن مخاطب به انتخاب بین دو حالت افراطی بدون دیدن راه‌حل‌های میانه." : "Presenting two options as the only alternatives when more possibilities exist."}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <span className="font-black text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded border border-[#1A1A1A] inline-block mb-1">
                      {isFa ? "مغالطه توسل به اکثریت (Appeal to Popularity)" : "Appeal to Popularity"}
                    </span>
                    <p className="text-xs font-medium leading-relaxed">
                      {isFa ? "درست دانستن یک نظر صرفاً به این علت که توده مردم آن را باور دارند." : "Arguing a point is true simply because the majority of people believe or support it."}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <span className="font-black text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded border border-[#1A1A1A] inline-block mb-1">
                      {isFa ? "مغالطه علت کاذب (False Cause)" : "False Cause (Post Hoc)"}
                    </span>
                    <p className="text-xs font-medium leading-relaxed">
                      {isFa ? "همبستگی زمانی دو رویداد مستقل را رابطه علت و معلولی دانستن." : "Assuming that correlation implies causation (since B happened after A, A caused B)."}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <span className="font-black text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded border border-[#1A1A1A] inline-block mb-1">
                      {isFa ? "مغالطه شیب لغزنده (Slippery Slope)" : "Slippery Slope"}
                    </span>
                    <p className="text-xs font-medium leading-relaxed">
                      {isFa ? "بزرگ‌نمایی غیرمنطقی پیامدهای زنجیره‌ای یک رویداد کوچک." : "Asserting that a minor initial step will unavoidably cascade into catastrophic ruin."}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <span className="font-black text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded border border-[#1A1A1A] inline-block mb-1">
                      {isFa ? "مغالطه توسل به احساسات (Appeal to Emotion)" : "Appeal to Emotion"}
                    </span>
                    <p className="text-xs font-medium leading-relaxed">
                      {isFa ? "تحریک خشم، ترحم یا ترس مخاطب به جای ارائه براهین عقلانی." : "Using pity, fear, or outrage to win over the audience instead of rational reasoning."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
