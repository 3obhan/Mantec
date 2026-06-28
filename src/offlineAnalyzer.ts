import { Fallacy } from './types';

// Simple heuristic fallback for fully offline mode
const rules_fa = [
  {
    regex: /(همه|هیچکس|همیشه|هرگز|همه‌چیز|هیچ‌چیز|عموماً|اکثراً|به‌طور کلی)/g,
    errorName: "مغالطه تعمیم شتاب‌زده (Hasty Generalization)",
    explanation: "استفاده از کلمات مطلق یا تعمیم‌های کلی بدون ارائه نمونه‌های آماری کافی، معمولاً منجر به نادیده گرفتن استثناها و مخدوش شدن استدلال می‌شود."
  },
  {
    regex: /(معلوم است|بدیهی است|کاملا مشخص است|همانطور که می‌دانیم|شک ندارم که|پر واضح است)/g,
    errorName: "مغالطه مصادره به مطلوب (Begging the Question)",
    explanation: "ادعای اینکه موضوعی ذاتاً اثبات‌شده و بدیهی است، معمولاً تلاشی برای طفره رفتن از ارائه شواهد واقعی و استدلال مستدل به شمار می‌آید."
  },
  {
    regex: /(احمق|نادان|دروغگو|دیوانه|بی‌سواد|نفهم|خودت که|شخص شما|سابقه شما)/g,
    errorName: "مغالطه حمله شخصی / توسل به شخص (Ad Hominem)",
    explanation: "حمله به ویژگی‌های شخصیتی، سابقه، یا انگیزه گوینده به جای به چالش کشیدن منطقی اصل استدلال و شواهد ارائه‌شده."
  },
  {
    regex: /(یا ... یا|یا با ما یا|یا این راه یا|دوراهی)/g,
    errorName: "مغالطه دوراهی کاذب (False Dilemma)",
    explanation: "محدود کردن گزینه‌های موجود به دو حالت متضاد و افراطی در حالی که گزینه‌ها و راه‌حل‌های میانه دیگری نیز وجود دارند."
  },
  {
    regex: /(اکثریت مردم|همه دارند می‌گویند|همه موافقند|افکار عمومی|محبوبیت|بین مردم جا افتاده)/g,
    errorName: "مغالطه توسل به اکثریت (Appeal to Popularity / Bandwagon)",
    explanation: "ادعای اینکه یک باور یا عمل به این دلیل که طرفداران یا پیروان زیادی دارد، لزوماً درست، اخلاقی یا منطقی است."
  },
  {
    regex: /(اگر این اتفاق بیفتد قطعا فاجعه می‌شود|شیب لغزنده|سقوط کل جامعه|نابودی کامل)/g,
    errorName: "مغالطه شیب لغزنده (Slippery Slope)",
    explanation: "ادعای اثبات‌نشده مبنی بر اینکه انجام یک اقدام کوچک لزوماً منجر به زنجیره‌ای از حوادث وحشتناک و غیرقابل‌کنترل خواهد شد."
  },
  {
    regex: /(یک دانشمندی می‌گفت|شنیده‌ام که|می‌گویند که|به نقل از منابع غیررسمی|یک کارشناسی گفته)/g,
    errorName: "مغالطه توسل به مرجع کاذب (Appeal to False Authority)",
    explanation: "استناد به مراجع مبهم، نامشخص یا فاقد تخصص مرتبط در حوزه مورد بحث برای اثبات صحت یک ادعا."
  },
  {
    regex: /(دلتان نمی‌سوزد|بی‌رحمی|احساسات|عواطف|ترحم|ترس از اینکه)/g,
    errorName: "مغالطه توسل به احساسات (Appeal to Emotion)",
    explanation: "بهره‌گیری از خشم، ترس، دلسوزی یا سایر عواطف مخاطب به عنوان ابزار متقاعدسازی به جای ارائه براهین عقلانی."
  }
];

const rules_en = [
  {
    regex: /\b(always|never|everyone|nobody|all|none|generally|typically)\b/gi,
    errorName: "Hasty Generalization / Absolute Statement",
    explanation: "Using absolute words usually indicates a hasty generalization that ignores nuances, statistics, or counter-examples."
  },
  {
    regex: /\b(obviously|clearly|as we all know|it is undeniable|plainly|without doubt)\b/gi,
    errorName: "Begging the Question / Circular Logic",
    explanation: "Assuming the premise is true without providing evidence, often used to bypass logical reasoning."
  },
  {
    regex: /\b(stupid|idiot|liar|crazy|uneducated|ignorant|fool|your past|you yourself)\b/gi,
    errorName: "Ad Hominem",
    explanation: "Attacking the character, motive, or background of a person rather than addressing the substance of their argument."
  },
  {
    regex: /\b(either ... or|only two choices|with us or against|dilemma)\b/gi,
    errorName: "False Dilemma / False Dichotomy",
    explanation: "Presenting only two extreme alternatives when in fact more realistic options or compromise solutions exist."
  },
  {
    regex: /\b(majority|everyone agrees|public opinion|popular belief|society says)\b/gi,
    errorName: "Appeal to Popularity (Bandwagon)",
    explanation: "Asserting that a claim is true or good simply because a majority of people believe or do it."
  },
  {
    regex: /\b(leads to disaster|slippery slope|complete ruin|downfall of)\b/gi,
    errorName: "Slippery Slope Fallacy",
    explanation: "Claiming without sufficient evidence that a small initial step will inevitably lead to a chain of catastrophic events."
  },
  {
    regex: /\b(some scientist|heard that|they say|unnamed source|expert says)\b/gi,
    errorName: "Appeal to False Authority",
    explanation: "Citing an irrelevant, vague, or unqualified source or authority to back up an argument."
  },
  {
    regex: /\b(pity|feel bad|fear of|cruelty|emotions|feelings|scared)\b/gi,
    errorName: "Appeal to Emotion",
    explanation: "Using emotional language, pity, fear, or anger to win an argument in the absence of solid rational proof."
  }
];

export function runOfflineAnalysis(text: string, lang: 'fa' | 'en'): Fallacy[] {
  const fallacies: Fallacy[] = [];
  const rules = lang === 'fa' ? rules_fa : rules_en;
  
  // simple sentence splitter
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  sentences.forEach((sentence) => {
    let handled = false;
    rules.forEach((rule) => {
      if (!handled && rule.regex.test(sentence)) {
        fallacies.push({
          quote: sentence.trim(),
          errorName: rule.errorName,
          explanation: rule.explanation
        });
        handled = true;
      }
    });
  });

  return fallacies;
}
