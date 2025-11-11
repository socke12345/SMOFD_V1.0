// ======== Globals ========
let username = '';
let messages = [];
let usersOnline = [];
let roles = []; // Laden über /admin/roles
const messagesEl = document.getElementById('messages');
const onlineCountEl = document.getElementById('onlineCount');

// ======== Login ========
document.getElementById('loginBtn').addEventListener('click', ()=>{
  const userInput = document.getElementById('usernameInput').value.trim();
  const passInput = document.getElementById('passwordInput').value;
  if(!userInput || !passInput) return alert('Bitte Benutzernamen und Passwort eingeben.');

  fetch('/login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ username: userInput, password: passInput })
  }).then(res=>res.json())
  .then(data=>{
    if(data.success){
      username = userInput;
      document.getElementById('loginContainer').style.display = 'none';
      document.getElementById('chatContainer').style.display = 'block';
      initChat();
    } else alert('Login fehlgeschlagen.');
  });
});

// ======== Chat Initialisierung ========
function initChat(){
  fetchRoles();
  loadMessages();
  setInterval(updateOnlineUsers, 5000); // Online Nutzer updaten
}

// ======== Rollen laden ========
function fetchRoles(){
  fetch(`/admin/roles?admin=${username}`)
    .then(res=>res.json())
    .then(data=>roles = data);
}

// ======== Nachricht senden ========
document.getElementById('sendBtn').addEventListener('click', sendMessage);

function sendMessage(){
  const msgInput = document.getElementById('messageInput');
  const text = msgInput.value.trim();
  if(!text) return;
  const time = new Date().toLocaleTimeString();
  const msg = { id: Date.now(), username, text, time, likes:0, dislikes:0, roles:getUserRoles(username) };
  messages.push(msg);
  saveMessages();
  renderMessages();
  msgInput.value='';
}

// ======== Nachrichten speichern/laden ========
function saveMessages(){ localStorage.setItem('chatMessages', JSON.stringify(messages)); }
function loadMessages(){
  const saved = localStorage.getItem('chatMessages');
  if(saved) messages = JSON.parse(saved);
  renderMessages();
}

// ======== Nachrichten rendern ========
function renderMessages(){
  messagesEl.innerHTML = '';
  messages.forEach(msg=>{
    const div = document.createElement('div');
    div.classList.add('message', msg.username===username?'self':'other');

    const rolesHtml = msg.roles.map(r=>{
      const roleData = roles.find(role=>role.name===r);
      if(roleData) return `<span class="role" style="background:${roleData.color}">${r}</span>`;
      return '';
    }).join(' ');

    div.innerHTML = `
      <div class="meta">
        <span class="username" style="color:${getUsernameColor(msg.username)}">${msg.username}</span>
        ${rolesHtml}
        • ${msg.time}
      </div>
      <div class="text">${msg.text}</div>
      <div class="reactions">
        👍 <span>${msg.likes}</span> 👎 <span>${msg.dislikes}</span>
        <button class="replyBtn" data-id="${msg.id}">Antworten</button>
      </div>
    `;
    messagesEl.appendChild(div);

    // Reaction Buttons
    div.querySelector('.reactions').querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{ replyToMessage(msg.id); });
    });
  });

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ======== Replies ========
function replyToMessage(msgId){
  const replyMsg = messages.find(m=>m.id===msgId);
  if(!replyMsg) return;
  const text = prompt(`Antwort an ${replyMsg.username}:`);
  if(text){
    const time = new Date().toLocaleTimeString();
    const msg = { id: Date.now(), username, text: `@${replyMsg.username} ${text}`, time, likes:0, dislikes:0, roles:getUserRoles(username) };
    messages.push(msg);
    saveMessages();
    renderMessages();
  }
}

// ======== Online Nutzer ========
function updateOnlineUsers(){
  // Hier könntest du via WebSocket oder API echte Online-User abfragen
  usersOnline = Array.from(new Set(messages.map(m=>m.username))); // einfache Simulation
  onlineCountEl.textContent = usersOnline.length;
}

// ======== Rollen Helper ========
function getUserRoles(user){
  const storedUsers = JSON.parse(localStorage.getItem('chatUsers') || '{}');
  return storedUsers[user]?.roles || [];
}

// ======== Benutzerfarben ========
function getUsernameColor(name){
  let hash = 0;
  for(let i=0;i<name.length;i++) hash = name.charCodeAt(i)+((hash<<5)-hash);
  let color = '#'+((hash>>0)&0xFFFFFF).toString(16).padStart(6,'0');
  return color;
}
