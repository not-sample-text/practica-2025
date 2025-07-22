const SUITS = ['h', 'd', 'c', 's'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

const counter = { iteration: 0, max: 1000, reset: () => { counter.iteration = 0; } };

const counterCheck = () => {
    counter.iteration++;
    if (counter.iteration > counter.max) {
        console.error("Infinite loop detected. Resetting counter.");
        console.error(new Error().stack);
        process.exit(1);
    }
};

function evaluateHand(sevenCards) {
    const combinations = [];
    function generateCombinations(startIndex, currentCombo) {
        if (currentCombo.length === 5) {
            combinations.push([...currentCombo]);
            return;
        }
        for (let i = startIndex; i < sevenCards.length; i++) {
            currentCombo.push(sevenCards[i]);
            generateCombinations(i + 1, currentCombo);
            currentCombo.pop();
        }
    }
    generateCombinations(0, []);

    let bestHand = { rank: -1, name: 'No Hand', highCardValues: [] };

    for (const combo of combinations) {
        const sortedCombo = [...combo].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);

        const ranks = sortedCombo.map(c => c.rank);
        const suits = sortedCombo.map(c => c.suit);
        const rankValues = ranks.map(r => RANK_VALUES[r]);

        const isFlush = suits.every(s => s === suits[0]);
        const rankCounts = ranks.reduce((acc, rank) => { acc[rank] = (acc[rank] || 0) + 1; return acc; }, {});
        const counts = Object.values(rankCounts).sort((a, b) => b - a);

        const uniqueSortedValues = [...new Set(rankValues)].sort((a, b) => a - b);
        let isStraight = false;
        if (uniqueSortedValues.length >= 5) {
            for (let i = 0; i <= uniqueSortedValues.length - 5; i++) {
                if (uniqueSortedValues[i + 4] - uniqueSortedValues[i] === 4) {
                    isStraight = true;
                    break;
                }
            }
            if ([14, 2, 3, 4, 5].every(v => uniqueSortedValues.includes(v))) {
                isStraight = true;
            }
        }

        let handName = '';
        const rankMap = { 'Straight Flush': 8, 'Four of a Kind': 7, 'Full House': 6, 'Flush': 5, 'Straight': 4, 'Three of a Kind': 3, 'Two Pair': 2, 'One Pair': 1, 'High Card': 0 };

        if (isFlush && isStraight) handName = 'Straight Flush';
        else if (counts[0] === 4) handName = 'Four of a Kind';
        else if (counts[0] === 3 && counts[1] === 2) handName = 'Full House';
        else if (isFlush) handName = 'Flush';
        else if (isStraight) handName = 'Straight';
        else if (counts[0] === 3) handName = 'Three of a Kind';
        else if (counts[0] === 2 && counts[1] === 2) handName = 'Two Pair';
        else if (counts[0] === 2) handName = 'One Pair';
        else handName = 'High Card';

        const handRank = rankMap[handName];

        if (handRank > bestHand.rank) {
            bestHand = { rank: handRank, name: handName, highCardValues: rankValues };
        } else if (handRank === bestHand.rank) {
            for (let i = 0; i < rankValues.length; i++) {
                if (rankValues[i] > bestHand.highCardValues[i]) {
                    bestHand = { rank: handRank, name: handName, highCardValues: rankValues };
                    break;
                }
                if (rankValues[i] < bestHand.highCardValues[i]) break;
            }
        }
    }
    return bestHand;
}

class Player {
    constructor(username, stack) {
        this.username = username;
        this.stack = stack;
        this.hand = [];
        this.currentBet = 0;
        this.status = 'active';
        this.token = null;
        this.isWinner = false;
        this.hasActed = false;
        this.evaluatedHand = null;
    }

    resetForNewHand() {
        this.hand = [];
        this.currentBet = 0;
        this.isWinner = false;
        this.hasActed = false;
        this.evaluatedHand = null;
        if (this.stack > 0) {
            this.status = 'active';
        } else {
            this.status = 'out';
        }
    }
}

class PokerGame {
    constructor(gameId, creatorUsername, userOptions = {}) {
        this.gameId = gameId;
        this.creatorUsername = creatorUsername;
        this.password = userOptions.password || null;
        this.playersByToken = new Map();
        this.players = [];
        this.options = {
            smallBlind: userOptions.smallBlind || 10,
            bigBlind: userOptions.bigBlind || 20,
            minPlayers: userOptions.minPlayers || 2,
            maxPlayers: userOptions.maxPlayers || 9,
        };
        this.deck = [];
        this.board = [];
        this.pot = 0;
        this.inProgress = false;
        this.round = 'pre-game';
        this.dealerIndex = -1;
        this.currentPlayerIndex = -1;
        this.lastRaiser = null;
    }

    checkPassword(passwordAttempt) {
        return !this.password || this.password === passwordAttempt;
    }

    addPlayer(token, username, stack) {
        if (this.playersByToken.has(token)) throw new Error("Ești deja la această masă.");
        if (this.players.length >= this.options.maxPlayers) throw new Error("Masa este plină.");
        const player = new Player(username, stack);
        player.token = token;
        this.players.push(player);
        this.playersByToken.set(token, player);
    }

