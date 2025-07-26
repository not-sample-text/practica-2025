
const MAX_ROUNDS = 5;

class Player {
    constructor() {
        this.username = null;
        this.choice = null;
        this.score = 0;
    }
}

class RockPaperScissors {

    constructor(sendGameDataCallabck) {

        this.winner = null;
        this.playerOne = new Player();
        this.playerTwo = new Player();
        this.sendGameData = sendGameDataCallabck;
        this.message = '';
        this.maxRounds = MAX_ROUNDS;

    }

    startGame(playerOne, playerTwo) {
        this.playerOne.username = playerOne;
        this.playerTwo.username = playerTwo;

        this.sendGameData({ type: 'game', to: playerOne, opponent: playerTwo, isMyTurn: true, status: 'start' });
        this.sendGameData({ type: 'game', to: playerTwo, opponent: playerOne, isMyTurn: false, status: 'start' });
    }

    handleChoice(gameData) {
        const { player, choice } = gameData;

        player === this.playerOne.username ? this.playerOne.choice = choice : this.playerTwo.choice = choice;

        const opponent = player === this.playerOne.username ? this.playerTwo.username : this.playerOne.username;

        if (this.playerOne.choice && this.playerTwo.choice) {
            this.playRound();
        } else {
            this.message = '';
        }

        const playerGameData = {
            type: 'game',
            nextTurn: opponent,
            message: this.message,
            choice: choice,
            winner: this.winner,
            playerChoice: choice,
            opponentChoice: opponent === this.playerOne.username ? this.playerOne.choice : this.playerTwo.choice,
            playerScore: player === this.playerOne.username ? this.playerOne.score : this.playerTwo.score,
            opponentScore: opponent === this.playerOne.username ? this.playerOne.score : this.playerTwo.score,
            status: 'choice'
        }

        const opponentGameData = {
            type: 'game',
            nextTurn: opponent,
            message: this.message,
            choice: choice,
            winner: this.winner,
            playerChoice: opponent === this.playerOne.username ? this.playerOne.choice : this.playerTwo.choice,
            opponentChoice: choice,
            playerScore: opponent === this.playerOne.username ? this.playerOne.score : this.playerTwo.score,
            opponentScore: player === this.playerOne.username ? this.playerOne.score : this.playerTwo.score,
            status: 'choice'
        }

        this.sendGameData({ ...playerGameData, to: player });
        this.sendGameData({ ...opponentGameData, to: opponent });

        if (this.playerOne.choice && this.playerTwo.choice) {
            this.playerOne.choice = null;
            this.playerTwo.choice = null;
        }

        if(this.winner) {
            this.restartGame(player, opponent);
        }
    }

    playRound() {

        if (this.playerOne.choice === this.playerTwo.choice) {
            this.message = "It's a tie";
        } else if (

            this.playerOne.choice === "rock" && this.playerTwo.choice === "scissors" ||
            this.playerOne.choice === "paper" && this.playerTwo.choice === "rock" ||
            this.playerOne.choice === "scissors" && this.playerTwo.choice == "paper"
        ) {
            this.playerOne.score += 1;
            console.log(this.playerOne, 'score: ', this.playerOne.score)
            this.message = `${this.playerOne.username} won this round`;
        } else {
            this.playerTwo.score += 1;
            console.log(this.playerTwo, 'score: ', this.playerTwo.score)
            this.message = `${this.playerTwo.username} won this round`;
        }

        this.checkScore();
    }

    checkScore() {

        if (this.playerOne.score !== this.maxRounds && this.playerTwo.score !== this.maxRounds) return;

        if (this.playerOne.score > this.playerTwo.score) {
            this.winner = this.playerOne.username;
        } else {
            this.winner = this.playerTwo.username;
        }
    }

    restartGame() {
        this.playerOne.score = 0;
        this.playerTwo.score = 0;
        this.playerOne.choice = '';
        this.playerTwo.choice = '';
        this.winner = null;
    }

}

module.exports = RockPaperScissors;