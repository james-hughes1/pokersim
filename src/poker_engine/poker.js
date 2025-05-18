import { getCohereResponse } from '../services/cohereApi.js';

var Hand = require('pokersolver').Hand;

function formatCards(cards) {
    const suitSymbols = {
      'Clubs': '♣',
      'Diamonds': '♦',
      'Hearts': '♥',
      'Spades': '♠'
    };
  
    return cards.map(card => `${card.rank}${suitSymbols[card.suit]}`).join(' ');
}

// Helper to convert suit to letter
function suitToChar(suit) {
  switch (suit.toLowerCase()) {
    case 'hearts': return 'h';
    case 'diamonds': return 'd';
    case 'clubs': return 'c';
    case 'spades': return 's';
    default: throw new Error('Invalid suit: ' + suit);
  }
}

// Convert ['A', 'Hearts'] -> 'Ah'
function cardToString(card) {
  return `${card.rank}${suitToChar(card.suit)}`;
}

// Main function to convert input into 7-card strings per player
function buildPlayerHands(communityCards, playersHoleCards) {
  const communityStrs = communityCards.map(cardToString);

  return playersHoleCards.map(holeCards => {
    const holeStrs = holeCards.map(cardToString);
    return [...holeStrs, ...communityStrs];
  });
}

function findWinnerIndexes(activeHands, winnerHands) {
  // Sort each hand alphabetically for comparison
  const normalize = hand => [...hand].sort().join(',');

  const normalizedActive = activeHands.map(normalize);
  const normalizedWinners = winnerHands.map(normalize);

  return normalizedWinners.map(winner =>
    normalizedActive.findIndex(hand => hand === winner)
  );
}

class BettingRound {
    constructor(players, communityCards, actionLog, dealerIndex, userName, blind = null) {
      this.players = players.filter(p => !p.hasFolded);  // Only active players

      // Figure out who goes first after dealer (people may have folded)
      let allPlayerIndex = (dealerIndex + 1) % players.length;
      this.currentPlayer = players[allPlayerIndex];
      this.currentPlayerIndex = this.players.findIndex(p => p.name === this.currentPlayer.name);
      while (this.currentPlayerIndex === -1) {
        allPlayerIndex = (allPlayerIndex + 1) % players.length;
        this.currentPlayer = players[allPlayerIndex];
        this.currentPlayerIndex = this.players.findIndex(p => p.name === this.currentPlayer.name);
      }
      this.communityCards = communityCards;
      this.currentBet = 0;
      this.userName = userName;
      this.players.forEach(player => {
        player.currentBet = 0;
      });
      this.minBets = this.players.length;
      this.numBets = 0;
      this.pot = 0;
      this.actionLog = actionLog;
      if (blind) {
        this.blind = blind;
        this.blindBets();
      }
      // Setup a Promise
      this.finishPromise = new Promise((resolve) => {
        this._resolveFinish = resolve; // Save resolver function
      });

      // If all-in, skip
      if (this.players.every(player => player.stack === 0)) {
        this._resolveFinish();
      }
    }

    async waitForFinish() {
        return this.finishPromise; // Wait until someone calls resolve
    }

    blindBets() {
        this.actionLog.addMessage("Blind betting:");
        let player = this.getCurrentPlayer();
        this.processAction(player.name, 'raise', this.blind, true);
        player = this.getCurrentPlayer();
        this.processAction(player.name, 'raise', this.blind, true);
        this.numBets = 2;
        this.actionLog.addMessage("Blind betting finished.");
    }
  
    getCurrentPlayer() {
      return this.players[this.currentPlayerIndex];
    }
  
