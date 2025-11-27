import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

const router = express.Router();

// Registracija
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  await db.query(
    "INSERT INTO users (username, password) VALUES ($1, $2)",
    [username, hashed]
  );

  res.json({ message: "User created" });
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const q = await db.query("SELECT * FROM users WHERE username=$1", [username]);

  if (q.rows.length === 0) return res.status(400).json({ message: "Not found" });

  const user = q.rows[0];

  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

  res.json({ token });
});

export default router;

