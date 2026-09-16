import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { APP_NAME } from '@/lib/constants';
import { tradeLabel } from '@/lib/trades';
import {
  CalculatorIcon,
  CalendarIcon,
  DebtIcon,
  HomeIcon,
  MoreIcon,
  OrdersIcon,
  PriceIcon,
  PrintIcon,
  ProductIcon,
  SettingsIcon,
} from './icons';

const primaryLinks = [
  { to: '/', label: 'الرئيسية', Icon: HomeIcon, end: true },
  { to: '/orders', label: 'الطلبيات', Icon: OrdersIcon, end: false },
  { to: '/schedule', label: 'المواعيد', Icon: CalendarIcon, end: false },
  { to: '/debts', label: 'الديون', Icon: DebtIcon, end: false },
];

const moreLinks = [
  { to: '/products', label: 'حاسبة المنتج', Icon: ProductIcon },
  { to: '/calculator', label: 'حاسبة التكلفة', Icon: CalculatorIcon },
  { to: '/prices', label: 'أسعار السوق', Icon: PriceIcon },
  { to: '/print', label: 'الطباعة', Icon: PrintIcon },
  { to: '/settings', label: 'الإعدادات', Icon: SettingsIcon },
];

const pageTitles: Record<string, string> = {
  '/': 'لوحة اليوم',
  '/orders': 'الطلبيات',
  '/schedule': 'تنظيم الوقت',
  '/debts': 'سجل الديون',
  '/calculator': 'حاسبة التكلفة والربح',
  '/products': 'حاسبة سعر المنتج',
  '/prices': 'مؤشرات أسعار السوق',
  '/print': 'الطباعة والتقارير',
  '/settings': 'الإعدادات',
};

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { profile, storeKind } = useData();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
    };
    const goOffline = () => {
      setOnline(false);
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const title = pageTitles[pathname] ?? APP_NAME;
  const isMoreActive = moreLinks.some((link) => pathname.startsWith(link.to));

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__row">
          <div>
            <div className="app-header__title">{title}</div>
            <div className="app-header__sub">
              {profile.businessName || APP_NAME} · {tradeLabel(profile)}
            </div>
          </div>
          <div className="app-header__actions">
            {storeKind === 'local' ? (
              <span className="header-btn" title="البيانات محفوظة على هذا الجهاز فقط">
                وضع محلي
              </span>
            ) : null}
            {user?.email ? (
              <NavLink to="/settings" className="header-btn">
                حسابي
              </NavLink>
            ) : null}
          </div>
        </div>
      </header>

      {!online ? (
        <div className="offline-bar">
          لا يوجد اتصال بالإنترنت — تعمل الآن على النسخة المحفوظة، وستتم المزامنة تلقائياً.
        </div>
      ) : null}

      <main className="app-main">{children}</main>

      <nav className="bottom-nav" aria-label="التنقّل الرئيسي">
        {primaryLinks.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `bottom-nav__item${isActive && !moreOpen ? ' is-active' : ''}`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`bottom-nav__item${isMoreActive || moreOpen ? ' is-active' : ''}`}
          onClick={() => {
            setMoreOpen((open) => !open);
          }}
          aria-expanded={moreOpen}
        >
          <MoreIcon />
          <span>المزيد</span>
        </button>
      </nav>

      {moreOpen ? (
        <div
          className="more-sheet"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMoreOpen(false);
          }}
        >
          <div className="more-sheet__panel" role="dialog" aria-label="قوائم إضافية">
            <div className="sheet-handle" />
            <div className="row-between">
              <strong>أقسام أخرى</strong>
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  setMoreOpen(false);
                }}
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>
            <div className="more-sheet__grid">
              {moreLinks.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `more-sheet__link${isActive ? ' is-active' : ''}`
                  }
                >
                  <Icon />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