    async processAction(playerName, action, amount = 0, blindForce = false) {
      const player = this.getCurrentPlayer();
      if (player.name === playerName) {
        if (this.communityCards.length === 0) {
          this.actionLog.addAction(player.name,action,amount,formatCards(player.hand));
        } else {
          const fullPlayerHand = buildPlayerHands(this.communityCards, [player.hand])[0];
          const descr = Hand.solve(fullPlayerHand).descr;
          this.actionLog.addAction(player.name,action,amount,descr);
        }
        if (action === 'call') {
            this.call(player);
        } else if (action === 'raise') {
            this.raise(player, amount);
        } else {
            // Assume fold otherwise
            this.fold(player);
            this.currentPlayerIndex = (this.currentPlayerIndex - 1) % this.players.length;
            this.currentPlayer = this.players[this.currentPlayerIndex];
        }

        this.numBets += 1;
        if (this.isRoundOver()) {
            console.log(`Betting round finished. Pot is $${this.pot}`);
            this.actionLog.addMessage(`Betting round finished. Pot is $${this.pot}.`);
            this._resolveFinish();
        } else {
            this.nextPlayer();
            if (this.getCurrentPlayer().name !== 'User' && !blindForce) {
              await this.promptAIForAction();
            }
        }
      }
    }
  
    fold(player) {
      player.makeMove('fold');
      console.log(`${player.name} folds.`);
      this.actionLog.addMessage(`${player.name} folds.`);
      this.removePlayer(player);
    }
  
    call(player) {
      const amountToCall = this.currentBet - player.currentBet;
      
      if (player.stack < amountToCall) {
        console.log(`${player.name} is all-in with ${player.stack}!`);
        this.actionLog.addMessage(`${player.name} is all-in with $${player.stack}!`);
        this.pot += player.stack;
        player.makeMove('call', player.stack);
      } else {
        this.pot += amountToCall;
        player.makeMove('call', amountToCall);
        console.log(`${player.name} calls.`);
        this.actionLog.addMessage(`${player.name} ${amountToCall > 0 ? "calls" : "checks"}.`);
      }
    }
  
    raise(player, amount) {
      const totalAmount = (this.currentBet - player.currentBet) + amount;
  
      if (player.stack < totalAmount) {
        if (player.stack === 0) {
          console.log(`${player.name} still all in.`);
          player.makeMove('call', 0);
        } else {
          // Not enough to match the bet
          if (player.stack < this.currentBet - player.currentBet) {
            this.pot += this.currentBet - player.currentBet;
            player.makeMove('call', this.currentBet - player.currentBet);
            console.log(`${player.name} all in.`);
            this.actionLog.addMessage(`${player.name} is all-in.`);
          } else {
            // Enough to match but not fully make the stated raise
            const raiseAmount = player.stack - (this.currentBet - player.currentBet);
            this.pot += player.stack;
            player.makeMove('raise', player.stack);
            this.currentBet = player.currentBet;
            console.log(`${player.name} raises by ${raiseAmount} to go all-in, total bet is now ${this.currentBet}.`);
            this.actionLog.addMessage(`${player.name} raises by $${raiseAmount} to go all-in, total bet is now $${this.currentBet}.`);
          }
        }
      } else {
        this.pot += totalAmount;
        player.makeMove('raise', totalAmount);
        this.currentBet = player.currentBet;
        console.log(`${player.name} raises by ${amount}, total bet is now ${this.currentBet}.`);
        this.actionLog.addMessage(`${player.name} raises by $${amount}, total bet is now $${this.currentBet}.`);
      }
    }
  
    nextPlayer() {
      do {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      } while (this.players[this.currentPlayerIndex].hasFolded);
      this.currentPlayer = this.players[this.currentPlayerIndex];
  
      // NOTE: Don't automatically do anything after this.
      // Wait for UI to call processAction() next!
    }
  
    removePlayer(player) {
      this.players = this.players.filter(p => p !== player);
    }
  
    isRoundOver() {
      const activePlayers = this.players.filter(p => !p.hasFolded);
      const nonAllInPlayers = activePlayers.filter(p => p.stack > 0);  // players who still have chips
      const allCalled = nonAllInPlayers.every(p => p.currentBet === this.currentBet) && (this.numBets >= this.minBets);
      return activePlayers.length <= 1 || allCalled;
    }

