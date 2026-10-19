"use client";
import React, { useState, useEffect, useCallback } from "react";
import { 
  LayoutDashboard, PenTool, Package, MessageSquare, 
  Settings, Share2, LogOut, LogIn, Clock, MessageCircle, 
  ShoppingBag, Truck, Sparkles, Menu, X, Target, Radio,
  Flame, Users, ShieldCheck, Film, Wand2, Crown, TrendingUp,
  BookOpen, Scale, Shield, Calendar, Check, CheckCircle2,
  QrCode, Ticket, Zap, Copy, PartyPopper
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

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
      { 
        name: "AI Remarketing", 
        icon: <Target size={18} className="text-rose-500" />, 
        href: "/remarketing" 
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
      { name: "Affiliate (Kiếm tiền)", icon: <Sparkles size={18} className="text-orange-500" />, href: "/affiliate", badge: "10% HOA HỒNG", badgeColor: "bg-orange-500 text-white font-black" },
      { name: "Kết nối MXH", icon: <Share2 size={18} className="text-blue-500" />, href: "/social" },
    ]
  },
  {
    title: "HỖ TRỢ & PHÁP LÝ",
    items: [
      { name: "Hướng dẫn khách mới", icon: <BookOpen size={18} className="text-blue-500" />, href: "/guide", badge: "MỚI", badgeColor: "bg-blue-600 text-white font-bold" },
      { name: "Điều khoản sử dụng", icon: <Scale size={18} className="text-slate-500" />, href: "/terms" },
      { name: "Chính sách bảo mật", icon: <Shield size={18} className="text-slate-500" />, href: "/privacy" },
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- 2. HÀM TÍNH TOÁN QUYỀN LỢI GÓI CƯỚC CHUẨN ĐỒNG NHẤT HỆ THỐNG ---
  const resolveSubscription = useCallback((userData: any) => {
    if (!userData) {
      return { plan: 'PRO TRIAL', daysLeft: 6, isTrial: true, isPaid: false };
    }

    const email = (userData.email || '').toLowerCase().trim();
    const rawPlan = (userData.plan || '').toUpperCase().trim();
    const rawExpiry = userData.planExpiry || userData.planExpire || userData.expireDate || null;
    const createdAt = userData.createdAt || userData.created_at || userData.createdDate || null;

    // 1. Kiểm tra cache nạp tiền trả phí kpost_paid_subscription (đảm bảo F5 không bị API đè về FREE)
    let paidCache: any = null;
    try {
      const savedPaid = localStorage.getItem('kpost_paid_subscription');
      if (savedPaid) {
        paidCache = JSON.parse(savedPaid);
      }
    } catch (e) {}

    const effectiveExpiry = (paidCache && paidCache.planExpiry && new Date(paidCache.planExpiry).getTime() > Date.now())
      ? paidCache.planExpiry
      : rawExpiry;

    const hasValidFutureExpiry = effectiveExpiry && new Date(effectiveExpiry).getTime() > Date.now();
    const isPaidPlan = rawPlan === 'PRO' || rawPlan === 'GOLD' || rawPlan === 'DIAMOND';
    const isExplicitPaid = (hasValidFutureExpiry && (isPaidPlan || paidCache?.isPaid === true)) && (userData.isTrial !== true);

    if (isExplicitPaid) {
      const remaining = Math.max(1, Math.ceil((new Date(effectiveExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const activePlan = isPaidPlan ? rawPlan : (paidCache?.plan || 'PRO');
      return {
        ...userData,
        plan: activePlan,
        displayPlan: activePlan,
        daysLeft: remaining,
        remainingDays: remaining,
        planExpiry: new Date(effectiveExpiry).toISOString(),
        isTrial: false,
        isPaid: true,
      };
    }

    // 2. KHÁCH MỚI ĐĂNG KÝ: TỰ ĐỘNG CỘNG 07 NGÀY DÙNG THỬ PRO TRIAL MIỄN PHÍ
    let trialStartTime: number;
    if (createdAt && !isNaN(new Date(createdAt).getTime())) {
      trialStartTime = new Date(createdAt).getTime();
    } else {
      const cachedStart = typeof window !== 'undefined' && email ? localStorage.getItem(`kpost_trial_start_${email}`) : null;
      if (cachedStart && !isNaN(new Date(cachedStart).getTime())) {
        trialStartTime = new Date(cachedStart).getTime();
      } else {
        trialStartTime = Date.now();
      }
    }

    try {
      if (email && typeof window !== 'undefined') {
        const existing = localStorage.getItem(`kpost_trial_start_${email}`);
        if (!existing) {
          localStorage.setItem(`kpost_trial_start_${email}`, new Date(trialStartTime).toISOString());
        }
      }
    } catch (e) {}

    const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
    const trialEndTime = trialStartTime + trialDurationMs;
    const diffMs = trialEndTime - Date.now();

    if (diffMs > 0) {
      // Vẫn trong 07 ngày dùng thử PRO TRIAL:
      const days = Math.min(7, Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
      return {
        ...userData,
        plan: 'PRO TRIAL',
        displayPlan: 'PRO TRIAL',
        daysLeft: days,
        remainingDays: days,
        planExpiry: new Date(trialEndTime).toISOString(),
        isTrial: true,
        isPaid: false,
        trialDays: 7,
      };
    }

    // 3. Đã hết 07 ngày dùng thử và chưa mua gói -> Gói FREE
    return {
      ...userData,
      plan: 'FREE',
      displayPlan: 'FREE MEMBER',
      daysLeft: 0,
      remainingDays: 0,
      planExpiry: null,
      isTrial: false,
      isPaid: false,
      trialExpired: true,
    };
  }, []);

  const fetchUserStatus = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Đọc trước từ localStorage để giao diện hiển thị ngay lập tức (không delay)
    try {
      const savedUserStr = localStorage.getItem("kpost_user") || localStorage.getItem("user");
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        const resolved = resolveSubscription(parsed);
        setUser(resolved);
        setPlan(resolved.displayPlan || resolved.plan);
        setDaysLeft(resolved.daysLeft);
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
      const resolved = resolveSubscription(userData);
      setUser(resolved);
      setPlan(resolved.displayPlan || resolved.plan);
      setDaysLeft(resolved.daysLeft);

      // Lưu ngược vào localStorage để đảm bảo dữ liệu đồng nhất
      try {
        localStorage.setItem("kpost_user", JSON.stringify(resolved));
        localStorage.setItem("user", JSON.stringify(resolved));
      } catch (err) {}
    } catch (e) {
      console.warn("Phiên kết nối máy chủ ngoại tuyến, sử dụng dữ liệu cục bộ");
    }
  }, [resolveSubscription]);

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

            {/* Huy hiệu PRO TRIAL màu cam gradient hoặc PRO */}
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm shrink-0 ${
              plan === "PRO TRIAL"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                : plan === "FREE"
                ? "bg-slate-200 text-slate-700"
                : "bg-[#f9570c] text-white"
            }`}>
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

        {/* 3. PHẦN DƯỚI CÙNG SIDEBAR: CÀI ĐẶT HỆ THỐNG + NÚT NÂNG CẤP / GIA HẠN + USER PROFILE CARD */}
        <div className="p-2.5 border-t border-slate-100 bg-white shrink-0 space-y-1.5">
          {/* Cài đặt hệ thống để ngay bên trên phần nâng cấp và gia hạn */}
          <Link
            href="/settings"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all cursor-pointer ${
              pathname === "/settings" 
                ? "bg-orange-50 text-[#f9570c] font-black shadow-xs" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`shrink-0 ${pathname === "/settings" ? "text-[#f9570c]" : "text-slate-500"}`}>
                <Settings size={18} />
              </span>
              <span className="truncate">Cài đặt hệ thống</span>
            </div>
          </Link>

          {/* Nút NÂNG CẤP / GIA HẠN ra phần nạp tiền luôn */}
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full bg-[#f9570c] hover:bg-[#ea4e07] text-white font-black py-2.5 px-3 rounded-[14px] text-[12px] uppercase tracking-wider shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all transform active:scale-98 cursor-pointer"
          >
            <Crown size={16} className="fill-white" />
            NÂNG CẤP / GIA HẠN
          </button>

          {/* Thẻ User Profile & Nút Đăng xuất */}
          <div className="flex items-center justify-between pt-2.5 px-1 mt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar cam chữ B */}
              <div className="w-8 h-8 rounded-[10px] bg-[#f9570c] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                {userInitial}
              </div>
              {/* Thông tin tên & Hạng PRO TRIAL */}
              <div className="flex flex-col min-w-0">
                <span className="font-black italic uppercase text-slate-900 text-xs tracking-tight truncate">
                  {displayName}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${
                    plan === "PRO TRIAL"
                      ? "text-[#f9570c]"
                      : plan === "FREE"
                      ? "text-slate-400"
                      : "text-blue-600 font-black"
                  }`}>
                    {plan}
                  </span>
                  {daysLeft > 0 && plan !== "FREE" && (
                    <span className="text-[9px] font-bold text-slate-400">
                      • Còn {daysLeft} ngày
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Nút Đăng Xuất icon LogOut màu cam */}
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="text-[#f9570c] hover:text-red-600 hover:bg-orange-50 p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

      </aside>

      {/* 👑 MODAL NÂNG CẤP & NẠP TIỀN TỰ ĐỘNG */}
      <UpgradeRenewModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentUser={{
          name: displayName,
          email: user?.email || '',
          plan: (plan === 'FREE' ? 'FREE' : plan === 'GOLD' ? 'GOLD' : plan === 'DIAMOND' ? 'DIAMOND' : 'PRO') as any,
          planExpire: user?.planExpiry || null,
          isTrial: plan === 'PRO TRIAL',
          trialDays: 7,
          createdAt: user?.createdAt || new Date().toISOString()
        }}
        onRenew={(newPlan, days) => {
          setPlan(newPlan);
          const currentExpireMs = user?.planExpiry && new Date(user.planExpiry).getTime() > Date.now()
            ? new Date(user.planExpiry).getTime()
            : Date.now();
          const totalDays = Math.max(1, Math.ceil((currentExpireMs + days * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));
          setDaysLeft(totalDays);
          fetchUserStatus();
        }}
        onSetTestDays={(days) => {
          setDaysLeft(days);
          if (days <= 0) setPlan('FREE');
          else setPlan('PRO TRIAL');
        }}
      />
    </>
  );
}

// ----------------------------------------------------------------------
// 👑 MODAL NÂNG CẤP & GIA HẠN + NẠP TIỀN TỰ ĐỘNG VIETQR
// ----------------------------------------------------------------------
export function UpgradeRenewModal({
  isOpen,
  onClose,
  currentUser,
  onRenew,
  onSetTestDays,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name?: string;
    email?: string;
    plan?: string;
    planExpire?: string | null;
    isTrial?: boolean;
    trialDays?: number;
    createdAt?: string;
  };
  onRenew: (plan: 'PRO' | 'GOLD' | 'DIAMOND', days: number) => void;
  onSetTestDays: (days: number) => void;
}) {
  const API_URL = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://api.kpost.vn') : 'https://api.kpost.vn';
  const [selectedPlanId, setSelectedPlanId] = useState<'PRO' | 'GOLD' | 'DIAMOND'>('PRO');
  const [duration, setDuration] = useState<'1m' | '3m' | '6m' | '12m'>('1m');
  const [voucher, setVoucher] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isPercentage, setIsPercentage] = useState(true);
  const [voucherMessage, setVoucherMessage] = useState('');
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);

  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success'>('pending');
  const [successDetails, setSuccessDetails] = useState<{
    plan: string;
    days: number;
    totalDays?: number;
    expiry: string;
    memo: string;
    amount: number;
  } | null>(null);
  const [transactionMemo, setTransactionMemo] = useState('');

  const wsId = (currentUser as any)?.currentWorkspaceId || (currentUser as any)?.wid || (currentUser as any)?.workspaceId || (typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : '') || 'KP_USER';

  useEffect(() => {
    if (!isOpen) return;
    axios.get(`${API_URL}/admin/marketing-campaigns`)
      .then(res => {
        if (res.data && res.data.flashSaleActive) {
          setCampaign(res.data);
        }
      })
      .catch(() => {});
  }, [isOpen, API_URL]);

  const plans = [
    {
      id: 'PRO' as const,
      name: 'GÓI PRO',
      color: 'blue',
      basePrice: 590000,
      prices: { '1m': 590000, '3m': 1690000, '6m': 3390000, '12m': 6890000 },
      badge: 'Bán chạy nhất',
      features: [
        'Add 50 Fanpage & Đăng bài không giới hạn',
        'AI Video Editor & Lồng tiếng AI đa ngôn ngữ',
        'AI Video Spinner nhân bản lách bản quyền',
        'Auto AI Inbox bóc tách đơn hàng thông minh',
        'Mở tính năng Affiliate hoa hồng 10%',
        'Hỗ trợ kỹ thuật ưu tiên 24/7'
      ]
    },
    {
      id: 'GOLD' as const,
      name: 'GÓI GOLD',
      color: 'amber',
      basePrice: 990000,
      prices: { '1m': 990000, '3m': 2890000, '6m': 5890000, '12m': 11690000 },
      badge: 'Doanh nghiệp',
      features: [
        'Toàn bộ quyền lợi gói PRO',
        'Quản lý tới 100 Fanpage & Đa kênh',
        'Thêm tới 100 sản phẩm & Cào Douyin không giới hạn',
        'AI Voice Clone giọng người thật siêu thực',
        'Bảo hành hệ thống và chống khóa Fanpage'
      ]
    },
    {
      id: 'DIAMOND' as const,
      name: 'GÓI DIAMOND',
      color: 'purple',
      basePrice: 3990000,
      prices: { '1m': 3990000, '3m': 11890000, '6m': 23390000, '12m': 46590000 },
      badge: 'VIP Agency',
      features: [
        'Toàn bộ quyền lợi gói GOLD & PRO',
        'Quản lý 500+ Fanpage & Bot bán hàng tự động',
        'Server Dedicated riêng tốc độ x5 lần',
        'Chuyên viên hỗ trợ 1 kèm 1 qua Ultraview/Tele',
        'Tùy chỉnh tính năng riêng theo yêu cầu'
      ]
    }
  ];

  const currentPlanObj = plans.find(p => p.id === selectedPlanId) || plans[0];
  const basePriceForDuration = currentPlanObj.prices[duration];

  const isFlashSaleActive = campaign?.flashSaleActive && campaign?.flashSalePlans?.[selectedPlanId];
  const discountPercent = Number(campaign?.flashSalePlans?.[selectedPlanId]?.discount) || 0;
  const priceAfterFlashSale = (isFlashSaleActive && discountPercent > 0)
    ? Math.round(basePriceForDuration * (1 - discountPercent / 100))
    : basePriceForDuration;

  let finalPrice = priceAfterFlashSale;
  if (discount > 0) {
    if (isPercentage) {
      finalPrice = Math.round(finalPrice * (1 - discount / 100));
    } else {
      finalPrice = Math.max(0, finalPrice - discount);
    }
  }

  const cleanUserName = currentUser.name ? currentUser.name.replace(/\s+/g, '').toUpperCase() : 'USER';
  const displayMemo = transactionMemo || `KPOST ${cleanUserName} ${selectedPlanId}`;
  const vietQrUrl = `https://img.vietqr.io/image/MB-0966527931-compact.png?amount=${finalPrice}&addInfo=${encodeURIComponent(displayMemo)}&accountName=BUI%20VAN%20KY`;

  const handleApplyVoucher = async () => {
    if (!voucher.trim()) {
      setDiscount(0);
      setVoucherMessage('');
      return;
    }
    setIsCheckingVoucher(true);
    setVoucherMessage('Đang kiểm tra...');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await axios.post(`${API_URL}/social/check-voucher`, { code: voucher.toUpperCase() }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && res.data.valid) {
        const val = res.data.discountValue;
        const type = res.data.discountType;
        setDiscount(val);
        setIsPercentage(type === 'percent');
        setVoucherMessage(`✅ Đã áp dụng giảm ${type === 'percent' ? val + '%' : val.toLocaleString() + 'đ'}`);
        toast.success(`Đã áp dụng mã giảm giá!`);
      } else {
        setDiscount(0);
        setVoucherMessage('❌ Mã không hợp lệ hoặc đã hết hạn');
      }
    } catch (error: any) {
      setDiscount(0);
      setVoucherMessage(`❌ ${error.response?.data?.message || 'Mã không hợp lệ hoặc đã hết hạn'}`);
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  // Hàm xử lý kích hoạt và hiển thị màn hình thông báo thành công
  const handlePaymentSuccess = (planId: 'PRO' | 'GOLD' | 'DIAMOND', days: number) => {
    const currentRemaining = (daysLeft && daysLeft > 0) ? daysLeft : 5;
    const totalRemainingDays = currentRemaining + days;
    const calculatedExpiry = new Date(Date.now() + totalRemainingDays * 24 * 60 * 60 * 1000);
    const expiryStr = calculatedExpiry.toLocaleDateString('vi-VN');

    setSuccessDetails({
      plan: planId,
      days: days,
      totalDays: totalRemainingDays,
      expiry: expiryStr,
      memo: transactionMemo || displayMemo,
      amount: finalPrice,
    });
    setPaymentStatus('success');

    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
      audio.play();
    } catch (e) {}

    onRenew(planId, days);

    // Đồng bộ vào localStorage để cả Sidebar và Setting đều cập nhật ngay lập tức
    try {
      const saved = localStorage.getItem('kpost_user') || localStorage.getItem('user');
      let parsed = saved ? JSON.parse(saved) : {};
      parsed.plan = planId;
      parsed.displayPlan = planId;
      parsed.planExpiry = calculatedExpiry.toISOString();
      parsed.planExpire = calculatedExpiry.toISOString();
      parsed.isTrial = false;
      parsed.isPaid = true;
      parsed.trialDays = 0;
      parsed.remainingDays = totalRemainingDays;
      parsed.daysLeft = totalRemainingDays;
      localStorage.setItem('kpost_user', JSON.stringify(parsed));
      localStorage.setItem('user', JSON.stringify(parsed));
      localStorage.setItem('kpost_paid_subscription', JSON.stringify({
        plan: planId,
        displayPlan: planId,
        planExpiry: calculatedExpiry.toISOString(),
        isPaid: true,
        daysLeft: totalRemainingDays,
      }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    // Cập nhật state Sidebar ngay lập tức
    setPlan(planId);
    setDaysLeft(totalRemainingDays);

    // Đồng bộ lên server
    try {
      axios.post(`${API_URL}/user/renew-plan`, {
        email: currentUser.email || 'tech28.vn@gmail.com',
        plan: planId,
        days: days
      }).catch(() => {});
    } catch (e) {}

    toast.success(`🎉 Nạp tiền & Kích hoạt thành công gói ${planId}! (Tổng còn ${totalRemainingDays} ngày)`, { duration: 6000 });
  };

  // Reset payment status khi mở lại modal
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('pending');
      setSuccessDetails(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let socketInstance: any = null;
    try {
      socketInstance = io(API_URL);
      socketInstance.on('paymentSuccess', () => {
        const days = duration === '12m' ? 365 : duration === '6m' ? 180 : duration === '3m' ? 90 : 30;
        handlePaymentSuccess(selectedPlanId, days);
      });
    } catch (e) {}

    let pollInterval: NodeJS.Timeout | null = null;
    if (transactionMemo && paymentStatus === 'pending') {
      pollInterval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/social/check-transaction/${transactionMemo}?t=${Date.now()}`);
          if (res.data && res.data.status === 'success') {
            if (pollInterval) clearInterval(pollInterval);
            const days = duration === '12m' ? 365 : duration === '6m' ? 180 : duration === '3m' ? 90 : 30;
            handlePaymentSuccess(selectedPlanId, days);
          }
        } catch (e) {}
      }, 5000);
    }

    return () => {
      if (socketInstance) socketInstance.disconnect();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOpen, transactionMemo, paymentStatus, selectedPlanId, duration, API_URL]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã chép ${label}!`, { duration: 2000 });
  };

  if (!isOpen) return null;

  const durationDays = duration === '12m' ? 365 : duration === '6m' ? 180 : duration === '3m' ? 90 : 30;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-5xl shadow-2xl border border-slate-100 overflow-hidden my-4 relative">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-5 md:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
              <Crown size={24} className="text-yellow-200 fill-yellow-200" />
            </span>
            <div>
              <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tight">
                GÓI CƯỚC & NẠP TIỀN TỰ ĐỘNG
              </h2>
              <p className="text-orange-100 text-xs font-medium mt-0.5">
                Kích hoạt tức thì qua chuyển khoản VietQR tự động 24/7
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white/90">Khách hàng:</span>
              <span className="bg-black/25 px-2.5 py-0.5 rounded-full font-black text-white">{currentUser.name || 'BÙI VĂN KỲ'}</span>
              <span className="bg-white/25 px-2.5 py-0.5 rounded-full font-black uppercase text-yellow-200">
                Gói hiện tại: {currentUser.plan || 'PRO TRIAL'}
              </span>
            </div>
            {currentUser.planExpire && (
              <div className="text-orange-100 font-medium">
                Hạn sử dụng: <strong className="text-white">{new Date(currentUser.planExpire).toLocaleDateString('vi-VN')}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        {paymentStatus === 'success' && successDetails ? (
          <div className="p-8 md:p-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-green-500/30 animate-bounce">
              <PartyPopper size={48} className="text-white" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-300 mb-2">
                <CheckCircle2 size={15} /> Giao dịch hoàn tất 24/7
              </span>
              <h3 className="text-2xl md:text-4xl font-black italic uppercase text-slate-900 tracking-tight">
                NẠP TIỀN & KÍCH HOẠT THÀNH CÔNG!
              </h3>
              <p className="text-xs md:text-sm font-semibold text-slate-500 mt-2 max-w-lg mx-auto">
                Chúc mừng bạn đã nạp tiền và nâng cấp thành công gói dịch vụ cao cấp trên Kpost.vn. Toàn bộ tính năng đã được mở khóa ngay lập tức cho tài khoản của bạn!
              </p>
            </div>

            {/* Chi tiết đơn hàng đã kích hoạt */}
            <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Gói cước kích hoạt:</span>
                <span className="font-black text-white bg-[#f9570c] px-3 py-1 rounded-lg uppercase tracking-wider text-xs shadow-xs">
                  {successDetails.plan}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Thời hạn sử dụng:</span>
                <span className="font-black text-emerald-600 text-sm">+{successDetails.days} ngày {successDetails.totalDays ? `(Tổng còn ${successDetails.totalDays} ngày)` : ''}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Hạn sử dụng mới đến:</span>
                <span className="font-black text-slate-900 text-sm">{successDetails.expiry}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-500">Mã hóa đơn / Nội dung CK:</span>
                <span className="font-mono font-black text-orange-700 text-xs bg-orange-100/60 px-2 py-0.5 rounded">
                  {successDetails.memo}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Số tiền đã thanh toán:</span>
                <span className="font-black text-slate-900 text-sm">{successDetails.amount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setPaymentStatus('pending');
                  setSuccessDetails(null);
                  onClose();
                }}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#f9570c] via-orange-500 to-amber-500 hover:from-[#ea4e07] hover:to-orange-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl shadow-orange-500/25 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles size={16} /> Bắt đầu trải nghiệm ngay 🚀
              </button>
            </div>
          </div>
        ) : (
        <div className="p-5 md:p-6 space-y-6 max-h-[78vh] overflow-y-auto custom-scrollbar text-slate-800">
          
          {/* Flash Sale Banner if active */}
          {campaign?.flashSaleActive && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white shadow-md flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-yellow-300 animate-bounce shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-yellow-300">
                    {campaign.flashSaleTitle || '🔥 FLASHSALE ĐANG DIỄN RA: GIÁ ĐÃ ĐƯỢC GIẢM TỰ ĐỘNG!'}
                  </p>
                  <p className="text-[11px] text-orange-100 font-medium">
                    Nâng cấp ngay hôm nay để nhận mức giá ưu đãi đặc quyền!
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 bg-black/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-yellow-200">
                Giá đã giảm
              </span>
            </div>
          )}

          {/* 1. Chọn chu kỳ */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 px-2 flex items-center gap-1.5">
              <Calendar size={14} className="text-orange-500" /> Chọn chu kỳ gia hạn:
            </span>
            <div className="grid grid-cols-4 gap-1.5 w-full sm:w-auto">
              {[
                { id: '1m', label: '1 Tháng', discountTag: '' },
                { id: '3m', label: '3 Tháng', discountTag: '-5%' },
                { id: '6m', label: '6 Tháng', discountTag: '-10%' },
                { id: '12m', label: '12 Tháng', discountTag: '-15%' },
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setDuration(d.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    duration === d.id
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {d.label} {d.discountTag && <span className="text-[9px] text-yellow-200 ml-0.5">{d.discountTag}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 3 Gói cước */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isSelected = selectedPlanId === p.id;
              const planPrice = p.prices[duration];
              const isSale = campaign?.flashSaleActive && campaign?.flashSalePlans?.[p.id];
              const pct = Number(campaign?.flashSalePlans?.[p.id]?.discount) || 0;
              const salePrice = (isSale && pct > 0) ? Math.round(planPrice * (1 - pct / 100)) : planPrice;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`rounded-2xl p-4.5 border-2 transition-all cursor-pointer relative flex flex-col ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/40 shadow-lg shadow-orange-500/10 scale-[1.01]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {p.badge && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                      {p.badge}
                    </span>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-black italic text-base text-slate-900 uppercase">{p.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400">
                        {p.id === 'PRO' ? 'Cá nhân & Shop vừa' : p.id === 'GOLD' ? 'Doanh nghiệp đa kênh' : 'VIP Agency & Chuỗi'}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300'}`}>
                      {isSelected && <Check size={12} className="stroke-[3]" />}
                    </div>
                  </div>

                  <div className="my-1.5">
                    {isSale && pct > 0 ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-red-600 tracking-tight">
                          {salePrice.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-xs line-through text-slate-400">
                          {planPrice.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    ) : (
                      <span className="text-xl font-black text-slate-900 tracking-tight">
                        {planPrice.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400"> /{duration === '12m' ? '12 tháng' : duration === '6m' ? '6 tháng' : duration === '3m' ? '3 tháng' : 'tháng'}</span>
                  </div>

                  <ul className="space-y-1.5 my-3 flex-1 text-[11px] text-slate-600 font-medium">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-tight">
                        <CheckCircle2 size={13} className="text-orange-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanId(p.id);
                    }}
                    className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all mt-auto cursor-pointer ${
                      isSelected
                        ? 'bg-[#f9570c] hover:bg-[#ea4e07] text-white shadow-md'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected ? 'Đang chọn gói này' : 'Chọn gói này'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 3. Ô nhập mã giảm giá */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="text-xs font-black uppercase text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Ticket size={14} className="text-orange-500" /> Mã giảm giá (Voucher):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá..."
                  value={voucher}
                  onChange={e => setVoucher(e.target.value)}
                  className="flex-1 bg-white px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={handleApplyVoucher}
                  disabled={isCheckingVoucher}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-black uppercase transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isCheckingVoucher ? 'Đang ktra...' : 'Áp dụng'}
                </button>
              </div>
              {voucherMessage && (
                <p className={`text-[11px] font-bold mt-1.5 ${discount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {voucherMessage}
                </p>
              )}
            </div>

            <div className="flex flex-col justify-between bg-white p-3 rounded-xl border border-slate-200">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Gói đã chọn:</span>
                  <span className="font-bold text-slate-800">{currentPlanObj.name} ({duration})</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Giảm giá voucher:</span>
                    <span>-{isPercentage ? `${discount}%` : `${discount.toLocaleString()}đ`}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                  <span>Tổng thanh toán:</span>
                  <span className="text-orange-600 text-base">{finalPrice.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. PHẦN NẠP TIỀN QUÉT MÃ VIETQR */}
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <QrCode size={18} className="text-orange-500" />
                PHẦN NẠP TIỀN & QUÉT MÃ VIETQR TỰ ĐỘNG
              </h4>
              <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Tự động kiểm tra 24/7
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <img
                  src={vietQrUrl}
                  alt="VietQR MBBank"
                  className="w-48 h-48 md:w-56 md:h-56 object-contain rounded-xl shadow-xs border border-white"
                />
                <p className="text-[10px] font-bold text-slate-500 mt-2">
                  Quét bằng App Ngân Hàng hoặc Ví MoMo
                </p>
                <div className="flex items-center gap-1 text-[11px] font-black text-orange-600 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  Đang chờ tín hiệu chuyển khoản...
                </div>
              </div>

              <div className="md:col-span-7 space-y-2.5 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Ngân hàng:</span>
                    <span className="font-black text-slate-900">MB BANK (Quân Đội)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-blue-600 text-sm">0966527931</span>
                      <button
                        onClick={() => copyToClipboard('0966527931', 'Số tài khoản')}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                        title="Sao chép"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Chủ tài khoản:</span>
                    <span className="font-black text-slate-900 uppercase">BÙI VĂN KỲ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Số tiền:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-orange-600 text-sm">
                        {finalPrice.toLocaleString('vi-VN')} đ
                      </span>
                      <button
                        onClick={() => copyToClipboard(String(finalPrice), 'Số tiền')}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                        title="Sao chép"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-orange-100/70 p-2 rounded-lg border border-orange-200">
                    <span className="text-slate-700 font-bold">Nội dung CK:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-orange-700 text-xs">
                        {displayMemo}
                      </span>
                      <button
                        onClick={() => copyToClipboard(displayMemo, 'Nội dung chuyển khoản')}
                        className="p-1 hover:bg-orange-200 rounded text-orange-700 cursor-pointer"
                        title="Sao chép nội dung"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => {
                      handlePaymentSuccess(selectedPlanId, durationDays);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black uppercase text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-98"
                  >
                    <Crown size={15} /> Xác nhận nạp tiền & Kích hoạt gói {selectedPlanId} (+{durationDays} ngày)
                  </button>
                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    * Hệ thống tích hợp SePay & Socket sẽ tự động nạp và kích hoạt ngay sau khi tiền vào tài khoản.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Tiện ích thử nghiệm */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <Zap size={13} className="text-amber-500" />
              Công cụ thử nghiệm thông báo & thời hạn:
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <button
                onClick={() => {
                  onSetTestDays(2);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-[11px] cursor-pointer"
              >
                ⏱️ Đặt còn 2 ngày (Xem dòng cảnh báo)
              </button>
              <button
                onClick={() => {
                  onSetTestDays(0);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-[11px] cursor-pointer"
              >
                ⚠️ Đặt hết hạn (Về FREE)
              </button>
              <button
                onClick={() => {
                  onSetTestDays(6);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-[11px] cursor-pointer"
              >
                🔄 Đặt lại 06 ngày PRO TRIAL
              </button>
            </div>
          </div>

        </div>
        )}
      </div>
    </div>
  );
}
