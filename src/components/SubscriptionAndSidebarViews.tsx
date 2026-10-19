import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Crown, 
  X, 
  Check, 
  CheckCircle2, 
  Zap, 
  Landmark, 
  Copy, 
  Users, 
  Bell, 
  Radio, 
  ShoppingBag, 
  ShieldCheck, 
  TrendingUp, 
  BookOpen, 
  HelpCircle, 
  LogOut, 
  Wand2, 
  Film, 
  Bot, 
  Calendar, 
  MessageSquare, 
  Settings,
  User as UserIcon,
  Sparkles,
  Scale,
  Shield,
  Share2,
  Flame,
  Ticket,
  Loader2,
  CreditCard,
  QrCode
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface UserSubscription {
  id?: string;
  name: string;
  email: string;
  plan: 'FREE' | 'PRO' | 'GOLD' | 'DIAMOND';
  planExpire: string | null;
  isTrial: boolean;
  trialDays: number;
  createdAt: string;
}

// ----------------------------------------------------------------------
// BẰNG CẢNH BÁO / NHẮC GIA HẠN CHẠY TRÊN CÙNG GIAO DIỆN CỦA WEBSITE
// (HIỆN TRƯỚC HẠN 3 NGÀY HOẶC KHI VỀ FREE)
// ----------------------------------------------------------------------
export function TopRenewalNoticeBanner({
  currentUser,
  daysLeft,
  onOpenUpgrade
}: {
  currentUser: UserSubscription;
  daysLeft: number;
  onOpenUpgrade: () => void;
}) {
  // Điều kiện: Trước ngày hết hạn 3 ngày (daysLeft <= 3 && daysLeft > 0)
  const isExpiringSoon = currentUser.plan === 'PRO' && daysLeft <= 3 && daysLeft > 0;
  const isFreePlan = currentUser.plan === 'FREE';

  if (!isExpiringSoon && !isFreePlan) return null;

  if (isExpiringSoon) {
    return (
      <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white shadow-lg z-50 flex items-center justify-between px-3 md:px-6 py-2 border-b border-orange-400/40 relative">
        <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
          <span className="flex h-3 w-3 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-200"></span>
          </span>
          <span className="bg-black/30 backdrop-blur-sm text-yellow-300 text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 border border-yellow-400/30">
            ⚡ NHẮC GIA HẠN
          </span>
          <div className="truncate text-xs md:text-sm font-bold tracking-wide">
            Gói PRO dùng thử của bạn sắp hết hạn sau <span className="text-yellow-300 font-black underline underline-offset-2">{daysLeft} ngày</span>
            {currentUser.planExpire && ` (hạn đến ${new Date(currentUser.planExpire).toLocaleDateString('vi-VN')})`}.
            {' '}Hãy gia hạn ngay để không bị gián đoạn tính năng Tạo video AI, lách bản quyền và đăng bài tự động!
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenUpgrade}
            className="bg-white hover:bg-yellow-50 text-orange-600 font-black text-xs md:text-sm px-3.5 py-1.5 rounded-xl shadow-md uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Crown size={15} className="text-amber-500 fill-amber-500" />
            Gia hạn ngay
          </button>
        </div>
      </div>
    );
  }

  // Nếu đã về FREE
  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-900 text-white shadow-md z-50 flex items-center justify-between px-3 md:px-6 py-2 border-b border-slate-700">
      <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2 text-xs md:text-sm font-bold">
        <span className="bg-red-500/30 text-red-300 text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 border border-red-500/40">
          ⚠️ GÓI MIỄN PHÍ (FREE)
        </span>
        <span className="truncate text-slate-300">
          Thời gian dùng thử 07 ngày PRO đã hết, tài khoản đã tự động về gói FREE. Hãy nâng cấp để mở khóa đầy đủ tính năng!
        </span>
      </div>
      <button
        onClick={onOpenUpgrade}
        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs md:text-sm px-3.5 py-1.5 rounded-xl shadow-md uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
      >
        <Crown size={15} /> Nâng cấp lại PRO
      </button>
    </div>
  );
}

