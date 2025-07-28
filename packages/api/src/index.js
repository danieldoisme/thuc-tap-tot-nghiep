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

// ===============================================
// APIs DÀNH CHO ỨNG DỤNG DI ĐỘNG
// ===============================================

// --- 1. API ĐĂNG NHẬP ---
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret_key";

app.post("/api/login", async (req, res) => {
  const { userCode, password } = req.body;

  if (!userCode || !password) {
    return res
      .status(400)
      .json({ message: "Vui lòng nhập mã nhân viên và mật khẩu." });
  }

  try {
    const [users] = await pool.query(
      "SELECT UserID, UserCode, Password, FullName FROM Users WHERE UserCode = ?",
      [userCode]
    );

    if (users.length === 0) {
      return res
        .status(401)
        .json({ message: "Mã nhân viên hoặc mật khẩu không đúng." });
    }

    const user = users[0];
    const isPasswordMatch = await bcrypt.compare(password, user.Password);

    if (!isPasswordMatch) {
      return res
        .status(401)
        .json({ message: "Mã nhân viên hoặc mật khẩu không đúng." });
    }

    const token = jwt.sign(
      { userId: user.UserID, userCode: user.UserCode },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Đăng nhập thành công!",
      token,
      user: {
        userId: user.UserID,
        fullName: user.FullName,
        userCode: user.UserCode,
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi từ phía server." });
  }
});

// --- 2. API LẤY DANH SÁCH BÀN ĂN ---
app.get("/api/tables", async (req, res) => {
  try {
    const [tables] = await pool.query(
      "SELECT TableID, TableName, Status FROM Tables ORDER BY TableName"
    );
    res.json(tables);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bàn:", error);
    res.status(500).json({ message: "Lỗi từ phía server." });
  }
});

// --- 3. API LẤY THỰC ĐƠN (MENU) ---
app.get("/api/menu", async (req, res) => {
  try {
    const [categories] = await pool.query(
      "SELECT * FROM Categories ORDER BY CategoryName"
    );

    const [dishes] = await pool.query(
      "SELECT DishID, DishName, Price, ImageURL, CategoryID FROM Dishes"
    );

    const menu = categories.map((category) => {
      return {
        ...category,
        dishes: dishes.filter(
          (dish) => dish.CategoryID === category.CategoryID
        ),
      };
    });

    res.json(menu);
  } catch (error) {
    console.error("Lỗi khi lấy thực đơn:", error);
    res.status(500).json({ message: "Lỗi từ phía server." });
  }
});

// ===============================================
// APIs DÀNH CHO ỨNG DỤNG WEB
// ===============================================

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
