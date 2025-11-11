const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const USERS_FILE = path.join(__dirname, 'users.json');
let users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));

// --- Login Endpoint ---
app.post('/login', async (req,res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if(!user) return res.json({ success:false, message:'Benutzer nicht gefunden' });
  if(user.banned) return res.json({ success:false, message:'Du wurdest gesperrt' });

  const match = await bcrypt.compare(password, user.password);
  if(!match) return res.json({ success:false, message:'Falsches Passwort' });

  res.json({ success:true });
});

// --- Admin Endpoints (Bannen/Entbannen) ---
app.get('/admin/users', (req,res) => {
  const admin = req.query.admin;
  const adminUser = users.find(u => u.username === admin && u.role === 'admin');
  if(!adminUser) return res.status(403).json({ message:'Keine Berechtigung' });
  res.json(users);
});

app.post('/admin/user/:username/ban', (req,res) => {
  const { username } = req.params;
  const { admin, banned } = req.body;
  const adminUser = users.find(u => u.username === admin && u.role === 'admin');
  if(!adminUser) return res.status(403).json({ message:'Keine Berechtigung' });

  const user = users.find(u => u.username === username);
  if(user){
    user.banned = banned;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  }
  res.json({ success:true });
});

const server = app.listen(3000, () => console.log('Server läuft auf Port 3000'));

// --- WebSocket Setup ---
const wss = new WebSocket.Server({ server });
let onlineUsers = new Set();

wss.on('connection', ws => {
  let username = null;

  ws.on('message', msg => {
    const data = JSON.parse(msg);

    if(data.type === 'login'){
      username = data.username;
      onlineUsers.add(username);
      broadcastOnlineCount();
    }

    if(data.type === 'message'){
      const messageData = {
        id: uuidv4(),
        username: data.username,
        text: data.text,
        replyTo: data.replyTo || null,
        likes: 0,
        dislikes: 0,
        time: new Date().toLocaleTimeString()
      };
      broadcast(JSON.stringify({ type:'message', message: messageData }));
    }

    if(data.type === 'reaction'){
      broadcast(JSON.stringify({ type:'reaction', messageId: data.messageId, reaction: data.reaction }));
    }
  });

  ws.on('close', () => {
    if(username){
      onlineUsers.delete(username);
      broadcastOnlineCount();
    }
  });
});

function broadcast(msg){
  wss.clients.forEach(client => {
    if(client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

function broadcastOnlineCount(){
  const msg = JSON.stringify({ type:'onlineCount', count: onlineUsers.size });
  broadcast(msg);
}