// ----------------------------------------------------------------------
// SIDEBAR CHUẨN ĐẸP KHỚP 100% ẢNH MINH HỌA
// CÓ Ô NÂNG CẤP / GIA HẠN NẰM BÊN TRÊN PHẦN ĐĂNG XUẤT
// ----------------------------------------------------------------------
export function isUserTrial(user: UserSubscription | any): boolean {
  if (!user) return false;
  if (user.isTrial === true || user.plan === 'PRO TRIAL' || user.displayPlan === 'PRO TRIAL') {
    return true;
  }
  if (user.createdAt) {
    const createdTime = new Date(user.createdAt).getTime();
    const diffMs = Date.now() - createdTime;
    if (diffMs >= 0 && diffMs < 7 * 24 * 60 * 60 * 1000) {
      if (!user.planExpire || new Date(user.planExpire).getTime() > Date.now()) {
        return true;
      }
    }
  }
  return false;
}

export function MainAppSidebar({
  activeTab,
  setActiveTab,
  currentUser,
  daysLeft,
  onOpenUpgrade,
  onLogout
}: {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  currentUser: UserSubscription;
  daysLeft: number;
  onOpenUpgrade: () => void;
  onLogout: () => void;
}) {
  const isTrial = isUserTrial(currentUser);
  const userInitial = currentUser.name ? currentUser.name.trim()[0].toUpperCase() : 'B';
  const displayName = currentUser.name || 'BÙI VĂN KỲ';

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-20 font-sans shadow-sm select-none">
      {/* 1. BRAND HEADER - GỌN GÀNG, ĐẸP MẮT */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0">
            K
          </div>
          <div>
            <div className="font-black italic text-[15px] tracking-tight text-slate-900 leading-none">
              KPOST<span className="text-[#f9570c]">.VN</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mt-0.5">
              AI Automator SaaS
            </span>
          </div>
        </div>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
          isTrial
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
            : currentUser.plan === 'PRO' || currentUser.plan === 'GOLD' || currentUser.plan === 'DIAMOND'
            ? 'bg-orange-50 text-orange-600 border border-orange-200'
            : 'bg-slate-100 text-slate-600'
        }`}>
          {isTrial ? 'PRO TRIAL' : (currentUser.plan || 'PRO TRIAL')}
        </span>
      </div>

      {/* 2. MENU LIST - PHÂN MỤC GỌN GÀNG, CHỮ VỪA VẶN TRANG NHÃ DỄ NHÌN */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-3 custom-scrollbar">
        {/* Nhóm 1: CÔNG CỤ AI */}
        <div>
          <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            CÔNG CỤ AI
          </p>
          <div className="space-y-0.5">
            <SidebarNavItem
              icon={<Wand2 size={17} className="text-amber-500" />}
              label="AI Video Editor"
              active={activeTab === 'ai-video-editor'}
              onClick={() => setActiveTab('ai-video-editor')}
              highlightBadge="AI PRO"
              badgeColor="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black"
            />
            <SidebarNavItem
              icon={<Film size={17} className="text-purple-500" />}
              label="AI Video Spinner"
              active={activeTab === 'video-spinner'}
              onClick={() => setActiveTab('video-spinner')}
              highlightBadge="HOT"
              badgeColor="bg-purple-600 text-white font-bold"
            />
            <SidebarNavItem
              icon={<Bot size={17} className="text-blue-500" />}
              label="AI Marketing"
              active={activeTab === 'ai'}
              onClick={() => setActiveTab('ai')}
            />
            <SidebarNavItem
              icon={<Radio size={17} className="text-red-500" />}
              label="AI Livestream"
              active={activeTab === 'livestream'}
              onClick={() => setActiveTab('livestream')}
              highlightBadge="LIVE"
              badgeColor="bg-red-500 text-white font-black"
            />
          </div>
        </div>

        {/* Nhóm 2: QUẢN LÝ DỊCH VỤ */}
        <div>
          <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            QUẢN LÝ DỊCH VỤ
          </p>
          <div className="space-y-0.5">
            <SidebarNavItem
              icon={<Calendar size={17} />}
              label="Lịch đăng bài"
              active={activeTab === 'calendar'}
              onClick={() => setActiveTab('calendar')}
            />
            <SidebarNavItem
              icon={<MessageSquare size={17} />}
              label="Hộp thư CSKH"
              active={activeTab === 'inbox'}
              onClick={() => setActiveTab('inbox')}
            />
            <SidebarNavItem
              icon={<ShoppingBag size={17} />}
              label="Quản lý Đơn hàng"
              active={activeTab === 'orders'}
              onClick={() => setActiveTab('orders')}
            />
            <SidebarNavItem
              icon={<Users size={17} />}
              label="Quản lý Bot Users"
              active={activeTab === 'bot-users'}
              onClick={() => setActiveTab('bot-users')}
            />
            <SidebarNavItem
              icon={<ShieldCheck size={17} />}
              label="Bảo hành & CSKH"
              active={activeTab === 'warranty'}
              onClick={() => setActiveTab('warranty')}
            />
          </div>
        </div>

        {/* Nhóm 3: PHÂN TÍCH & KẾT NỐI (ĐẨY AFFILIATE VÀO ĐÂY) */}
        <div>
          <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            PHÂN TÍCH & KẾT NỐI
          </p>
          <div className="space-y-0.5">
            <SidebarNavItem
              icon={<TrendingUp size={17} className="text-emerald-500" />}
              label="Doanh thu"
              active={activeTab === 'revenue' || activeTab === 'dashboard'}
              onClick={() => setActiveTab('revenue')}
            />
            <SidebarNavItem
              icon={<Sparkles size={17} className="text-orange-500" />}
              label="Affiliate (Kiếm tiền)"
              active={activeTab === 'affiliate'}
              onClick={() => setActiveTab('affiliate')}
              highlightBadge="10% HOA HỒNG"
              badgeColor="bg-orange-500 text-white font-black"
            />
            <SidebarNavItem
              icon={<Radio size={17} className="text-rose-500" />}
              label="Tele Campaign"
              active={activeTab === 'tele-campaign'}
              onClick={() => setActiveTab('tele-campaign')}
            />
            <SidebarNavItem
              icon={<Settings size={17} />}
              label="Cài đặt hệ thống"
              active={activeTab === 'settings' || activeTab === 'profile'}
              onClick={() => setActiveTab('settings')}
            />
          </div>
        </div>

        {/* Nhóm 4: HỖ TRỢ & PHÁP LÝ (ĐẨY SANG CUỐI SIDEBAR, BỎ HẲN TRONG SETTING) */}
        <div>
          <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            HỖ TRỢ & PHÁP LÝ
          </p>
          <div className="space-y-0.5">
            <SidebarNavItem
              icon={<BookOpen size={17} className="text-blue-500" />}
              label="Hướng dẫn khách mới"
              active={activeTab === 'guide'}
              onClick={() => setActiveTab('guide')}
              highlightBadge="MỚI"
              badgeColor="bg-blue-600 text-white font-bold"
            />
            <SidebarNavItem
              icon={<Scale size={17} className="text-slate-500" />}
              label="Điều khoản sử dụng"
              active={activeTab === 'terms'}
              onClick={() => setActiveTab('terms')}
            />
            <SidebarNavItem
              icon={<Shield size={17} className="text-slate-500" />}
              label="Chính sách bảo mật"
              active={activeTab === 'privacy'}
              onClick={() => setActiveTab('privacy')}
            />
          </div>
        </div>
      </div>

      {/* 3. PHẦN DƯỚI CÙNG SIDEBAR: NÚT NÂNG CẤP / GIA HẠN + USER PROFILE CARD */}
      <div className="p-2.5 border-t border-slate-100 bg-white shrink-0">
        {/* Nút NÂNG CẤP / GIA HẠN ra phần nạp tiền luôn */}
        <button
          onClick={onOpenUpgrade}
          className="w-full bg-[#f9570c] hover:bg-[#ea4e07] text-white font-black py-2.5 px-3 rounded-[14px] text-[12px] uppercase tracking-wider shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all transform active:scale-98 cursor-pointer"
        >
          <Crown size={16} className="fill-white" />
          NÂNG CẤP / GIA HẠN
        </button>

        {/* Thẻ User Profile & Nút Đăng xuất */}
        <div className="flex items-center justify-between pt-2.5 px-1 mt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[10px] bg-[#f9570c] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              {userInitial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black italic uppercase text-slate-900 text-xs tracking-tight truncate">
                {displayName}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-black uppercase tracking-wider ${
                  isTrial || currentUser.plan === 'PRO' ? 'text-[#f9570c]' : 'text-slate-400'
                }`}>
                  {isTrial ? 'PRO TRIAL' : currentUser.plan}
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  • Còn {daysLeft || 7} ngày
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="text-[#f9570c] hover:text-red-600 hover:bg-orange-50 p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarNavItem({
  icon,
  label,
  active,
  onClick,
  highlightBadge,
  badgeColor
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  highlightBadge?: string;
  badgeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
        active
          ? 'bg-orange-50 text-[#f9570c] font-black shadow-xs'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`shrink-0 ${active ? 'text-[#f9570c]' : 'text-slate-500'}`}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      {highlightBadge && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 font-black ${
          badgeColor || 'bg-amber-400 text-slate-950 font-black'
        }`}>
          {highlightBadge}
        </span>
      )}
    </button>
  );
}

// ----------------------------------------------------------------------
// 👑 MODAL NÂNG CẤP & GIA HẠN + NẠP TIỀN TỰ ĐỘNG (TÍCH HỢP TỪ SETTINGS)
// BẬT RA PHẦN NẠP TIỀN LUÔN KHI BẤM NÂNG CẤP / GIA HẠN TRÊN SIDEBAR
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
  currentUser: UserSubscription;
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

  // Trạng thái thanh toán VietQR
  const [showQRSection, setShowQRSection] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success'>('pending');
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [transactionMemo, setTransactionMemo] = useState('');

  // Lấy workspaceId hoặc email user
  const wsId = (currentUser as any)?.currentWorkspaceId || (currentUser as any)?.wid || (currentUser as any)?.workspaceId || (typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : '') || 'KP_USER';

  // Lấy FlashSale marketing từ backend
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

  // Tính giá sau flash sale
  const isFlashSaleActive = campaign?.flashSaleActive && campaign?.flashSalePlans?.[selectedPlanId];
  const discountPercent = Number(campaign?.flashSalePlans?.[selectedPlanId]?.discount) || 0;
  const priceAfterFlashSale = (isFlashSaleActive && discountPercent > 0)
    ? Math.round(basePriceForDuration * (1 - discountPercent / 100))
    : basePriceForDuration;

  // Tính giá cuối sau Voucher
  let finalPrice = priceAfterFlashSale;
  if (discount > 0) {
    if (isPercentage) {
      finalPrice = Math.round(finalPrice * (1 - discount / 100));
    } else {
      finalPrice = Math.max(0, finalPrice - discount);
    }
  }

  // Cú pháp nội dung chuyển khoản
  const cleanUserName = currentUser.name ? currentUser.name.replace(/\s+/g, '').toUpperCase() : 'USER';
  const displayMemo = transactionMemo || `KPOST ${cleanUserName} ${selectedPlanId}`;

  // URL VietQR
  const vietQrUrl = `https://img.vietqr.io/image/MB-0966527931-compact.png?amount=${finalPrice}&addInfo=${encodeURIComponent(displayMemo)}&accountName=BUI%20VAN%20KY`;

  // Kiểm tra mã voucher
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

  // Tạo giao dịch trên hệ thống
  const handleCreateTransaction = async () => {
    setIsCreatingTransaction(true);
    try {
      const res = await axios.post(`${API_URL}/social/create-transaction`, {
        workspaceId: wsId,
        planName: selectedPlanId,
        amount: finalPrice
      });
      if (res.data && res.data.description) {
        setTransactionMemo(res.data.description);
      }
      toast.success('Đã tạo mã QR nạp tiền thành công!');
    } catch (e) {
      // Dùng cú pháp mặc định
      setTransactionMemo(`KPOST ${cleanUserName} ${selectedPlanId}`);
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  // Lắng nghe socket và polling kiểm tra thanh toán thành công
  useEffect(() => {
    if (!isOpen) return;

    let socketInstance: any = null;
    try {
      socketInstance = io(API_URL);
      socketInstance.on('paymentSuccess', () => {
        setPaymentStatus('success');
        const days = duration === '12m' ? 365 : duration === '6m' ? 180 : duration === '3m' ? 90 : 30;
        onRenew(selectedPlanId, days);
        toast.success(`🎉 Thanh toán thành công! Gói ${selectedPlanId} đã được kích hoạt!`, { duration: 6000 });
      });
    } catch (e) {}

    let pollInterval: NodeJS.Timeout | null = null;
    if (transactionMemo && paymentStatus === 'pending') {
      pollInterval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/social/check-transaction/${transactionMemo}?t=${Date.now()}`);
          if (res.data && res.data.status === 'success') {
            setPaymentStatus('success');
            if (pollInterval) clearInterval(pollInterval);
            const days = duration === '12m' ? 365 : duration === '6m' ? 180 : duration === '3m' ? 90 : 30;
            onRenew(selectedPlanId, days);
            toast.success(`🎉 Thanh toán thành công! Gói ${selectedPlanId} đã được kích hoạt!`, { duration: 6000 });
          }
        } catch (e) {}
      }, 5000);
    }

    return () => {
      if (socketInstance) socketInstance.disconnect();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOpen, transactionMemo, paymentStatus, selectedPlanId, duration, onRenew, API_URL]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã chép ${label}!`, { duration: 2000 });
  };

  if (!isOpen) return null;

  const durationDays = duration === '12m' ? 365 : duration === '6m' ? 180 : duration === '3m' ? 90 : 30;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 overflow-y-auto animate-in fade-in">
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
                Kích hoạt tức thì qua chuyển khoản VietQR tự động 24/7 (Được chuyển từ Settings ra Sidebar)
              </p>
            </div>
          </div>

          {/* Current User Status Chip */}
          <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white/90">Khách hàng:</span>
              <span className="bg-black/25 px-2.5 py-0.5 rounded-full font-black text-white">{currentUser.name || 'BÙI VĂN KỲ'}</span>
              <span className="bg-white/25 px-2.5 py-0.5 rounded-full font-black uppercase text-yellow-200">
                Gói hiện tại: {currentUser.plan}
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

          {/* 1. Chọn thời hạn thanh toán */}
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

          {/* 2. Danh sách 3 Gói cước (PRO, GOLD, DIAMOND) */}
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

                  {/* Giá hiển thị */}
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
                      handleCreateTransaction();
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

          {/* 3. Ô nhập mã giảm giá & Tóm tắt nạp tiền */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* Áp dụng Voucher */}
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

            {/* Tóm tắt thanh toán */}
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

          {/* 4. PHẦN NẠP TIỀN QUÉT MÃ VIETQR (RA TRỰC TIẾP KHI BẤM NÂNG CẤP / GIA HẠN) */}
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
              {/* Cột Trái: Ảnh QR VietQR */}
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

              {/* Cột Phải: Thông tin số tài khoản và copy */}
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

                {/* Nút mô phỏng nạp tiền & kích hoạt ngay */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => {
                      onRenew(selectedPlanId, durationDays);
                      onClose();
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

          {/* 5. CÔNG CỤ THỬ NGHIỆM ĐẶT HẠN (QUẢN TRỊ VIÊN) */}
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
                title="Kích hoạt banner nhắc nhở gia hạn trước 3 ngày"
              >
                ⏱️ Đặt còn 2 ngày (Xem dòng cảnh báo)
              </button>
              <button
                onClick={() => {
                  onSetTestDays(0);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-[11px] cursor-pointer"
                title="Chuyển ngay tài khoản về gói FREE"
              >
                ⚠️ Đặt hết hạn (Về FREE)
              </button>
              <button
                onClick={() => {
                  onSetTestDays(7);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-[11px] cursor-pointer"
                title="Cấp lại 07 ngày dùng thử PRO như khách vừa đăng ký"
              >
                🔄 Đặt lại 07 ngày PRO TRIAL
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// CÁC VIEW TIỆN ÍCH PHỤ TRỢ (KHI BẤM MENU SIDEBAR)
// ----------------------------------------------------------------------
export function OrdersView({ onOpenUpgrade }: { onOpenUpgrade: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tight text-slate-900">Quản Lý Đơn Hàng</h1>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Hệ thống bóc tách đơn tự động từ Livestream & Video AI</p>
          </div>
          <button onClick={onOpenUpgrade} className="bg-[#f9570c] text-white font-black text-xs uppercase px-4 py-3 rounded-2xl shadow-md hover:bg-[#e44c05] transition-all flex items-center gap-2 cursor-pointer self-start">
            <Crown size={16} /> Nâng cấp tính năng Auto chốt đơn
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[11px] font-black uppercase text-slate-400">Đơn chờ xử lý</p><p className="text-2xl font-black text-slate-900 mt-1">18 đơn</p></div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[11px] font-black uppercase text-slate-400">Đã chốt AI</p><p className="text-2xl font-black text-green-600 mt-1">142 đơn</p></div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[11px] font-black uppercase text-slate-400">Doanh số hôm nay</p><p className="text-2xl font-black text-blue-600 mt-1">42.850.000đ</p></div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[11px] font-black uppercase text-slate-400">Tỷ lệ chốt thành công</p><p className="text-2xl font-black text-orange-500 mt-1">94.2%</p></div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 font-black text-sm uppercase text-slate-700">Đơn hàng mới nhất</div>
          <div className="divide-y divide-slate-100 text-xs">
            {[
              { id: 'DH-8841', name: 'Nguyễn Thu Trang', phone: '0978***112', prod: 'Combo Serum Trị Mụn + Kem Dưỡng', total: '489.000đ', status: 'Đã gửi hàng', time: '10 phút trước' },
              { id: 'DH-8840', name: 'Trần Văn Hoàng', phone: '0912***456', prod: 'Nồi chiên không dầu 8L Kpost', total: '1.290.000đ', status: 'Đã xác nhận', time: '25 phút trước' },
              { id: 'DH-8839', name: 'Lê Thùy Dung', phone: '0984***789', prod: 'Tai nghe Bluetooth Pro Max', total: '350.000đ', status: 'Chờ thanh toán', time: '40 phút trước' },
            ].map(item => (
              <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div><span className="font-mono font-bold text-blue-600">{item.id}</span> • <span className="font-bold text-slate-900">{item.name}</span> ({item.phone})</div>
                <div className="text-slate-600">{item.prod}</div>
                <div className="font-black text-slate-900">{item.total}</div>
                <div><span className="bg-green-50 text-green-700 font-bold px-2.5 py-1 rounded-full">{item.status}</span></div>
                <div className="text-slate-400 font-medium">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BotUsersView() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-black italic uppercase tracking-tight text-slate-900">Quản Lý Người Dùng Bot</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh sách khách hàng tương tác qua Messenger, Zalo và Telegram</p>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center text-slate-400 py-16">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">1.842 khách hàng đang tương tác với bot</h3>
          <p className="text-xs text-slate-400 mt-1">Các kịch bản tự động chăm sóc và re-marketing đang chạy đều đặn.</p>
        </div>
      </div>
    </div>
  );
}

export function WarrantyView() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-black italic uppercase tracking-tight text-slate-900">Tra Cứu & Bảo Hành</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hệ thống bảo hành điện tử chính hãng và chăm sóc khách hàng Kpost</p>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 max-w-xl mx-auto">
          <div className="flex gap-2">
            <input type="text" placeholder="Nhập số điện thoại hoặc mã đơn..." className="flex-1 p-3.5 rounded-2xl border border-slate-300 font-bold text-sm outline-none focus:border-orange-500" />
            <button className="bg-[#f9570c] text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase hover:bg-[#e44c05] cursor-pointer">Tra cứu</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RevenueView() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-black italic uppercase tracking-tight text-slate-900">Báo Cáo Doanh Thu & Phân Tích</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Doanh thu tháng 10</p><p className="text-3xl font-black text-slate-900 mt-2">184.500.000đ</p><span className="text-xs font-bold text-green-600">↑ 24.5% so với tháng trước</span></div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Chi phí quảng cáo</p><p className="text-3xl font-black text-slate-900 mt-2">18.200.000đ</p><span className="text-xs font-bold text-blue-600">ROI 10.1x</span></div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Lợi nhuận ròng</p><p className="text-3xl font-black text-[#f9570c] mt-2">128.300.000đ</p><span className="text-xs font-bold text-green-600">Tăng trưởng ổn định</span></div>
        </div>
      </div>
    </div>
  );
}

export function BotNotificationsView() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-black italic uppercase tracking-tight text-slate-900">Thông Báo Bot</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cấu hình chuông báo và tự động gửi thông báo khi có đơn mới</p>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center text-slate-500">
          <Bell size={48} className="mx-auto text-amber-500 mb-3" />
          <p className="font-bold text-base">Hệ thống thông báo bot đang hoạt động 24/7</p>
        </div>
      </div>
    </div>
  );
}

export function TeleCampaignView() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-black italic uppercase tracking-tight text-slate-900">Tele Campaign</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chiến dịch gửi tin nhắn tự động chăm sóc hàng loạt trên Telegram</p>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center text-slate-500">
          <Radio size={48} className="mx-auto text-[#f9570c] mb-3" />
          <p className="font-bold text-base">Sẵn sàng khởi tạo chiến dịch phát tin Telegram hàng loạt</p>
        </div>
      </div>
    </div>
  );
}

export function SupportView({ onOpenUpgrade }: { onOpenUpgrade: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-black italic uppercase tracking-tight text-slate-900">Trung Tâm Hỗ Trợ 24/7</h1>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <h3 className="font-black text-orange-800 text-sm uppercase">Kênh hỗ trợ nhanh</h3>
            <p className="text-xs text-orange-700 mt-1">Đội ngũ kỹ thuật Kpost trực tuyến hỗ trợ qua Telegram và Zalo mọi lúc.</p>
          </div>
          <div className="space-y-3 text-xs font-bold text-slate-700">
            <p>📞 Hotline / Zalo hỗ trợ: <span className="font-mono text-blue-600">0988.288.288</span></p>
            <p>💬 Telegram Support: <span className="font-mono text-blue-600">@kpost_support_bot</span></p>
            <p>✉️ Email: <span className="font-mono text-blue-600">support@kpost.vn</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
