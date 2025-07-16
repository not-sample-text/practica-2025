const auth = require('../auth');
const config = require('../config');
const fs = require('fs/promises');

const login = async (ctx) => {
  const { username, password } = ctx.request.body;
  const errors = await auth.validateLoginInput(username, password, true);
  if (Object.keys(errors).length > 0) {
    ctx.status = 400;
    ctx.body = { success: false, error: errors };
    return;
  }
  const token = auth.createToken(username);
  ctx.cookies.set('token', token, config.cookieOptions);
  ctx.body = { success: true, token };
};

const register = async (ctx) => {
  const { username, password } = ctx.request.body;
  const errors = await auth.validateRegisterInput(username, password);
  if (Object.keys(errors).length > 0) {
    ctx.status = 400;
    ctx.body = { success: false, error: errors };
    return;
  }
  // Save user
  const users = JSON.parse(await fs.readFile('users.json', 'utf-8'));
  users[username] = { username, password };
  await fs.writeFile('users.json', JSON.stringify(users, null, 2));
  ctx.body = { success: true };
};

const logout = async (ctx) => {
  ctx.cookies.set('token', '', { maxAge: 0 });
  ctx.status = 200;
  ctx.body = { success: true, message: 'Logged out successfully' };
};

module.exports = { login, register, logout }; 