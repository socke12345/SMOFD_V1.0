let roles = [];
let users = [];

const admin = localStorage.getItem('username'); // aktueller Admin

// Initial laden
fetchRoles();
fetchUsers();

// --- Rollen laden ---
function fetchRoles(){
  fetch(`/admin/roles?admin=${admin}`)
    .then(res=>res.json())
    .then(data=>{
      roles = data;
      renderRoles();
    });
}

// --- Benutzer laden ---
function fetchUsers(){
  fetch(`/users?admin=${admin}`) // Endpoint muss alle Benutzer zurückgeben
    .then(res=>res.json())
    .then(data=>{
      users = data;
      renderUsers();
    });
}

// --- Rollen rendern ---
function renderRoles(){
  const container = document.getElementById('rolesList');
  container.innerHTML = '';
  roles.forEach(r=>{
    const div = document.createElement('div');
    div.classList.add('role-item');
    div.innerHTML = `
      <span>${r.name}</span>
      <span class="role-badge" style="background:${r.color}">${r.name}</span>
      <button onclick="deleteRole('${r.name}')">Löschen</button>
    `;
    container.appendChild(div);
  });
}

// --- Benutzer rendern ---
function renderUsers(){
  const container = document.getElementById('usersList');
  const select = document.getElementById('userSelect');
  container.innerHTML = '';
  select.innerHTML = '';
  users.forEach(u=>{
    const div = document.createElement('div');
    div.classList.add('user-item');
    div.innerHTML = `
      <span style="color:${getUsernameColor(u.username)}">${u.username}</span>
      ${u.roles.map(r=>{
        const roleData = roles.find(role=>role.name===r);
        if(roleData) return `<span class="role-badge" style="background:${roleData.color}">${r}</span>`;
        return '';
      }).join(' ')}
      <select onchange="assignRole('${u.username}', this.value)">
        <option value="">Rolle zuweisen</option>
        ${roles.map(r=>`<option value="${r.name}">${r.name}</option>`).join('')}
      </select>
      <select onchange="removeRole('${u.username}', this.value)">
        <option value="">Rolle entfernen</option>
        ${u.roles.map(r=>`<option value="${r}">${r}</option>`).join('')}
      </select>
    `;
    container.appendChild(div);

    // Dropdown für Benutzer-Select
    const opt = document.createElement('option');
    opt.value = u.username;
    opt.textContent = u.username;
    select.appendChild(opt);
  });
}

// --- Rollen erstellen ---
function createRole(){
  const name = document.getElementById('roleName').value;
  const color = document.getElementById('roleColor').value;
  fetch('/admin/role/create', {
    method:'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ admin, name, color })
  }).then(()=>fetchRoles());
}

// --- Rollen löschen ---
function deleteRole(name){
  fetch('/admin/role/delete', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ admin, name })
  }).then(()=>{ fetchRoles(); fetchUsers(); });
}

// --- Rolle zuweisen ---
function assignRole(username, role){
  if(!role) return;
  fetch('/admin/role/assign', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ admin, username, role })
  }).then(()=>fetchUsers());
}

// --- Rolle entfernen ---
function removeRole(username, role){
  if(!role) return;
  fetch('/admin/role/remove', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ admin, username, role })
  }).then(()=>fetchUsers());
}

// --- Benutzer umbenennen ---
function renameUser(){
  const oldName = document.getElementById('userSelect').value;
  const newName = document.getElementById('newName').value.trim();
  if(!oldName || !newName) return alert('Wähle Benutzer und gib neuen Namen ein.');
  fetch('/admin/user/rename', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ admin, oldName, newName })
  }).then(()=>fetchUsers());
}

// Farbcode für Benutzernamen
function getUsernameColor(name){
  let hash = 0;
  for(let i=0;i<name.length;i++) hash = name.charCodeAt(i)+((hash<<5)-hash);
  let color = '#'+((hash>>0)&0xFFFFFF).toString(16).padStart(6,'0');
  return color;
}
