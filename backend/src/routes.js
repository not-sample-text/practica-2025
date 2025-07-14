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
        await next();
        // return;
    });
    
routes.post('/login', async (ctx, next) => {
        
        let { username, password } = ctx.request.body;
        const errors = await auth.validateLoginInput(username, password);

        if (Object.keys(errors).length > 0) {
            ctx.status = 400;
            return ctx.body = { success: false, error: errors };
        }

        const token = auth.createToken(username);
        ctx.cookies.set("token", token, config.cookieOptions);
        ctx.body = { success: true, token: token }; 
        await next();
        // return;
    })  
    ;


module.exports = routes;