export const CATEGORIES = [
  { id: '1', name: 'Tất cả' },
  { id: '2', name: 'Món chính' },
  { id: '3', name: 'Khai vị' },
  { id: '4', name: 'Đồ uống' },
];

export const DISHES = [
  {
    id: '1',
    name: 'Tên món 1',
    price: 20000,
    category: 'Món chính',
    image: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    name: 'Tên món 2',
    price: 20000,
    category: 'Món chính',
    image: 'https://via.placeholder.com/150',
  },
  {
    id: '3',
    name: 'Tên món 3',
    price: 30000,
    category: 'Khai vị',
    image: 'https://via.placeholder.com/150',
  },
  {
    id: '4',
    name: 'Tên món 4',
    price: 30000,
    category: 'Đồ uống',
    image: 'https://via.placeholder.com/150',
  },
];

export const TABLES = [
  { id: '1', name: 'Bàn 1', status: 'trống' },
  { id: '2', name: 'Bàn 2', status: 'có khách' },
  { id: '3', name: 'Bàn 3', status: 'trống' },
  { id: '4', name: 'Bàn 4', status: 'có khách' },
  { id: '5', name: 'Bàn 5', status: 'có khách' },
  { id: '6', name: 'Bàn 6', status: 'có khách' },
];

export const ORDERS = {
  2: [
    {
      id: 'd1',
      dishId: '1',
      name: 'Tên món 1',
      quantity: 2,
      notes: 'Không hành',
      status: 'đã hoàn thành',
    },
    {
      id: 'd2',
      dishId: '2',
      name: 'Tên món 2',
      quantity: 1,
      notes: '',
      status: 'đang chế biến',
    },
    {
      id: 'd3',
      dishId: '3',
      name: 'Tên món 3',
      quantity: 2,
      notes: 'Ít cay',
      status: 'đã phục vụ',
    },
  ],
};
