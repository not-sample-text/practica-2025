const Router = require('@koa/router');
const authHandlers = require('./handlers/authHandlers');

const routes = new Router();

routes.post('/login', authHandlers.login);
routes.post('/register', authHandlers.register);
routes.get('/logout', authHandlers.logout);

module.exports = routes;