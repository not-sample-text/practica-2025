const Koa = require('koa');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const route = require('koa-route');
const websockify = require('koa-websocket');

const clients = new Map(); // Store connected clients
const option = {
  httpOnly: false,         // ✅ dacă vrei să-l vezi din JS (document.cookie)
  sameSite: 'lax',         // ✅ Lax sau Strict sau None (vezi explicații jos)
  secure: false,           // ✅ false pe localhost (true doar pe HTTPS)
  domain: 'localhost',     // opțional; se poate omite pe localhost
  path: '/',               // disponibil pe tot site-ul
  maxAge: 1000 * 60 * 60,  // opțional: 1 oră
};
const secretKey = '564798ty9GJHB%^&*(KJNLK';
const app = websockify(new Koa());

app.ws.use(route.all('/ws', function (ctx) {
    // `ctx` is the regular koa context created from the `ws` onConnection `socket.upgradeReq` object.
    // the websocket is added to the context on `ctx.websocket`.
    const { username } = jwt.verify(ctx.cookies.get('token'), secretKey);
    clients.set(ctx.cookies.get('token'), ctx.websocket);

    ctx.websocket.send(`token–Hello ${username}, welcome to the WebSocket server!`);
    ctx.websocket.on('message', function (message) {
        // do something with the message from client
        console.log(`Received ws from client: ${message}`);
        // broadcast the message to all connected clients
        clients.forEach((client, token) => {
            if (client.readyState === client.OPEN) {
                client.send(`${token}–${message}`);
            }
        });
    });
}));

app
    .use(async (ctx, next) => {
        console.log(`Request URL: ${ctx.url}`);
        if (['/', '/index.html'].includes(ctx.url)) {
            const username = ctx.cookies.get('token') ? jwt.verify(ctx.cookies.get('token'), secretKey).username : null;
            const responseHtml = username ? './welcome.html' : './index.html';
            const content = fs.readFileSync(responseHtml, 'utf-8');
            const response = content.replace('@username', username || 'Guest');
            return ctx.body = response;
        }
        await next(); // Call the next middleware
    })
    .use(async (ctx, next) => {
        if (ctx.url.includes('/login')) {
            const { username, password } = ctx.query;
            const content = fs.readFileSync('./welcome.html', 'utf-8');
            const response = content.replace('@username', username);
            const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' });
            ctx.cookies.set('token', token, option);
            return ctx.body = response;
        }
        await next(); // Call the next middleware
    })
    .use(async ctx => {
        ctx.body = 'Hello World';
    });


app.listen(3000);
console.log('http://localhost:3000');
