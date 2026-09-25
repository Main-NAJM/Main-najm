import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Requests from '@/pages/Requests';
import Site from '@/pages/Site';
import Account from '@/pages/Account';
import { DataProvider } from '@/context/DataContext';
import Layout from '@/components/Layout';
import { Spinner } from '@/components/ui';
import Login from '@/pages/Login';

function Gate() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner label="جارٍ فتح التطبيق…" />;
  if (!user) return <Login />;

  return (
    <DataProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Requests />} />
          <Route path="site" element={<Site />} />
          <Route path="settings" element={<Account />} />
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
