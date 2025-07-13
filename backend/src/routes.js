const Router = require('@koa/router');
const config = require("./config");
const auth = require("./auth");
const fs = require("fs/promises");

const routes = new Router();

routes
  .get('/logout', async (ctx) => {
    ctx.cookies.set('token', '', { 
      maxAge: 0,
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/"
    });
    ctx.status = 200;
    ctx.body = { success: true, message: "Deconectat cu succes" };
  })
  .post('/login', async (ctx) => {
    const { username, password } = ctx.request.body;

    const users = JSON.parse(await fs.readFile('users.json', 'utf-8'));

    if (!users[username]) {
      ctx.status = 401;
      ctx.body = { success: false, error: { general: "Utilizatorul nu exista. Verificați datele." } };
      return;
    }

    if (users[username].password !== password) {
      ctx.status = 401;
      ctx.body = { success: false, error: { password: "Parola invalidă." } };
      return;
    }

    const token = auth.createToken(username);
    ctx.cookies.set("token", token, config.cookieOptions);
    ctx.body = { success: true, token, username };
  })
  .post('/register', async (ctx) => {
    const { username, password } = ctx.request.body;

    // Validare input înregistrare
    const errors = await auth.validateRegisterInput(username, password);
    if (Object.keys(errors).length > 0) {
      ctx.status = 400;
      ctx.body = { success: false, error: errors };
      return;
    }

    const users = JSON.parse(await fs.readFile('users.json', 'utf-8'));

    if (users[username]) {
      ctx.status = 409;
      ctx.body = { success: false, error: { username: "Nume de utilizator deja există. Vă rugăm alegeți altul." } };
      return;
    }

    // Creare cont nou
    users[username] = { username, password };
    await fs.writeFile('users.json', JSON.stringify(users, null, 2));

    const token = auth.createToken(username);
    ctx.cookies.set("token", token, config.cookieOptions);
    ctx.body = { success: true, token, username };
  });

module.exports = routes;
