const Koa = require('koa');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const route = require('koa-route');
const websockify = require('koa-websocket');

const clients = new Map(); // Store connected clients
const usernames = [];
const option = {
    httpOnly: false,    // ✅ accesibil din browser
    secure: false,      // ✅ nu cere HTTPS
    sameSite: 'lax',    // ✅ ok pe localhost
    path: '/',          // ✅ disponibil pe toată aplicația
};
const secretKey = '564798ty9GJHB%^&*(KJNLK';
const app = websockify(new Koa());

app.ws.use(route.all('/ws', function (ctx) {
    // `ctx` is the regular koa context created from the `ws` onConnection `socket.upgradeReq` object.
    // the websocket is added to the context on `ctx.websocket`.
    const token = ctx.cookies.get('token');
    const { username } = jwt.verify(token, secretKey);
    usernames.push(username);
    clients.set(token, ctx.websocket);
    console.log(`Socket client «${token}» added`);

    sendUsernames();
    
    ctx.websocket.on('message', function (message) {
        // do something with the message from client
        console.log(`Received ws from client: ${message}`);

        // broadcast the message to all connected clients
        clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
                console.log(token);
                client.send(JSON.stringify({type: 'message', token: token, message: message.toString()}));
            }
        });
    });

    if(!usernames.length !== 0)
        sendUsernames();

    ctx.websocket.on('close', () => {
        console.log('Client disconnected');
        // Remove the client from the map and the usernames array
        for (const [token, clientWs] of clients.entries()) {
            if (clientWs === ctx.websocket) {
                clients.delete(token); 
                const index = usernames.indexOf(username); 
                if (index !== -1) {
                    usernames.splice(index, 1); 
                }
                break;
            }
        }
        sendUsernames();
    });


}));

function sendUsernames(){

    const message = JSON.stringify({type: 'usernames', usernames: usernames});

    clients.forEach((client) =>{
        if (client.readyState === client.OPEN) {
                client.send(message);
            }
    } )
}


app
    .use(async (ctx, next) => {
        // console.log(`Request URL: ${ctx.url}`);
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


app.listen(80);
console.log('http://localhost');
