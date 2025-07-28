const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "tttn",
};

// Example: API endpoint to get all dishes
app.get("/api/dishes", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [dishes] = await connection.execute("SELECT * FROM Dishes");
    await connection.end();
    res.json(dishes);
  } catch (error) {
    console.error("Failed to fetch dishes:", error);
    res.status(500).json({ message: "Error fetching data from database" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
