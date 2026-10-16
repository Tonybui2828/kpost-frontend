import React, { useState } from 'react';
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
  Sparkles
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
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-20 font-sans shadow-sm">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
            K
          </div>
          <div>
            <div className="font-black italic text-lg tracking-tight text-slate-900 leading-none">
              KPOST<span className="text-orange-500">.VN</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              AI Automator SaaS
            </span>
          </div>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
          currentUser.plan === 'PRO' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-slate-100 text-slate-600'
        }`}>
          {currentUser.plan}
        </span>
      </div>

      {/* Middle Scrollable Menu List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
        {/* Core AI Tools */}
        <SidebarNavItem
          icon={<Wand2 size={19} className="text-amber-500" />}
          label="AI Video Editor"
          active={activeTab === 'ai-video-editor'}
          onClick={() => setActiveTab('ai-video-editor')}
          highlightBadge="Hot"
        />
        <SidebarNavItem
          icon={<Film size={19} className="text-purple-500" />}
          label="AI Video Spinner"
          active={activeTab === 'video-spinner'}
          onClick={() => setActiveTab('video-spinner')}
        />
        <SidebarNavItem
          icon={<Bot size={19} className="text-blue-500" />}
          label="AI Marketing"
          active={activeTab === 'ai'}
          onClick={() => setActiveTab('ai')}
        />
        <SidebarNavItem
          icon={<Calendar size={19} />}
          label="Lịch đăng bài"
          active={activeTab === 'calendar'}
          onClick={() => setActiveTab('calendar')}
        />
        <SidebarNavItem
          icon={<MessageSquare size={19} />}
          label="Hộp thư CSKH"
          active={activeTab === 'inbox'}
          onClick={() => setActiveTab('inbox')}
        />

        <div className="my-2 border-t border-slate-100"></div>

        {/* Khớp với danh sách ảnh người dùng */}
        <SidebarNavItem
          icon={<ShoppingBag size={19} />}
          label="Đơn hàng"
          active={activeTab === 'orders'}
          onClick={() => setActiveTab('orders')}
        />
        <SidebarNavItem
          icon={<Users size={19} />}
          label="Quản lý người dùng bot"
          active={activeTab === 'bot-users'}
          onClick={() => setActiveTab('bot-users')}
        />
        <SidebarNavItem
          icon={<ShieldCheck size={19} />}
          label="Bảo hành"
          active={activeTab === 'warranty'}
          onClick={() => setActiveTab('warranty')}
        />

        {/* Phân mục PHÂN TÍCH */}
        <div className="pt-3 pb-1 px-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            PHÂN TÍCH
          </p>
        </div>

        <SidebarNavItem
          icon={<TrendingUp size={19} />}
          label="Doanh thu"
          active={activeTab === 'revenue' || activeTab === 'dashboard'}
          onClick={() => setActiveTab('revenue')}
        />
        <SidebarNavItem
          icon={<Sparkles size={19} className="text-orange-500" />}
          label="Affiliate"
          active={activeTab === 'affiliate'}
          onClick={() => setActiveTab('affiliate')}
        />
        <SidebarNavItem
          icon={<Bell size={19} />}
          label="Thông báo bot"
          active={activeTab === 'bot-notifications'}
          onClick={() => setActiveTab('bot-notifications')}
        />
        <SidebarNavItem
          icon={<Radio size={19} className="text-orange-500" />}
          label="Tele Campaign"
          active={activeTab === 'tele-campaign'}
          onClick={() => setActiveTab('tele-campaign')}
        />
        <SidebarNavItem
          icon={<UserIcon size={19} />}
          label="Hồ sơ"
          active={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
        />
        <SidebarNavItem
          icon={<BookOpen size={19} />}
          label="Hướng dẫn"
          active={activeTab === 'guide'}
          onClick={() => setActiveTab('guide')}
        />
        <SidebarNavItem
          icon={<HelpCircle size={19} />}
          label="Hỗ trợ"
          active={activeTab === 'support'}
          onClick={() => setActiveTab('support')}
        />
        <SidebarNavItem
          icon={<Settings size={19} />}
          label="Cài đặt hệ thống"
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </div>

      {/* 🌟 PHẦN DƯỚI CÙNG SIDEBAR: Ô NÂNG CẤP / GIA HẠN + USER PROFILE + NÚT ĐĂNG XUẤT */}
      <div className="p-3 border-t border-slate-100 bg-white shrink-0">
        {/* Nút NÂNG CẤP / GIA HẠN màu cam nổi bật */}
        <button
          onClick={onOpenUpgrade}
          className="w-full bg-[#f9570c] hover:bg-[#ea4e07] text-white font-black py-3 px-4 rounded-[18px] text-[13px] uppercase tracking-wider shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
        >
          <Crown size={18} className="fill-white" />
          NÂNG CẤP / GIA HẠN
        </button>

        {/* Thẻ User Profile & Đăng xuất */}
        <div className="flex items-center justify-between pt-3 pb-1 px-1 mt-1">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar cam chữ B */}
            <div className="w-10 h-10 rounded-[14px] bg-[#f9570c] text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
              {currentUser.name?.[0]?.toUpperCase() || 'B'}
            </div>
            {/* Thông tin tên & Hạng PRO */}
            <div className="flex flex-col min-w-0">
              <span className="font-black italic uppercase text-slate-900 text-sm tracking-tight truncate">
                {currentUser.name || 'BÙI VĂN KỲ'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  currentUser.plan === 'PRO' ? 'text-[#f9570c]' : 'text-slate-400'
                }`}>
                  {currentUser.plan}
                </span>
                {currentUser.plan === 'PRO' && (
                  <span className="text-[10px] font-bold text-slate-400">
                    • Còn {daysLeft} ngày
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Nút Đăng Xuất mũi tên đỏ/cam */}
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="text-[#f9570c] hover:text-red-600 hover:bg-orange-50 p-2 rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <LogOut size={19} />
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
  highlightBadge
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  highlightBadge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
        active
          ? 'bg-orange-50 text-[#f9570c] font-black shadow-sm'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={active ? 'text-[#f9570c]' : 'text-slate-500'}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      {highlightBadge && (
        <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase">
          {highlightBadge}
        </span>
      )}
    </button>
  );
}

