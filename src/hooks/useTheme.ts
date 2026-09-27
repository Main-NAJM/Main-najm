import { useCallback, useState } from 'react';
import { applyTheme, readTheme, saveTheme, type ThemeChoice } from '@/lib/theme';

/**
 * مفتاح المظهر: يقرأ المحفوظ ويكتب الجديد على الصفحة فوراً.
 *
 * لا حاجة لمراقبة تغيّر إعداد الجهاز: في وضع «تلقائي» تحمل وسوم
 * ‎theme-color‎ شرط ‎prefers-color-scheme‎ بنفسها، والمتصفّح يبدّلها وحده.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>(() => readTheme());

  const setTheme = useCallback((choice: ThemeChoice) => {
    setThemeState(choice);
    saveTheme(choice);
    applyTheme(choice);
  }, []);

  return { theme, setTheme };
}
