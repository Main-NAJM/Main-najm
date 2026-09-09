import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { APP_SHORT } from '@/lib/format';

const NAV = [
  {
    to: '/',
    label: 'الرئيسية',
    icon: <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  },
  {
    to: '/customers',
    label: 'الزبائن',
    icon: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20c.6-3.4 2.8-5.2 5.5-5.2S13.9 16.6 14.5 20" />
        <path d="M16 11.2a2.8 2.8 0 1 0-1.6-5.1M17 14.6c2 .5 3.2 2.2 3.5 5.4" />
      </>
    ),
  },
  {
    to: '/orders',
    label: 'الطلبات',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 9h16M12 9v11" />
      </>
    ),
  },
  {
    to: '/receivables',
    label: 'المستحقّات',
    icon: (
      <>
        <path d="M3 7h18v10H3z" />
        <circle cx="12" cy="12" r="2.4" />
      </>
    ),
  },
  {
    to: '/settings',
    label: 'الإعدادات',
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
      </>
    ),
  },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const printing = location.pathname.startsWith('/print');

  return (
    <div className="shell">
      {printing ? null : (
        <header className="topbar">
          <div className="topbar__title">
            <strong>{APP_SHORT}</strong>
            <span>إدارة الزبائن والطلبات</span>
          </div>
          <button
            type="button"
            className="topbar__action"
            onClick={() => {
              void signOut();
            }}
          >
            {user?.isLocal ? 'تسجيل الدخول' : 'خروج'}
          </button>
        </header>
      )}

      <main className="page">
        <Outlet />
      </main>

      {printing ? null : (
        <nav className="navbar">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {item.icon}
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
