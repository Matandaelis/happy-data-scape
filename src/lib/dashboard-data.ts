export const MOCK_SHOWS = [
  { id: "s1", title: "Summer Flash Sale", status: "live" as const, published: true, startTime: "2026-03-22 21:00", host: "Grace Wanjiku", viewers: 142 },
  { id: "s2", title: "New Arrivals Drop", status: "scheduled" as const, published: true, startTime: "2026-03-25 18:00", host: "Brian Otieno", viewers: 0 },
  { id: "s3", title: "Electronics Week", status: "ended" as const, published: true, startTime: "2026-03-18 15:00", host: "Grace Wanjiku", viewers: 389 },
  { id: "s4", title: "Draft Show", status: "scheduled" as const, published: false, startTime: "2026-03-30 10:00", host: "Elis Matanda", viewers: 0 },
];

export const MOCK_VIDEOS = [
  { id: "v1", title: "Unboxing iPhone 16", thumb: "📱", published: true, views: 1204, duration: "4:32" },
  { id: "v2", title: "Nike Air Force 1 Review", thumb: "👟", published: true, views: 876, duration: "3:15" },
  { id: "v3", title: "Kitchen Gadgets Tour", thumb: "🍳", published: false, views: 0, duration: "6:01" },
];

export const MOCK_PRODUCTS = [
  { id: "p1", title: "iPhone 16 Pro 256GB", price: 189000, inStock: true, thumb: "📱" },
  { id: "p2", title: "Nike Air Force 1", price: 14500, inStock: true, thumb: "👟" },
  { id: "p3", title: "Samsung Galaxy S25", price: 145000, inStock: false, thumb: "📲" },
  { id: "p4", title: "Sony WH-1000XM5", price: 42000, inStock: true, thumb: "🎧" },
];

export const MOCK_CHAT = [
  { id: 1, user: "Grace W.", msg: "Love this product! 😍", color: "#1648e8", time: "21:04" },
  { id: 2, user: "Brian O.", msg: "What's the price?", color: "#8b5cf6", time: "21:04" },
  { id: 3, user: "Anonymous", msg: "Add to cart!", color: "#10b981", time: "21:05" },
  { id: 4, user: "Fatuma A.", msg: "Shipping to Mombasa?", color: "#f59e0b", time: "21:05" },
];

export type ShowStatus = "live" | "scheduled" | "ended";

export const STATUS_STYLES: Record<ShowStatus, string> = {
  live: "bg-live/10 text-live border border-live",
  scheduled: "bg-blue-50 text-primary border border-blue-200",
  ended: "bg-gray-100 text-gray-500 border border-gray-300",
};