    removePlayer(token) {
        const player = this.playersByToken.get(token);
        if (!player) return 0;
        const playerStack = player.stack + player.currentBet;

        if (this.inProgress && player.status !== 'folded' && this.players[this.currentPlayerIndex]?.token === token) {
            this.handlePlayerAction(token, 'fold');
        } else {
            player.status = 'folded';
        }

        const index = this.players.findIndex(p => p.token === token);
        if (index !== -1) {
            this.players.splice(index, 1);
            this.playersByToken.delete(token);
        }

        if (this.inProgress && this.players.filter(p => p.status !== 'folded' && p.status !== 'out').length <= 1) {
            this.determineWinners();
        }

        return playerStack;
    }

    startGame() {
        if (this.players.length < this.options.minPlayers) throw new Error("Nu sunt suficienți jucători.");
        if (this.inProgress) throw new Error("Jocul este deja în desfășurare.");
        this.inProgress = true;
        this.setupNewHand();
    }

    startNewHand() {
        if (this.round !== 'showdown') {
            throw new Error("Mâna curentă nu s-a terminat încă.");
        }
        this.inProgress = true;
        this.setupNewHand();
    }

    handlePlayerAction(token, action, amount = 0) {
        if (this.round === 'showdown') {
            throw new Error("Mâna s-a terminat. Așteaptă runda următoare.");
        }
        const player = this.playersByToken.get(token);
        if (!player || this.players[this.currentPlayerIndex]?.token !== token) {
            throw new Error("Nu este rândul tău.");
        }

        const highestBet = Math.max(...this.players.map(p => p.currentBet));

        switch (action.toLowerCase()) {
            case 'fold':
                player.status = 'folded';
                break;
            case 'check':
                if (player.currentBet < highestBet) throw new Error("Nu poți da check, trebuie să dai call sau raise.");
                break;
            case 'call':
                const callAmount = highestBet - player.currentBet;
                if (callAmount <= 0) {
                    throw new Error("Nu poți da call, trebuie să dai check.");
                }
                if (callAmount >= player.stack) {
                    player.currentBet += player.stack;
                    player.stack = 0;
                    player.status = 'all-in';
                } else {
                    player.stack -= callAmount;
                    player.currentBet += callAmount;
                }
                break;
            case 'raise':
                const totalNewBet = amount;
                const raiseAmount = totalNewBet - player.currentBet;
                const minRaiseValue = highestBet + this.options.bigBlind;

                if (totalNewBet < minRaiseValue) {
                    throw new Error(`Raise-ul trebuie să fie cel puțin la ${minRaiseValue}.`);
                }
                if (raiseAmount > player.stack) {
                    throw new Error("Fonduri insuficiente pentru acest raise.");
                }

                player.stack -= raiseAmount;
                player.currentBet = totalNewBet;
                this.lastRaiser = player;

                if (player.stack === 0) player.status = 'all-in';
                break;
            default: throw new Error(`Acțiune invalidă: ${action}`);
        }

        player.hasActed = true;

        if (this.isRoundComplete()) {
            this.advanceToNextState();
        } else {
            this.moveToNextPlayer();
        }
    }

    getHandForPlayer(token) {
        const player = this.playersByToken.get(token);
        return player ? player.hand : null;
    }

    getGameState() {
        const potValue = this.inProgress
            ? this.pot + this.players.reduce((sum, p) => sum + p.currentBet, 0)
            : 0;

        let playersList;

        if (!this.inProgress) {
            playersList = this.players.map(p => ({
                token: p.token,
                username: p.username,
                stack: p.stack,
                currentBet: 0,
                status: 'waiting',
                isWinner: false,
                hand: null,
                evaluatedHand: null,
            }));
        } else {
            playersList = this.players.map(p => ({
                token: p.token,
                username: p.username,
                stack: p.stack,
                currentBet: p.currentBet,
                status: p.status,
                isWinner: p.isWinner,
                hand: this.round === 'showdown' && p.status !== 'folded' ? p.hand : null,
                evaluatedHand: this.round === 'showdown' ? p.evaluatedHand : null,
            }));
        }

        const currentPlayer = this.inProgress && this.currentPlayerIndex !== -1
            ? this.players[this.currentPlayerIndex]
            : null;

        return {
            gameId: this.gameId,
            creatorUsername: this.creatorUsername,
            inProgress: this.inProgress,
            hasPassword: !!this.password,
            options: this.options,
            minPlayers: this.options.minPlayers,
            maxPlayers: this.options.maxPlayers,

            round: this.inProgress ? this.round : 'pre-game',
            pot: potValue,
            board: this.inProgress ? this.board : [],
            currentPlayerToken: currentPlayer ? currentPlayer.token : null,
            players: playersList,
        };
    }
    setupNewHand() {
        this.pot = 0;
        this.board = [];
        this.players.forEach(p => p.resetForNewHand());

        this.players = this.players.filter(p => p.status !== 'out');
        if (this.players.length < this.options.minPlayers) {
            this.inProgress = false;
            return;
        }

        this.deck = SUITS.flatMap(suit => RANKS.map(rank => ({ rank, suit }))).sort(() => Math.random() - 0.5);

        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
        const sbIndex = (this.dealerIndex + 1) % this.players.length;
        const bbIndex = (this.dealerIndex + 2) % this.players.length;

        this.postBlind(this.players[sbIndex], this.options.smallBlind);
        this.postBlind(this.players[bbIndex], this.options.bigBlind);

        for (let i = 0; i < 2; i++) {
            for (const player of this.players) {
                if (player.status !== 'out') player.hand.push(this.deck.pop());
            }
        }
        this.currentPlayerIndex = (bbIndex + 1) % this.players.length;
        counter.reset();
        while (this.players[this.currentPlayerIndex]?.status !== 'active') {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            counterCheck();
        }
        this.lastRaiser = this.players[bbIndex];
        this.round = 'pre-flop';
    }

