import React, { useState, useEffect } from 'react';
import { getCohereResponse } from '../services/cohereApi';
import "./GamePage.css";
import PokerGame from "../poker_engine/poker.js";

const initialPlayers = [
  { name: "Alice", stack: 500, currentBet: 0, folded: false },
  { name: "Bob", stack: 500, currentBet: 0, folded: false },
  { name: "Charlie", stack: 500, currentBet: 0, folded: false },
  { name: "Diana", stack: 500, currentBet: 0, folded: false },
  { name: "Eve", stack: 500, currentBet: 0, folded: false },
];
const game = new PokerGame(initialPlayers.map(player=>player.name));

const GamePage = () => {
  const [, updateState] = useState(0);  // <- create dummy state
  const forceUpdate = () => updateState(n => n + 1);  // <- define forceUpdate
  const [raiseAmounts, setRaiseAmounts] = useState(
    initialPlayers.map(() => 0)
  );

  const handleAction = (playerName, action, amount = 0) => {
    game.bettingRound.processAction(playerName, action, amount);
    forceUpdate(n => n + 1); // Re-render after each move
  };
  

  const handleSliderChange = (index, value) => {
    const updated = [...raiseAmounts];
    updated[index] = parseInt(value, 10);
    setRaiseAmounts(updated);
  };

  const [move, setMove] = useState(null);
  const handleGenerate = async (prompt) => {
    if (!prompt.trim()) return; // Don't proceed if the prompt is empty

    try {
      // Call the getCohereResponse function from the service
      const response = await getCohereResponse(prompt);
      // Set the generated response
      const textObject = response.data.message.content[0];
      const parsedMove = JSON.parse(textObject.text);

      setMove(parsedMove);
    } catch (error) {
      console.error('Error generating text:', error);
    }
  };

  // useEffect(() => {
  //   // Only call ONCE when the page loads
  //   handleGenerate(
  //     "Produce a JSON that details the actions of a poker player. Here is the history of the current game so far, with the context that this player is 3rd out of 5 players. First round bets: 5, 10, 10, 10, 10, you get A club 2 diamond, community cards are A spades 3 spades, bets 10 fold, now it's your turn."
  //   );
  // }, []); // ← empty dependency array = run only ONCE after mount

  // useEffect(() => {
  //   console.log(move);
  // }, [move]); // ← log when move changes

  return (
    <div className="game-container">
      <h1 className="game-title">Poker Game</h1>

      <div className="players-container">
        {game.players.map((player, index) => (
          <div key={index} className="player-card">
            <h3>{player.name}</h3>
            <p>Stack: {player.stack}</p>
            <p>Current Bet: {player.currentBet}</p>
            <p>Status: {player.folded ? "Folded" : "Active"}</p>

            <div className="actions">
              <button
                disabled={player.folded}
                onClick={() => handleAction(player.name, "call")}
              >
                Call
              </button>
              <button
                disabled={player.folded}
                onClick={() => handleAction(player.name, "fold")}
              >
                Fold
              </button>
              <button
                disabled={player.folded || raiseAmounts[index] <= 0}
                onClick={() => handleAction(player.name, "raise", raiseAmounts[index])}
              >
                Raise
              </button>
            </div>

            <input
              type="range"
              min="0"
              max={player.stack}
              value={raiseAmounts[index]}
              onChange={(e) => handleSliderChange(index, e.target.value)}
              disabled={player.folded}
            />
            <div>Raise Amount: {raiseAmounts[index]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Example Usage

game.startGame();

// game.playerAction("Alice", "raise", 50);
// game.playerAction("Bob", "call", 50);
// game.playerAction("Charlie", "fold");

// game.nextStage(); // Flop

// game.playerAction("Alice", "check");
// game.playerAction("Bob", "raise", 100);

// game.printSummary("Alice");

export default GamePage;
