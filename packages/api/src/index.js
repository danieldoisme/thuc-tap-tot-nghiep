import "dotenv/config";

import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

pool
  .getConnection()
  .then((connection) => {
    console.log("Đã kết nối thành công với database!");
    connection.release();
  })
  .catch((err) => {
    console.error("Không thể kết nối đến database:", err);
  });

app.get("/api/dishes", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Dishes");
    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi truy vấn dishes:", error);
    res.status(500).json({ message: "Lỗi từ phía server" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
