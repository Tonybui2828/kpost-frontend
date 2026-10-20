'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminUsersPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kpost.vn';
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PRO TRIAL, FREE, PRO, GOLD, DIAMOND, DELETED
  
  // State tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // Quản lý các user được chọn checkbox
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // State Modal Nâng cấp / Điều chỉnh hạn dùng
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [planForm, setPlanForm] = useState<{
    plan: string;
    extraDays: number;
    customExpireDate: string;
  }>({
    plan: 'PRO',
    extraDays: 30,
    customExpireDate: ''
  });

  // State Modal Tặng Voucher
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');

  // 1. Tải danh sách người dùng từ API
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users-list`);
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        toast.error('Không thể tải danh sách khách hàng');
      }
      setSelectedUserIds([]);
    } catch (err) {
      toast.error('Lỗi kết nối khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // =========================================================================
  // 🌟 HÀM PHÂN LOẠI CHÍNH XÁC GÓI CƯỚC (ĐỒNG NHẤT 100% VỚI SIDEBAR & SETTINGS)
  // Khắc phục triệt để lỗi: Khách mua lên PRO vẫn bị hiển thị là "PRO TRIAL"
  // =========================================================================
  const resolveUserPlan = (user: any) => {
    if (!user) return { displayPlan: 'FREE', isTrial: false, isPaid: false, remainingDays: 0 };

    const rawPlan = (user.plan || '').toUpperCase().trim();
    const expiry = user.planExpire || user.planExpiry || user.expireDate;
    
    let remainingDays = 0;
    let hasValidExpiry = false;
    if (expiry) {
      const expMs = new Date(expiry).getTime();
      if (!isNaN(expMs)) {
        hasValidExpiry = true;
        remainingDays = Math.ceil((expMs - Date.now()) / (1000 * 60 * 60 * 24));
      }
    }

    // 1. Nếu tài khoản đã thanh toán rõ ràng (isPaid: true hoặc isTrial: false)
    if (user.isPaid === true || user.isTrial === false) {
      const paidPlan = (rawPlan === 'GOLD' || rawPlan === 'DIAMOND') ? rawPlan : 'PRO';
      return { displayPlan: paidPlan, isTrial: false, isPaid: true, remainingDays };
    }

    // 2. Nếu hạn dùng còn > 7 ngày (Dùng thử chỉ có tối đa 7 ngày, nên > 7 ngày 100% là gói trả phí đã mua)
    if (hasValidExpiry && remainingDays > 7) {
      const paidPlan = (rawPlan === 'GOLD' || rawPlan === 'DIAMOND') ? rawPlan : 'PRO';
      return { displayPlan: paidPlan, isTrial: false, isPaid: true, remainingDays };
    }

    // 3. Nếu khoảng cách giữa ngày tạo tài khoản và ngày hết hạn > 8 ngày -> Khách đã gia hạn/mua gói
    if (hasValidExpiry && user.createdAt) {
      const createdMs = new Date(user.createdAt).getTime();
      const expMs = new Date(expiry).getTime();
      if (!isNaN(createdMs) && !isNaN(expMs) && (expMs - createdMs > 8 * 24 * 60 * 60 * 1000)) {
        const paidPlan = (rawPlan === 'GOLD' || rawPlan === 'DIAMOND') ? rawPlan : 'PRO';
        return { displayPlan: paidPlan, isTrial: false, isPaid: true, remainingDays };
      }
    }

    // 4. Nếu tên gói trong database là PRO TRIAL hoặc đang trong 7 ngày dùng thử thực tế
    if (rawPlan === 'PRO TRIAL' || rawPlan === 'PRO_TRIAL' || rawPlan === 'TRIAL') {
      return { displayPlan: 'PRO TRIAL', isTrial: true, isPaid: false, remainingDays };
    }

    // 5. Khách mới trong vòng 7 ngày đầu chưa mua gói trả phí -> Hưởng 07 ngày PRO TRIAL
    if (user.createdAt) {
      const createdMs = new Date(user.createdAt).getTime();
      if (!isNaN(createdMs)) {
        const diffDays = (Date.now() - createdMs) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7 && (!user.plan || rawPlan === 'FREE' || rawPlan === 'PRO')) {
          return { displayPlan: 'PRO TRIAL', isTrial: true, isPaid: false, remainingDays };
        }
      }
    }

    // 6. Nếu gói trong DB là PRO và không có cờ dùng thử
    if (rawPlan === 'PRO') {
      if (user.isTrial === true) {
        return { displayPlan: 'PRO TRIAL', isTrial: true, isPaid: false, remainingDays };
      }
      return { displayPlan: 'PRO', isTrial: false, isPaid: true, remainingDays };
    }

    if (rawPlan === 'GOLD' || rawPlan === 'DIAMOND') {
      return { displayPlan: rawPlan, isTrial: false, isPaid: true, remainingDays };
    }

    return { displayPlan: rawPlan || 'FREE', isTrial: false, isPaid: false, remainingDays };
  };

  // Helper định dạng ngày giờ Việt Nam
  const formatDateVN = (dateStr: any) => {
    if (!dateStr) return { date: '--', time: '' };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: '--', time: '' };
      const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return { date, time };
    } catch {
      return { date: '--', time: '' };
    }
  };

  // Helper lấy ngày đăng ký gói
  const getPlanStartDate = (user: any) => {
    const raw = user.planStartedAt || user.planStartDate || (user.isPaid ? user.updatedAt : null) || user.createdAt;
    return formatDateVN(raw);
  };

  // Danh sách user sau khi gắn thông tin chuẩn hóa và lọc
  const processedUsers = users.map(user => {
    const planInfo = resolveUserPlan(user);
    return {
      ...user,
      ...planInfo
    };
  });

  const filteredUsers = processedUsers.filter(user => {
    // Tìm kiếm theo tên hoặc email hoặc ID
    const matchSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.id?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;

    // Lọc theo Tab
    if (activeTab === 'DELETED') return user.status === 'deleted';
    if (activeTab === 'ALL') return user.status === 'active';
    if (activeTab === 'PRO TRIAL') return user.status === 'active' && user.displayPlan === 'PRO TRIAL';
    return user.status === 'active' && user.displayPlan === activeTab;
  });

  // Chọn tất cả
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  // Chọn 1 user
  const handleSelectOne = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  // Mở modal nâng cấp gói
  const openUpgradeModal = (user: any) => {
    setSelectedUser(user);
    
    let formattedDate = '';
    if (user.planExpire) {
      const d = new Date(user.planExpire);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split('T')[0];
      }
    }

    setPlanForm({
      plan: user.displayPlan === 'PRO TRIAL' ? 'PRO' : user.displayPlan || 'PRO',
      extraDays: 30,
      customExpireDate: formattedDate
    });
    setShowPlanModal(true);
  };

  // Xử lý lưu nâng cấp gói
  const handleUpgradePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${selectedUser.id}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...planForm,
          isTrial: planForm.plan === 'PRO TRIAL',
          isPaid: planForm.plan !== 'FREE' && planForm.plan !== 'PRO TRIAL'
        })
      });
      if (res.ok) {
        toast.success('Cập nhật gói và hạn dùng thành công!');
        setShowPlanModal(false);
        fetchUsers();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || 'Lỗi cập nhật');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    }
  };

  // Xử lý tặng Voucher
  const handleAddVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !voucherCode.trim()) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${selectedUser.id}/voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherCode: voucherCode.trim() })
      });
      if (res.ok) {
        toast.success('Đã tặng Voucher thành công!');
        setShowVoucherModal(false);
        setVoucherCode('');
        fetchUsers();
      } else {
        toast.error('Lỗi khi tặng voucher');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    }
  };

  // Khóa / Khôi phục tài khoản
  const toggleUserStatus = async (user: any) => {
    const isDeleting = user.status === 'active';
    const method = isDeleting ? 'DELETE' : 'PUT';

    if (!confirm(`Bạn có chắc muốn ${isDeleting ? 'Khóa' : 'Khôi phục'} tài khoản này?`)) return;

    try {
      const res = await fetch(`${API_URL}/admin/users/${user.id}${isDeleting ? '' : '/restore'}`, {
        method
      });
      if (res.ok) {
        toast.success('Cập nhật trạng thái thành công!');
        fetchUsers();
      } else {
        toast.error('Lỗi cập nhật trạng thái');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    }
  };

  // Xóa vĩnh viễn (Hard delete)
  const hardDeleteUser = async (userId: string) => {
    if (!confirm('CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn tài khoản khỏi hệ thống và không thể khôi phục. Bạn có chắc chắn?')) return;
    
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/hard-delete`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Đã xóa vĩnh viễn tài khoản');
        fetchUsers();
      } else {
        toast.error('Lỗi xóa tài khoản');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    }
  };

  // Thao tác hàng loạt
  const handleBulkAction = async (actionType: 'lock' | 'restore' | 'hard-delete') => {
    if (selectedUserIds.length === 0) return;

    let confirmMsg = '';
    let urlEndpoint = '';
    let httpMethod = '';

    if (actionType === 'lock') {
      confirmMsg = `Bạn có chắc muốn KHÓA ${selectedUserIds.length} tài khoản này?`;
      urlEndpoint = '/admin/users/bulk-lock';
      httpMethod = 'POST';
    } else if (actionType === 'restore') {
      confirmMsg = `Bạn có chắc muốn KHÔI PHỤC ${selectedUserIds.length} tài khoản này?`;
      urlEndpoint = '/admin/users/bulk-restore';
      httpMethod = 'POST';
    } else if (actionType === 'hard-delete') {
      confirmMsg = `CẢNH BÁO: Xóa vĩnh viễn ${selectedUserIds.length} tài khoản khỏi database? Không thể khôi phục!`;
      urlEndpoint = '/admin/users/bulk-hard-delete';
      httpMethod = 'POST';
    }

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_URL}${urlEndpoint}`, {
        method: httpMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds })
      });

      if (res.ok) {
        toast.success('Thao tác hàng loạt thành công!');
        fetchUsers();
        setSelectedUserIds([]);
      } else {
        toast.error('Có lỗi xảy ra khi thực hiện');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER & TÌM KIẾM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý Khách hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng cộng: <strong className="text-gray-800">{users.length}</strong> tài khoản | Hiển thị: <strong className="text-blue-600">{filteredUsers.length}</strong>
          </p>
        </div>
        
        {/* Ô Tìm kiếm */}
        <div className="w-full md:w-80 relative">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input 
            type="text" 
            placeholder="Tìm theo email, tên khách hàng..." 
            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABS PHÂN LOẠI */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'PRO TRIAL', label: '⚡ Gói PRO TRIAL' },
          { key: 'FREE', label: 'Gói FREE' },
          { key: 'PRO', label: 'Gói PRO' },
          { key: 'GOLD', label: 'Gói GOLD' },
          { key: 'DIAMOND', label: 'Gói DIAMOND' },
          { key: 'DELETED', label: 'Đã khóa' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedUserIds([]); }}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === tab.key 
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-bold' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* THANH THAO TÁC HÀNG LOẠT */}
      {selectedUserIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <span className="text-sm font-semibold text-blue-800">
            Đã chọn <span className="text-blue-600 font-bold">{selectedUserIds.length}</span> khách hàng
          </span>
          <div className="flex gap-2">
            <button onClick={() => handleBulkAction('lock')} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition shadow-2xs">
              Khóa tài khoản
            </button>
            <button onClick={() => handleBulkAction('restore')} className="px-3 py-1.5 bg-white border border-gray-200 text-green-600 text-xs font-semibold rounded-lg hover:bg-green-50 transition shadow-2xs">
              Khôi phục
            </button>
            <button onClick={() => handleBulkAction('hard-delete')} className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition shadow-2xs">
              Xóa vĩnh viễn
            </button>
          </div>
        </div>
      )}

      {/* BẢNG DANH SÁCH KHÁCH HÀNG */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left min-w-[950px]">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider border-b border-gray-200">
            <tr>
              <th className="p-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  onChange={handleSelectAll}
                  checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                />
              </th>
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Gói hiện tại</th>
              <th className="p-4">Ngày đăng ký TK</th>
              <th className="p-4">Ngày đăng ký gói</th>
              <th className="p-4">Ngày hết hạn</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="p-12 text-center text-gray-400">Đang tải danh sách khách hàng...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-gray-400">Không tìm thấy khách hàng nào.</td></tr>
            ) : (
              filteredUsers.map(user => {
                const regDate = formatDateVN(user.createdAt);
                const planDate = getPlanStartDate(user);
                
                return (
                  <tr key={user.id} className={`hover:bg-gray-50/80 transition-colors ${selectedUserIds.includes(user.id) ? 'bg-blue-50/40' : ''}`}>
                    {/* Checkbox */}
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => handleSelectOne(user.id)}
                      />
                    </td>

                    {/* Khách hàng (Tên, Email, ID, Vouchers) */}
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{user.name || 'Chưa đặt tên'}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{user.email}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 font-mono">ID: {user.id}</div>
                      {user.vouchers?.length > 0 && (
                        <div className="text-[10px] mt-1 bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded-md inline-block font-semibold border border-yellow-200">
                          Mã Voucher: {Array.isArray(user.vouchers) ? user.vouchers.join(', ') : 'Đã có mã'}
                        </div>
                      )}
                    </td>

                    {/* Gói hiện tại: PRO TRIAL cam, PRO xanh đậm, GOLD vàng, DIAMOND tím */}
                    <td className="p-4 whitespace-nowrap">
                      {user.displayPlan === 'PRO TRIAL' ? (
                        <div className="inline-flex flex-col items-center px-3 py-1 bg-orange-100 text-orange-800 border border-orange-200 rounded-lg shadow-2xs">
                          <span className="text-xs font-black tracking-wider">PRO</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-orange-600">TRIAL</span>
                        </div>
                      ) : user.displayPlan === 'PRO' ? (
                        <span className="px-3 py-1 rounded-lg text-xs font-black tracking-wide bg-blue-100 text-blue-700 border border-blue-200 inline-block shadow-2xs">
                          PRO
                        </span>
                      ) : user.displayPlan === 'GOLD' ? (
                        <span className="px-3 py-1 rounded-lg text-xs font-black tracking-wide bg-amber-100 text-amber-700 border border-amber-200 inline-block shadow-2xs">
                          GOLD
                        </span>
                      ) : user.displayPlan === 'DIAMOND' ? (
                        <span className="px-3 py-1 rounded-lg text-xs font-black tracking-wide bg-purple-100 text-purple-700 border border-purple-200 inline-block shadow-2xs">
                          DIAMOND
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 inline-block">
                          FREE
                        </span>
                      )}
                    </td>

                    {/* Ngày đăng ký tài khoản */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{regDate.date}</div>
                      {regDate.time && (
                        <div className="text-[11px] text-gray-400 mt-0.5">{regDate.time}</div>
                      )}
                    </td>

                    {/* Ngày đăng ký gói */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{planDate.date}</div>
                      <div className="text-[11px] mt-0.5">
                        {user.displayPlan === 'PRO TRIAL' ? (
                          <span className="text-orange-600 font-medium">Bắt đầu dùng thử</span>
                        ) : user.displayPlan === 'FREE' ? (
                          <span className="text-gray-400">Gói mặc định</span>
                        ) : (
                          <span className="text-blue-600 font-bold">Gói chính thức</span>
                        )}
                      </div>
                    </td>

                    {/* Ngày hết hạn */}
                    <td className="p-4 whitespace-nowrap">
                      {user.planExpire ? (
                        <div>
                          <div className="font-bold text-gray-900">
                            {new Date(user.planExpire).toLocaleDateString('vi-VN')}
                          </div>
                          {user.displayPlan === 'PRO TRIAL' ? (
                            <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200 inline-block mt-0.5">
                              ⚡ Dùng thử
                            </span>
                          ) : (
                            (() => {
                              const diff = Math.ceil((new Date(user.planExpire).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                              return diff > 0 ? (
                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                                  Còn {diff} ngày
                                </span>
                              ) : (
                                <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200 inline-block mt-0.5">
                                  Đã hết hạn
                                </span>
                              );
                            })()
                          )}
                        </div>
                      ) : user.displayPlan === 'PRO TRIAL' ? (
                        <span className="text-[11px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          07 ngày PRO TRIAL
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Vô thời hạn</span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="p-4 text-right whitespace-nowrap">
                      {user.status === 'active' ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openUpgradeModal(user)} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-semibold transition">
                            Nâng cấp
                          </button>
                          <button onClick={() => { setSelectedUser(user); setShowVoucherModal(true); }} className="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg font-semibold transition">
                            Tặng Voucher
                          </button>
                          <button onClick={() => toggleUserStatus(user)} className="text-xs px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg font-semibold transition">
                            Khóa
                          </button>
                          <button onClick={() => hardDeleteUser(user.id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold transition">
                            Xóa hẳn
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => toggleUserStatus(user)} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-semibold transition">
                            Khôi phục
                          </button>
                          <button onClick={() => hardDeleteUser(user.id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold transition">
                            Xóa hẳn
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL NÂNG CẤP & ĐIỀU CHỈNH HẠN DÙNG --- */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpgradePlan} className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-xl text-gray-900">Chỉnh Gói & Hạn Dùng</h3>
                <p className="text-xs text-gray-500 mt-0.5">Khách hàng: <span className="font-semibold text-gray-800">{selectedUser?.name || selectedUser?.email}</span></p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPlanModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Thông tin hạn dùng hiện tại */}
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="font-medium text-blue-800">Hạn dùng hiện tại:</span>
              <span className="font-bold text-blue-900">
                {selectedUser?.planExpire ? new Date(selectedUser.planExpire).toLocaleDateString('vi-VN') : 'Không giới hạn (FREE)'}
              </span>
            </div>

            {/* Chọn gói */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Gói cước</label>
              <div className="grid grid-cols-5 gap-2">
                {['PRO', 'GOLD', 'DIAMOND', 'PRO TRIAL', 'FREE'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlanForm({ 
                      ...planForm, 
                      plan: p,
                      extraDays: p === 'PRO TRIAL' ? 7 : (p === 'FREE' ? 0 : 30)
                    })}
                    className={`py-2 text-[11px] font-bold rounded-xl border transition-all ${
                      planForm.plan === p 
                        ? (p === 'PRO TRIAL' ? 'bg-orange-500 text-white border-orange-500 shadow-xs' : 'bg-blue-600 text-white border-blue-600 shadow-xs')
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Tăng / giảm ngày nhanh */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                Cộng thêm / Trừ bớt số ngày
              </label>
              
              <div className="grid grid-cols-4 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setPlanForm({ ...planForm, extraDays: -5 })}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                    planForm.extraDays === -5 
                      ? 'bg-red-600 text-white border-red-600 shadow-xs' 
                      : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                  }`}
                >
                  -5 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => setPlanForm({ ...planForm, extraDays: -1 })}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                    planForm.extraDays === -1 
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs' 
                      : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  -1 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => setPlanForm({ ...planForm, extraDays: 7 })}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                    planForm.extraDays === 7 
                      ? 'bg-green-600 text-white border-green-600 shadow-xs' 
                      : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                  }`}
                >
                  +7 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => setPlanForm({ ...planForm, extraDays: 30 })}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                    planForm.extraDays === 30 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                      : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  +30 Ngày
                </button>
              </div>

              {/* Nhập số ngày tự do */}
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="Gõ số ngày (VD: 30 hoặc -5)"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800"
                  value={planForm.extraDays} 
                  onChange={e => setPlanForm({ ...planForm, extraDays: Number(e.target.value) })}
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">
                  {planForm.extraDays < 0 ? 'Giảm' : 'Tăng'} {Math.abs(planForm.extraDays)} ngày
                </span>
              </div>
            </div>

            {/* Chọn ngày hết hạn cụ thể */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                Hoặc chọn trực tiếp ngày hết hạn trên lịch
              </label>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
                value={planForm.customExpireDate} 
                onChange={e => setPlanForm({ ...planForm, customExpireDate: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowPlanModal(false)} 
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-200 active:scale-95"
              >
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL TẶNG VOUCHER --- */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddVoucher} className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-xl mb-1 text-gray-900">Tặng Voucher</h3>
            <p className="text-sm text-gray-500 mb-5">Cho: <span className="font-semibold text-gray-800">{selectedUser?.email}</span></p>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1.5 text-gray-700">Mã Voucher</label>
              <input 
                type="text" 
                placeholder="VD: KPOST50"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase placeholder:normal-case font-bold"
                value={voucherCode} 
                onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowVoucherModal(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                Hủy
              </button>
              <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-200">
                Tặng mã
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}