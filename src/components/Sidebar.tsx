"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  LayoutDashboard, PenTool, Package, MessageSquare, 
  Settings, Share2, LogOut, LogIn, Clock, MessageCircle, 
  ShoppingBag, Truck, Sparkles, Menu, X, Target, Radio,
  Flame, Users, ShieldCheck, Film, Wand2, Crown, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { io } from "socket.io-client";

// --- 1. KẾT NỐI SOCKET ĐỘNG ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.kpost.vn";
const socket = io(API_URL);

// CẤU TRÚC PHÂN MỤC MENU GIAO DIỆN HIỆN ĐẠI (CHỮ THƯỜNG DỄ NHÌN, ĐÚNG CHUẨN KPOST.VN)
interface MenuItem {
  name: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  badgeColor?: string;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "CÔNG CỤ AI",
    items: [
      { 
        name: "AI Video Editor", 
        icon: <Wand2 size={18} className="text-amber-500 animate-pulse" />, 
        href: "/ai-video-editor", 
        badge: "AI PRO",
        badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black"
      },
      { 
        name: "AI Video Spinner", 
        icon: <Film size={18} className="text-purple-500" />, 
        href: "/video-spinner", 
        badge: "HOT",
        badgeColor: "bg-purple-600 text-white font-bold"
      },
      { 
        name: "AI Marketing", 
        icon: <PenTool size={18} className="text-blue-500" />, 
        href: "/" 
      },
      { 
        name: "AI Livestream", 
        icon: <Radio size={18} className="text-red-500 animate-pulse" />, 
        href: "/livestream", 
        badge: "LIVE",
        badgeColor: "bg-red-500 text-white font-black"
      },
    ]
  },
  {
    title: "QUẢN LÝ DỊCH VỤ",
    items: [
      { name: "Tổng quan", icon: <LayoutDashboard size={18} />, href: "/dashboard" },
      { name: "Lịch đăng bài", icon: <Clock size={18} />, href: "/schedule" }, 
      { name: "Hộp thư Inbox", icon: <MessageSquare size={18} />, href: "/inbox" },
      { name: "Quản lý sản phẩm", icon: <Package size={18} />, href: "/products" },
      { name: "Quản lý Bình luận", icon: <MessageCircle size={18} />, href: "/comments" }, 
      { name: "Quản lý Đơn hàng", icon: <ShoppingBag size={18} />, href: "/orders" },
      { name: "Cấu hình vận chuyển", icon: <Truck size={18} />, href: "/shipping" },
    ]
  },
  {
    title: "PHÂN TÍCH & KẾT NỐI",
    items: [
      { name: "Doanh thu", icon: <TrendingUp size={18} className="text-emerald-500" />, href: "/dashboard" },
      { name: "Affiliate", icon: <Sparkles size={18} className="text-orange-500" />, href: "/affiliate" },
      { name: "AI Remarketing", icon: <Target size={18} className="text-rose-500" />, href: "/remarketing" }, 
      { name: "Kết nối MXH", icon: <Share2 size={18} className="text-blue-500" />, href: "/social" },
      { name: "Cài đặt hệ thống", icon: <Settings size={18} />, href: "/settings" },
    ]
  }
];

