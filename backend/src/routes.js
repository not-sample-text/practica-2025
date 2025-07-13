const Router = require('@koa/router');
const config = require("./config");
const auth = require("./auth");
const fs = require("fs/promises");

const routes = new Router();

routes
    .get('/logout', async (ctx, next) => {
        ctx.cookies.set('token', '', { maxAge: 0 });
        ctx.status = 200;
        ctx.body = { success: true, message: "Logged out successfully" };
    }).post('/login', async (ctx, next) => {

        let { username, password } = ctx.request.body;
        const errors = await auth.validateLoginInput(username, password);

        if (Object.keys(errors).length > 0) {
            ctx.status = 400;
            return ctx.body = { success: false, error: errors };
        }

        const token = auth.createToken(username);
        ctx.cookies.set("token", token, config.cookieOptions);
        ctx.body = { success: true, token: token };

    }).post('/register', async (ctx, next) => {
        let { username, password } = ctx.request.body;
        const errors = await auth.validateRegistrationInput(username, password);

        if (Object.keys(errors).length > 0) {
            ctx.status = 400;
            return ctx.body = { success: false, error: errors };
        }

        const users = JSON.parse(await fs.readFile('users.json', "utf-8"));
        users[username] = { username, password };
        await fs.writeFile('users.json', JSON.stringify(users, null, 2));

    })
    ;


module.exports = routes;