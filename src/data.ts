export type Robot = {
  id: string;
  name: string;
  location: string;
  city: string;
  status: "online" | "offline" | "error";
  orders: number;
  revenue: number;
  stock: number[];
};
export const ingredients = ["Hạt cà phê", "Sữa tươi", "Siro đường", "Ly giấy"];
export const initialRobots: Robot[] = [
  {
    id: "RB-001",
    name: "Landmark 81",
    location: "Tầng 1, sảnh chính",
    city: "TP. Hồ Chí Minh",
    status: "online",
    orders: 186,
    revenue: 6510000,
    stock: [78, 65, 82, 90],
  },
  {
    id: "RB-002",
    name: "Bitexco Financial Tower",
    location: "Tầng trệt, khu văn phòng",
    city: "TP. Hồ Chí Minh",
    status: "online",
    orders: 154,
    revenue: 5390000,
    stock: [62, 18, 70, 76],
  },
  {
    id: "RB-003",
    name: "Vincom Đồng Khởi",
    location: "Tầng B1, cửa phía Đông",
    city: "TP. Hồ Chí Minh",
    status: "online",
    orders: 132,
    revenue: 4620000,
    stock: [55, 72, 61, 68],
  },
  {
    id: "RB-004",
    name: "Crescent Mall",
    location: "Tầng 2, khu ẩm thực",
    city: "TP. Hồ Chí Minh",
    status: "error",
    orders: 97,
    revenue: 3395000,
    stock: [42, 54, 12, 45],
  },
  {
    id: "RB-005",
    name: "Lotte Center",
    location: "Tầng 1, sảnh văn phòng",
    city: "Hà Nội",
    status: "online",
    orders: 126,
    revenue: 4410000,
    stock: [85, 80, 74, 92],
  },
  {
    id: "RB-006",
    name: "Keangnam Landmark",
    location: "Tầng trệt, lối vào A",
    city: "Hà Nội",
    status: "offline",
    orders: 83,
    revenue: 2905000,
    stock: [33, 46, 65, 19],
  },
  {
    id: "RB-007",
    name: "Saigon Centre",
    location: "Tầng 3, khu mua sắm",
    city: "TP. Hồ Chí Minh",
    status: "online",
    orders: 145,
    revenue: 5075000,
    stock: [72, 61, 84, 80],
  },
  {
    id: "RB-008",
    name: "FPT Complex",
    location: "Sảnh A, khu văn phòng",
    city: "Đà Nẵng",
    status: "online",
    orders: 101,
    revenue: 3535000,
    stock: [68, 75, 59, 88],
  },
];
export const money = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + " ₫";
export const statusLabel = {
  online: "Đang hoạt động",
  offline: "Mất kết nối",
  error: "Có lỗi",
};
export function getAlerts(robots: Robot[]) {
  return robots.flatMap((r) => [
    ...(r.status !== "online"
      ? [
          {
            id: r.id + "-status",
            robot: r,
            title:
              r.status === "error"
                ? "Lỗi bộ phận pha chế"
                : "Robot mất kết nối",
            detail:
              r.status === "error"
                ? "Cần kiểm tra cụm pha chế tại điểm bán."
                : "Kiểm tra nguồn điện và đường truyền mạng.",
            kind: "error" as const,
            index: -1,
          },
        ]
      : []),
    ...r.stock.flatMap((v, i) =>
      v < 25
        ? [
            {
              id: r.id + "-" + i,
              robot: r,
              title: ingredients[i] + " sắp hết",
              detail: `Còn ${v}% dung lượng. Cần bổ sung nguyên liệu.`,
              kind: "stock" as const,
              index: i,
            },
          ]
        : [],
    ),
  ]);
}
