const express = require("express");
const router = express.Router();
const db = require("../db");


// ===============================
// ✅ CREATE LINK
// ===============================
router.post("/", async (req, res) => {
  try {
    const { name, url, department_id } = req.body;

    await db.query(
      "INSERT INTO links (name, url, department_id) VALUES (?, ?, ?)",
      [name, url, department_id]
    );

    res.json({ message: "Link created" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create link" });
  }
});


// ===============================
// ✅ GET ALL LINKS (ADMIN)
// ===============================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT links.*, departments.name AS department_name
      FROM links
      JOIN departments ON links.department_id = departments.id
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch links" });
  }
});


// ===============================
// ✅ GET LINKS FOR USER
// ===============================
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const [rows] = await db.query(`
      SELECT * FROM links
      WHERE department_id IN (
        SELECT department_id FROM user_departments
        WHERE user_id = ?
      )
    `, [userId]);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user links" });
  }
});


// ===============================
// ✅ DELETE LINK
// ===============================
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM links WHERE id = ?", [req.params.id]);
    res.json({ message: "Link deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete link" });
  }
});

module.exports = router;
