import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import io from "socket.io-client";
import "./App.css";

const API_URL = "http://localhost:3001";
const socket = io(API_URL);

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [waitingDishes, setWaitingDishes] = useState([]);
  const [preparedDishes, setPreparedDishes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const fetchAndSetDishes = useCallback(async (page, date) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/kitchen-orders?page=${page}&limit=10&date=${date}`
      );
      const { orders, totalPages: newTotalPages } = response.data;

      const formattedDishes = orders.map((dish) => ({
        orderItemId: dish.OrderItemID,
        dishName: dish.DishName,
        quantity: dish.Quantity,
        tableName: dish.TableName,
        orderTime: dish.OrderTime,
        status: dish.Status,
        notes: dish.Notes,
      }));

      const waiting = formattedDishes.filter(
        (dish) => dish.status === "đang chế biến"
      );
      const prepared = formattedDishes
        .filter((dish) => dish.status === "đã hoàn thành")
        .map((dish) => ({
          ...dish,
          time: new Date(dish.orderTime).toLocaleTimeString("en-GB"),
        }));

      setWaitingDishes(waiting);
      setPreparedDishes(prepared);
      setTotalPages(newTotalPages);
    } catch (error) {
      console.error("Lỗi không thể tải dữ liệu:", error);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    fetchAndSetDishes(currentPage, selectedDate);

    const handleStatusUpdate = () => {
      // Tải lại dữ liệu trang hiện tại khi có cập nhật
      fetchAndSetDishes(currentPage, selectedDate);
    };

    socket.on("order_status_updated", handleStatusUpdate);
    socket.on("new_order", handleStatusUpdate);

    return () => {
      socket.off("order_status_updated", handleStatusUpdate);
      socket.off("new_order", handleStatusUpdate);
    };
  }, [currentPage, selectedDate, fetchAndSetDishes]);

  const handleMarkAsDone = async (orderItemId) => {
    try {
      await axios.patch(`${API_URL}/api/order-items/${orderItemId}/complete`);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      alert("Không thể cập nhật trạng thái món ăn.");
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-GB");
  };

  const DishCard = ({ dish, isWaiting, onDone }) => (
    <div className="dish-card">
      <div className="dish-info">
        <p>
          <strong>{dish.dishName}</strong>
        </p>
        <p>Số lượng: {dish.quantity}</p>
        {dish.notes && <p className="dish-notes">Lưu ý: {dish.notes}</p>}
      </div>
      <div className="dish-details">
        <p>{dish.tableName}</p>
        <p className={isWaiting ? "time-waiting" : "time-prepared"}>
          {isWaiting
            ? new Date(dish.orderTime).toLocaleTimeString("en-GB")
            : dish.time}
        </p>
      </div>
      <div className="dish-action">
        {isWaiting && (
          <button
            className="done-button"
            onClick={() => onDone(dish.orderItemId)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Danh sách món ăn chờ chế biến</h1>
        <div className="header-controls">
          <div className="date-picker-container">
            <input
              type="date"
              id="date-picker"
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>
          <div className="clock">{formatTime(currentTime)}</div>
        </div>
      </header>
      <main className="main-content">
        <div className="dish-column">
          <h2>Chờ chế biến</h2>
          <div className="dish-list">
            {waitingDishes.length > 0 ? (
              waitingDishes
                .sort((a, b) => new Date(a.orderTime) - new Date(b.orderTime))
                .map((dish) => (
                  <DishCard
                    key={dish.orderItemId}
                    dish={dish}
                    isWaiting={true}
                    onDone={handleMarkAsDone}
                  />
                ))
            ) : (
              <p className="empty-list-message">Không có món nào đang chờ.</p>
            )}
          </div>
        </div>
        <div className="dish-column">
          <h2>Đã chế biến</h2>
          <div className="dish-list">
            {preparedDishes.length > 0 ? (
              preparedDishes.map((dish) => (
                <DishCard
                  key={dish.orderItemId}
                  dish={dish}
                  isWaiting={false}
                />
              ))
            ) : (
              <p className="empty-list-message">
                Chưa có món nào được hoàn thành.
              </p>
            )}
          </div>
        </div>
      </main>
      <footer className="app-footer">
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Trang trước
          </button>
          <span>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Trang sau
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
