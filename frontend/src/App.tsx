// frontend/src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PostureDetector from './components/PostureDetector';
import Dashboard from './components/Dashboard';
import './styles/global.scss';

const App: React.FC = () => {
  return (
    <div id="app">
      <Routes>
        <Route path="/" element={<PostureDetector />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
};

export default App;

