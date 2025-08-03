const { faker } = require("@faker-js/faker");
const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "tttn",
};

const NUMBER_OF_ORDERS = 500;
const VAT_PERCENTAGE = 8.0;
const BUSINESS_HOURS = [10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 22];

async function createRandomOrder(connection, users, tables, dishes) {
  await connection.beginTransaction();
  try {
    const randomUser = faker.helpers.arrayElement(users);
    const randomTable = faker.helpers.arrayElement(tables);
    const orderStatus = "đã thanh toán";
    let orderTime = faker.date.recent({
      days: 14,
    });

    if (Math.random() > 0.3) {
      orderTime.setHours(faker.helpers.arrayElement(BUSINESS_HOURS));
    }

    const orderItems = [];
    let subTotal = 0;
    const numberOfItems = faker.number.int({ min: 1, max: 6 });

    for (let j = 0; j < numberOfItems; j++) {
      const randomDish = faker.helpers.arrayElement(dishes);
      const quantity = faker.number.int({ min: 1, max: 3 });
      subTotal += randomDish.Price * quantity;

      orderItems.push({
        DishID: randomDish.DishID,
        Quantity: quantity,
        Price: randomDish.Price,
        Status: "đã phục vụ",
      });
    }

    const vatAmount = (subTotal * VAT_PERCENTAGE) / 100;
    const totalAmount = subTotal + vatAmount;

    const orderSQL = `
      INSERT INTO Orders (TableID, UserID, OrderTime, SubTotal, VAT_Percentage, VAT_Amount, TotalAmount, Status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const [orderResult] = await connection.execute(orderSQL, [
      randomTable.TableID,
      randomUser.UserID,
      orderTime,
      subTotal,
      VAT_PERCENTAGE,
      vatAmount,
      totalAmount,
      orderStatus,
    ]);
    const newOrderId = orderResult.insertId;

    const orderItemSQL = `
      INSERT INTO Order_Items (OrderID, DishID, Quantity, Price, Status) VALUES ?`;
    const orderItemValues = orderItems.map((item) => [
      newOrderId,
      item.DishID,
      item.Quantity,
      item.Price,
      item.Status,
    ]);
    await connection.query(orderItemSQL, [orderItemValues]);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function generateData() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Kết nối CSDL thành công.");

    const [users] = await connection.execute("SELECT UserID FROM Users");
    const [tables] = await connection.execute("SELECT TableID FROM Tables");
    const [dishes] = await connection.execute(
      "SELECT DishID, Price FROM Dishes"
    );

    if (users.length === 0 || tables.length === 0 || dishes.length === 0) {
      console.error(
        "Lỗi: Cần có dữ liệu trong các bảng Users, Tables, và Dishes."
      );
      return;
    }

    console.log(`Bắt đầu tạo ${NUMBER_OF_ORDERS} đơn hàng...`);

    for (let i = 0; i < NUMBER_OF_ORDERS; i++) {
      try {
        await createRandomOrder(connection, users, tables, dishes);
        process.stdout.write(
          `\rĐã tạo thành công đơn hàng ${i + 1}/${NUMBER_OF_ORDERS}`
        );
      } catch (error) {
        console.error(`\nLỗi khi tạo đơn hàng thứ ${i + 1}:`, error);
        break;
      }
    }

    console.log(
      `\nHoàn thành! Đã tạo thành công ${NUMBER_OF_ORDERS} đơn hàng.`
    );
  } catch (error) {
    console.error("Lỗi không mong muốn:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("Đã đóng kết nối CSDL.");
    }
  }
}

generateData();