// ----------------------------------------------------------------------
// MODAL NÂNG CẤP & GIA HẠN GÓI CƯỚC CHI TIẾT
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
  const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'GOLD' | 'DIAMOND'>('PRO');
  const [copiedAccount, setCopiedAccount] = useState(false);

  if (!isOpen) return null;

  const plans = [
    {
      id: 'PRO' as const,
      name: 'GÓI PRO',
      price: '599.000',
      period: 'tháng',
      popular: true,
      features: [
        'Tất cả tính năng AI Video Editor & Lồng tiếng AI',
        'AI Video Spinner nhân bản lách reup không giới hạn',
        'AI Smart Inbox Facebook & Instagram',
        'Quản lý tới 50 Fanpage đồng thời',
        'Tự động bóc tách đơn hàng AI & Tele Campaign',
        'Hỗ trợ kỹ thuật ưu tiên 24/7'
      ],
      badge: 'Bán chạy nhất'
    },
    {
      id: 'GOLD' as const,
      name: 'GÓI GOLD',
      price: '999.000',
      period: 'tháng',
      popular: false,
      features: [
        'Toàn bộ quyền lợi gói PRO',
        'Quản lý tới 100 Fanpage & Đa kênh',
        'Cào Douyin & TikTok không giới hạn luồng',
        'AI Voice Clone giọng người thật siêu thực',
        'Bảo hành hệ thống và chống khóa Fanpage'
      ],
      badge: 'Doanh nghiệp'
    },
    {
      id: 'DIAMOND' as const,
      name: 'GÓI DIAMOND',
      price: '3.999.000',
      period: 'tháng',
      popular: false,
      features: [
        'Toàn bộ quyền lợi gói GOLD',
        'Quản lý 500+ Fanpage & Bot bán hàng tự động',
        'Server Dedicated riêng tốc độ x5 lần',
        'Chuyên viên hỗ trợ 1 kèm 1 riêng qua Ultraview/Tele',
        'Tùy chỉnh tính năng riêng theo yêu cầu'
      ],
      badge: 'VIP Agency'
    }
  ];

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    toast.success('Đã sao chép số tài khoản!', { duration: 2000 });
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 md:p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
              <Crown size={28} className="text-yellow-200 fill-yellow-200" />
            </span>
            <div>
              <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight">
                NÂNG CẤP & GIA HẠN GÓI CƯỚC
              </h2>
              <p className="text-orange-100 text-xs md:text-sm font-medium">
                Mở khóa tối đa tiềm năng sáng tạo video AI và tự động hóa bán hàng đa kênh
              </p>
            </div>
          </div>

          {/* Current User Status Chip */}
          <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white/90">Tài khoản:</span>
              <span className="bg-black/25 px-3 py-1 rounded-full font-black text-white">{currentUser.name || 'BÙI VĂN KỲ'}</span>
              <span className="bg-white/25 px-3 py-1 rounded-full font-black uppercase text-yellow-200">
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
        <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Quick Testing Bar (Tiện ích kiểm tra thông báo & hết hạn) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
              <Zap size={14} className="text-amber-500" />
              Công cụ thử nghiệm tính năng thông báo & hết hạn gói:
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <button
                onClick={() => {
                  onSetTestDays(2);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Đặt thời hạn còn 2 ngày để kích hoạt ngay dòng thông báo nhắc gia hạn chạy trên cùng website"
              >
                ⏱️ Đặt hạn còn 2 ngày (Xem dòng cảnh báo)
              </button>
              <button
                onClick={() => {
                  onSetTestDays(0);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Mô phỏng hết 07 ngày dùng thử để tự động chuyển về gói FREE"
              >
                ⚠️ Đặt hết hạn ngay (Về FREE)
              </button>
              <button
                onClick={() => {
                  onSetTestDays(7);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Cấp lại 07 ngày dùng thử PRO như khách vừa mới đăng ký"
              >
                🔄 Đặt lại 07 ngày dùng thử PRO
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => {
              const isSelected = selectedPlan === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`rounded-[24px] p-5 border-2 transition-all cursor-pointer relative flex flex-col ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/40 shadow-xl shadow-orange-500/10 scale-[1.02]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                      {p.badge}
                    </span>
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-black italic text-lg text-slate-900 uppercase">{p.name}</h3>
                      <p className="text-[11px] font-bold text-slate-400">Dành cho cá nhân & shop</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300'}`}>
                      {isSelected && <Check size={14} className="stroke-[3]" />}
                    </div>
                  </div>

                  <div className="my-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">{p.price}đ</span>
                    <span className="text-xs font-bold text-slate-400"> /{p.period}</span>
                  </div>

                  <ul className="space-y-2.5 my-4 flex-1 text-xs text-slate-600 font-medium">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 leading-tight">
                        <CheckCircle2 size={14} className="text-orange-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenew(p.id, 30);
                      onClose();
                    }}
                    className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all mt-auto cursor-pointer ${
                      isSelected
                        ? 'bg-[#f9570c] hover:bg-[#ea4e07] text-white shadow-lg shadow-orange-500/25'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Gia hạn 30 ngày ngay
                  </button>
                </div>
              );
            })}
          </div>

          {/* Payment & Transfer Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-6">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
              <Landmark size={18} className="text-orange-500" />
              Thông tin chuyển khoản & Kích hoạt tự động
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Ngân hàng:</span>
                  <span className="font-black text-slate-800">MB BANK (Quân Đội)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-blue-600 text-sm">0988288288</span>
                    <button
                      onClick={() => handleCopyAccount('0988288288')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                      title="Sao chép"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Chủ tài khoản:</span>
                  <span className="font-black text-slate-800">BÙI VĂN KỲ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Cú pháp:</span>
                  <span className="font-mono font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    KPOST {currentUser.name ? currentUser.name.replace(/\s+/g, '').toUpperCase() : 'USER'} {selectedPlan}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="font-bold text-slate-700 mb-1">Kích hoạt nhanh trong 10 giây</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Hệ thống sẽ tự động cộng thêm ngày sử dụng ngay khi nhận được biến động số dư. Hoặc bấm nút bên dưới để mô phỏng kích hoạt ngay lập tức!
                  </p>
                </div>
                <button
                  onClick={() => {
                    onRenew(selectedPlan, 30);
                    onClose();
                  }}
                  className="w-full mt-3 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black uppercase text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Crown size={15} /> Xác nhận kích hoạt gói {selectedPlan} (+30 ngày)
                </button>
              </div>
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
