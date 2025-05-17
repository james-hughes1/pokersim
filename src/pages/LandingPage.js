import React, { useState } from "react";
import { useNavigate } from "react-router-dom";  // Change here
import "./LandingPage.css";

const LandingPage = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();  // Change here

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleSubmit = () => {
    if (name.trim()) {
      // navigate("/game", { state: { name } });  // Change here
      localStorage.setItem("userName", name);
      navigate("/game");
    } else {
      alert("Please enter a name!");
    }
  };

  return (
    <div className="landing-container">
      <h1 className="landing-title">Welcome to Poker Game</h1>
      <p className="landing-description">
        Enter your name to start playing!
      </p>
      <input
        type="text"
        value={name}
        onChange={handleNameChange}
        className="name-input"
        placeholder="Enter your name"
      />
      <button onClick={handleSubmit} className="start-button">
        Start Game
      </button>
    </div>
  );
};

export default LandingPage;
