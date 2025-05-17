import React, { useState, useEffect } from 'react';
import { getCohereResponse } from '../services/cohereApi';
import "./GamePage.css";
import PokerGame from "../poker_engine/poker.js";

const initialPlayers = [
  { name: "Player" },
  { name: "Bob" },
  { name: "Charlie" },
  { name: "Diana" },
  { name: "Eve" },
];

const game = new PokerGame(initialPlayers.map(player=>player.name));

const GamePage = () => {

  // useEffect(() => {
  //   // Only call ONCE when the page loads
  //   handleGenerate(
  //     "Produce a JSON that details the actions of a poker player. Here is the history of the current game so far, with the context that this player is 3rd out of 5 players. First round bets: 5, 10, 10, 10, 10, you get A club 2 diamond, community cards are A spades 3 spades, bets 10 fold, now it's your turn."
  //   );
  // }, []); // ← empty dependency array = run only ONCE after mount

  // useEffect(() => {
  //   console.log(move);
  // }, [move]); // ← log when move changes

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

export default GamePage;

game.playUntilEliminated();

// useEffect(() => {
//   const playUntilEliminated = async () => {
//     while (
//       game.players.length > 1 &&
//       game.players.find(p => p.name === "Player")?.stack > 0
//     ) {
//       await game.startGame(); // must return a Promise
//       game.players = game.players.filter(p => p.stack > 0);
//       forceUpdate(n => n + 1); // update UI after each game
//     }

//     // Optional: alert or message
//     if (game.players.length === 1) {
//       alert(`${game.players[0].name} is the winner!`);
//     } else {
//       alert("You're out of chips!");
//     }
//   };

//   playUntilEliminated(); // run on mount
// }, []);
