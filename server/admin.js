const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const usersPath = path.join(__dirname, "users.json");

// Admin: Benutzer umbenennen
router.post("/rename", (req, res) => {
  const { oldName, newName } = req.body;
  const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
  const user = users.find((u) => u.username === oldName);
  if (!user) return res.status(404).json({ error: "User nicht gefunden" });
  user.username = newName;
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  res.json({ success: true });
});

// Admin: Rolle vergeben/entfernen
router.post("/role", (req, res) => {
  const { username, role, action } = req.body; // action: add | remove
  const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: "User nicht gefunden" });

  if (action === "add" && !user.roles.includes(role)) user.roles.push(role);
  if (action === "remove") user.roles = user.roles.filter((r) => r !== role);

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  res.json({ success: true, roles: user.roles });
});

// Admin: User bannen/unbannen
router.post("/ban", (req, res) => {
  const { username, banned } = req.body;
  const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: "User nicht gefunden" });
  user.banned = banned;
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  res.json({ success: true, banned });
});

module.exports = router;
