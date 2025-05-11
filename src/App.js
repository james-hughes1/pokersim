import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; // Import Routes instead of Switch
import LandingPage from "./pages/LandingPage";
import GamePage from "./pages/GamePage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/game" element={<GamePage />} /> 
      </Routes>
    </Router>
  );
}

export default App;
