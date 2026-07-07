import { useCallback } from 'react';
import { useSettings } from '@/stores/appStore';
import { Lang, TKey, translations } from './translations';

/** Translate a key, with {placeholder} interpolation. */
export function useI18n() {
  const lang = useSettings((s) => s.lang);

  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => {
      let str: string = translations[lang][key] ?? translations.id[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang]
  );

  return { t, lang };
}

export type { Lang, TKey };
