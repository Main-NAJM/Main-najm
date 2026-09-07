import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * يدمج أصناف Tailwind ويحلّ التعارض بينها (الأخير يفوز).
 * تعتمد عليه مكوّنات shadcn/ui المضافة عبر `npx shadcn@latest add`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
