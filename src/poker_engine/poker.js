function formatCards(cards) {
    const suitSymbols = {
      'Clubs': '♣',
      'Diamonds': '♦',
      'Hearts': '♥',
      'Spades': '♠'
    };
  
    return cards.map(card => `${card.rank}${suitSymbols[card.suit]}`).join(' ');
}

class BettingRound {
    constructor(players, actionLog, blind = null) {
      this.players = players.filter(p => !p.hasFolded);  // Only active players
      this.currentBet = 0;
      this.players.forEach(player => {
        player.currentBet = 0;
      });
      this.minBets = this.players.length;
      this.numBets = 0;
      this.pot = 0;
      this.currentPlayerIndex = 0;
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
        this.raise(player, this.blind);
        this.nextPlayer();
        player = this.getCurrentPlayer();
        this.raise(player, this.blind);
        this.nextPlayer();
        this.numBets = 2;
    }
  
    getCurrentPlayer() {
      return this.players[this.currentPlayerIndex];
    }
  
    processAction(playerName, action, amount = 0) {
      const player = this.getCurrentPlayer();
      if (player.name === playerName) {
        this.actionLog.addAction(player.name,action,amount);
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
    addAction(player, action, amount) {
      const actionData = { player, action, amount };
      this.actions.push(actionData);
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
        if (action.action === "raise") {
            console.log(`${action.player} ${action.action} ${action.amount}`);
        } else {
            console.log(`${action.player} ${action.action}`);
        }
      });
    }
}
  

class Deck {
    constructor() {
      this.suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
      this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
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
      if (this.hasFolded) {
        console.log(`${this.name} has already folded.`);
        return;
      }
  
      switch (action.toLowerCase()) {
        case 'fold':
          this.hasFolded = true;
          console.log(`${this.name} folds.`);
          break;
        case 'call':
          this.currentBet += amount;
          this.stack -= amount;
          console.log(`${this.name} calls ${amount}.`);
          break;
        case 'raise':
          this.currentBet += amount;
          this.stack -= amount;
          console.log(`${this.name} raises ${amount}.`);
          break;
        case 'check':
          console.log(`${this.name} checks.`);
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
        this.pot = 0;
        this.communityCards = []; // Not handling cards yet
        this.currentRound = 'Pre-Flop';
        this.actionLog = new ActionLog();
        this.deck = new Deck();
        this.deck.shuffle();
        this.blind = 5;
    }

    startGame() {
        console.log(`Starting ${this.currentRound}...`);
        this.players.forEach(player => player.resetForNextRound());
        this.players.forEach(player => {
            player.receiveCard(this.deck.drawCard());
            player.receiveCard(this.deck.drawCard());
        });
        this.startBettingRound(this.blind)
    }

    checkForWinner() {
        const activePlayers = this.players.filter(player => !player.folded);
    
        if (activePlayers.length === 1) {
        const winner = activePlayers[0];
        console.log(`🏆 ${winner.name} wins! Everyone else folded.`);
        winner.chips += this.pot;
        this.pot = 0;
        return winner;
        }
    
        if (this.currentRound === 'Showdown') {
        // Simple placeholder for hand strength
        const handStrengths = activePlayers.map(player => ({
            player,
            strength: this.evaluateHand(player.hand.concat(this.communityCards))
        }));
    
        handStrengths.sort((a, b) => b.strength - a.strength);
    
        const winner = handStrengths[0].player;
        console.log(`🏆 ${winner.name} wins at showdown!`);
        winner.chips += this.pot;
        this.pot = 0;
        return winner;
        }
    
        // No winner yet
        return null;
    }
  
    // Placeholder for hand evaluator - you can replace this with real poker hand logic
    evaluateHand(cards) {
        // Just random scoring for now
        return Math.floor(Math.random() * 1000);
    }
    

    async startBettingRound(blind=null) {
        console.log("Betting round started!");
        this.bettingRound = new BettingRound(this.players, this.actionLog, blind);
        
        await this.bettingRound.waitForFinish(); // <-- REAL AWAIT now
      
        console.log(`Betting round finished. Pot is ${this.bettingRound.pot}`);

        this.nextStage();
        this.printSummary("Alice");
    }

    nextStage() {
        this.pot = this.actionLog.pot;
        switch (this.currentRound) {
        case 'Pre-Flop':
            if (!this.checkForWinner()) {
                this.currentRound = 'Flop';
                this.communityCards.push(this.deck.drawCard());
                this.communityCards.push(this.deck.drawCard());
                this.communityCards.push(this.deck.drawCard());
                this.startBettingRound()
            } else {
                this.currentRound = 'End';
            }
            break;
        case 'Flop':
            if (!this.checkForWinner()) {
                this.currentRound = 'Turn';
                this.communityCards.push(this.deck.drawCard());
                this.startBettingRound()
            } else {
                this.currentRound = 'End';
            }
            break;
        case 'Turn':
            if (!this.checkForWinner()) {
                this.currentRound = 'River';
                this.communityCards.push(this.deck.drawCard());
                this.startBettingRound()
            } else {
                this.currentRound = 'End';
            }
            break;
        case 'River':
            if (!this.checkForWinner()) {
                this.currentRound = 'Showdown';
                this.checkForWinner();
            } else {
                this.currentRound = 'End';
            }
            break;
        default:
            this.checkForWinner()
            console.log('The game is over!');
            break;
        }
        console.log(`Moving to ${this.currentRound}`);
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
        this.actionLog.printActions()
        console.log('Player Stacks:');
        this.players.forEach(player => {
        console.log(`${player.name}: $${player.stack} ${player.hasFolded ? '(Folded)' : ''}`);
        });
        console.log('---------------------');
    }
}

export default PokerGame;
