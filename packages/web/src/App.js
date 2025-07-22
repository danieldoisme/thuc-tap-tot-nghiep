import { useState, useEffect } from "react";
import "./App.css";

const initialWaitingDishes = [
  {
    orderItemId: 1,
    dishName: "Phở Bò Tái",
    quantity: 2,
    tableName: "Bàn 2",
    orderTime: "2025-07-22T11:55:55Z",
    notes: "Không hành",
  },
  {
    orderItemId: 2,
    dishName: "Bún Chả",
    quantity: 2,
    tableName: "Bàn 1",
    orderTime: "2025-07-22T11:55:55Z",
    notes: null,
  },
  {
    orderItemId: 3,
    dishName: "Cơm Tấm",
    quantity: 2,
    tableName: "Bàn 3",
    orderTime: "2025-07-22T11:55:55Z",
    notes: "Thêm trứng ốp la",
  },
  {
    orderItemId: 4,
    dishName: "Gỏi Cuốn",
    quantity: 4,
    tableName: "Bàn 5",
    orderTime: "2025-07-22T11:55:55Z",
    notes: null,
  },
];

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [waitingDishes, setWaitingDishes] = useState(initialWaitingDishes);
  const [preparedDishes, setPreparedDishes] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMarkAsDone = (orderItemId) => {
    const dishToMove = waitingDishes.find(
      (dish) => dish.orderItemId === orderItemId
    );
    if (dishToMove) {
      const now = new Date();
      const doneDish = { ...dishToMove, time: now.toLocaleTimeString("en-GB") };

      setWaitingDishes(
        waitingDishes.filter((dish) => dish.orderItemId !== orderItemId)
      );
      setPreparedDishes((prevPrepared) => [doneDish, ...prevPrepared]);
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
            ? new Date(dish.orderTime).toLocaleTimeString("en-GB", {
                timeZone: "UTC",
              })
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

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Danh sách món ăn chờ chế biến</h1>
        <div className="clock">{formatTime(currentTime)}</div>
      </header>
      <main className="main-content">
        <div className="dish-column">
          <h2>Chờ chế biến</h2>
          <div className="dish-list">
            {waitingDishes.length > 0 ? (
              waitingDishes
                .sort((a, b) => a.orderTime.localeCompare(b.orderTime))
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
    </div>
  );
};

export default App;
