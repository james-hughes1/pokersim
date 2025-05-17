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
    constructor(players, communityCards, actionLog, dealerIndex, blind = null) {
      this.players = players.filter(p => !p.hasFolded);  // Only active players
      this.communityCards = communityCards;
      this.currentBet = 0;
      this.players.forEach(player => {
        player.currentBet = 0;
      });
      this.minBets = this.players.length;
      this.numBets = 0;
      this.pot = 0;
      this.currentPlayerIndex = (dealerIndex + 1) % players.length;
      this.actionLog = actionLog;
      if (blind) {
        this.blind = blind;
        this.blindBets();
      }
      // Setup a Promise
        this.finishPromise = new Promise((resolve) => {
        this._resolveFinish = resolve; // Save resolver function
      });
    }

    async waitForFinish() {
        return this.finishPromise; // Wait until someone calls resolve
    }

    blindBets() {
        let player = this.getCurrentPlayer();
        this.processAction(player.name, 'raise', this.blind);
        player = this.getCurrentPlayer();
        this.processAction(player.name, 'raise', this.blind);
        this.numBets = 2;
    }
  
    getCurrentPlayer() {
      return this.players[this.currentPlayerIndex];
    }
  
    processAction(playerName, action, amount = 0) {
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
        }
        this.numBets += 1;

        if (this.isRoundOver()) {
            console.log(`Betting round finished. Pot is ${this.pot}`);
            this.actionLog.addToPot(this.pot);
            this._resolveFinish();
        } else {
        this.nextPlayer();
        }
      }
    }
  
    fold(player) {
      player.makeMove('fold');
      console.log(`${player.name} folds.`);
      this.removePlayer(player);
    }
  
    call(player) {
      const amountToCall = this.currentBet - player.currentBet;
      
      if (player.stack < amountToCall) {
        console.log(`${player.name} is all-in with ${player.stack}!`);
        player.makeMove('call', player.stack);
        this.pot += player.stack;
      } else {
        player.makeMove('call', amountToCall);
        this.pot += amountToCall;
        console.log(`${player.name} calls ${amountToCall}`);
      }
    }
  
    raise(player, amount) {
      const totalAmount = (this.currentBet - player.currentBet) + amount;
  
      if (player.stack < totalAmount) {
        console.log(`${player.name} doesn't have enough to raise!`);
        return;
      }
  
      player.makeMove('raise', totalAmount);
      this.pot += totalAmount;
      this.currentBet = player.currentBet;
      console.log(`${player.name} raises by ${amount}, total bet is now ${this.currentBet}`);
    }
  
    nextPlayer() {
      do {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      } while (this.players[this.currentPlayerIndex].hasFolded);
  
      // NOTE: Don't automatically do anything after this.
      // Wait for UI to call processAction() next!
    }
  
    removePlayer(player) {
      this.players = this.players.filter(p => p !== player);
    }
  
    isRoundOver() {
      const activePlayers = this.players.filter(p => !p.hasFolded);
      const allCalled = activePlayers.every(p => p.currentBet === this.currentBet) && (this.numBets >= this.minBets);
      return activePlayers.length <= 1 || allCalled;
    }
  }
  
class ActionLog {
    constructor() {
      this.actions = [];  // Array to store actions
      this.pot = 0;
    }
  
    // Method to add a new action
    addAction(playerName, action, amount, descr) {
      const actionData = { playerName, action, amount, descr};
      this.actions.push(actionData);
    }

    addWinner(activePlayers, winningPlayers, pot, communityCards) {
        for (const player of activePlayers) {
          var action;
          var amount;
          if (winningPlayers.includes(player)) {
            action = "win";
            amount = pot / winningPlayers.length
          } else {
            action = "lose";
            amount = player.currentBet;
          }
          const fullPlayerHand = buildPlayerHands(communityCards, [player.hand])[0];
          const descr = Hand.solve(fullPlayerHand).descr;
          this.addAction(player.name, action, amount, descr);
        }
    }

    addToPot(amount) {
        this.pot += amount;
    }

    // Method to get the action log
    getActions() {
      return this.actions;
    }

    // Optional: Method to print the action log to the console
    printActions() {
      console.log("Action Log:");
      this.actions.forEach(action => {
        console.log(`${action.playerName} ${action.action} ${action.amount} ${action.descr}`);
      });
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
        this.players = playerNames.map(name => new Player(name));
        this.resetGame();
        this.actionLog = new ActionLog();
        this.blind = 5;
        this.dealerIndex = 0;
    }

    resetGame() {
        this.pot = 0;
        this.communityCards = []; // Not handling cards yet
        this.currentRound = 'Pre-Flop';
        this.deck = new Deck();
        this.deck.shuffle();
    }

    checkForWinner() {
        const activePlayers = this.players.filter(player => !player.hasFolded);
        if (activePlayers.length === 1) {
          const winner = activePlayers[0];
          console.log(`🏆 ${winner.name} wins! Everyone else folded.`);
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
          } else {
            console.log(`Tie: ${winner[0].descr}`)
            winningPlayers.map(p => console.log(`${p.name}, ${formatCards(p.hand)}`))
          }
          this.actionLog.addWinner(activePlayers, winningPlayers, this.pot, this.communityCards);

          winningPlayers.forEach(player => {player.stack += this.pot / winningPlayers.length});
          this.pot = 0;
          return winningPlayers;
        }

        // No winner yet
        return null;
    }

    async startBettingRound(blind=null) {
        console.log("Betting round started!");
        this.bettingRound = new BettingRound(this.players, this.communityCards, this.actionLog, this.dealerIndex, blind);
        await this.bettingRound.waitForFinish(); // <-- REAL AWAIT now
    }

    nextStage() {
        this.pot = this.actionLog.pot;
        switch (this.currentRound) {
        case 'Pre-Flop':
            this.currentRound = 'Flop';
            this.communityCards.push(this.deck.drawCard());
            this.communityCards.push(this.deck.drawCard());
            this.communityCards.push(this.deck.drawCard());
            this.printSummary("Player");
            this.actionLog.addAction(this.players[this.dealerIndex], this.currentRound, 0, formatCards(this.communityCards));
            break;
        case 'Flop':
            this.currentRound = 'Turn';
            this.communityCards.push(this.deck.drawCard());
            this.printSummary("Player");
            this.actionLog.addAction(this.players[this.dealerIndex], this.currentRound, 0, formatCards(this.communityCards));
            break;
        case 'Turn':
            this.currentRound = 'River';
            this.communityCards.push(this.deck.drawCard());
            this.printSummary("Player");
            this.actionLog.addAction(this.players[this.dealerIndex], this.currentRound, 0, formatCards(this.communityCards));
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
        this.players.forEach(player => {
            player.receiveCard(this.deck.drawCard());
            player.receiveCard(this.deck.drawCard());
        });
        await this.startBettingRound(this.blind);
        this.nextStage();
        while (!this.checkForWinner()) {
            await this.startBettingRound();
            this.nextStage();
        }
        this.printSummary("Player");
    }

    checkEnded () {
        if (!this.players.some(p => p.name === "Player")) {
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
    }

}

export default PokerGame;
