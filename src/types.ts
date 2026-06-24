export type Fallacy = {
  quote: string;
  errorName: string;
  explanation: string;
};

export type AnalysisResult = {
  id: string;
  timestamp: string;
  text: string;
  fallacies: Fallacy[];
  lang: 'en' | 'fa';
};
