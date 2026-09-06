import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import Login from '@/pages/Login';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Orders = lazy(() => import('@/pages/Orders'));
const Schedule = lazy(() => import('@/pages/Schedule'));
const Calculator = lazy(() => import('@/pages/Calculator'));
const MarketPrices = lazy(() => import('@/pages/MarketPrices'));
const Debts = lazy(() => import('@/pages/Debts'));
const Print = lazy(() => import('@/pages/Print'));
const Settings = lazy(() => import('@/pages/Settings'));

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <Spinner label="جارٍ فتح التطبيق…" />
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <DataProvider>
      <Layout>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/prices" element={<MarketPrices />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/print" element={<Print />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </DataProvider>
  );
}
