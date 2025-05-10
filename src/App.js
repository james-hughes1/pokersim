import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import LlmChatPage from './pages/LlmChatPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<LlmChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;
