import React, { useEffect, useRef, useState } from 'react';
import './GamePage.css';
import PokerGame from "../poker_engine/poker.js";

function GamePage() {
  const userName = localStorage.getItem("userName") || "User";

  const gameRef = useRef(null);
  if (!gameRef.current) {
    gameRef.current = new PokerGame([userName, "Robo-Rob", "Electric Elle", "Cyber Steve"]);
    gameRef.current.playUntilEliminated();
  }
  const game = gameRef.current;

  const [players, setPlayers] = useState(game.players);
  const [sliderValues, setSliderValues] = useState(players.map(() => 10));
  const [currentPlayer, setCurrentPlayer] = useState(game.bettingRound.currentPlayer);
  const [communityCards, setCommunityCards] = useState(game.communityCards || []);
  const [winMessage, setWinMessage] = useState("");
  const [feedVersion, setFeedVersion] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers([...game.players]);
      setCommunityCards([...game.communityCards || []]);
      setCurrentPlayer(game.bettingRound.currentPlayer);
      setWinMessage(game.winMessage);
      setFeedVersion(prev => prev + 1);
    }, 200);

    return () => clearInterval(interval);
  }, [game]);

  const getCardImage = (card) => {
    const rank = card.rank;
    const suit = card.suit[0].toLowerCase(); // S, H, D, C
    return `/cards/${rank}${suit}.png`;
  };

  const handleAction = (PlayerIndex, action) => {
    const player = players[PlayerIndex];
    const raiseAmount = sliderValues[PlayerIndex];
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

  // Feed functionality
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const feedRef = useRef(null);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;

    const handleScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
      setShouldAutoScroll(atBottom);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const el = feedRef.current;
    if (shouldAutoScroll && el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [feedVersion, shouldAutoScroll]);

  return (
    <div className="table-container">
      {/* New Game Feed Section */}
      <div className="game-feed">
        <h3>Game Feed</h3>
        <div className="feed-messages" ref={feedRef}>
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
