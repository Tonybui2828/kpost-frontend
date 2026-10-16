import axios from "axios";
import { io } from "socket.io-client";
import { toast, Toaster } from "react-hot-toast";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  Clock, 
  Calendar, 
  Loader2, 
  Trash2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Edit,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldAlert,
  MessageCircle,
  LayoutDashboard,
  BarChart,
  Settings,
  Bot,
  Sparkles,
  Image as ImageIcon,
  Edit3,
  ShoppingCart,
  FolderCheck,
  Square,
  Globe,
  Shuffle,
  Plus,
  User,
  Lock,
  CreditCard,
  Gift,
  BookOpen,
  Scale,
  Shield,
  LogIn,
  UserPlus,
  Share2,
  DollarSign,
  MousePointerClick,
  Users,
  Wallet,
  History,
  AlertCircle,
  Copy,
  Landmark,
  TrendingUp, Check, CheckCircle,
  KeyRound,
  LogOut,
  ShieldCheck,
  Fingerprint,
  Mail,
  MessageSquare,
  Inbox,
  Paperclip,
  Send,
  Film,
  Smartphone,
  Wand2,
  Crown
} from "lucide-react";
import { mockPosts, mockConversations } from './data';
import VideoSpinnerPage from "./app/video-spinner/page";
import AiVideoEditorPage from "./app/ai-video-editor/page";
import { 
  MainAppSidebar, 
  TopRenewalNoticeBanner, 
  UpgradeRenewModal, 
  UserSubscription,
  OrdersView,
  BotUsersView,
  WarrantyView,
  RevenueView,
  BotNotificationsView,
  TeleCampaignView,
  SupportView
} from "./components/SubscriptionAndSidebarViews";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('ai-video-editor');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- QUẢN LÝ GÓI CƯỚC & TÍNH NĂNG 07 NGÀY PRO MIỄN PHÍ ---
  const [currentUser, setCurrentUser] = useState<UserSubscription>(() => {
    try {
      const saved = localStorage.getItem('kpost_user');
      if (saved) {
        const parsed: UserSubscription = JSON.parse(saved);
        // Kiểm tra hết hạn: Hết 07 ngày -> tự động về FREE
        if (parsed.plan === 'PRO' && parsed.planExpire) {
          const diff = new Date(parsed.planExpire).getTime() - Date.now();
          if (diff <= 0) {
            parsed.plan = 'FREE';
            parsed.planExpire = null;
            parsed.isTrial = false;
            localStorage.setItem('kpost_user', JSON.stringify(parsed));
          }
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    // Mặc định khách hàng BÙI VĂN KỲ với 07 ngày dùng thử PRO miễn phí
    const initialUser: UserSubscription = {
      name: 'BÙI VĂN KỲ',
      email: 'tech28.vn@gmail.com',
      plan: 'PRO',
      planExpire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isTrial: true,
      trialDays: 7,
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('kpost_user', JSON.stringify(initialUser));
    } catch (e) {}
    return initialUser;
  });

  // Tính số ngày còn lại
  const calculateDaysLeft = (user: UserSubscription) => {
    if (!user.planExpire || user.plan === 'FREE') return 0;
    const diff = new Date(user.planExpire).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = calculateDaysLeft(currentUser);

  // Đồng bộ localStorage khi currentUser thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('kpost_user', JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);

  // Kiểm tra định kỳ (auto downgrade về FREE nếu hết 7 ngày)
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentUser.plan === 'PRO' && currentUser.planExpire) {
        const diff = new Date(currentUser.planExpire).getTime() - Date.now();
        if (diff <= 0) {
          setCurrentUser(prev => ({
            ...prev,
            plan: 'FREE',
            planExpire: null,
            isTrial: false,
          }));
          toast('⚠️ Gói dùng thử 07 ngày PRO đã hết hạn và tài khoản đã chuyển về gói FREE.', {
            duration: 6000,
            icon: 'ℹ️'
          });
        }
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [currentUser]);

  // Xử lý khách đăng ký mới -> Tự động tặng 07 ngày dùng thử PRO miễn phí
  const handleRegisterNewCustomer = (name: string, email: string) => {
    const expireDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const newUser: UserSubscription = {
      name: name.trim() || 'Khách Hàng Mới',
      email: email.trim() || 'user@kpost.vn',
      plan: 'PRO',
      planExpire: expireDate,
      isTrial: true,
      trialDays: 7,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(newUser);
    toast.success(
      `🎉 Chúc mừng ${newUser.name}! Bạn được tặng 07 NGÀY SỬ DỤNG GÓI PRO MIỄN PHÍ!`,
      { duration: 7000, icon: '👑' }
    );
  };

  // Xử lý gia hạn / nâng cấp
  const handleRenewPlan = (plan: 'PRO' | 'GOLD' | 'DIAMOND', days: number) => {
    const currentExpireMs = currentUser.planExpire && new Date(currentUser.planExpire).getTime() > Date.now()
      ? new Date(currentUser.planExpire).getTime()
      : Date.now();
    const newExpire = new Date(currentExpireMs + days * 24 * 60 * 60 * 1000).toISOString();
    const updated: UserSubscription = {
      ...currentUser,
      plan,
      planExpire: newExpire,
      isTrial: false,
    };
    setCurrentUser(updated);
    toast.success(`👑 Kích hoạt thành công gói ${plan} thêm ${days} ngày!`, { duration: 5000 });
  };

  // Tiện ích thử nghiệm thông báo & hết hạn
  const handleSetTestDays = (days: number) => {
    if (days <= 0) {
      const updated: UserSubscription = {
        ...currentUser,
        plan: 'FREE',
        planExpire: null,
        isTrial: false,
      };
      setCurrentUser(updated);
      toast('⚠️ Đã đặt hết hạn: Tài khoản chuyển về gói FREE!', { icon: 'ℹ️' });
    } else {
      const newExpire = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const updated: UserSubscription = {
        ...currentUser,
        plan: 'PRO',
        planExpire: newExpire,
        isTrial: true,
      };
      setCurrentUser(updated);
      toast(`✅ Đã đặt hạn PRO còn ${days} ngày (Dòng nhắc nhở trên cùng đã kích hoạt)!`, { icon: '⏱️' });
    }
  };

  // --- BẮT LINK AFFILIATE TRÊN URL ---
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      if (refCode) {
        localStorage.setItem("kpost_affiliate_ref", refCode);
        console.log("Đã bắt và lưu mã Affiliate:", refCode);
      }
    } catch (e) {
      console.log("Lỗi bắt mã Affiliate", e);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Toaster position="top-right" />
      
      {/* ⚡ DÒNG THÔNG BÁO NHẮC GIA HẠN CHẠY TRÊN CÙNG GIAO DIỆN (TRƯỚC HẠN 3 NGÀY) */}
      <TopRenewalNoticeBanner
        currentUser={currentUser}
        daysLeft={daysLeft}
        onOpenUpgrade={() => setShowUpgradeModal(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* 🌟 SIDEBAR CHUẨN ĐẸP KHỚP 100% ẢNH MINH HỌA - CÓ NÚT NÂNG CẤP BÊN TRÊN ĐĂNG XUẤT */}
        <MainAppSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          daysLeft={daysLeft}
          onOpenUpgrade={() => setShowUpgradeModal(true)}
          onLogout={() => {
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
              toast('Đã đăng xuất tài khoản!', { icon: '👋' });
              setActiveTab('settings');
            }
          }}
        />

        {/* Khung nội dung chính */}
        <main className="flex-1 flex overflow-hidden bg-slate-50">
          {activeTab === 'ai-video-editor' && <AiVideoEditorPage />}
          {activeTab === 'video-spinner' && <VideoSpinnerPage />}
          {activeTab === 'ai' && <AiMarketingView />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'inbox' && <InboxView />}
          {activeTab === 'orders' && <OrdersView onOpenUpgrade={() => setShowUpgradeModal(true)} />}
          {activeTab === 'bot-users' && <BotUsersView />}
          {activeTab === 'warranty' && <WarrantyView />}
          {activeTab === 'revenue' && <RevenueView />}
          {activeTab === 'bot-notifications' && <BotNotificationsView />}
          {activeTab === 'tele-campaign' && <TeleCampaignView />}
          {activeTab === 'support' && <SupportView onOpenUpgrade={() => setShowUpgradeModal(true)} />}
          
          {/* Nhóm Settings & Tabs con */}
          {(activeTab === 'settings' || activeTab === 'profile' || activeTab === 'affiliate' || activeTab === 'guide') && (
            <SettingsView
              currentUser={currentUser}
              onOpenUpgrade={() => setShowUpgradeModal(true)}
              onRegisterCustomer={handleRegisterNewCustomer}
              initialSubTab={activeTab === 'profile' ? 'account' : activeTab === 'guide' ? 'guide' : activeTab === 'affiliate' ? 'affiliate' : 'affiliate'}
            />
          )}

          {activeTab !== 'ai-video-editor' && 
           activeTab !== 'video-spinner' && 
           activeTab !== 'ai' && 
           activeTab !== 'calendar' && 
           activeTab !== 'inbox' && 
           activeTab !== 'orders' && 
           activeTab !== 'bot-users' && 
           activeTab !== 'warranty' && 
           activeTab !== 'revenue' && 
           activeTab !== 'bot-notifications' && 
           activeTab !== 'tele-campaign' && 
           activeTab !== 'support' && 
           activeTab !== 'settings' && 
           activeTab !== 'profile' && 
           activeTab !== 'affiliate' && 
           activeTab !== 'guide' && (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center text-slate-500">
                <div className="mb-4 flex justify-center">
                  <Bot size={48} className="text-slate-300" />
                </div>
                <h2 className="text-xl font-medium">Chọn một tính năng trên menu để bắt đầu!</h2>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 👑 MODAL NÂNG CẤP & GIA HẠN GÓI CƯỚC */}
      <UpgradeRenewModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentUser={currentUser}
        onRenew={handleRenewPlan}
        onSetTestDays={handleSetTestDays}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// AI MARKETING VIEW (MÔ PHỎNG CODE CỦA BẠN)
// ----------------------------------------------------------------------
function AiMarketingView() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<any>(null);
  const [editableContent, setEditableContent] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false); 
  const [isEditing, setIsEditing] = useState(false);

  // MOCK DATA ẢNH
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [availableImages, setAvailableImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80",
    "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&q=80"
  ]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  // KIỂM TRA LOCAL STORAGE KHI LOAD TRANG
  useEffect(() => {
    const savedTopic = localStorage.getItem("pendingAIPost_topic");
    const savedImgs = localStorage.getItem("pendingAIPost_imgs");

    if (savedTopic) {
      setTopic(savedTopic);
      localStorage.removeItem("pendingAIPost_topic");
    }

    if (savedImgs) {
      const imgList = savedImgs.split(',');
      setAvailableImages(prev => [...new Set([...imgList, ...prev])]); // Merge & Dedupe
      setSelectedImages(imgList);
      localStorage.removeItem("pendingAIPost_imgs");
    }
  }, []);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Tạo object URL cho preview ảnh/video
    const newMediaUrls = Array.from(files).map(file => URL.createObjectURL(file as File));
    
    setAvailableImages(prev => [...newMediaUrls, ...prev]);
    // Tự động chọn luôn ảnh vừa tải lên (giới hạn tối đa 10)
    setSelectedImages(prev => {
      const combined = [...newMediaUrls, ...prev];
      return combined.slice(0, 10);
    });
  };

  // MOCK DATA PAGES
  const [accounts, setAccounts] = useState<any[]>([
    { platformId: '1', accountName: 'Thời Trang K-Post' },
    { platformId: '2', accountName: 'K-Post VN - Giải pháp' },
    { platformId: '3', accountName: 'Đồ gia dụng K-Post' },
    { platformId: '4', accountName: 'Dropshipping Việt Nam' },
    { platformId: '5', accountName: 'Công nghệ Tech 28' },
  ]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [pageGroups, setPageGroups] = useState<{name: string, ids: string[]}[]>([
    { name: 'Nhóm Page Bán Hàng', ids: ['1', '3'] },
    { name: 'Nhóm Vệ Tinh', ids: ['2', '4', '5'] }
  ]);
  const [newGroupName, setNewGroupName] = useState("");

  // TÍNH NĂNG MỚI: HẸN GIỜ & CHỐNG SPAM
  const [isScheduling, setIsScheduling] = useState(true); // Bật mặc định để demo
  const [spinContent, setSpinContent] = useState(true); // Nút toggle chống spam
  const [scheduleDate, setScheduleDate] = useState("");
  const [productUrl, setProductUrl] = useState(""); 

  const handleGenerateContent = async () => {
    if (!topic) return alert("Nhập chủ đề!");
    setLoading(true);
    try {
      // Gọi API thực tế
      const response = await axios.post('/api/generate-content', { topic });
      const generated = response.data.content;
      setResult({ content: generated });
      setEditableContent(generated);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || "AI đang bận hoặc có lỗi xảy ra. Vui lòng thử lại sau.";
      alert(`kpost.vn says
${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePostAction = async () => {
    if (!editableContent || selectedPageIds.length === 0) return alert("Chưa chọn nội dung hoặc Page!");
    if (selectedImages.length === 0) return alert("Hãy chọn ít nhất 1 tấm ảnh!");
    if (isScheduling && !scheduleDate) return alert("Vui lòng chọn ngày giờ hẹn lịch!");

    setPosting(true);
    setTimeout(() => {
      if (isScheduling) {
        let msg = `🚀 Thành công! Đã đưa ${selectedPageIds.length} bài viết vào LỊCH CHỜ.`;
        if (spinContent && selectedPageIds.length > 1) {
          msg += `\n✨ Hệ thống sẽ tự động sử dụng AI viết lại nội dung thành ${selectedPageIds.length} bản khác nhau cho từng Page để chống Spam Facebook!`;
        }
        alert(msg);
      } else {
        alert(`🚀 Thành công! Đã đăng bài ngay lập tức lên ${selectedPageIds.length} Fanpage.`);
      }
      setPosting(false);
    }, 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 text-black font-sans">
      <div className="max-w-5xl mx-auto pb-20">
        <h1 className="text-4xl font-black text-center mb-10 italic uppercase text-slate-900 tracking-tighter">AI CONTENT CREATOR</h1>

        {/* CHỌN ẢNH BÀI ĐĂNG */}
        <div className="mb-10 bg-white p-6 rounded-[32px] border shadow-sm text-black">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-blue-600" /> Bộ sưu tập ảnh sản phẩm ({selectedImages.length}/10)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* NÚT UPLOAD */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all bg-slate-50"
                >
                  <Plus size={32} className="mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Thêm Media</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                </div>

                {/* DANH SÁCH ẢNH HIỆN TẠI */}
                {availableImages.map((url, idx) => (
                    <div key={idx} onClick={() => setSelectedImages(prev => prev.includes(url) ? prev.filter(u => u !== url) : (prev.length < 10 ? [...prev, url] : prev))}
                         className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 transition-all ${selectedImages.includes(url) ? 'border-blue-600 scale-95 shadow-md' : 'border-white opacity-40'}`}>
                        <img src={url} className="w-full h-full object-cover" alt="product" />
                        {selectedImages.includes(url) && <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1"><CheckCircle2 size={16} /></div>}
                    </div>
                ))}
            </div>
        </div>

        {/* NHẬP Ý TƯỞNG */}
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border mb-10 text-black">
          <textarea className="w-full p-6 bg-slate-50 border-none rounded-[32px] outline-none text-xl min-h-[140px] text-slate-900 font-bold focus:bg-white transition-all" placeholder="Mô tả ý tưởng của bạn (vd: Viết bài bán áo thun mùa hè)..." value={topic} onChange={(e) => setTopic(e.target.value)} />
          <button onClick={handleGenerateContent} disabled={loading} className="w-full mt-6 bg-black text-white font-black py-5 rounded-3xl shadow-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all">
             {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={22} />} SÁNG TẠO BÀI VIẾT VỚI AI
          </button>
        </div>

        {/* KẾT QUẢ VÀ CẤU HÌNH ĐĂNG */}
        {result && (
          <div className="bg-white p-8 rounded-[45px] shadow-xl border-l-[16px] border-blue-600 mb-10 text-black animate-in fade-in slide-in-from-bottom-10">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase italic">Nội dung đề xuất gốc</h2>
                <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-xl ${isEditing ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}><Edit3 size={18}/></button>
             </div>
             <textarea className={`w-full p-6 rounded-[24px] text-lg leading-relaxed outline-none border-2 transition-all mb-8 ${isEditing ? 'border-orange-200 bg-orange-50/10' : 'border-transparent bg-slate-50'}`} rows={6} value={editableContent} readOnly={!isEditing} onChange={(e) => setEditableContent(e.target.value)} />
             
             {/* LINK COMMENT & HẸN GIỜ */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-black">
                <div className="p-6 bg-blue-50/50 rounded-[35px] border-2 border-dashed border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                        <ShoppingCart size={16} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase text-blue-900">Link chèn tự động dưới comment</span>
                    </div>
                    <input className="w-full px-6 py-4 bg-white rounded-2xl outline-none font-bold text-blue-600 shadow-sm" placeholder="Dán link sản phẩm của bạn..." value={productUrl} onChange={(e) => setProductUrl(e.target.value)} />
                </div>

                <div className="p-6 bg-slate-50 rounded-[35px] border border-slate-100 flex flex-col justify-center">
                    <label className="flex items-center justify-between cursor-pointer mb-3">
                        <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"><Clock size={14} /> Chế độ hẹn giờ đăng</span>
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600" checked={isScheduling} onChange={(e) => setIsScheduling(e.target.checked)} />
                    </label>
                    {isScheduling && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                          <input type="datetime-local" className="w-full mb-3 bg-white border-2 border-blue-100 px-4 py-3 rounded-2xl text-xs font-bold text-blue-600 outline-none" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                          
                          {/* TÍNH NĂNG CHỐNG SPAM */}
                          <label className="flex items-center gap-2 cursor-pointer bg-orange-50 p-3 rounded-xl border border-orange-100">
                              <input type="checkbox" className="w-4 h-4 rounded text-orange-600" checked={spinContent} onChange={(e) => setSpinContent(e.target.checked)} />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-orange-700 flex items-center gap-1">
                                  <Shuffle size={12} /> Tránh Spam (Khuyên dùng)
                                </span>
                                <span className="text-[9px] text-orange-600 font-medium leading-tight mt-0.5">
                                  Hệ thống sẽ dùng AI viết lại {selectedPageIds.length || 'nhiều'} phiên bản nội dung khác nhau cho từng Page.
                                </span>
                              </div>
                          </label>
                        </div>
                    )}
                </div>
             </div>

             {/* PAGE FOLDERS */}
             <div className="mb-8 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 text-black"><FolderCheck size={14} /> Nhóm Fanpage theo Folder ({selectedPageIds.length} đã chọn)</h3>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {pageGroups.map((group, idx) => (
                        <div key={idx} className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setSelectedPageIds(group.ids)} className="bg-white border-2 border-blue-500 text-blue-600 px-5 py-2.5 rounded-2xl text-[10px] font-black whitespace-nowrap hover:bg-blue-50 transition-colors">📁 {group.name.toUpperCase()}</button>
                            <button className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
                        </div>
                    ))}
                </div>
             </div>

             {/* CHỌN PAGE LẺ */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar text-black">
                {accounts.map((acc: any) => (
                    <div key={acc.platformId} onClick={() => setSelectedPageIds(prev => prev.includes(acc.platformId) ? prev.filter(id => id !== acc.platformId) : [...prev, acc.platformId])} 
                         className={`p-4 rounded-[20px] border-2 cursor-pointer transition-all flex items-center justify-between ${selectedPageIds.includes(acc.platformId) ? 'border-blue-500 bg-white shadow-md' : 'border-transparent bg-slate-50 opacity-40 hover:opacity-100'}`}>
                        <p className="font-bold text-xs truncate pr-2 text-black">{acc.accountName}</p>
                        {selectedPageIds.includes(acc.platformId) ? <CheckCircle2 size={18} className="text-blue-600" /> : <Square size={18} className="text-slate-200" />}
                    </div>
                ))}
             </div>

             <button onClick={handlePostAction} disabled={posting} className="w-full bg-blue-600 text-white font-black py-6 rounded-[30px] shadow-xl text-xl hover:bg-blue-700 active:scale-95 transition-all">
                {posting ? <Loader2 className="animate-spin mx-auto" /> : (
                  <>
                    <Globe size={24} className="inline mr-2" /> 
                    {isScheduling ? (spinContent ? 'LÊN LỊCH & SPIN NỘI DUNG 🚀' : 'ĐƯA VÀO HÀNG CHỜ ĐĂNG 🚀') : 'XUẤT BẢN NGAY 🚀'}
                  </>
                )}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

// SHARED COMPONENT CHO SIDEBAR
function NavItem({ icon, active, onClick, tooltip }: { icon: React.ReactNode, active?: boolean, onClick: () => void, tooltip: string }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-xl transition-all relative group flex items-center justify-center ${
        active 
          ? 'bg-blue-600/10 text-blue-500' 
          : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
      }`}
      title={tooltip}
    >
      {icon}
    </button>
  );
}

// ----------------------------------------------------------------------
// QUẢN LÝ LỊCH BÀI ĐĂNG VIEW
// ----------------------------------------------------------------------
function CalendarView() {
  const [posts, setPosts] = useState(mockPosts);

  const scheduledPosts = posts
    .filter(p => p.status === 'scheduled')
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group by date
  const groupedPosts: Record<string, typeof mockPosts> = {};
  
  scheduledPosts.forEach(post => {
    const d = new Date(post.date);
    const dateKey = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    if (!groupedPosts[dateKey]) {
      groupedPosts[dateKey] = [];
    }
    groupedPosts[dateKey].push(post);
  });

  const handleDelete = (id: string) => {
    if(confirm("Bạn có chắc chắn muốn xóa bài đăng này không?")) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  const handleEdit = (id: string) => {
    alert("Chức năng chỉnh sửa đang phát triển!");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 text-black font-sans">
      <div className="max-w-5xl mx-auto pb-20">
        <h1 className="text-4xl font-black text-center mb-10 italic uppercase text-slate-900 tracking-tighter">QUẢN LÝ LỊCH BÀI ĐĂNG</h1>
        
        {Object.entries(groupedPosts).map(([dateKey, dailyPosts]) => (
          <div key={dateKey} className="mb-10 bg-white p-6 rounded-[32px] border shadow-sm">
             <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                   <Calendar size={20} className="text-blue-600" /> Ngày đăng: {dateKey}
                </h2>
                <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                   Số bài chờ đăng: {dailyPosts.length}
                </div>
             </div>
             
             <div className="mb-2 text-xs font-black uppercase text-slate-400 tracking-widest px-2">Danh sách bài đăng:</div>
             
             <div className="flex flex-col gap-3">
                {dailyPosts.map(post => {
                   const d = new Date(post.date);
                   const timeString = `${d.getHours().toString().padStart(2, '0')}h:${d.getMinutes().toString().padStart(2, '0')}`;
                   
                   return (
                     <div key={post.id} className="flex flex-col md:flex-row md:items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors gap-4">
                        
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-bold text-slate-800 truncate" title={post.content}>{post.content}</p>
                           <div className="flex gap-2 mt-2">
                              <button onClick={() => handleEdit(post.id)} className="text-[10px] bg-white border border-slate-200 px-3 py-1 rounded-lg font-black text-blue-600 hover:bg-blue-50 transition-colors uppercase flex items-center gap-1"><Edit size={12}/> Chỉnh sửa</button>
                              <button onClick={() => handleDelete(post.id)} className="text-[10px] bg-white border border-slate-200 px-3 py-1 rounded-lg font-black text-red-500 hover:bg-red-50 transition-colors uppercase flex items-center gap-1"><Trash2 size={12}/> Xóa</button>
                           </div>
                        </div>
                        
                        <div className="md:w-48 shrink-0 flex items-center gap-2 text-slate-600 text-sm font-medium border-l border-slate-200 pl-4">
                            <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{post.pageName.charAt(0)}</div>
                            <span className="truncate" title={post.pageName}>{post.pageName}</span>
                        </div>
                        
                        <div className="md:w-40 shrink-0 flex items-center gap-2 text-slate-900 text-sm font-black border-l border-slate-200 pl-4">
                            <Clock size={16} className="text-orange-500" /> Thời gian đăng: {timeString}
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>
        ))}

        {scheduledPosts.length === 0 && (
           <div className="text-center py-20 text-slate-500">
               <Calendar size={48} className="mx-auto mb-4 text-slate-300 opacity-50" />
               <p className="font-medium">Chưa có bài viết nào được lên lịch.</p>
           </div>
        )}
      </div>
    </div>
  );
}




// ----------------------------------------------------------------------
// CÀI ĐẶT VIEW
// ----------------------------------------------------------------------
function SettingsView({
  currentUser,
  onOpenUpgrade,
  onRegisterCustomer,
  initialSubTab
}: {
  currentUser?: UserSubscription;
  onOpenUpgrade?: () => void;
  onRegisterCustomer?: (name: string, email: string) => void;
  initialSubTab?: string;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Mặc định true để xem luôn giao diện
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [activeTab, setActiveTab] = useState(initialSubTab || 'affiliate');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsSendingReset(true);
    try {
      await axios.post('/api/send-email', {
        to: forgotEmail,
        subject: 'Khôi phục mật khẩu Kpost',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #000; font-style: italic; text-transform: uppercase;">Khôi phục mật khẩu</h2>
            <p>Xin chào,</p>
            <p>Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản liên kết với email này.</p>
            <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>
            <a href="https://kpost.vn/reset-password" style="display: inline-block; background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">ĐẶT LẠI MẬT KHẨU</a>
            <p style="color: #64748b; font-size: 12px;">Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
          </div>
        `
      });
      alert('Đã gửi liên kết khôi phục. Vui lòng kiểm tra email của bạn.');
      setMode('login');
    } catch (error) {
      console.error(error);
      alert('Đã có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText("https://kpost.vn/?ref=KPOST_PRO_999");
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex-1 flex bg-slate-50 overflow-hidden font-sans p-4 md:p-8">
        <div className="flex-1 bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 flex justify-center items-center">
            {mode === 'login' ? (
              <div className="w-full max-w-md">
                <h2 className="text-3xl font-black italic text-center mb-10 uppercase tracking-tighter">ĐĂNG NHẬP</h2>
                <div className="flex flex-col gap-4 mb-6">
                  <input type="email" placeholder="Email" className="w-full p-4 rounded-[16px] border border-slate-300 focus:outline-none focus:border-black font-medium transition-colors" />
                  <input type="password" placeholder="Mật khẩu" className="w-full p-4 rounded-[16px] border border-slate-300 focus:outline-none focus:border-black font-medium transition-colors" />
                </div>
                <div className="flex justify-end mb-6">
                  <button onClick={() => setMode('forgot')} className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">Quên mật khẩu?</button>
                </div>
                <button onClick={() => setIsLoggedIn(true)} className="w-full bg-black text-white font-black py-4 rounded-[20px] text-sm uppercase hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mb-6">
                  <LogIn size={18} /> VÀO HỆ THỐNG
                </button>
                <div className="text-center mb-8">
                  <button onClick={() => setMode('register')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest underline underline-offset-4">
                    CHƯA CÓ TÀI KHOẢN? ĐĂNG KÝ
                  </button>
                </div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px bg-slate-100 flex-1"></div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">HOẶC</span>
                  <div className="h-px bg-slate-100 flex-1"></div>
                </div>
                <button className="w-full bg-white border border-slate-200 text-slate-700 font-black py-4 rounded-[24px] text-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-4 shadow-[0_4px_15px_rgb(0,0,0,0.02)]">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/list/google.svg" className="w-5 h-5" alt="G" />
                  TIẾP TỤC VỚI GOOGLE
                </button>
              </div>
            ) : mode === 'forgot' ? (
              <div className="w-full max-w-md">
                <h2 className="text-3xl font-black italic text-center mb-2 uppercase tracking-tighter">QUÊN MẬT KHẨU</h2>
                <p className="text-center text-slate-500 font-medium mb-10">Nhập email đã đăng ký để nhận liên kết khôi phục</p>
                <form onSubmit={handleForgotSubmit} className="flex flex-col gap-6 mb-8">
                  <input 
                    type="email" 
                    placeholder="Ví dụ: example@gmail.com..." 
                    className="w-full p-4 rounded-[16px] border border-slate-300 focus:outline-none focus:border-blue-600 font-medium transition-colors"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={isSendingReset}
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-[20px] text-sm uppercase hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-[0_8px_20px_rgb(37,99,235,0.25)] disabled:opacity-70"
                  >
                    {isSendingReset ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />} 
                    GỬI YÊU CẦU KHÔI PHỤC
                  </button>
                </form>
                <div className="text-center">
                  <button onClick={() => setMode('login')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest underline underline-offset-4">
                    QUAY LẠI ĐĂNG NHẬP
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md">
                <h2 className="text-3xl font-black italic text-center mb-6 uppercase tracking-tighter">TẠO TÀI KHOẢN</h2>
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-4 mb-6 shadow-md flex items-center gap-3 text-xs font-bold">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Crown size={18} className="text-yellow-200 fill-yellow-200" />
                  </div>
                  <div>
                    <span className="font-black uppercase tracking-wider block text-yellow-200">Đặc quyền khách mới</span>
                    Đăng ký hôm nay tự động nhận ngay <strong>07 ngày sử dụng gói PRO miễn phí</strong>!
                  </div>
                </div>
                <div className="flex flex-col gap-4 mb-2">
                  <input type="text" placeholder="Họ và tên" value={regName} onChange={e => setRegName(e.target.value)} className="w-full p-4 rounded-[16px] border border-slate-300 focus:outline-none focus:border-black font-medium transition-colors" />
                  <input type="email" placeholder="Email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full p-4 rounded-[16px] border border-slate-300 focus:outline-none focus:border-black font-medium transition-colors" />
                  <input type="password" placeholder="Mật khẩu" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full p-4 rounded-[16px] border border-slate-300 focus:outline-none focus:border-black font-medium transition-colors" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 mb-6 px-1">* Lưu ý: Mật khẩu tối thiểu 6 ký tự. Hết 07 ngày gói PRO tự động về FREE.</p>
                <button 
                  onClick={() => {
                    if (!regEmail.trim()) {
                      alert('Vui lòng nhập Email!');
                      return;
                    }
                    onRegisterCustomer?.(regName || 'Khách Hàng Mới', regEmail);
                    setIsLoggedIn(true);
                  }}
                  className="w-full bg-[#f9570c] hover:bg-[#ea4e07] text-white font-black py-4 rounded-[20px] text-sm uppercase transition-all flex items-center justify-center gap-2 mb-6 shadow-lg shadow-orange-500/25 cursor-pointer"
                >
                  <UserPlus size={18} /> ĐĂNG KÝ NGAY (+ 07 NGÀY PRO MIỄN PHÍ)
                </button>
                <div className="text-center mb-8">
                  <button onClick={() => setMode('login')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest underline underline-offset-4">
                    ĐÃ CÓ TÀI KHOẢN? ĐĂNG NHẬP
                  </button>
                </div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px bg-slate-100 flex-1"></div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">HOẶC</span>
                  <div className="h-px bg-slate-100 flex-1"></div>
                </div>
                <button className="w-full bg-white border border-slate-200 text-slate-700 font-black py-4 rounded-[24px] text-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-4 shadow-[0_4px_15px_rgb(0,0,0,0.02)]">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/list/google.svg" className="w-5 h-5" alt="G" />
                  TIẾP TỤC VỚI GOOGLE
                </button>
              </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-slate-50 overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR CÀI ĐẶT */}
          <div className="w-full lg:w-72 shrink-0">
            <h1 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase mb-1">SETTINGS</h1>
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-8">
              {currentUser?.name || 'BÙI VĂN KỲ'} - <span className="text-[#f9570c] font-black">{currentUser?.plan || 'PRO'}</span>
            </p>
            
            <nav className="flex flex-col gap-2">
              <SettingMenuBtn icon={<User size={18} />} label="Tài khoản & Login" active={activeTab === 'account'} onClick={() => setActiveTab('account')} />
              <SettingMenuBtn 
                icon={<Share2 size={18} />} 
                label="AFFILIATE (KIẾM TIỀN)" 
                active={activeTab === 'affiliate'} 
                onClick={() => setActiveTab('affiliate')} 
                highlight={true}
              />
              <SettingMenuBtn icon={<Lock size={18} />} label="Mật khẩu & Bảo mật" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
              <SettingMenuBtn icon={<CreditCard size={18} />} label="Gói cước & Nạp tiền" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
              <SettingMenuBtn icon={<Gift size={18} />} label="Mã giảm giá" active={activeTab === 'voucher'} onClick={() => setActiveTab('voucher')} />
              <SettingMenuBtn icon={<BookOpen size={18} />} label="Hướng dẫn khách mới" active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} />
              <SettingMenuBtn icon={<Scale size={18} />} label="Điều khoản sử dụng" active={activeTab === 'terms'} onClick={() => setActiveTab('terms')} />
              <SettingMenuBtn icon={<Shield size={18} />} label="Chính sách bảo mật" active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} />
            </nav>
            
            {/* 🌟 NÚT NÂNG CẤP / GIA HẠN NẰM BÊN TRÊN PHẦN ĐĂNG XUẤT */}
            <button
              onClick={onOpenUpgrade}
              className="mt-6 w-full bg-[#f9570c] hover:bg-[#ea4e07] text-white font-black py-3 px-4 rounded-[18px] text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Crown size={16} className="fill-white" />
              NÂNG CẤP / GIA HẠN
            </button>

            <button onClick={() => setIsLoggedIn(false)} className="mt-3 text-[11px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2 px-4 cursor-pointer">
              <LogOut size={14} className="rotate-0"/> Đăng xuất
            </button>
          </div>
          
          {/* MAIN CONTENT CÀI ĐẶT */}
          <div className="flex-1 bg-white rounded-[50px] shadow-sm border border-slate-100 p-8 md:p-12 min-h-[700px]">
            {activeTab === 'affiliate' ? (
              <AffiliateTab />
            ) : activeTab === 'account' ? (
              <AccountTab />
            ) : activeTab === 'security' ? (
              <SecurityTab />
            ) : activeTab === 'billing' ? (
              <BillingTab onUpgrade={(plan: any) => alert('Mô phỏng nâng cấp gói ' + plan.name)} />
            ) : activeTab === 'voucher' ? (
              <VoucherTab />
            ) : activeTab === 'guide' ? (
              <GuideTab />
            ) : activeTab === 'terms' ? (
              <TermsOfServiceView />
            ) : activeTab === 'privacy' ? (
              <PrivacyPolicyView />
            ) : activeTab === 'account' ? (
              <AccountTab />
            ) : activeTab === 'billing' ? (
              <BillingTab />
            ) : activeTab === 'security' ? (
              <SecurityTab />
            ) : activeTab === 'voucher' ? (
              <VoucherTab />
            ) : activeTab === 'guide' ? (
              <GuideTab />
            ) : (
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-center min-h-[400px]">
                 <div className="text-center text-slate-400">
                    <Settings size={48} className="mx-auto mb-4 opacity-20" />
                    <h2 className="text-xl font-bold text-slate-600 mb-2">Đang phát triển</h2>
                    <p>Tab {activeTab.toUpperCase()} đang được hoàn thiện.</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingMenuBtn({icon, label, active, onClick, highlight = false}: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between w-full p-4 rounded-[20px] font-bold text-sm transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-md' 
          : highlight 
            ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100'
            : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {active && <ChevronRight size={18} />}
    </button>
  );
}

function StatCard({icon, label, value, color}: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className={`p-4 rounded-[24px] ${colors[color]} border border-white/50 shadow-sm`}>
      <div className="mb-3 opacity-80">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{label}</p>
      <p className="text-xl font-black tracking-tight">{value}</p>
    </div>
  );
}


function PrivacyPolicyView() {
  return (
    <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-sm border border-slate-100 max-h-[85vh] overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-8 border-b border-slate-100 pb-6 flex items-center gap-4">
        <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl">
          <Shield size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
            Chính Sách Bảo Mật Của Kpost
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">Cập nhật lần cuối: Tháng 9, 2026</p>
        </div>
      </div>

      <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
        {/* Intro */}
        <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-3 uppercase tracking-tighter flex items-center gap-2">
            <CheckCircle2 className="text-green-500" size={20}/> Cam kết giá trị
          </h3>
          <p className="mb-4">
            Tại <strong>Kpost</strong>, chúng tôi đặt sự an toàn và quyền riêng tư của khách hàng lên hàng đầu. 
            Mọi dữ liệu bạn cung cấp đều được mã hóa, lưu trữ an toàn và xử lý một cách minh bạch nhằm mang lại trải nghiệm phần mềm tối ưu và đáng tin cậy nhất.
          </p>
          <p>
            Chính sách này mô tả chi tiết cách chúng tôi thu thập, sử dụng, tiết lộ và bảo vệ thông tin khi bạn sử dụng dịch vụ thông qua Kpost, bao gồm các tích hợp với <strong>Facebook, Instagram, TikTok, Telegram, WhatsApp, Shopee, Zalo, Line và Youtube</strong>. Bằng việc sử dụng dịch vụ, bạn đồng ý với các thực hành được mô tả dưới đây.
          </p>
        </div>

        {/* Placeholder image */}
        <div className="relative w-full h-48 md:h-64 bg-slate-100 rounded-[24px] overflow-hidden flex items-center justify-center border border-slate-200">
           <div className="absolute inset-0 bg-blue-900/5 mix-blend-multiply"></div>
           <div className="text-center z-10">
             <Shield className="mx-auto mb-3 text-blue-400" size={56} />
             <p className="text-slate-600 font-bold text-xs uppercase tracking-widest px-4">Hệ thống bảo mật dữ liệu an toàn tiêu chuẩn quốc tế của Kpost</p>
           </div>
        </div>

        {/* Section 1 */}
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
            Thông tin Chúng tôi Thu thập
          </h3>
          <p className="mb-3">Chúng tôi thu thập nhiều loại thông tin để cung cấp, duy trì và cải thiện dịch vụ, bao gồm:</p>
          <ul className="space-y-3 ml-2 md:ml-4">
            <li className="flex items-start gap-2">
              <Check className="text-blue-500 shrink-0 mt-1" size={16}/> 
              <span><strong>Thông tin Nhận dạng Cá nhân (PII):</strong> Các thông tin như tên, địa chỉ email, số điện thoại và các chi tiết có thể nhận dạng bạn. <em className="text-blue-700 bg-blue-50 px-1 rounded">Kpost KHÔNG thu thập hoặc lưu trữ thông tin nhạy cảm: tình trạng sức khỏe, tài chính, sinh trắc học, thông tin tài khoản ngân hàng, dữ liệu tội phạm, đặc điểm sinh học.</em></span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-blue-500 shrink-0 mt-1" size={16}/> 
              <span><strong>Thông tin Không Cá nhân:</strong> Dữ liệu không trực tiếp nhận dạng bạn (thống kê sử dụng, loại trình duyệt, thông tin thiết bị).</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-blue-500 shrink-0 mt-1" size={16}/> 
              <span><strong>Dữ liệu Theo Nền tảng:</strong> Thông tin thu thập qua tích hợp bên thứ ba (Facebook, Instagram, TikTok, Telegram, WhatsApp, Shopee, Zalo, Line, Youtube) bao gồm tương tác người dùng, vị trí, số liệu tương tác và dữ liệu cuộc trò chuyện.</span>
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> 
            Cách Chúng tôi Sử dụng Thông tin
          </h3>
          <p className="mb-3">Dữ liệu chúng tôi thu thập được sử dụng để:</p>
          <ul className="list-disc ml-6 space-y-2 mb-6 text-slate-700 font-medium">
            <li>Cung cấp và duy trì dịch vụ.</li>
            <li>Cải thiện trải nghiệm người dùng và chức năng nền tảng.</li>
            <li>Giao tiếp với người dùng và phản hồi các câu hỏi.</li>
            <li>Đảm bảo tuân thủ các nghĩa vụ pháp lý và tiêu chuẩn bảo mật.</li>
          </ul>
          
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
             <h4 className="font-bold text-blue-900 mb-3 uppercase tracking-wider text-xs">Phương Pháp Xác thực Tài khoản</h4>
             <ul className="space-y-3 text-sm text-blue-900 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  Kpost áp dụng các phương pháp xác thực: <strong>Xác minh email, SMS OTP (One-Time Password), Số điện thoại.</strong>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  Kpost KHÔNG yêu cầu hoặc lưu trữ: <strong>Ảnh/video giấy tờ tùy thân (CCCD, Passport), dữ liệu sinh trắc học.</strong>
                </li>
             </ul>
          </div>
        </div>

        {/* Section 3 */}
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> 
            Chia sẻ và Tiết lộ Dữ liệu
          </h3>
          <p className="mb-3 font-bold text-slate-900">Chúng tôi tuyệt đối không bán thông tin cá nhân của bạn. Dữ liệu chỉ được chia sẻ trong các trường hợp:</p>
          <ul className="space-y-3 ml-2 md:ml-4">
            <li className="flex items-start gap-2">
              <Check className="text-blue-500 shrink-0 mt-1" size={16}/> 
              <span><strong>Nhà cung cấp Dịch vụ:</strong> Chia sẻ khi cần thiết để duy trì chất lượng dịch vụ. Các đối tác phải cam kết đảm bảo quy định về tiêu chuẩn an toàn và luật an toàn thông tin của Việt Nam.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-blue-500 shrink-0 mt-1" size={16}/> 
              <span><strong>Cơ quan Pháp lý:</strong> Khi có yêu cầu hợp pháp để tuân thủ quy định hoặc lệnh của tòa án.</span>
            </li>
          </ul>
        </div>

        {/* Section 4 */}
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span> 
            Bảo mật và Lưu trữ Dữ liệu Khách hàng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-blue-200 transition-colors">
                <h4 className="font-bold text-slate-900 mb-2">a. Cam kết bảo mật</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Kpost cam kết bảo vệ dữ liệu trong suốt quá trình cung cấp và vận hành phần mềm. Toàn bộ dữ liệu được lưu trữ trên hệ thống máy chủ đạt chuẩn bảo mật, áp dụng cơ chế mã hóa phù hợp và kiểm soát truy cập nghiêm ngặt. Việc xử lý chỉ diễn ra trong phạm vi cần thiết.</p>
             </div>
             <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-blue-200 transition-colors">
                <h4 className="font-bold text-slate-900 mb-2">b. Quyền chủ động xóa dữ liệu</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">Hệ thống cung cấp "Tùy chọn lưu trữ", cho phép Khách hàng thiết lập cơ chế xóa dữ liệu tự động.</p>
                <div className="bg-red-50 text-red-700 p-2 rounded-lg text-[10px] font-bold flex gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>Lưu ý: Dữ liệu đã xóa tự động theo thiết lập sẽ không thể khôi phục. Cần chủ động sao lưu trước khi xóa.</span>
                </div>
             </div>
             <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-blue-200 transition-colors">
                <h4 className="font-bold text-slate-900 mb-2">c. Dữ liệu sau khi kết thúc gói cước</h4>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li>• <strong>Thời gian chờ gia hạn:</strong> Lưu trữ thêm 2 năm kể từ ngày kết thúc gói cước.</li>
                  <li>• <strong>Xóa tự động:</strong> Sau 2 năm nếu không gia hạn, hệ thống tự động xóa toàn bộ dữ liệu.</li>
                  <li>• <strong>Trường hợp ưu tiên:</strong> Áp dụng mốc thời gian ngắn hơn nếu KH đã thiết lập ở mục 4.b.</li>
                </ul>
             </div>
             <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-blue-200 transition-colors">
                <h4 className="font-bold text-slate-900 mb-2">d. Trách nhiệm của Khách hàng</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Khách hàng có trách nhiệm quản lý cấu hình lưu trữ trong "Cài đặt tài khoản" và tự chịu rủi ro về mất dữ liệu do không gia hạn hoặc do thiết lập xóa tự động.</p>
             </div>
          </div>
        </div>

        {/* Section 5 */}
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">5</span> 
            Thu thập và Xử lý Dữ liệu Theo Nền tảng
          </h3>
          <p className="mb-4">Kpost tuân thủ chính sách bảo mật của từng nền tảng và các quy định quốc tế liên quan. Dữ liệu từ các nền tảng được xử lý an toàn và lưu trữ trên máy chủ riêng của Kpost.</p>
          
          <div className="overflow-hidden border border-slate-200 rounded-2xl mb-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-4 border-b border-slate-200 w-1/4">Nền tảng</th>
                  <th className="px-4 py-4 border-b border-slate-200">Cách thức hoạt động và Xử lý dữ liệu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-900 whitespace-nowrap">TikTok</td>
                  <td className="px-4 py-4 text-slate-600">Truy cập dữ liệu (bình luận, lượt thích, chia sẻ) qua API và Webhooks thời gian thực. Lưu trữ mã hóa trên máy chủ Kpost.</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-900 whitespace-nowrap">Facebook & Instagram</td>
                  <td className="px-4 py-4 text-slate-600">Yêu cầu quyền quản lý trang, đọc/trả lời tin nhắn, quảng cáo (tùy chọn). Thu thập dữ liệu qua API & Webhooks để chăm sóc khách hàng.</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-900 whitespace-nowrap">WhatsApp & Telegram</td>
                  <td className="px-4 py-4 text-slate-600">Thu thập tin nhắn, nhật ký tương tác qua API để quản lý tự động. Dữ liệu được mã hóa bảo mật.</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-900 whitespace-nowrap">Shopee</td>
                  <td className="px-4 py-4 text-slate-600">Truy cập dữ liệu đơn hàng, câu hỏi, giao dịch qua API nhằm quản lý đơn và phân tích hiệu suất.</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-900 whitespace-nowrap">Zalo & Line</td>
                  <td className="px-4 py-4 text-slate-600">Thu thập dữ liệu tin nhắn/nhật ký qua API để quản lý giao tiếp. Lưu trữ an toàn trên máy chủ Kpost.</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-900 whitespace-nowrap">Google & Youtube</td>
                  <td className="px-4 py-4 text-slate-600">
                    Tuân thủ nghiêm ngặt Chính sách Dữ liệu Người dùng Dịch vụ API của Google và Điều khoản của Youtube. Chúng tôi sử dụng API để cung cấp tính năng bình luận, phát trực tiếp và <strong>không chuyển giao/bán dữ liệu cho bên thứ ba</strong> ngoài mục đích đã yêu cầu. Bạn có thể thu hồi quyền truy cập qua Cài đặt Bảo mật của Google.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
             <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-xs">Quyền của Bạn về Dữ liệu Nền tảng</h4>
             <ul className="text-sm space-y-2 text-slate-700 font-medium">
               <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" /> <strong>Truy cập & Sửa đổi:</strong> Yêu cầu truy cập hoặc sửa các sai sót.</li>
               <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" /> <strong>Xóa:</strong> Yêu cầu xóa dữ liệu theo luật bảo vệ hiện hành (VD: GDPR).</li>
             </ul>
          </div>
        </div>

        {/* Section 6 & 7 */}
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">6</span> 
            Chuyển Dữ liệu Quốc tế và Quyền Bảo vệ
          </h3>
          <p className="mb-4">Kpost có thể chuyển dữ liệu ra ngoài quốc gia của bạn (bao gồm ngoài Khu vực Kinh tế Châu Âu - EEA), đi kèm các biện pháp bảo vệ thích hợp như điều khoản hợp đồng tiêu chuẩn.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <h4 className="font-bold text-slate-900 mb-3">Quyền của Người dùng (Theo GDPR/CCPA)</h4>
                <ul className="text-xs text-slate-600 space-y-2 mb-4">
                  <li>• <strong>Quyền Truy cập & Sửa đổi:</strong> Yêu cầu bản sao hoặc sửa dữ liệu.</li>
                  <li>• <strong>Quyền Xóa & Di chuyển:</strong> Yêu cầu xóa hoặc nhận bản sao định dạng máy đọc được.</li>
                  <li>• <strong>Quyền Phản đối:</strong> Giới hạn hoặc dừng xử lý dữ liệu.</li>
                </ul>
                <div className="bg-slate-50 text-slate-600 text-xs font-medium p-3 rounded-xl border border-slate-200 text-center">
                  Liên hệ <strong className="text-blue-600">support@kpost.vn</strong> để thực hiện các quyền này.
                </div>
             </div>
             <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <h4 className="font-bold text-slate-900 mb-3">Quyền của Kpost</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Kpost bảo lưu quyền sử dụng hình ảnh, thương hiệu (Logo) và thông tin của khách hàng/đối tác cho mục đích: Quảng bá thương hiệu, Nghiên cứu phân tích dịch vụ Kpost, và Trưng bày tài liệu/câu chuyện thành công.</p>
             </div>
          </div>
        </div>

        {/* Section 8, 9, 10, 11 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
           <div className="border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-tighter flex gap-2"><span className="text-blue-500">8.</span> Cookie và Công nghệ Theo dõi</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Kpost sử dụng cookie ẩn danh gửi đến trình duyệt nhằm cải thiện trải nghiệm người dùng. Bạn hoàn toàn có thể kiểm soát việc sử dụng cookie thông qua cài đặt trình duyệt cá nhân.</p>
           </div>
           <div className="border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-tighter flex gap-2"><span className="text-blue-500">9.</span> Liên kết Bên Thứ Ba</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Dịch vụ có thể chứa liên kết đến các trang web bên ngoài không do Kpost vận hành. Chúng tôi không chịu trách nhiệm về nội dung và chính sách bảo mật của các trang web này.</p>
           </div>
           <div className="border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-tighter flex gap-2"><span className="text-blue-500">10.</span> Quyền Riêng tư của Trẻ em</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Kpost không cung cấp dịch vụ và không cố ý thu thập thông tin của trẻ em dưới 13 tuổi. Nếu phát hiện trường hợp này, dữ liệu sẽ ngay lập tức được xóa khỏi máy chủ.</p>
           </div>
           <div className="border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-tighter flex gap-2"><span className="text-blue-500">11.</span> Thay đổi Chính sách</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Kpost có quyền cập nhật chính sách này để phù hợp với công nghệ và luật pháp. Mọi thay đổi sẽ được thông báo qua email hoặc trực tiếp trên phần mềm ít nhất 30 ngày trước khi áp dụng.</p>
           </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-slate-900 text-white p-8 md:p-12 rounded-[32px] text-center shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
           
           <div className="relative z-10">
             <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Cần Hỗ Trợ Khác?</h3>
             <p className="mb-8 font-medium text-slate-300 max-w-lg mx-auto text-sm leading-relaxed">
               Nếu bạn có bất kỳ thắc mắc nào về Chính sách Bảo mật này hoặc cách chúng tôi bảo vệ thông tin của bạn, đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng lắng nghe và giải quyết.
             </p>
             <a href="mailto:support@kpost.vn" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-sm transition-colors mb-8 shadow-lg shadow-blue-900/50">
               <MessageCircle size={18} />
               support@kpost.vn
             </a>
             <div className="border-t border-slate-800 pt-6">
                <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">
                  Hãy yên tâm phát triển kinh doanh, việc bảo vệ dữ liệu đã có Kpost đồng hành cùng bạn!
                </p>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}


function TermsOfServiceView() {
  useEffect(() => {
    // Tối ưu hóa Meta SEO
    document.title = "Điều Khoản Dịch Vụ & Thỏa Thuận Pháp Lý Minh Bạch | Kpost";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Chi tiết điều khoản dịch vụ và thỏa thuận pháp lý khi sử dụng phần mềm Kpost. Tìm hiểu rõ về quyền lợi, trách nhiệm, quy trình thanh toán và bảo mật tài khoản.");
    }
  }, []);

  return (
    <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-sm border border-slate-100 max-h-[85vh] overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-8 border-b border-slate-100 pb-6 flex items-center gap-4">
        <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl">
          <Scale size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
            Điều Khoản Dịch Vụ
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">Thỏa Thuận Pháp Lý Kpost</p>
        </div>
      </div>

      <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
        {/* Intro */}
        <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 text-center md:text-left">
          <h3 className="text-lg font-black text-slate-900 mb-3 uppercase tracking-tighter flex items-center justify-center md:justify-start gap-2">
            <ShieldAlert className="text-orange-500" size={20}/> Chào mừng đến với Kpost!
          </h3>
          <p className="mb-4">
            Để xây dựng một môi trường làm việc hiệu quả, minh bạch và bảo vệ tối đa quyền lợi của Khách hàng, 
            tài liệu này đóng vai trò là <strong>Thỏa thuận pháp lý ("Thỏa thuận")</strong> chính thức giữa <strong>Bạn ("Khách hàng")</strong> và <strong>Công ty ("Kpost" hoặc "Chúng tôi")</strong>. 
            Chúng tôi cam kết cung cấp các dịch vụ công nghệ chất lượng cao, đồng hành cùng sự phát triển kinh doanh của bạn.
          </p>
          <div className="bg-orange-100 text-orange-800 p-3 rounded-xl font-bold text-xs uppercase tracking-wider">
            Bằng việc đăng ký tài khoản, thực hiện thanh toán hoặc bắt đầu sử dụng Phần mềm, Khách hàng xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ các điều khoản dưới đây.
          </div>
        </div>

        {/* Placeholder image */}
        <div className="relative w-full h-48 md:h-64 bg-slate-900 rounded-[24px] overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
           <div className="text-center z-10 text-white px-4">
             <div className="flex justify-center gap-4 mb-4">
                <div className="bg-blue-500 p-3 rounded-full"><User size={24} className="text-white"/></div>
                <Scale size={48} className="text-slate-400 opacity-50" />
                <div className="bg-orange-500 p-3 rounded-full"><Shield size={24} className="text-white"/></div>
             </div>
             <p className="font-bold text-xs uppercase tracking-widest text-slate-300">Thỏa thuận pháp lý và điều khoản dịch vụ minh bạch tại Kpost</p>
           </div>
        </div>

        {/* 1. Định nghĩa */}
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter flex items-center gap-2">
            <span className="bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
            Định Nghĩa Cơ Bản
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <p className="font-bold text-slate-900 mb-1 text-xs uppercase tracking-widest">"Phần mềm"</p>
                <p className="text-xs text-slate-600">Là hệ thống ứng dụng Kpost, bao gồm toàn bộ mã nguồn, giao diện website, ứng dụng di động, tài liệu kỹ thuật và các bản cập nhật do Chúng tôi phát triển, sở hữu.</p>
             </div>
             <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <p className="font-bold text-slate-900 mb-1 text-xs uppercase tracking-widest">"Khách hàng"</p>
                <p className="text-xs text-slate-600">Là cá nhân hoặc tổ chức thực hiện trả phí để mua Quyền sử dụng Phần mềm.</p>
             </div>
             <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <p className="font-bold text-slate-900 mb-1 text-xs uppercase tracking-widest">"Quyền sử dụng" (License)</p>
                <p className="text-xs text-slate-600">Là quyền có thời hạn, không độc quyền, không thể chuyển nhượng mà Kpost cấp cho Khách hàng để truy cập và khai thác các tính năng của Phần mềm.</p>
             </div>
             <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <p className="font-bold text-slate-900 mb-1 text-xs uppercase tracking-widest">"Gói cước"</p>
                <p className="text-xs text-slate-600">Là tập hợp các tính năng, giới hạn dung lượng và thời hạn sử dụng (Time-based subscription) mà Khách hàng đã lựa chọn.</p>
             </div>
          </div>
        </div>

        {/* 2 & 3. Tài khoản và Thanh toán */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div>
              <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter flex items-center gap-2">
                <span className="bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> 
                Tài Khoản và Bảo Mật
              </h3>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16}/> 
                  Khách hàng có trách nhiệm cung cấp thông tin hoàn toàn chính xác trong quá trình đăng ký.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16}/> 
                  Tự bảo mật thông tin tài khoản (username, password, API Key). Mọi hoạt động phát sinh từ tài khoản sẽ do Khách hàng chịu trách nhiệm hoàn toàn.
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={16}/> 
                  Kpost được miễn trừ trách nhiệm đối với thiệt hại do Khách hàng vô tình hay cố ý để lộ thông tin.
                </li>
              </ul>
           </div>
           <div>
              <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter flex items-center gap-2">
                <span className="bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> 
                Thanh Toán & Nghiệm Thu
              </h3>
              <div className="space-y-3">
                 <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                   <div className="bg-blue-100 text-blue-600 font-black w-6 h-6 flex items-center justify-center rounded-full text-xs">1</div>
                   <p className="text-xs"><strong className="text-slate-900">Thanh toán:</strong> 100% giá trị Gói cước trước khi sử dụng.</p>
                 </div>
                 <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                   <div className="bg-blue-100 text-blue-600 font-black w-6 h-6 flex items-center justify-center rounded-full text-xs">2</div>
                   <p className="text-xs"><strong className="text-slate-900">Bàn giao:</strong> Ngay khi hệ thống gửi xác nhận kích hoạt.</p>
                 </div>
                 <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                   <div className="bg-blue-100 text-blue-600 font-black w-6 h-6 flex items-center justify-center rounded-full text-xs">3</div>
                   <p className="text-xs"><strong className="text-slate-900">Nghiệm thu:</strong> Lần đăng nhập đầu tiên được coi là Biên bản nghiệm thu điện tử.</p>
                 </div>
                 <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                   <div className="bg-blue-100 text-blue-600 font-black w-6 h-6 flex items-center justify-center rounded-full text-xs">4</div>
                   <p className="text-xs"><strong className="text-slate-900">Hóa đơn:</strong> Ghi nhận với nội dung "Phí quyền sử dụng phần mềm".</p>
                 </div>
              </div>
           </div>
        </div>

        {/* 4. Non-refundable */}
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl">
          <h3 className="text-lg font-black text-red-700 mb-2 uppercase tracking-tighter flex items-center gap-2">
            <span className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span> 
            Chính Sách Không Hoàn Hủy
          </h3>
          <p className="text-red-900 font-medium">
            Trừ khi có những quy định khác được thỏa thuận bằng văn bản, tất cả các khoản phí mua Quyền sử dụng Phần mềm tại Kpost là <strong>không hoàn lại (non-refundable)</strong> trong mọi trường hợp, bao gồm cả việc Khách hàng chủ động ngưng sử dụng dịch vụ trước khi hết thời hạn gói cước.
          </p>
        </div>

        {/* 5. AUP */}
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter flex items-center gap-2">
            <span className="bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">5</span> 
            Quy Định Sử Dụng Hợp Lệ (AUP)
          </h3>
          <p className="mb-3">Để duy trì môi trường phần mềm sạch và tuân thủ pháp luật, Khách hàng cam kết KHÔNG sử dụng Phần mềm Kpost để:</p>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <XCircle className="text-red-500 shrink-0 mt-0.5" size={18}/> 
                <span className="text-slate-700">Phát tán tin nhắn rác (Spam), thực hiện hành vi lừa đảo, truyền bá nội dung đồi trụy hoặc các hành vi vi phạm pháp luật hiện hành.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="text-red-500 shrink-0 mt-0.5" size={18}/> 
                <span className="text-slate-700">Vi phạm tiêu chuẩn cộng đồng hoặc chính sách của các Nền tảng bên thứ ba (Meta, TikTok, Shopee, Google...).</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="text-red-500 shrink-0 mt-0.5" size={18}/> 
                <span className="text-slate-700">Xâm nhập trái phép, cố ý phá hoại, hoặc sao chép/dịch ngược mã nguồn Phần mềm Kpost.</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs flex gap-3 items-center">
             <AlertCircle size={24} className="text-orange-500 shrink-0" />
             <p><strong>Xử lý vi phạm:</strong> Kpost bảo lưu quyền đơn phương khóa tài khoản vĩnh viễn, không cần báo trước và không hoàn tiền đối với bất kỳ trường hợp nào bị phát hiện vi phạm các quy định trên.</p>
          </div>
        </div>

        {/* 6, 7, 8 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="border-t border-slate-200 pt-4">
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-tighter flex gap-2"><span className="text-blue-500">6.</span> Cập Nhật Tính Năng</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Kpost là một sản phẩm không ngừng tiến hóa ("Evolving Software"). Chúng tôi có quyền chủ động cập nhật, chỉnh sửa, loại bỏ tính năng để tối ưu hóa hiệu suất. Thay đổi này không làm mất đi bản chất cốt lõi của Quyền sử dụng.</p>
           </div>
           <div className="border-t border-slate-200 pt-4">
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-tighter flex gap-2"><span className="text-blue-500">7.</span> Quyền Sở Hữu Trí Tuệ</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-2"><strong>Kpost:</strong> Giữ toàn quyền sở hữu trí tuệ đối với Phần mềm, mã nguồn và thương hiệu. Khách hàng chỉ được cấp quyền sử dụng.</p>
              <p className="text-xs text-slate-600 leading-relaxed"><strong>Khách hàng:</strong> Toàn bộ dữ liệu do Khách hàng tải lên hệ thống thuộc quyền sở hữu hợp pháp của Khách hàng.</p>
           </div>
           <div className="border-t border-slate-200 pt-4">
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-tighter flex gap-2"><span className="text-blue-500">8.</span> Lưu Trữ & Xóa Dữ Liệu</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Sau 30 ngày kể từ khi hết hạn gói cước mà không gia hạn, Kpost có quyền xóa vĩnh viễn dữ liệu để giải phóng máy chủ. Kpost không chịu trách nhiệm bồi thường cho mất mát dữ liệu do chậm trễ gia hạn.</p>
           </div>
        </div>

        {/* 9, 10, 11, 12 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs">9. Miễn Trừ Trách Nhiệm</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Phần mềm cung cấp trên cơ sở "Nguyên trạng" (As-is). Chúng tôi miễn trừ trách nhiệm với các lỗi, sự cố hoặc khóa tài khoản (checkpoint) xuất phát từ Nền tảng bên thứ ba hoặc do thay đổi chính sách của họ.</p>
           </div>
           <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs">10. Giới Hạn Trách Nhiệm</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Tổng trách nhiệm bồi thường của Kpost đối với Khách hàng không vượt quá tổng giá trị Gói cước mà Khách hàng đã thực thanh toán trong vòng 03 (ba) tháng gần nhất tính đến thời điểm xảy ra sự kiện.</p>
           </div>
           <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs">11. Sự Kiện Bất Khả Kháng</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Miễn trừ trách nhiệm bồi thường trong điều kiện: thiên tai, dịch bệnh, chiến tranh, đứt cáp quang quốc tế, hoặc các quyết định đình chỉ từ cơ quan Nhà nước có thẩm quyền.</p>
           </div>
           <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs">12. Luật & Tranh Chấp</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Điều chỉnh theo pháp luật Việt Nam. Tranh chấp ưu tiên hòa giải thiện chí, nếu không thành sẽ được phân xử tại Tòa án có thẩm quyền tại Hà Nội.</p>
           </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-white border-2 border-slate-900 text-slate-900 p-8 md:p-12 rounded-[32px] text-center shadow-xl">
           <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Bạn Đã Sẵn Sàng?</h3>
           <p className="mb-8 font-medium text-slate-600 max-w-lg mx-auto text-sm leading-relaxed">
             Nếu bạn đã đọc kỹ và đồng ý với các điều khoản trên, hãy bắt đầu tối ưu hóa quy trình kinh doanh của mình ngay hôm nay.
           </p>
           <a href="mailto:support@kpost.vn" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-sm transition-colors mb-6">
             <MessageCircle size={18} />
             Hỗ trợ Pháp lý & Dịch vụ
           </a>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
             support@kpost.vn
           </p>
           <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-sm font-black text-slate-900 uppercase tracking-tighter italic">
                Khởi đầu hành trình chuyển đổi số an toàn, minh bạch và hiệu quả cùng Kpost!
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}






function AffiliateTab() {
  const [copySuccess, setCopySuccess] = useState(false);
  const [timeFilter, setTimeFilter] = useState('month');
  const [bankInfo, setBankInfo] = useState({
    bankName: 'Vietcombank (VCB)',
    accountNumber: '012345678999',
    accountName: 'NGUYEN VAN A'
  });
  const [balance, setBalance] = useState(4500000);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([
    { id: 1, amount: 1500000, time: '14:30 - 12/08/2026', status: 'Thành công' },
    { id: 2, amount: 2000000, time: '09:15 - 25/07/2026', status: 'Thành công' }
  ]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText("https://kpost.vn/?ref=KPOST_PRO_999");
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };
  
  const handleSaveBankInfo = () => {
    alert("Đã lưu thông tin tài khoản ngân hàng thành công!");
  };
  
  const handleWithdraw = () => {
    if (balance < 500000) {
      alert("Số dư khả dụng không đủ để tạo lệnh rút tiền. Yêu cầu tối thiểu 500.000 VNĐ.");
      return;
    }
    
    if (confirm(`Bạn có chắc chắn muốn tạo lệnh rút ${balance.toLocaleString()} VNĐ về tài khoản ${bankInfo.bankName} - ${bankInfo.accountNumber}?`)) {
      const newWithdrawal = {
        id: Date.now(),
        amount: balance,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN'),
        status: 'Đang xử lý'
      };
      
      setWithdrawHistory([newWithdrawal, ...withdrawHistory]);
      setBalance(0);
      alert("Đã tạo lệnh rút tiền thành công! Vui lòng chờ xử lý.");
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 font-sans">
       <div className="mb-8 border-b border-slate-100 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <Share2 className="text-blue-600" size={28} /> KPOST AFFILIATE
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-2">Chia sẻ Kpost - Nhận hoa hồng trọn đời</p>
          </div>
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-[24px] flex items-center gap-2">
             <CheckCircle2 size={24} className="text-green-500" />
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider">Trạng thái Affiliate</span>
                <span className="text-sm font-bold">Đã kích hoạt (DIAMOND)</span>
             </div>
          </div>
       </div>

       {/* INFO CARDS */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50/50 rounded-[24px] p-6 border border-blue-100">
             <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Chính sách hoa hồng</h3>
             <ul className="space-y-3 text-sm font-medium text-slate-700">
               <li className="flex items-center gap-2"><Check className="text-blue-500" size={16}/> Hoa hồng <strong className="text-blue-700">10%</strong> trên giá trị đơn sau giảm giá.</li>
               <li className="flex items-center gap-2"><Check className="text-blue-500" size={16}/> Cookie được lưu <strong className="text-blue-700">12 tháng</strong>.</li>
             </ul>
          </div>
          <div className="bg-orange-50/50 rounded-[24px] p-6 border border-orange-100">
             <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-4">Quy định thanh toán</h3>
             <ul className="space-y-3 text-sm font-medium text-slate-700">
               <li className="flex items-center gap-2"><Check className="text-orange-500" size={16}/> Lệnh rút tối thiểu <strong className="text-orange-700">500.000 VNĐ</strong>.</li>
               <li className="flex items-center gap-2"><Check className="text-orange-500" size={16}/> Thanh toán vào <strong className="text-orange-700">Thứ 2</strong> và <strong className="text-orange-700">Thứ 6</strong>.</li>
             </ul>
          </div>
       </div>

       {/* LINK AFFILIATE */}
       <div className="mb-10">
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Link Giới Thiệu Của Bạn</label>
          <div className="flex gap-2">
             <input 
               readOnly 
               value="https://kpost.vn/?ref=KPOST_admin-workspace-01" 
               className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none"
             />
             <button onClick={handleCopy} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase hover:bg-blue-600 transition-colors flex items-center gap-2">
               {copySuccess ? <Check size={18} /> : <Copy size={18} />}
               {copySuccess ? 'Đã Copy' : 'Copy'}
             </button>
          </div>
       </div>

       {/* THỐNG KÊ */}
       <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Tổng quan thống kê</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <StatCard icon={<MousePointerClick/>} label="Lượt nhấp" value="1,245" color="blue" />
             <StatCard icon={<Users/>} label="Đăng ký mới" value="128" color="indigo" />
             <StatCard icon={<ShoppingCart/>} label="Đã mua gói" value="45" color="purple" />
             <StatCard icon={<DollarSign/>} label="Số dư hoa hồng" value={`${balance.toLocaleString()}đ`} color="green" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4 italic">* Số liệu được cập nhật theo thời gian thực từ hệ thống.</p>
       </div>

       {/* BÁO CÁO DOANH THU THEO THỜI GIAN */}
       <div className="mb-10 p-6 rounded-[32px] border border-slate-100 bg-slate-50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
               <TrendingUp size={18} className="text-blue-500"/> Doanh thu theo thời gian
             </h3>
             <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm flex-wrap">
               {['day', 'week', 'month', 'quarter', 'year'].map(t => (
                 <button 
                   key={t}
                   onClick={() => setTimeFilter(t)}
                   className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${timeFilter === t ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   {t === 'day' ? 'Ngày' : t === 'week' ? 'Tuần' : t === 'month' ? 'Tháng' : t === 'quarter' ? 'Quý' : 'Năm'}
                 </button>
               ))}
             </div>
          </div>
          
          <div className="h-48 flex items-end gap-2 justify-between mt-8">
             {[40, 70, 45, 90, 65, 120, 80].map((h, i) => (
               <div key={i} className="w-full bg-blue-100 rounded-t-lg relative group transition-all hover:bg-blue-200">
                  <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all" style={{height: `${h}%`}}></div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                    +{(h * 15000).toLocaleString()}đ
                  </div>
               </div>
             ))}
          </div>
       </div>

       {/* RÚT TIỀN VÀ TÀI KHOẢN NGÂN HÀNG */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cài đặt ngân hàng */}
          <div className="p-6 rounded-[32px] border border-slate-100 shadow-sm bg-slate-50">
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
               <Landmark size={18} className="text-slate-500"/> Tài khoản nhận tiền
             </h3>
             <div className="space-y-4">
               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngân hàng</label>
                 <input 
                   type="text" 
                   value={bankInfo.bankName} 
                   onChange={(e) => setBankInfo({...bankInfo, bankName: e.target.value})}
                   className="w-full bg-transparent border-b-2 border-slate-200 py-2 font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors" 
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số tài khoản</label>
                 <input 
                   type="text" 
                   value={bankInfo.accountNumber} 
                   onChange={(e) => setBankInfo({...bankInfo, accountNumber: e.target.value})}
                   className="w-full bg-transparent border-b-2 border-slate-200 py-2 font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors" 
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chủ tài khoản</label>
                 <input 
                   type="text" 
                   value={bankInfo.accountName} 
                   onChange={(e) => setBankInfo({...bankInfo, accountName: e.target.value})}
                   className="w-full bg-transparent border-b-2 border-slate-200 py-2 font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors" 
                 />
               </div>
               <button onClick={handleSaveBankInfo} className="w-full mt-4 border-2 border-slate-900 text-slate-900 font-black py-3 rounded-2xl text-xs uppercase hover:bg-slate-900 hover:text-white transition-colors">
                 Lưu Tài Khoản
               </button>
             </div>
          </div>

          {/* Rút tiền & Lịch sử */}
          <div className="p-6 rounded-[32px] bg-slate-900 text-white shadow-xl flex flex-col">
             <div className="flex-1">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                 <Wallet size={18}/> Số dư khả dụng
               </h3>
               <p className="text-4xl font-black italic tracking-tighter text-green-400 mb-6">{balance.toLocaleString()} <span className="text-xl">VNĐ</span></p>
               
               <button 
                 onClick={handleWithdraw}
                 disabled={balance < 500000}
                 className="w-full bg-green-500 text-slate-900 font-black py-4 rounded-2xl text-sm uppercase hover:bg-green-400 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Tạo Lệnh Rút Tiền
               </button>
               <p className="text-[10px] font-medium text-slate-400 text-center">* Lệnh rút tối thiểu 500.000đ. Thanh toán T2 & T6.</p>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-800 flex-1 overflow-y-auto max-h-[200px] custom-scrollbar pr-2">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2 sticky top-0 bg-slate-900 py-1">
                 <History size={14}/> Lịch sử rút gần đây
               </h4>
               <div className="space-y-3">
                  {withdrawHistory.length > 0 ? withdrawHistory.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold">Đã rút {item.amount.toLocaleString()}đ</p>
                        <p className="text-[10px] text-slate-500">{item.time}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        item.status === 'Thành công' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  )) : (
                    <p className="text-slate-500 text-sm italic text-center py-4">Chưa có lịch sử rút tiền</p>
                  )}
               </div>
             </div>
          </div>
       </div>
    </div>
  );
}


function AccountTab() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [authMode, setAuthMode] = useState("login"); 
    const [formData, setFormData] = useState({ email: "", password: "", name: "" });

    // THÊM ĐOẠN CODE NÀY ĐỂ BẮT LỖI ĐĂNG NHẬP GOOGLE TỪ URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');

        if (errorParam === 'account_locked') {
            toast.error('Tài khoản của bạn đã bị khóa vui lòng liên hệ : support@kpost.vn để được hỗ trợ', {
                duration: 8000,
                style: {
                    background: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #f87171',
                    fontWeight: 'bold',
                    padding: '16px'
                }
            });
            // Dọn dẹp URL sau khi hiện lỗi
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleManualAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: any = { ...formData };
            if (authMode === "register") {
                let savedRef = localStorage.getItem("kpost_affiliate_ref");
                if (savedRef) {
                    const cleanRef = savedRef.startsWith("KPOST_") ? savedRef.replace("KPOST_", "") : savedRef;
                    payload.referredBy = cleanRef; 
                    payload.affiliateBy = savedRef;
                }
                // Tự động tặng 07 ngày gói PRO miễn phí
                const expireDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                const newUser = {
                    name: formData.name || "Khách Hàng Mới",
                    email: formData.email,
                    plan: "PRO",
                    planExpire: expireDate,
                    isTrial: true,
                    trialDays: 7,
                    createdAt: new Date().toISOString()
                };
                localStorage.setItem("kpost_user", JSON.stringify(newUser));
            }

            const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
            const res = await axios.post(`${API_URL}${endpoint}`, payload);
            if (authMode === "login") {
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("workspaceId", res.data.wid);
                window.location.href = "/dashboard";
            } else {
                toast.success("🎉 Đăng ký thành công! Bạn đã được kích hoạt 07 NGÀY SỬ DỤNG GÓI PRO MIỄN PHÍ!", { duration: 6000, icon: '👑' });
                setAuthMode("login");
            }
        } catch (error: any) {
            // Ngay cả khi backend offline, vẫn hỗ trợ tài khoản cục bộ 07 ngày Pro
            if (authMode === "register") {
                toast.success("🎉 Đăng ký thành công! Bạn đã được kích hoạt 07 NGÀY SỬ DỤNG GÓI PRO MIỄN PHÍ!", { duration: 6000, icon: '👑' });
                setAuthMode("login");
            } else {
                alert(error.response?.data?.message || "Lỗi xử lý xác thực!");
            }
        } finally { setLoading(false); }
    };

    if (loading) return <div className="p-10 text-center animate-pulse font-black text-slate-300 uppercase">Đang kết nối hệ thống...</div>;

    if (user) return (
        <div className="space-y-10 animate-in fade-in text-black">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center text-white font-black text-3xl shadow-xl">{user.name?.[0]}</div>
                <div><h2 className="text-3xl font-black italic uppercase tracking-tighter">{user.name}</h2><p className="text-slate-400 font-bold">{user.email}</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl border"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gói hiện tại</p><p className="text-xl font-black text-blue-600 italic">{user.plan} MEMBER</p></div>
                <div className="p-6 bg-slate-50 rounded-3xl border"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Không gian</p><p className="text-sm font-mono font-bold text-slate-600 truncate">{user.currentWorkspaceId}</p></div>
            </div>
            <button onClick={() => {localStorage.clear(); window.location.reload();}} className="text-red-500 font-black text-[10px] uppercase tracking-[0.2em] hover:underline flex items-center gap-2"><LogOut size={14} /> Thoát tài khoản</button>
        </div>
    );

    return (
        <div className="max-w-md mx-auto text-black">
            <h2 className="text-3xl font-black italic uppercase mb-10 text-center tracking-tighter">{authMode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</h2>
            <form onSubmit={handleManualAuth} className="space-y-4">
                {authMode === 'register' && <input className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" placeholder="Họ và tên" onChange={e => setFormData({...formData, name: e.target.value})} required />}
                <input className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} required />
                <input className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" type="password" placeholder="Mật khẩu" onChange={e => setFormData({...formData, password: e.target.value})} required />
                <button type="submit" className="w-full py-5 bg-black text-white font-black rounded-[25px] shadow-2xl flex justify-center items-center gap-3 active:scale-95 transition-all">{authMode === 'login' ? <LogIn size={20}/> : <UserPlus size={20}/>} {authMode === 'login' ? 'VÀO HỆ THỐNG' : 'ĐĂNG KÝ NGAY'}</button>
            </form>
            <div className="mt-8 text-center"><button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 underline"> {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'} </button></div>
            <div className="my-10 flex items-center gap-4"><div className="h-[1px] bg-slate-100 flex-1"></div><span className="text-[10px] font-black text-slate-300">HOẶC</span><div className="h-[1px] bg-slate-100 flex-1"></div></div>
            <button onClick={() => window.location.href=`${API_URL}/auth/google`} className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-4 font-black shadow-sm text-black">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/list/google.svg" className="w-6" alt="G" /> Dùng Google
            </button>
        </div>
    )
}

function SecurityTab() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) return alert("Mật khẩu mới không khớp!");
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${API_URL}/auth/change-password`, passwords, { headers: { Authorization: `Bearer ${token}` } });
            alert("✅ Đã đổi mật khẩu thành công!");
            setPasswords({ old: "", new: "", confirm: "" });
        } catch (e: any) { alert(e.response?.data?.message || "Thất bại!"); } finally { setLoading(false); }
    };

    return (
        <div className="space-y-10 text-black">
            <h2 className="text-2xl font-black italic uppercase">Bảo mật đa tầng</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <h3 className="font-black text-sm text-blue-600 uppercase flex items-center gap-2"><KeyRound size={16} /> Đổi mật khẩu</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <input type="password" placeholder="Mật khẩu hiện tại" className="w-full p-4 bg-slate-50 rounded-2xl border outline-none font-bold" value={passwords.old} onChange={e => setPasswords({...passwords, old: e.target.value})} required />
                        <input type="password" placeholder="Mật khẩu mới" className="w-full p-4 bg-slate-50 rounded-2xl border outline-none font-bold" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} required />
                        <input type="password" placeholder="Xác nhận mật khẩu" className="w-full p-4 bg-slate-50 rounded-2xl border outline-none font-bold" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} required />
                        <button className="w-full py-4 bg-black text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">{loading ? <Loader2 className="animate-spin mx-auto" /> : "CẬP NHẬT MẬT KHẨU"}</button>
                    </form>
                </div>
                <div className="space-y-6">
                    <h3 className="font-black text-sm text-blue-600 uppercase flex items-center gap-2"><ShieldCheck size={16} /> Nhật ký & 2FA</h3>
                    <div className="p-5 bg-slate-50 rounded-3xl border flex items-center justify-between"><div className="flex items-center gap-3"><Smartphone size={20} className="text-slate-400" /><div><p className="text-sm font-black text-black">Xác thực OTP</p><p className="text-[10px] text-slate-400 font-bold">Bảo vệ qua điện thoại</p></div></div><span className="px-4 py-1.5 bg-slate-200 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">Coming soon</span></div>
                    <div className="p-5 bg-slate-50 rounded-3xl border flex items-center justify-between"><div className="flex items-center gap-3"><Fingerprint size={20} className="text-slate-400" /><div><p className="text-sm font-black text-black">Thiết bị tin cậy</p><p className="text-[10px] text-slate-400 font-bold">Quản lý phiên đăng nhập</p></div></div><button className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase">Kiểm tra</button></div>
                </div>
            </div>
        </div>
    )
}

function BillingTab() {
    const plans = [
        { name: "PRO", price: "599.000", color: "blue", features: ["AI Smart Inbox", "50 Fanpage", "Bóc tách đơn AI"] },
        { name: "GOLD", price: "999.000", color: "amber", features: ["Tất cả gói PRO", "100 Fanpage", "Quản lý Hội nhóm"] },
        { name: "DIAMOND", price: "3.999.000", color: "purple", features: ["Tất cả gói GOLD", "500 Fanpage", "Support 24/7"] },
    ];
    return (
        <div className="space-y-10 text-black">
            <h2 className="text-2xl font-black italic uppercase">Nâng cấp thành viên</h2>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {plans.map((p) => (
                    <div key={p.name} className={`p-8 rounded-[45px] border-4 bg-white hover:shadow-2xl transition-all ${p.color === 'blue' ? 'border-blue-600' : p.color === 'amber' ? 'border-amber-500' : 'border-purple-600'}`}>
                        <p className={`font-black uppercase text-[10px] mb-4 ${p.color === 'blue' ? 'text-blue-600' : p.color === 'amber' ? 'text-amber-500' : 'text-purple-600'}`}>Hạng {p.name}</p>
                        <p className="text-3xl font-black italic">{p.price}đ</p>
                        <ul className="my-8 space-y-3">{p.features.map(f => <li key={f} className="text-[11px] font-bold text-slate-500 flex items-start gap-2 leading-tight"><CheckCircle2 size={14} className="text-green-500 shrink-0"/> {f}</li>)}</ul>
                        <button className={`w-full py-4 rounded-3xl font-black text-white uppercase italic shadow-lg active:scale-95 transition-all ${p.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : p.color === 'amber' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-600 hover:bg-purple-700'}`}>Nâng cấp ✨</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function VoucherTab() { return <div className="p-10 text-center text-black"><Gift size={48} className="mx-auto text-slate-200 mb-4" /><p className="font-black text-slate-400 uppercase italic">Bạn chưa có mã giảm giá nào.</p></div> }
function GuideTab() { return <div className="p-10 text-center text-black"><BookOpen size={48} className="mx-auto text-slate-200 mb-4" /><p className="font-black text-slate-400 uppercase italic">Tài liệu đang được cập nhật...</p></div> }




// ----------------------------------------------------------------------
// INBOX VIEW (Tin nhắn & Bình luận)
// ----------------------------------------------------------------------
function InboxView() {
  const [conversations, setConversations] = useState(mockConversations);
  const [activeId, setActiveId] = useState<string | null>(mockConversations[0]?.id || null);
  const [filter, setFilter] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [replyText, setReplyText] = useState('');

  const activeConv = conversations.find(c => c.id === activeId);
  const filteredConvs = conversations.filter(c => {
    if (filter === 'unread') return c.unread;
    if (filter === 'message') return c.type === 'message';
    if (filter === 'comment') return c.type === 'comment';
    return true;
  });

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("Đã đồng bộ 4 tin nhắn và bình luận mới từ Facebook!", {
        style: { borderRadius: '16px', background: '#333', color: '#fff' },
        iconTheme: { primary: '#4ade80', secondary: '#fff' }
      });
    }, 1500);
  };

  const handleSend = () => {
    if (!replyText.trim() || !activeConv) return;
    const newMessage = {
      id: 'msg_' + Date.now(),
      senderId: 'agent',
      text: replyText,
      timestamp: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})
    };
    
    const updatedConvs = conversations.map(c => {
      if (c.id === activeConv.id) {
        return {
          ...c,
          messages: [...c.messages, newMessage],
          lastMessage: replyText,
          timestamp: 'Vừa xong',
          unread: false
        };
      }
      return c;
    });
    setConversations(updatedConvs);
    setReplyText('');
    
    // Simulate auto reply or status after sending
    toast.success("Đã gửi thành công!", { position: 'bottom-center' });
  };

  return (
    <div className="flex h-full w-full bg-white font-sans overflow-hidden">
      {/* Sidebar - Danh sách hội thoại */}
      <div className="w-1/3 min-w-[320px] max-w-[400px] border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-5 border-b border-slate-100 bg-white shadow-sm z-10">
           <div className="flex justify-between items-center mb-5">
             <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-800 flex items-center gap-2">
               <MessageCircle className="text-blue-600" size={24} />
               HỘP THƯ
             </h2>
             <button onClick={handleSync} disabled={isSyncing} className="p-2.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50" title="Đồng bộ ngay">
               <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
             </button>
           </div>
           
           <div className="flex gap-2 mb-2 overflow-x-auto custom-scrollbar pb-1">
             <button onClick={() => setFilter('all')} className={`shrink-0 px-4 py-2 rounded-[16px] text-xs font-black uppercase tracking-wider transition ${filter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Tất cả</button>
             <button onClick={() => setFilter('unread')} className={`shrink-0 px-4 py-2 rounded-[16px] text-xs font-black uppercase tracking-wider transition ${filter === 'unread' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Chưa đọc</button>
             <button onClick={() => setFilter('message')} className={`shrink-0 px-4 py-2 rounded-[16px] text-xs font-black uppercase tracking-wider transition ${filter === 'message' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Tin nhắn</button>
             <button onClick={() => setFilter('comment')} className={`shrink-0 px-4 py-2 rounded-[16px] text-xs font-black uppercase tracking-wider transition ${filter === 'comment' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Bình luận</button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
          {filteredConvs.map(conv => (
            <div 
              key={conv.id} 
              onClick={() => { 
                 setActiveId(conv.id); 
                 if (conv.unread) {
                   setConversations(conversations.map(c => c.id === conv.id ? {...c, unread: false} : c));
                 }
              }}
              className={`p-5 border-b border-slate-100/80 cursor-pointer transition flex gap-4 ${activeId === conv.id ? 'bg-white shadow-[inset_4px_0_0_0_#3b82f6]' : 'hover:bg-white/60'}`}
            >
              <div className="relative shrink-0 mt-1">
                <img src={conv.customer.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover shadow-sm" />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${conv.type === 'message' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                  {conv.type === 'message' ? <MessageCircle size={10} className="text-white"/> : <MessageSquare size={10} className="text-white"/>}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1.5">
                  <h4 className={`text-sm truncate pr-2 ${conv.unread ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{conv.customer.name}</h4>
                  <span className={`text-[10px] font-bold whitespace-nowrap mt-0.5 ${conv.unread ? 'text-blue-600' : 'text-slate-400'}`}>{conv.timestamp}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-bold uppercase tracking-widest truncate max-w-[120px]">{conv.pageName}</span>
                </div>
                <p className={`text-xs truncate ${conv.unread ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unread && (
                 <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0 mt-3 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              )}
            </div>
          ))}
          {filteredConvs.length === 0 && (
             <div className="p-10 flex flex-col items-center justify-center text-slate-400">
                <Inbox size={48} className="mb-4 opacity-20" />
                <span className="text-xs font-black uppercase tracking-widest">Trống</span>
             </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-slate-50">
           {/* Header */}
           <div className="h-[88px] border-b border-slate-200 bg-white flex items-center px-8 justify-between shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-4">
                 <img src={activeConv.customer.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover shadow-sm" />
                 <div>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
                      {activeConv.customer.name}
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${activeConv.type === 'message' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {activeConv.type === 'message' ? 'INBOX' : 'COMMENT'}
                      </span>
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                       Nguồn: <strong className="text-slate-700">{activeConv.pageName}</strong>
                    </p>
                 </div>
              </div>
              <div className="flex gap-2">
                 {activeConv.customer.tags.map(tag => (
                   <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200">
                     {tag}
                   </span>
                 ))}
              </div>
           </div>

           {/* Messages */}
           <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50">
              {activeConv.messages.map(msg => {
                 const isAgent = msg.senderId === 'agent';
                 if (msg.isPostContext) {
                    return (
                       <div key={msg.id} className="flex justify-center mb-8 mt-2">
                         <div className="bg-white text-slate-600 px-6 py-3 rounded-[24px] text-xs font-medium border border-slate-200 max-w-lg text-center shadow-sm relative">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-100 px-3 py-1 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                               BÀI VIẾT GỐC
                            </div>
                            {msg.text}
                         </div>
                       </div>
                    );
                 }
                 return (
                   <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                     {!isAgent && <img src={activeConv.customer.avatar} className="w-8 h-8 rounded-full mr-3 self-end shadow-sm" alt="cus" />}
                     <div className={`max-w-[70%] rounded-[24px] px-6 py-4 shadow-sm ${isAgent ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm'}`}>
                       <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                       <p className={`text-[9px] mt-2 font-black uppercase tracking-widest ${isAgent ? 'text-blue-200' : 'text-slate-400'}`}>
                         {msg.timestamp}
                       </p>
                     </div>
                   </div>
                 );
              })}
           </div>

           {/* Input */}
           <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
             <div className="flex gap-4 items-end max-w-5xl mx-auto">
               <div className="flex-1 bg-slate-50 border border-slate-200 rounded-[24px] overflow-hidden focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all shadow-inner">
                 <textarea 
                   rows={2}
                   value={replyText}
                   onChange={e => setReplyText(e.target.value)}
                   onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                   placeholder={activeConv.type === 'message' ? "Nhập tin nhắn trả lời..." : "Nhập bình luận trả lời..."}
                   className="w-full bg-transparent p-4 text-sm font-medium text-slate-700 focus:outline-none resize-none custom-scrollbar min-h-[60px]"
                 />
                 <div className="bg-slate-100/50 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center">
                   <div className="flex gap-1">
                     <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"><ImageIcon size={18}/></button>
                     <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"><Paperclip size={18}/></button>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nhấn Enter để gửi</span>
                 </div>
               </div>
               <button 
                 onClick={handleSend}
                 disabled={!replyText.trim()}
                 className="h-[104px] px-8 bg-blue-600 text-white rounded-[24px] font-black uppercase text-sm tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
               >
                 <Send size={24} />
                 GỬI
               </button>
             </div>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
           <MessageCircle size={64} className="mb-6 opacity-20 text-blue-500" />
           <p className="text-sm font-black uppercase tracking-widest text-slate-500">Chọn một cuộc trò chuyện để bắt đầu</p>
        </div>
      )}
    </div>
  );
}
