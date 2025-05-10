import React from "react";
import "./Hero.css"; // Optional: External styles

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Poker Simulator</h1>
        <p>Play poker like never before. Train, play, and master the game!</p>
        <a href="#features" className="cta-button">
          Start Playing
        </a>
      </div>
    </section>
  );
}

export default Hero;