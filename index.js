const Koa = require("koa");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const route = require("koa-route");
const websockify = require("koa-websocket");
const path = require("path");

const clients = new Map(); // Store connected clients
const rooms = new Set(); // Set global pentru camere
const userRooms = new Map(); // Map token -> room
const roomUsers = new Map(); // Map room -> Set(token)
const option = {
  httpOnly: false, // ✅ accesibil din browser
  secure: false, // ✅ nu cere HTTPS
  sameSite: "lax", // ✅ ok pe localhost
  path: "/", // ✅ disponibil pe toată aplicația
};
const secretKey = "564798ty9GJHB%^&*(KJNLK";
const app = websockify(new Koa());
const usersFile = path.join(__dirname, "users.json");

function loadUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile, "utf-8"));
}

function saveUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    console.log("[LOG] users.json salvat la:", usersFile);
    console.log("[LOG] Utilizatori actuali:", users);
  } catch (err) {
    console.error("Eroare la scrierea users.json:", err);
  }
}

app.ws.use(
  route.all("/ws", function (ctx) {
    const token = ctx.cookies.get("token");
    const { username } = jwt.verify(token, secretKey);
    clients.set(token, ctx.websocket);
    ctx.websocket.send(
      `token–Hello ${username}, welcome to the WebSocket server!`
    );
    // Trimite lista de camere la conectare
    ctx.websocket.send(
      JSON.stringify({ type: "room-list", rooms: Array.from(rooms) })
    );
    function sendRoomUsers(room) {
      if (!room) return;
      const users = Array.from(roomUsers.get(room) || []).map((tk) => {
        try {
          return jwt.verify(tk, secretKey).username;
        } catch {
          return "?";
        }
      });
      // Trimite tuturor din cameră lista de useri
      (roomUsers.get(room) || []).forEach((tk) => {
        const ws = clients.get(tk);
        if (ws && ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "room-users", users }));
        }
      });
    }
    ctx.websocket.on("message", function (message) {
      try {
        const data = JSON.parse(message);
        if (data.type === "room-create") {
          rooms.add(data.room);
          // Intră automat în cameră la creare
          userRooms.set(token, data.room);
          if (!roomUsers.has(data.room)) roomUsers.set(data.room, new Set());
          roomUsers.get(data.room).add(token);
          // Trimite lista actualizată tuturor
          clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
              client.send(
                JSON.stringify({ type: "room-list", rooms: Array.from(rooms) })
              );
            }
          });
          sendRoomUsers(data.room);
        } else if (data.type === "room-join") {
          // Scoate userul din camera veche dacă era
          const oldRoom = userRooms.get(token);
          if (oldRoom && roomUsers.has(oldRoom)) {
            roomUsers.get(oldRoom).delete(token);
            sendRoomUsers(oldRoom);
          }
          userRooms.set(token, data.room);
          if (!roomUsers.has(data.room)) roomUsers.set(data.room, new Set());
          roomUsers.get(data.room).add(token);
          sendRoomUsers(data.room);
        } else if (data.type === "room-leave") {
          const oldRoom = userRooms.get(token);
          if (oldRoom && roomUsers.has(oldRoom)) {
            roomUsers.get(oldRoom).delete(token);
            sendRoomUsers(oldRoom);
          }
          userRooms.delete(token);
        }
      } catch (e) {
        // Nu e JSON, e mesaj de chat clasic
        clients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            client.send(`${token}–${message}`);
          }
        });
      }
    });
    ctx.websocket.on("close", function () {
      // La deconectare, scoate userul din camera
      const oldRoom = userRooms.get(token);
      if (oldRoom && roomUsers.has(oldRoom)) {
        roomUsers.get(oldRoom).delete(token);
        sendRoomUsers(oldRoom);
      }
      userRooms.delete(token);
      clients.delete(token);
    });
  })
);

app
  .use(async (ctx, next) => {
    // console.log(`Request URL: ${ctx.url}`);
    if (["/", "/index.html"].includes(ctx.url)) {
      const username = ctx.cookies.get("token")
        ? jwt.verify(ctx.cookies.get("token"), secretKey).username
        : null;
      const responseHtml = username ? "./welcome.html" : "./index.html";
      const content = fs.readFileSync(responseHtml, "utf-8");
      const response = content.replace("@username", username || "Guest");
      return (ctx.body = response);
    }
    await next(); // Call the next middleware
  })
  .use(async (ctx, next) => {
    if (ctx.url.includes("/login")) {
      console.log("[LOG] S-a primit request la /login cu query:", ctx.query);
      const { username, password } = ctx.query;
      let users = loadUsers();
      let user = users.find((u) => u.username === username);
      if (!user) {
        // Înregistrare automată
        user = { username, password };
        users.push(user);
        console.log(`[LOG] Utilizator nou: ${username}`);
        saveUsers(users);
      }
      if (user.password !== password) {
        // Injectează mesajul de eroare direct în HTML, chiar înainte de div-ul cu clasa mb-3 pentru parolă
        let loginHtml = fs.readFileSync("./index.html", "utf-8");
        loginHtml = loginHtml.replace(
          /(<div class="mb-3">\s*<label for="parola"[\s\S]*?<input[\s\S]*?id="parola"[\s\S]*?\/>)/,
          '<div id="errorMsg" class="alert alert-danger text-center py-2">Parolă greșită!</div>\n$1'
        );
        ctx.body = loginHtml;
        return; // <-- oprește execuția aici
      }
      const content = fs.readFileSync("./welcome.html", "utf-8");
      const response = content.replace("@username", username);
      const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
      ctx.cookies.set("token", token, option);
      ctx.body = response;
      return; // <-- oprește execuția aici
    }
    await next(); // Call the next middleware
  })
  .use(async (ctx) => {
    ctx.body = "Hello World";
  });

app.listen(3000);
console.log("http://localhost:3000");