  async promptAIForAction() {
    const player = this.getCurrentPlayer();

    if (player.name === this.userName) {
      return; // Wait for user input
    }

    console.log("Prompting AI for action...");
    player.thinking = true;

    // Delay 5 seconds before attempting the prompt
    await new Promise(resolve => setTimeout(resolve, 10000));

    let historyString = this.actionLog.getActionHistoryString(player.name);
    historyString = '...' + historyString.slice(-100);
    const prompt = `You're playing Texas Holdem as ${player.name}. Your hole cards: ${formatCards(player.hand)}. Moves: ${historyString}. Stacks: ${this.players.map(player => `${player.name}: $${player.stack}`).join('|')}. Recommend best move in form of (call, raise, fold) and amount.`.replace(/♠/g, 's')
      .replace(/♥/g, 'h')
      .replace(/♦/g, 'd')
      .replace(/♣/g, 'c');

    // Retry logic
    const maxRetries = 3;
    let response;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt + 1}: sending prompt...`);

        // Race against a timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI response timeout")), 2000)
        );

        response = await Promise.race([
          getCohereResponse(prompt),
          timeoutPromise
        ]);

        break; // If successful, break the loop

      } catch (err) {
        console.warn(`Attempt ${attempt + 1} failed:`, err.message);

        if (attempt === maxRetries - 1) {
          console.error("Max retries reached. Using fallback action.");
        } else {
          await new Promise(res => setTimeout(res, 2000 * (attempt + 1))); // Backoff: 2s, 4s...
        }
      }
    }

    player.thinking = false;

    if (response) {
      try {
        const { action, amount } = JSON.parse(response.data.message.content[0].text);
        console.log(`AI recommends: ${action} with amount ${amount}`);
        await this.processAction(player.name, action, amount);
      } catch (e) {
        console.error("Failed to parse AI response:", e);
        await this.processAction(player.name, 'fold', 0); // Parse fail fallback
      }
    } else {
      // Fallback: random between fold/call
      const fallback = Math.random() > 0.5 ? 'fold' : 'call';
      await this.processAction(player.name, fallback, 0);
    }
  }
}
  
class ActionLog {
    constructor() {
      this.actions = [];  // Array to store actions
      this.pot = 0;
      this.messages = []; // For message feed UI
    }
  
    // Method to add a new action
    addAction(playerName, action, amount, descr) {
      const actionData = { playerName, action, amount, descr};
      this.actions.push(actionData);
    }

    addMessage(msg) {
      this.messages.push(msg);
    }

    addWinner(activePlayers, winningPlayers, pot, communityCards) {
        for (const player of activePlayers) {
          var action;
          var amount;
          if (winningPlayers.includes(player)) {
            action = "win";
            amount = Math.floor(pot / winningPlayers.length);
          } else {
            action = "lose";
            amount = player.currentBet;
          }
          const fullPlayerHand = buildPlayerHands(communityCards, [player.hand])[0];
          const descr = Hand.solve(fullPlayerHand).descr;
          this.addAction(player.name, action, amount, descr);
        }
    }

    // Method to get the action log
    getActions() {
      return this.actions;
    }

    printActions() {
      console.log("Action Log:");
      this.actions.forEach(action => {
        console.log(`${action.playerName} ${action.action} ${action.amount} ${action.descr}`);
      });
    }

    getActionHistoryString(currentName) {
      let historyString = this.actions
        .map(a => `${a.playerName} ${a.action} ${a.amount > 0 ? '$' + a.amount : ''} ${a.action.includes("deal")?a.descr:''}`)
        .join(', ');
      historyString = historyString.replace(/♠/g, 's')
        .replace(/♥/g, 'h')
        .replace(/♦/g, 'd')
        .replace(/♣/g, 'c');
      return historyString;
    }
}
  

class Deck {
    constructor() {
      this.suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
      this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
      this.cards = [];
  
      this.suits.forEach(suit => {
        this.ranks.forEach(rank => {
          this.cards.push({ rank, suit });
        });
      });
    }
  
    drawCard() {
      if (this.cards.length === 0) {
        throw new Error('No more cards in the deck');
      }
      const randomIndex = Math.floor(Math.random() * this.cards.length);
      return this.cards.splice(randomIndex, 1)[0];
    }
  
    shuffle() {
      for (let i = this.cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
      }
    }

    reset() {
      this.cards = [];
      this.suits.forEach(suit => {
        this.ranks.forEach(rank => {
          this.cards.push({ rank, suit });
        });
      });
    }
}


class Player {
    constructor(name, stack = 1000) {
      this.name = name;
      this.stack = stack;
      this.currentBet = 0;
      this.hasFolded = false;
      this.hand = [];
      this.thinking = false;
      this.showHands = false;
    }
  
    makeMove(action, amount = 0) {  
      switch (action.toLowerCase()) {
        case 'fold':
          this.hasFolded = true;
          break;
        case 'call':
          this.currentBet += amount;
          this.stack -= amount;
          break;
        case 'raise':
          this.currentBet += amount;
          this.stack -= amount;
          break;
        case 'check':
          break;
        default:
          console.log(`Invalid move: ${action}`);
      }
    }

    receiveCard(card) {
        this.hand.push(card);
    }
  
    resetForNextRound() {
      this.currentBet = 0;
      this.hasFolded = false;
      this.hand = [];
    }
  }
  

class PokerGame {
    constructor(playerNames) {
        this.userName = playerNames[0];
        this.players = playerNames.map(name => new Player(name));
        this.resetGame();
        this.actionLog = new ActionLog();
        this.blind = 5;
        this.dealerIndex = 1;
        this.winMessage = "";
    }

    resetGame() {
        this.pot = 0;
        this.communityCards = []; // Not handling cards yet
        this.currentRound = 'Pre-Flop';
        this.deck = new Deck();
        this.deck.shuffle();
    }

    async checkForWinner() {
        const activePlayers = this.players.filter(player => !player.hasFolded);
        if (activePlayers.length === 1) {
          const winner = activePlayers[0];
          console.log(`🏆 ${winner.name} wins! Everyone else folded.`);
          this.actionLog.addMessage(`🏆 ${winner.name} wins! Everyone else folded.`);
          // Delay 5 seconds before moving to next round
          this.winMessage = `🏆 ${winner.name} wins! Everyone else folded.`;
          await new Promise(resolve => setTimeout(resolve, 5000));
          this.winMessage = "";

          this.actionLog.addWinner(activePlayers, activePlayers, this.pot, this.communityCards);
          winner.stack += this.pot;
          this.pot = 0;
          return [winner];
        }
    
        if (this.currentRound === 'Showdown') {
          const holeCardsList = activePlayers.map(player => player.hand);
          const fullPlayerHands = buildPlayerHands(this.communityCards, holeCardsList);
          const evalPlayerHands = [...fullPlayerHands.map(hand => Hand.solve(hand))];
          const winner = Hand.winners(evalPlayerHands);
          const fullWinningHands = winner.map(w => [...w.cardPool.map(card => `${card.value}${card.suit}`)]);
          const winnerIndexes = findWinnerIndexes(fullPlayerHands, fullWinningHands);
          const winningPlayers = [...winnerIndexes.map(i => activePlayers[i])];
          if (winningPlayers.length === 1) {
            console.log(`🏆 Winner: ${winningPlayers[0].name}`);
            console.log(`Hole cards: ${formatCards(winningPlayers[0].hand)}`);
            console.log(`Hand: ${winner[0].descr}`)
            this.actionLog.addMessage(`🏆 Winner: ${winningPlayers[0].name} with hand ${winner[0].descr}`);
            // Delay 5 seconds before moving to next round
            this.winMessage = `🏆 Winner: ${winningPlayers[0].name} with hand ${winner[0].descr}`;
            activePlayers.forEach(p => {p.showHands = true;});
            await new Promise(resolve => setTimeout(resolve, 5000));
            this.winMessage = "";
            activePlayers.forEach(p => {p.showHands = false;});
          } else {
            console.log(`Tie: ${winner[0].descr}`);
            this.actionLog.addMessage(`🏆 Tie: ${winningPlayers.map(p => p.name).join(", ")} with hand ${winner[0].descr}.`);
            winningPlayers.map(p => console.log(`${p.name}, ${formatCards(p.hand)}`));
            // Delay 5 seconds before moving to next round
            this.winMessage = `🏆 Tie: ${winningPlayers.map(p => p.name).join(", ")} with hand ${winner[0].descr}.`;
            activePlayers.forEach(p => {p.showHands = true;});
            await new Promise(resolve => setTimeout(resolve, 5000));
            this.winMessage = "";
            activePlayers.forEach(p => {p.showHands = false;});
          }
          this.actionLog.addWinner(activePlayers, winningPlayers, this.pot, this.communityCards);

          winningPlayers.forEach(player => {player.stack += Math.floor(this.pot / winningPlayers.length)});
          this.pot = 0;
          return winningPlayers;
        }

        // No winner yet
        return null;
    }

    async startBettingRound(blind=null) {
        console.log("Betting round started!");
        this.bettingRound = new BettingRound(this.players, this.communityCards, this.actionLog, this.dealerIndex, this.userName, blind);
        await this.bettingRound.promptAIForAction();
        await this.bettingRound.waitForFinish(); // <-- REAL AWAIT now
    }

    nextStage() {
        switch (this.currentRound) {
        case 'Pre-Flop':
            this.currentRound = 'Flop';
            this.communityCards.push(this.deck.drawCard());
            this.communityCards.push(this.deck.drawCard());
            this.communityCards.push(this.deck.drawCard());
            this.printSummary(this.userName);
            this.actionLog.addAction(this.players[this.dealerIndex].name, `deal-${this.currentRound}`, 0, formatCards(this.communityCards));
            this.actionLog.addMessage("Flop dealt.");
            break;
        case 'Flop':
            this.currentRound = 'Turn';
            this.communityCards.push(this.deck.drawCard());
            this.printSummary(this.userName);
            this.actionLog.addAction(this.players[this.dealerIndex].name, `deal-${this.currentRound}`, 0, formatCards(this.communityCards));
            this.actionLog.addMessage("Turn dealt.");
            break;
        case 'Turn':
            this.currentRound = 'River';
            this.communityCards.push(this.deck.drawCard());
            this.printSummary(this.userName);
            this.actionLog.addAction(this.players[this.dealerIndex].name, `deal-${this.currentRound}`, 0, formatCards(this.communityCards));
            this.actionLog.addMessage("River dealt.");
            break;
        case 'River':
            this.currentRound = 'Showdown';
            break;
        default:
            console.log('The game is over!');
            break;
        }
    }

    printSummary(playerName) {
        const player = this.players.find(p => p.name === playerName);
        if (!player) {
        console.log(`Player ${playerName} not found.`);
        return;
        }
        console.log('--- Game Summary ---');
        console.log(`Current Stage: ${this.currentRound}`);
        console.log(`Pot: $${this.pot}`);
        console.log('Community cards:', formatCards(this.communityCards));
        console.log(`${player.name}'s hand:`, formatCards(player.hand));
        console.log('Player Stacks:');
        this.players.forEach(player => {
        console.log(`${player.name}: $${player.stack} ${player.hasFolded ? '(Folded)' : ''}`);
        });
        console.log('---------------------');
    }

    async playMatch() {
        console.log("Dealing new cards...");
        this.actionLog.addMessage("New round started.");
        this.players.forEach(player => {
            player.receiveCard(this.deck.drawCard());
            player.receiveCard(this.deck.drawCard());
        });
        this.players.find(p => p.name === this.userName).showHands = true;
        await this.startBettingRound(this.blind);
        this.pot += this.bettingRound.pot;
        this.nextStage();
        let foundWinner = null;
        foundWinner = await this.checkForWinner();
        while (!foundWinner) {
            await this.startBettingRound();
            this.pot += this.bettingRound.pot;
            this.nextStage();
            foundWinner = await this.checkForWinner();
        }
        this.printSummary(this.userName);
    }

    checkEnded () {
        if (!this.players.some(p => p.name === this.userName)) {
            return "lose";
        } else {
            if (this.players.length === 1) {
                return "win";
            } else {
                return null;
            }
        }
    }

    async playUntilEliminated () {
        while (
          !this.checkEnded()
        ) {
          await this.playMatch();
          this.actionLog.printActions();
          this.players = this.players.filter(p => p.stack > 0);
          this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
          this.resetGame();
          this.players.forEach(player => player.resetForNextRound());
        }
      switch (this.checkEnded()) {
        case "win":
          this.winMessage = "Congratulations you win!"
          break;
        case "lose":
          this.winMessage = "Uh-oh you lose!"
          break;
        default:
          break;
      }
    }

}

export default PokerGame;
