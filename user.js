const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");


// =====================================
// ✅ GET ALL USERS + DEPARTMENTS (JOIN)
// =====================================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        users.id,
        users.email,
        users.role,
        GROUP_CONCAT(departments.name) AS departments
      FROM users
      LEFT JOIN user_departments 
        ON users.id = user_departments.user_id
      LEFT JOIN departments 
        ON departments.id = user_departments.department_id
      GROUP BY users.id
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


// =====================================
// ✅ CREATE USER (WITH DEPARTMENTS)
// =====================================
router.post("/", async (req, res) => {
  try {
    const { email, password, role, departments } = req.body;

    // validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    // check duplicate email
    const [existing] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user
    const [result] = await db.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, hashedPassword, role]
    );

    const userId = result.insertId;

    // insert departments
    if (departments && departments.length > 0) {
      for (let depId of departments) {
        await db.query(
          "INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)",
          [userId, depId]
        );
      }
    }

    res.json({ message: "User created successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});


// =====================================
// ✅ UPDATE USER (DEPARTMENTS ONLY)
// =====================================
router.put("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { departments } = req.body;

    // remove old departments
    await db.query(
      "DELETE FROM user_departments WHERE user_id = ?",
      [userId]
    );

    // insert new departments
    if (departments && departments.length > 0) {
      for (let depId of departments) {
        await db.query(
          "INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)",
          [userId, depId]
        );
      }
    }

    res.json({ message: "User updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});


// =====================================
// ✅ DELETE USER
// =====================================
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // delete relationships first
    await db.query(
      "DELETE FROM user_departments WHERE user_id = ?",
      [userId]
    );

    // delete user
    await db.query(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    res.json({ message: "User deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
