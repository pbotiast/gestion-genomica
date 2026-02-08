import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Researchers from './pages/Researchers';
import Services from './pages/Services';
import Requests from './pages/Requests';
import Config from './pages/Config';

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
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="solicitudes" element={<Requests />} />
        <Route path="investigadores" element={<Researchers />} />
        <Route path="servicios" element={<Services />} />
        <Route path="configuracion" element={<Config />} />
        <Route path="*" element={<PlaceholderPage title="Página no encontrada" />} />
      </Route>
    </Routes>
  );
}

export default App;
