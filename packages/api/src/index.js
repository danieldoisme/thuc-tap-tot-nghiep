import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import http from "http";
import { Server } from "socket.io";

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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Một client đã kết nối:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client đã ngắt kết nối:", socket.id);
  });
});

// --- API Endpoints ---

// API LẤY DANH SÁCH MÓN ĂN CHỜ CHẾ BIẾN
app.get("/api/kitchen-orders", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const offset = (page - 1) * limit;

    // Query để đếm tổng số mục theo ngày
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM Order_Items oi
      JOIN Orders o ON oi.OrderID = o.OrderID
      WHERE oi.Status IN ('đang chế biến', 'đã hoàn thành')
      AND DATE(o.OrderTime) = ?;
    `;
    const [totalResult] = await pool.query(countQuery, [date]);
    const totalItems = totalResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Query để lấy dữ liệu đã phân trang theo ngày
    const dataQuery = `
      SELECT 
        oi.OrderItemID, 
        d.DishName AS DishName, 
        oi.Quantity, 
        t.TableName, 
        o.OrderTime, 
        oi.Status,
        oi.Notes
      FROM Order_Items oi
      JOIN Dishes d ON oi.DishID = d.DishID
      JOIN Orders o ON oi.OrderID = o.OrderID
      JOIN Tables t ON o.TableID = t.TableID
      WHERE oi.Status IN ('đang chế biến', 'đã hoàn thành')
      AND DATE(o.OrderTime) = ?
      ORDER BY o.OrderTime ASC
      LIMIT ?
      OFFSET ?;
    `;
    const [orders] = await pool.query(dataQuery, [date, limit, offset]);

    res.json({
      orders,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Lỗi khi truy vấn kitchen-orders:", error);
    res.status(500).json({ message: "Lỗi từ phía server" });
  }
});

// API CẬP NHẬT TRẠNG THÁI MÓN ĂN -> 'đã hoàn thành'
app.patch("/api/order-items/:orderItemId/complete", async (req, res) => {
  const { orderItemId } = req.params;
  try {
    const updateQuery =
      "UPDATE Order_Items SET Status = 'đã hoàn thành' WHERE OrderItemID = ?";
    const [result] = await pool.query(updateQuery, [orderItemId]);

    if (result.affectedRows > 0) {
      console.log(
        `Món ăn ${orderItemId} đã được cập nhật thành 'đã hoàn thành'.`
      );
      // Gửi sự kiện đến tất cả các client đang kết nối
      io.emit("order_status_updated", { orderItemId, status: "đã hoàn thành" });
      res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy món ăn" });
    }
  } catch (error) {
    console.error(`Lỗi khi cập nhật món ăn ${orderItemId}:`, error);
    res.status(500).json({ message: "Lỗi từ phía server" });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(
    `Server (API + WebSocket) đang chạy tại http://localhost:${PORT}`
  );
});
