const Router = require('@koa/router');
const config = require("./config");
const auth = require("./auth");

const routes = new Router({
    prefix: '/api/auth'
});

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

module.exports = routes;