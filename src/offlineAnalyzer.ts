import { Fallacy } from './types';

// Simple heuristic fallback for fully offline mode
const rules_fa = [
  {
    regex: /(همه|هیچکس|همیشه|هرگز||همه‌چیز|هیچ‌چیز)/g,
    errorName: "تعمیم شتاب‌زده (Hasty Generalization)",
    explanation: "استفاده از کلمات مطلق معمولاً نشان‌دهنده یک پیش‌فرض قاطع و بدون استثنا است که در منطق مخدوش است."
  },
  {
    regex: /(معلوم است|بدیهی است|کاملا مشخص است|همانطور که می‌دانیم)/g,
    errorName: "مصادره به مطلوب (Begging the Question)",
    explanation: "ادعای این که موضوعی ذاتاً اثبات شده و بدیهی است معمولاً برای طفره رفتن از استدلال مستدل به کار می‌رود."
  },
  {
    regex: /(احمق|نادان|دروغگو|دیوانه|بی‌سواد)/g,
    errorName: "توسل به شخص / حمله شخصی (Ad Hominem)",
    explanation: "حمله به شخصیت گوینده به جای پرداختن به اصل استدلال."
  }
];

const rules_en = [
  {
    regex: /\b(always|never|everyone|nobody|all|none)\b/gi,
    errorName: "Hasty Generalization / Absolute Statement",
    explanation: "Using absolute words usually indicates a hasty generalization that ignores nuances or exceptions."
  },
  {
    regex: /\b(obviously|clearly|as we all know|it is undeniable)\b/gi,
    errorName: "Begging the Question / Proof by Assertion",
    explanation: "Assuming the premise is true without providing evidence, often used to bypass logical reasoning."
  },
  {
    regex: /\b(stupid|idiot|liar|crazy|uneducated|ignorant)\b/gi,
    errorName: "Ad Hominem",
    explanation: "Attacking the character or motive of a person rather than addressing the substance of their argument."
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