// MENU QUẢN TRỊ VIÊN ADMIN
const adminMenuItems: MenuItem[] = [
  { 
    name: "Flash Sale & Popup", 
    icon: <Flame size={18} className="text-orange-500 animate-bounce" />, 
    href: "/admin/marketing",
    badge: "HOT",
    badgeColor: "bg-orange-500 text-white font-black"
  },
  { 
    name: "Quản lý Khách hàng", 
    icon: <Users size={18} className="text-blue-500" />, 
    href: "/admin/users" 
  },
  { 
    name: "Admin Dashboard", 
    icon: <ShieldCheck size={18} className="text-purple-500" />, 
    href: "/admin" 
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter(); 
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState("PRO TRIAL");
  const [daysLeft, setDaysLeft] = useState<number>(6);
  
  // STATE ĐIỀU KHIỂN MENU TRÊN MOBILE
  const [isOpen, setIsOpen] = useState(false);

  // --- 2. HÀM LẤY THÔNG TIN NGƯỜI DÙNG & GÓI CƯỚC THẬT ---
  const fetchUserStatus = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Đọc trước từ localStorage để giao diện hiển thị ngay lập tức (không delay)
    try {
      const savedUserStr = localStorage.getItem("kpost_user") || localStorage.getItem("user");
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        setUser(parsed);
        if (parsed.plan) setPlan(parsed.plan === "FREE" ? "PRO TRIAL" : parsed.plan);
        if (parsed.daysLeft) setDaysLeft(parsed.daysLeft);
      }
    } catch (e) {}

    if (!token) {
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = res.data || {};
      setUser(userData);

      // 🌟 KIỂM TRA ĐẶC QUYỀN KHÁCH MỚI: 07 NGÀY DÙNG THỬ PRO TRIAL
      const rawPlan = (userData.plan || "").toUpperCase().trim();
      const rawExpiry = userData.planExpiry || userData.planExpire || userData.expireDate || null;
      
      const createdAtTime = userData.createdAt ? new Date(userData.createdAt).getTime() : Date.now();
      const diffDaysFromCreated = (Date.now() - createdAtTime) / (1000 * 60 * 60 * 24);
      const isWithin7Days = diffDaysFromCreated >= 0 && diffDaysFromCreated < 7;

      let isLocalTrial = false;
      try {
        const saved = localStorage.getItem("kpost_user") || localStorage.getItem("user");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.isTrial) isLocalTrial = true;
        }
      } catch (err) {}

      // Tính số ngày còn lại
      if (rawExpiry) {
        const diffMs = new Date(rawExpiry).getTime() - Date.now();
        const calcDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        setDaysLeft(calcDays);

        if (diffMs <= 0) {
          setPlan("FREE");
          return;
        }
      } else {
        const remaining = Math.max(1, 7 - Math.floor(diffDaysFromCreated));
        setDaysLeft(remaining);
      }

      // Xác định gói cước hiển thị
      if (rawPlan === "PRO TRIAL" || userData.isTrial || isLocalTrial || (isWithin7Days && (rawPlan === "FREE" || rawPlan === "" || rawPlan === "PRO"))) {
        setPlan("PRO TRIAL");
      } else if (rawPlan === "DIAMOND") {
        setPlan("DIAMOND");
      } else if (rawPlan === "GOLD") {
        setPlan("GOLD");
      } else if (rawPlan === "PRO") {
        setPlan("PRO");
      } else {
        setPlan(rawPlan || "PRO TRIAL");
      }
    } catch (e) {
      console.warn("Phiên kết nối máy chủ ngoại tuyến, sử dụng dữ liệu cục bộ");
    }
  }, []);

  useEffect(() => {
    fetchUserStatus();

    socket.on("paymentSuccess", () => {
      fetchUserStatus(); 
    });

    const handleStorageChange = () => {
      fetchUserStatus();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      socket.off("paymentSuccess");
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchUserStatus, pathname]);

  // Tự động đóng Menu khi đổi trang (trên Mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.clear(); 
      window.location.href = "/"; 
    }
  };

  // Kiểm tra tài khoản có phải Admin không
  const isAdmin = user?.role === "super_admin" || user?.role === "admin" || user?.email === "tech28.vn@gmail.com";
  const userInitial = user?.name ? user.name.trim()[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "B");
  const displayName = user?.name || (user?.email ? user.email.split("@")[0].toUpperCase() : "BÙI VĂN KỲ");

  return (
    <>
      {/* HEADER CHO MOBILE */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-sm">
            K
          </div>
          <div>
            <div className="font-black italic text-base tracking-tight text-slate-900 leading-none">
              KPOST<span className="text-[#f9570c]">.VN</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              AI Automator SaaS
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* OVERLAY NỀN ĐEN MỜ CHO MOBILE */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* THANH MENU (SIDEBAR) CHÍNH - KHỚP 100% GIAO DIỆN CHUẨN ĐẸP KPOST.VN */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 
        flex flex-col z-[100] font-sans transition-transform duration-300 ease-in-out shadow-sm
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
      `}>
        
        {/* 1. BRAND HEADER (LOGO K XANH + KPOST.VN CAM + BADGE PRO TRIAL BÊN PHẢI) */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            {/* Logo K vuông bo góc xanh biển */}
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
              K
            </div>
            <div>
              <div className="font-black italic text-lg tracking-tight text-slate-900 leading-none">
                KPOST<span className="text-[#f9570c]">.VN</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 block">
                AI AUTOMATOR SAAS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5">
            {/* Huy hiệu PRO TRIAL màu cam gradient */}
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm shrink-0">
              {plan === "PRO TRIAL" ? "PRO TRIAL" : plan}
            </span>
            <button 
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. DANH SÁCH MENU DẠNG NHÓM (CHỮ THƯỜNG TRANG NHÃ, DỄ NHÌN) */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4 text-slate-700 custom-scrollbar">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <div className="px-3 pt-1 pb-1">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {section.title}
                  </p>
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all cursor-pointer ${
                      isActive 
                        ? "bg-orange-50 text-[#f9570c] font-black shadow-xs" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 ${isActive ? "text-[#f9570c]" : "text-slate-500"}`}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                        item.badgeColor || "bg-amber-400 text-slate-950 font-black"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* 3. MENU DÀNH CHO ADMIN */}
          {(isAdmin || pathname.startsWith("/admin")) && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="px-3 pt-1 pb-1">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  QUẢN TRỊ ADMIN
                </p>
              </div>
              {adminMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all cursor-pointer ${
                      isActive 
                        ? "bg-orange-50 text-[#f9570c] font-black shadow-xs" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 ${isActive ? "text-[#f9570c]" : "text-slate-500"}`}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                        item.badgeColor || "bg-orange-500 text-white font-black"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* 3. PHẦN DƯỚI CÙNG SIDEBAR: NÚT NÂNG CẤP / GIA HẠN + USER PROFILE CARD */}
        <div className="p-3 border-t border-slate-100 bg-white shrink-0">
          {/* Nút NÂNG CẤP / GIA HẠN màu cam nổi bật */}
          <Link
            href="/settings"
            className="w-full bg-[#f9570c] hover:bg-[#ea4e07] text-white font-black py-3 px-4 rounded-[18px] text-[13px] uppercase tracking-wider shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
          >
            <Crown size={18} className="fill-white" />
            NÂNG CẤP / GIA HẠN
          </Link>

          {/* Thẻ User Profile & Nút Đăng xuất */}
          <div className="flex items-center justify-between pt-3 pb-1 px-1 mt-1">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar cam chữ B */}
              <div className="w-10 h-10 rounded-[14px] bg-[#f9570c] text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                {userInitial}
              </div>
              {/* Thông tin tên & Hạng PRO TRIAL */}
              <div className="flex flex-col min-w-0">
                <span className="font-black italic uppercase text-slate-900 text-sm tracking-tight truncate">
                  {displayName}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#f9570c]">
                    {plan}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    • Còn {daysLeft} ngày
                  </span>
                </div>
              </div>
            </div>

            {/* Nút Đăng Xuất icon LogOut màu cam */}
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="text-[#f9570c] hover:text-red-600 hover:bg-orange-50 p-2 rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}