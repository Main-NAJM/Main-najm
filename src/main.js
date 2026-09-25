import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { registerServiceWorker } from './registerSW';
import './styles/global.css';
const container = document.getElementById('root');
if (!container)
    throw new Error('لم يُعثر على عنصر الجذر #root.');
createRoot(container).render(_jsx(StrictMode, { children: _jsx(BrowserRouter, { basename: import.meta.env.BASE_URL, children: _jsx(AuthProvider, { children: _jsx(ToastProvider, { children: _jsx(App, {}) }) }) }) }));
registerServiceWorker();
