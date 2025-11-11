const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const usersPath = path.join(__dirname, "users.json");

// Login-Route
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
  const user = users.find((u) => u.username === username);

  if (!user) return res.status(400).json({ error: "Benutzer nicht gefunden" });

  if (user.banned) return res.status(403).json({ error: "Benutzer gesperrt" });

  if (bcrypt.compareSync(password, user.password)) {
    res.json({
      username: user.username,
      role: user.role,
      roles: user.roles,
      color: user.color,
      roleColor: user.roleColor,
    });
  } else {
    res.status(400).json({ error: "Falsches Passwort" });
  }
});

// Userliste für Admin
router.get("/users", (req, res) => {
  const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
  res.json(users);
});

module.exports = router;
