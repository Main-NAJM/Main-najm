import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { APP_SHORT } from '@/lib/format';

const NAV = [
  {
    to: '/',
    label: 'الطلبات',
    icon: (
      <>
        <path d="M5 4h14a1 1 0 0 1 1 1v15l-4-2.5L12 20l-4-2.5L4 20V5a1 1 0 0 1 1-1z" />
        <path d="M8.5 9h7M8.5 12.5h4.5" />
      </>
    ),
  },
  {
    to: '/site',
    label: 'الموقع',
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.3-3.6-8.5S9.6 5.9 12 3.5z" />
      </>
    ),
  },
  {
    to: '/settings',
    label: 'الإعدادات',
    icon: (
      <>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5" />
      </>
    ),
  },
];

export default function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__title">
          <strong>{APP_SHORT}</strong>
          <span>لوحة تحكّم الموقع</span>
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

      <main className="page">
        <Outlet />
      </main>

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
    </div>
  );
}
