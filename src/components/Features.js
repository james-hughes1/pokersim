import React from "react";
import "./Features.css";

function Features() {
  return (
    <section className="features" id="features">
      <div className="feature">
        <h2>Realistic Gameplay</h2>
        <p>Experience poker as if you're sitting at a real table, with AI opponents.</p>
      </div>
      <div className="feature">
        <h2>Multiplayer Mode</h2>
        <p>Challenge your friends or play against others online.</p>
      </div>
      <div className="feature">
        <h2>Customizable Poker Rules</h2>
        <p>Adjust the rules to your preference, whether you're playing Texas Hold'em or Omaha.</p>
      </div>
    </section>
  );
}

export default Features;
