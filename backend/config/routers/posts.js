import express from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// Upload objave
router.post("/create", auth, upload.single("image"), async (req, res) => {
  const img = await cloudinary.uploader.upload_stream(
    { resource_type: "image" },
    async (err, result) => {
      if (err) return res.status(500).json(err);

      await db.query(
        "INSERT INTO posts (user_id, image_url) VALUES ($1, $2)",
        [req.user.id, result.secure_url]
      );

      res.json({ image: result.secure_url });
    }
  );
  req.file.stream.pipe(img);
});

// Feed
router.get("/feed", async (req, res) => {
  const q = await db.query(`
    SELECT posts.image_url, users.username 
    FROM posts 
    JOIN users ON users.id = posts.user_id
    ORDER BY posts.id DESC
  `);

  res.json(q.rows);
});

export default router;

