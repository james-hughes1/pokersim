import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleSubmit = () => {
    if (name.trim()) {
      localStorage.setItem("userName", name);
      navigate("/game");
    } else {
      alert("Please enter a name!");
    }
  };

  return (
    <div className="landing-container">
      <img src="/images/chip.png" alt="Poker Chip" className="poker-chip" />
      <h1 className="landing-title">Welcome to Poker Royale</h1>
      <p className="landing-description">Enter your name to join the table</p>
      <input
        type="text"
        value={name}
        onChange={handleNameChange}
        className="name-input"
        placeholder="Your Name"
      />
      <button onClick={handleSubmit} className="start-button">
        🎲 Start Playing
      </button>
    </div>
  );
};

export default LandingPage;
