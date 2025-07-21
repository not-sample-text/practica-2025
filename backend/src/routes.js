const Router = require('@koa/router');
const config = require("./config");
const auth = require("./auth");
const { PokerGame } = require("./pokerGame");

const routes = new Router({
    prefix: '/api/auth'
});

const pokerGames = new Map();

let wsManager = null;

const setWebSocketManager = (manager) => {
    wsManager = manager;
};

routes.post('/register', async (ctx) => {
    console.log("Am primit cerere de înregistrare cu datele:", ctx.request.body);

    const { username, password } = ctx.request.body;
    const { errors } = await auth.registerUser(username, password);

    if (Object.keys(errors).length > 0) {
        ctx.status = 400;
        return ctx.body = { success: false, errors: errors };
    }
    
    ctx.status = 201;
    ctx.body = { success: true, message: "Cont creat cu succes!" };
});

routes.post('/login', async (ctx) => {
    const { username, password } = ctx.request.body;
    const { errors } = await auth.authenticateUser(username, password);

    if (Object.keys(errors).length > 0) {
        ctx.status = 401;
        return ctx.body = { success: false, errors: errors };
    }

    const token = auth.createToken(username);
    ctx.cookies.set("token", token, config.cookieOptions);
    ctx.status = 200; 
    ctx.body = { success: true, token: token };
});

routes.post('/logout', (ctx) => {
    ctx.cookies.set('token', '', { maxAge: 0 }); 
    ctx.status = 200;
    ctx.body = { success: true, message: "Deconectare reușită" };
});

routes.get('/poker/games', (ctx) => {
    const gamesList = Array.from(pokerGames.values()).map(game => game.getGameState());
    ctx.status = 200;
    ctx.body = { success: true, games: gamesList };
});

routes.post('/poker/create', (ctx) => {
    const token = ctx.cookies.get("token");
    if (!auth.isValidToken(token)) {
        ctx.status = 401;
        return ctx.body = { success: false, error: "Token invalid" };
    }

    const { gameId, password, smallBlind, bigBlind, maxPlayers, stack } = ctx.request.body;
    const username = auth.getUsernameFromToken(token);
    
    if (pokerGames.has(gameId)) {
        ctx.status = 400;
        return ctx.body = { success: false, error: "O masă cu acest nume există deja" };
    }

    const options = {
        password: password || null,
        smallBlind: smallBlind || 10,
        bigBlind: bigBlind || 20,
        maxPlayers: maxPlayers || 9
    };

    const game = new PokerGame(gameId, username, options);
    pokerGames.set(gameId, game);
    
    try {
        game.addPlayer(token, username, stack || 1000);
    } catch (error) {
        pokerGames.delete(gameId);
        ctx.status = 400;
        return ctx.body = { success: false, error: error.message };
    }

    ctx.status = 201;
    ctx.body = { success: true, gameState: game.getGameState() };
    
    if (wsManager) {
        wsManager.sendPokerLobbyUpdate();
        wsManager.broadcastPokerGameState(gameId);
    }
});

routes.post('/poker/join', (ctx) => {
    const token = ctx.cookies.get("token");
    if (!auth.isValidToken(token)) {
        ctx.status = 401;
        return ctx.body = { success: false, error: "Token invalid" };
    }

    const { gameId, password, stack } = ctx.request.body;
    const username = auth.getUsernameFromToken(token);
    
    const game = pokerGames.get(gameId);
    if (!game) {
        ctx.status = 404;
        return ctx.body = { success: false, error: "Masa nu există" };
    }

    if (!game.checkPassword(password)) {
        ctx.status = 403;
        return ctx.body = { success: false, error: "Parolă incorectă" };
    }

    try {
        game.addPlayer(token, username, stack || 1000);
        ctx.status = 200;
        ctx.body = { success: true, gameState: game.getGameState() };
        
        if (wsManager) {
            wsManager.sendPokerLobbyUpdate();
            wsManager.broadcastPokerGameState(gameId);
        }
    } catch (error) {
        ctx.status = 400;
        ctx.body = { success: false, error: error.message };
    }
});

routes.post('/poker/start', (ctx) => {
    const token = ctx.cookies.get("token");
    if (!auth.isValidToken(token)) {
        ctx.status = 401;
        return ctx.body = { success: false, error: "Token invalid" };
    }

    const { gameId } = ctx.request.body;
    const game = pokerGames.get(gameId);
    if (!game) {
        ctx.status = 404;
        return ctx.body = { success: false, error: "Masa nu există" };
    }

    try {
        game.startGame();
        ctx.status = 200;
        ctx.body = { success: true, gameState: game.getGameState() };
        
        if (wsManager) {
            wsManager.broadcastPokerGameState(gameId);
            wsManager.sendPokerLobbyUpdate();
        }
    } catch (error) {
        ctx.status = 400;
        ctx.body = { success: false, error: error.message };
    }
});

routes.get('/poker/current-game', (ctx) => {
    const token = ctx.cookies.get("token");
    if (!auth.isValidToken(token)) {
        ctx.status = 401;
        return ctx.body = { success: false, error: "Token invalid" };
    }

    for (const [gameId, game] of pokerGames) {
        if (game.playersByToken.has(token)) {
            ctx.status = 200;
            ctx.body = { 
                success: true, 
                gameState: game.getGameState(),
                gameId: gameId,
                hand: game.getHandForPlayer(token)
            };
            return;
        }
    }

    ctx.status = 404;
    ctx.body = { success: false, error: "Nu ești în niciun joc" };
});

module.exports = { routes, pokerGames, setWebSocketManager };