    postBlind(player, amount) {
        const blind = Math.min(player.stack, amount);
        player.stack -= blind;
        player.currentBet = blind;
    }

    advanceToNextState() {
        this.players.forEach(p => {
            this.pot += p.currentBet;
            p.currentBet = 0;
            if (p.status === 'active') {
                p.hasActed = false;
            }
        });

        const playersLeft = this.players.filter(p => p.status !== 'folded' && p.status !== 'out');
        if (playersLeft.length <= 1) {
            this.determineWinners();
            return;
        }
        if(!this.players.some(p => p.status === 'active')) {
            this.determineWinners();
            return;
        }
        switch (this.round) {
            case 'pre-flop':
                this.round = 'flop';
                this.deck.pop();
                this.board.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
                break;
            case 'flop':
                this.round = 'turn';
                this.deck.pop();
                this.board.push(this.deck.pop());
                break;
            case 'turn':
                this.round = 'river';
                this.deck.pop();
                this.board.push(this.deck.pop());
                break;
            case 'river':
                this.determineWinners();
                return;
        }
        counter.reset();
        this.currentPlayerIndex = (this.dealerIndex + 1) % this.players.length;
        while (this.players[this.currentPlayerIndex].status !== 'active') {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            counterCheck();
        }
        this.lastRaiser = null;
    }

    determineWinners() {
        this.players.forEach(p => {
            this.pot += p.currentBet;
            p.currentBet = 0;
        });

        const contenders = this.players.filter(p => p.status !== 'folded' && p.status !== 'out');

        if (contenders.length === 1) {
            contenders[0].stack += this.pot;
            contenders[0].isWinner = true;
            contenders[0].evaluatedHand = { name: 'Câștigător prin abandon' };
        } else {
            let winners = [];
            let bestHand = { rank: -1, highCardValues: [] };

            for (const player of contenders) {
                const sevenCards = [...player.hand, ...this.board];
                const evaluatedHand = evaluateHand(sevenCards);
                player.evaluatedHand = evaluatedHand;

                if (evaluatedHand.rank > bestHand.rank) {
                    bestHand = evaluatedHand;
                    winners = [player];
                } else if (evaluatedHand.rank === bestHand.rank) {
                    let isNewBest = false;
                    for (let i = 0; i < evaluatedHand.highCardValues.length; i++) {
                        if (evaluatedHand.highCardValues[i] > bestHand.highCardValues[i]) {
                            isNewBest = true;
                            break;
                        }
                        if (evaluatedHand.highCardValues[i] < bestHand.highCardValues[i]) break;
                    }
                    if (isNewBest) {
                        winners = [player];
                        bestHand = evaluatedHand;
                    } else if (evaluatedHand.highCardValues.every((v, i) => v === bestHand.highCardValues[i])) {
                        winners.push(player);
                    }
                }
            }

            const potShare = Math.floor(this.pot / winners.length);
            winners.forEach(winner => {
                winner.isWinner = true;
                winner.stack += potShare;
            });
        }

        this.round = 'showdown';
        this.currentPlayerIndex = -1;
    }

    moveToNextPlayer() {
        counter.reset();
        let attempts = 0;
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            attempts++;
            if (attempts > this.players.length * 2) {
                console.error("Infinite loop detected in moveToNextPlayer. Ending hand.");
                this.determineWinners();
                return;
            }
            counterCheck();
        } while (this.players[this.currentPlayerIndex].status !== 'active');
    }

    isRoundComplete() {
        const playersInHand = this.players.filter(p => p.status !== 'folded' && p.status !== 'out');
        const activePlayers = playersInHand.filter(p => p.status === 'active');

        if (activePlayers.length === 0) {
            return true;
        }

        const highestBet = Math.max(...playersInHand.map(p => p.currentBet));

        const allHaveActedAndMatched = activePlayers.every(p =>
            p.hasActed && p.currentBet === highestBet
        );

        return allHaveActedAndMatched;
    }
}

module.exports = { PokerGame };