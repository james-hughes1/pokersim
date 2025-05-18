import React, { useState, useEffect } from 'react';
import './GamePage.css';
import PokerGame from "../poker_engine/poker.js";

const userName = localStorage.getItem("userName") || "User";
const game = new PokerGame([userName, "Robo-Rob", "Electric Elle", "Cyber Steve"]);
game.playUntilEliminated();

function GamePage() {
  const [players, setPlayers] = useState(game.players);
  const [sliderValues, setSliderValues] = useState(players.map(() => 10));
  const [currentPlayer, setCurrentPlayer] = useState(game.bettingRound.currentPlayer);
  const [communityCards, setCommunityCards] = useState(game.communityCards || []);
  const [winMessage, setWinMessage] = useState("");
  const [feedVersion, setFeedVersion] = useState(0);

  // Sync UI with the current game state on component mount
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers([...game.players]);
      setCommunityCards([...game.communityCards || []]);
      setCurrentPlayer(game.bettingRound.currentPlayer);
      setWinMessage(game.winMessage);
      setFeedVersion(prev => prev + 1);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const getCardImage = (card) => {
    const rank = card.rank;
    const suit = card.suit[0].toLowerCase(); // S, H, D, C
    return `/cards/${rank}${suit}.png`;
  };

  const handleAction = (PlayerName, action) => {
    const player = players[PlayerName];
    const raiseAmount = sliderValues[PlayerName];
    game.bettingRound.processAction(player.name, action, raiseAmount);

    // Update state to reflect game changes
    setPlayers([...game.players]);
    setCurrentPlayer(game.bettingRound.currentPlayer);
    setCommunityCards([...game.communityCards || []]);
  };

  const handleSliderChange = (index, value) => {
    const newSliders = [...sliderValues];
    newSliders[index] = value;
    setSliderValues(newSliders);
  };

  useEffect(() => {
    const el = document.querySelector(".feed-messages");
    if (el) el.scrollTop = el.scrollHeight;
  }, [feedVersion]);

  return (
    <div className="table-container">
      {/* New Game Feed Section */}
      <div className="game-feed">
        <h3>Game Feed</h3>
        <div className="feed-messages">
          {game.actionLog.messages.map((msg, i) => (
            <div key={i} className="feed-line">{msg}</div>
          ))}
        </div>
      </div>

      <div className="community-cards">
        {Array.from({ length: 5 }).map((_, i) => (
          <img
            key={i}
            src={
              communityCards[i]
                ? getCardImage(communityCards[i])
                : '/cards/back.png'
            }
            alt={`Community card ${i + 1}`}
            className="card-img"
          />
        ))}
      </div>

      <div className="pot-display">
        🪙 Pot: ${game.pot}
      </div>

      <div className="players-wrapper">
        {players.map((player, index) => {
          const isTurn = currentPlayer && currentPlayer.name === player.name;
          return (
            <div className={`player-card ${player.hasFolded ? 'folded' : ''}`} key={index}>
              <div className="player-header">
                {isTurn && <span className="arrow">➡️</span>}
                <span className="player-name">{player.name}</span>
              </div>
              <div>Stack: ${player.stack}</div>
              <div>Bet: ${player.currentBet}</div>

              {index === game.dealerIndex && (
                <div className="dealer-chip">D</div>
              )}

              {player.thinking && (
                <div className="thinking-indicator">
                  <div className="spinner" />
                  <span>Thinking...</span>
                </div>
              )}

              <div className="hand">
                {player.showHands
                    ? player.hand.map((card, i) => (
                        <img
                          key={i}
                          src={getCardImage(card)}
                          alt={`${card.rank} of ${card.suit}`}
                          className="card-img"
                        />
                      ))
                    : player.hand.map((_, i) => (
                        <img
                          key={i}
                          src="/cards/back.png"
                          alt="Hidden card"
                          className="card-img"
                        />
                      ))}
              </div>
              {!player.hasFolded && player.name === userName && (
                <div className="actions-section">
                  <button onClick={() => handleAction(index, 'fold')}>Fold</button>
                  <button onClick={() => handleAction(index, 'call')}>Check/Call</button>
                  <button onClick={() => handleAction(index, 'raise')}>Raise</button>
                  <div className="slider-container">
                    Raise Amount: ${sliderValues[index]}
                    <input
                      type="range"
                      min="5"
                      max={player.stack}
                      value={sliderValues[index]}
                      onChange={(e) => handleSliderChange(index, Number(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Display the win message if it exists */}
      {winMessage && (
        <div className="win-message">
          {winMessage}
        </div>
      )}
    </div>
  );
}

export default GamePage;
