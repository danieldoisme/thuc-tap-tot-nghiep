import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import http from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

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
import bcrypt from "bcrypt";

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

    res.json({
      message: "Đăng nhập thành công!",
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
      "SELECT TableID, TableName, Status FROM Tables ORDER BY CAST(SUBSTRING(TableName, 5) AS UNSIGNED)"
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

// --- 4. API TẠO ĐƠN HÀNG MỚI HOẶC THÊM MÓN VÀO ĐƠN HÀNG HIỆN TẠI ---
app.post("/api/orders", async (req, res) => {
  const { tableId, userId, items } = req.body;

  if (!tableId || !userId || !items || items.length === 0) {
    return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Kiểm tra xem có đơn hàng nào đang 'chờ thanh toán' cho bàn này không
    const [existingOrders] = await connection.query(
      "SELECT OrderID FROM Orders WHERE TableID = ? AND Status = 'chờ thanh toán' ORDER BY OrderID DESC LIMIT 1",
      [tableId]
    );

    let orderId;

    if (existingOrders.length > 0) {
      // Nếu có, sử dụng OrderID hiện có
      orderId = existingOrders[0].OrderID;
    } else {
      // Nếu không, tạo một đơn hàng mới
      const [orderResult] = await connection.execute(
        "INSERT INTO Orders (TableID, UserID, SubTotal, VAT_Amount, TotalAmount, OrderTime) VALUES (?, ?, 0, 0, 0, NOW())",
        [tableId, userId]
      );
      orderId = orderResult.insertId;

      // Cập nhật trạng thái bàn thành 'có khách' chỉ khi tạo order mới
      await connection.execute(
        "UPDATE Tables SET Status = 'có khách' WHERE TableID = ?",
        [tableId]
      );
      // Gửi sự kiện cập nhật trạng thái bàn
      io.emit("table_status_updated", { tableId: tableId, status: "có khách" });
    }

    // Thêm các món ăn mới vào bảng Order_Items
    const orderItemsValues = items.map((item) => [
      orderId,
      item.id,
      item.quantity,
      item.price,
      item.notes || null,
    ]);
    await connection.query(
      "INSERT INTO Order_Items (OrderID, DishID, Quantity, Price, Notes) VALUES ?",
      [orderItemsValues]
    );

    // Cập nhật lại tổng tiền của đơn hàng
    const [allItems] = await connection.query(
      "SELECT SUM(Price * Quantity) as total FROM Order_Items WHERE OrderID = ?",
      [orderId]
    );
    const subTotal = parseFloat(allItems[0].total) || 0;
    const vatAmount = subTotal * 0.08;
    const totalAmount = subTotal + vatAmount;

    await connection.execute(
      "UPDATE Orders SET SubTotal = ?, VAT_Amount = ?, TotalAmount = ? WHERE OrderID = ?",
      [subTotal, vatAmount, totalAmount, orderId]
    );

    // Nếu tất cả thành công, commit transaction
    await connection.commit();

    // Gửi thông báo đến nhà bếp
    io.emit("new_order");

    res
      .status(201)
      .json({ message: "Cập nhật đơn hàng thành công!", orderId: orderId });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi khi xử lý đơn hàng:", error);
    res.status(500).json({ message: "Lỗi từ phía server." });
  } finally {
    connection.release();
  }
});

// --- 5. API LẤY CHI TIẾT ĐƠN HÀNG CỦA MỘT BÀN ---
app.get("/api/orders/table/:tableId", async (req, res) => {
  try {
    const { tableId } = req.params;

    // Tìm đơn hàng chưa thanh toán của bàn
    const [orders] = await pool.query(
      "SELECT OrderID, SubTotal, VAT_Amount, TotalAmount, OrderTime FROM Orders WHERE TableID = ? AND Status = 'chờ thanh toán' ORDER BY OrderID DESC LIMIT 1",
      [tableId]
    );

    if (orders.length === 0) {
      // Nếu bàn không có order, trả về mảng rỗng
      return res.json({ order: null, items: [] });
    }

    const currentOrder = orders[0];

    // Lấy tất cả các món trong đơn hàng đó
    const [items] = await pool.query(
      `
      SELECT 
        oi.OrderItemID, 
        oi.Quantity, 
        oi.Status, 
        oi.Notes,
        d.DishName, 
        d.Price,
        d.ImageURL
      FROM Order_Items oi
      JOIN Dishes d ON oi.DishID = d.DishID
      WHERE oi.OrderID = ?
    `,
      [currentOrder.OrderID]
    );

    res.json({ order: currentOrder, items: items });
  } catch (error) {
    console.error(
      `Lỗi khi lấy chi tiết đơn hàng cho bàn ${req.params.tableId}:`,
      error
    );
    res.status(500).json({ message: "Lỗi từ phía server." });
  }
});

// --- 6. API CẬP NHẬT TRẠNG THÁI MÓN ĂN -> "đã phục vụ" ---
app.patch("/api/order-items/:orderItemId/serve", async (req, res) => {
  const { orderItemId } = req.params;
  try {
    await pool.query(
      "UPDATE Order_Items SET Status = 'đã phục vụ' WHERE OrderItemID = ?",
      [orderItemId]
    );

    // Gửi sự kiện cập nhật
    io.emit("order_status_updated", { orderItemId });

    res.json({ message: "Cập nhật trạng thái món ăn thành công." });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái món ăn:", error);
    res.status(500).json({ message: "Lỗi từ phía server." });
  }
});

// --- 7. API THANH TOÁN (CHECKOUT) ---
app.post("/api/checkout", async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "Vui lòng cung cấp mã đơn hàng." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lấy thông tin TableID từ OrderID để cập nhật bàn
    const [orders] = await connection.execute(
      "SELECT TableID FROM Orders WHERE OrderID = ?",
      [orderId]
    );
    if (orders.length === 0) {
      throw new Error("Không tìm thấy đơn hàng.");
    }
    const tableId = orders[0].TableID;

    // Cập nhật trạng thái đơn hàng thành 'đã thanh toán'
    const [orderUpdateResult] = await connection.execute(
      "UPDATE Orders SET Status = 'đã thanh toán' WHERE OrderID = ?",
      [orderId]
    );

    if (orderUpdateResult.affectedRows === 0) {
      throw new Error("Không thể cập nhật trạng thái đơn hàng.");
    }

    // Cập nhật trạng thái bàn thành 'trống'
    await connection.execute(
      "UPDATE Tables SET Status = 'trống' WHERE TableID = ?",
      [tableId]
    );

    // Nếu tất cả thành công, commit transaction
    await connection.commit();

    // Gửi sự kiện để cập nhật trạng thái bàn trên các client
    io.emit("table_status_updated", { tableId: tableId, status: "trống" });

    res.json({ message: "Thanh toán thành công." });
  } catch (error) {
    await connection.rollback();
    console.error(`Lỗi khi thanh toán cho đơn hàng ${orderId}:`, error);
    // Phân biệt lỗi do client hay server
    if (error.message === "Không tìm thấy đơn hàng.") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Lỗi từ phía server." });
    }
  } finally {
    connection.release();
  }
});

// --- 8. API LẤY THÔNG TIN NHÂN VIÊN ---
app.get("/api/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [users] = await pool.query(
      "SELECT UserID, UserCode, FullName FROM Users WHERE UserID = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const user = users[0];
    res.json({
      userId: user.UserID,
      fullName: user.FullName,
      userCode: user.UserCode,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
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

// API CẬP NHẬT TRẠNG THÁI MÓN ĂN -> "đã hoàn thành"
app.patch("/api/order-items/:orderItemId/complete", async (req, res) => {
  const { orderItemId } = req.params;
  try {
    await pool.query(
      "UPDATE Order_Items SET Status = 'đã hoàn thành' WHERE OrderItemID = ?",
      [orderItemId]
    );

    // Gửi sự kiện cập nhật
    io.emit("order_status_updated", { orderItemId });

    res.json({ message: "Món ăn đã được hoàn thành." });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái món ăn:", error);
    res.status(500).json({ message: "Lỗi từ phía server." });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(
    `Server (API + WebSocket) đang chạy tại http://localhost:${PORT}`
  );
});
