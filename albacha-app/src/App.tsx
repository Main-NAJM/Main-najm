import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import Layout from '@/components/Layout';
import { Spinner } from '@/components/ui';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import Orders from '@/pages/Orders';
import Receivables from '@/pages/Receivables';
import Materials from '@/pages/Materials';
import Reports from '@/pages/Reports';
import More from '@/pages/More';
import Settings from '@/pages/Settings';
import Print from '@/pages/Print';

function Gate() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner label="جارٍ فتح التطبيق…" />;
  if (!user) return <Login />;

  return (
    <DataProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="receivables" element={<Receivables />} />
          <Route path="materials" element={<Materials />} />
          <Route path="reports" element={<Reports />} />
          <Route path="more" element={<More />} />
          <Route path="settings" element={<Settings />} />
          <Route path="print/:orderId" element={<Print />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  );
}
