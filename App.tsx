import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import GroupRoom from './pages/GroupRoom';
import Profile from './pages/Profile';
import GlobalShop from './pages/GlobalShop';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/group/:id" element={<GroupRoom />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/shop" element={<GlobalShop />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
