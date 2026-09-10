import { useSessionStore } from '../store/sessionStore';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';

type Translations = typeof en;

const translations: Record<string, Translations> = {
  'en-IN': en,
  'hi-IN': hi,
};

export function useTranslation() {
  const language = useSessionStore((s) => s.language);
  const t = translations[language] || translations['en-IN'];

  return { t, language };
}
