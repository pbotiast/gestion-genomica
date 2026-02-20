import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Layout from './components/Layout';

// Lazy loaded pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Researchers = lazy(() => import('./pages/Researchers'));
const Services = lazy(() => import('./pages/Services'));
const Requests = lazy(() => import('./pages/Requests'));
const Billing = lazy(() => import('./pages/Billing'));
const Config = lazy(() => import('./pages/Configuration'));
const Associates = lazy(() => import('./pages/Associates'));

const Audit = lazy(() => import('./pages/Audit'));
const EmailHistory = lazy(() => import('./pages/EmailHistory'));

// Loading fallback component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      <p className="mt-4 text-slate-600">Cargando...</p>
    </div>
  </div>
);

// Placeholders for other pages
const PlaceholderPage = ({ title }) => (
  <div>
    <h1 className="text-3xl font-bold mb-6 text-gradient">{title}</h1>
    <div className="glass-panel p-6 text-slate-400">
      Sección en construcción.
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={
          <Suspense fallback={<LoadingSpinner />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="solicitudes" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Requests />
          </Suspense>
        } />
        <Route path="investigadores" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Researchers />
          </Suspense>
        } />
        <Route path="usuarios" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Associates />
          </Suspense>
        } />

        <Route path="servicios" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Services />
          </Suspense>
        } />
        <Route path="facturacion" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Billing />
          </Suspense>
        } />
        <Route path="auditoria" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Audit />
          </Suspense>
        } />
        <Route path="historial-emails" element={
          <Suspense fallback={<LoadingSpinner />}>
            <EmailHistory />
          </Suspense>
        } />
        <Route path="configuracion" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Config />
          </Suspense>
        } />
        <Route path="*" element={<PlaceholderPage title="Página no encontrada" />} />
      </Route>
    </Routes>
  );
}

export default App;
