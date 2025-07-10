// poker.js - Schelet logică server pentru Poker Texas Hold'em (simplificat)

class PokerGame {
  constructor(roomName, players) {
    this.room = roomName;
    this.players = players; // array de {token, username, chips, hand: []}
    this.deck = [];
    this.community = [];
    this.pot = 0;
    this.currentBet = 0;
    this.turn = 0; // index in players
    this.state = "waiting"; // waiting, preflop, flop, turn, river, showdown
  }

  startGame() {
    this.deck = PokerGame.shuffle(PokerGame.fullDeck());
    this.community = [];
    this.pot = 0;
    this.currentBet = 0;
    this.state = "preflop";
    this.players.forEach((p) => {
      p.hand = [this.deck.pop(), this.deck.pop()];
      p.folded = false;
      p.allIn = false;
    });
    this.turn = 0;
    this.lastAggressor = 0; // indexul ultimului care a dat raise
    this.bets = Array(this.players.length).fill(0); // bets pe runda curenta
  }

  static fullDeck() {
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
      "A",
    ];
    return suits.flatMap((s) => ranks.map((r) => r + s));
  }

  static shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  nextTurn() {
    let count = 0;
    do {
      this.turn = (this.turn + 1) % this.players.length;
      count++;
    } while (
      (this.players[this.turn].folded || this.players[this.turn].allIn) &&
      count <= this.players.length
    );
  }

  playerAction(token, action, amount) {
    // action: 'fold', 'call', 'raise', 'check', 'allin'
    const idx = this.players.findIndex((p) => p.token === token);
    const player = this.players[idx];
    if (!player || player.folded || player.allIn) return;
    if (action === "fold") {
      player.folded = true;
    } else if (action === "call") {
      const toCall = this.currentBet - this.bets[idx];
      if (player.chips <= toCall) {
        this.pot += player.chips;
        this.bets[idx] += player.chips;
        player.chips = 0;
        player.allIn = true;
      } else {
        player.chips -= toCall;
        this.pot += toCall;
        this.bets[idx] += toCall;
      }
    } else if (action === "raise") {
      const toCall = this.currentBet - this.bets[idx];
      const total = toCall + amount;
      if (player.chips <= total) {
        this.pot += player.chips;
        this.bets[idx] += player.chips;
        player.chips = 0;
        player.allIn = true;
      } else {
        player.chips -= total;
        this.pot += total;
        this.bets[idx] += total;
        this.currentBet += amount;
        this.lastAggressor = idx;
      }
    } else if (action === "check") {
      // nimic de făcut dacă nu e de pus
    } else if (action === "allin") {
      this.pot += player.chips;
      this.bets[idx] += player.chips;
      player.chips = 0;
      player.allIn = true;
      if (this.bets[idx] > this.currentBet) {
        this.currentBet = this.bets[idx];
        this.lastAggressor = idx;
      }
    }
    // treci la următorul jucător
    this.nextTurn();
    // verifică dacă runda s-a terminat
    if (this.isBettingRoundOver()) {
      this.advanceState();
    }
  }

  isBettingRoundOver() {
    // Runda e gata dacă toți au dat call/check/fold/allin după ultimul raise
    // sau dacă doar unul a rămas
    const active = this.players.filter((p) => !p.folded && !p.allIn);
    if (active.length <= 1) return true;
    // Dacă toți au bet egal cu currentBet sau sunt allin/folded
    return this.players.every(
      (p, i) => p.folded || p.allIn || this.bets[i] === this.currentBet
    );
  }

  advanceState() {
    // Avansează starea jocului: preflop -> flop -> turn -> river -> showdown
    if (this.state === "preflop") {
      this.state = "flop";
      this.community = [this.deck.pop(), this.deck.pop(), this.deck.pop()];
    } else if (this.state === "flop") {
      this.state = "turn";
      this.community.push(this.deck.pop());
    } else if (this.state === "turn") {
      this.state = "river";
      this.community.push(this.deck.pop());
    } else if (this.state === "river") {
      this.state = "showdown";
      // TODO: determină câștigătorul
    }
    // Reset bets pentru noua rundă
    this.currentBet = 0;
    this.bets = Array(this.players.length).fill(0);
    // Găsește următorul jucător activ
    this.turn = this.players.findIndex((p) => !p.folded && !p.allIn);
  }

  getGameState() {
    // Returnează starea jocului pentru client (fără a arăta mâinile altora)
    return {
      room: this.room,
      state: this.state,
      pot: this.pot,
      community: this.community,
      players: this.players.map((p) => ({
        username: p.username,
        chips: p.chips,
        folded: p.folded,
        allIn: p.allIn,
      })),
      turn: this.turn,
    };
  }

  // ...poți adăuga metode pentru flop, turn, river, showdown, etc.
}

module.exports = PokerGame;
