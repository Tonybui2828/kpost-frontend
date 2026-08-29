"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { 
  Clock, 
  Calendar, 
  Loader2, 
  Trash2, 
  RefreshCw, 
  Edit,
} from "lucide-react";

export default function SchedulePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("workspaceId");
    if (savedId) setWorkspaceId(savedId);
    else setWorkspaceId("workspace-01");
  }, []);

  const fetchPosts = useCallback(async () => {
    if (!workspaceId) return; 
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/social/scheduled-posts?workspaceId=${workspaceId}`);
      setPosts(res.data || []);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu lịch trình:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, API_URL]);

  useEffect(() => {
    if (workspaceId) fetchPosts();
  }, [workspaceId, fetchPosts]);

  // Handle Delete Action
  const handleDelete = async (postId: string) => {
    if(!confirm("Bạn có chắc chắn muốn xóa lịch đăng bài này?")) return;
    try {
      // Gọi API xóa thực tế
      await axios.delete(`${API_URL}/social/scheduled-posts/${postId}`);
      setPosts(posts.filter(p => p.id !== postId));
      alert("Xóa thành công!");
    } catch (error) {
      console.error("Lỗi xóa bài:", error);
      alert("Không thể xóa bài viết. Có thể API Delete chưa được định nghĩa ở Backend.");
      // Fallback xoá tạm trên giao diện nếu API chưa có
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  const handleEdit = (post: any) => {
    alert("Chức năng chỉnh sửa đang được phát triển!");
  };

  // --- LOGIC GỘP NHÓM THEO NGÀY (EXCEL FORM) ---
  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = new Date(a.scheduledAt || a.createdAt).getTime();
    const dateB = new Date(b.scheduledAt || b.createdAt).getTime();
    return dateA - dateB; // Sắp xếp từ bài gần nhất đến xa nhất
  });

  const groupedPosts: Record<string, any[]> = {};
  
  sortedPosts.forEach(post => {
    const d = new Date(post.scheduledAt || post.createdAt);
    // Format DD/MM/YYYY
    const dateKey = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    if (!groupedPosts[dateKey]) {
      groupedPosts[dateKey] = [];
    }
    groupedPosts[dateKey].push(post);
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* Header */}
      <div className="h-20 px-8 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Calendar size={20} />
            </div>
            Quản lý lịch đăng bài
          </h1>
          <p className="text-xs text-slate-500 mt-1">Danh sách trực quan, dễ dàng theo dõi hàng loạt</p>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={fetchPosts} className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm group flex items-center gap-2 text-sm font-semibold text-slate-700">
            <RefreshCw size={16} className={`text-slate-500 group-hover:text-blue-600 ${loading ? "animate-spin" : ""}`} />
            Làm mới danh sách
          </button>
        </div>
      </div>

      {/* Main Content - Excel Layout */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto pb-20">
          
          {loading && posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mb-4 text-blue-600" size={32} />
              <p className="text-sm font-medium">Đang tải lịch trình...</p>
            </div>
          ) : (
            <>
              {Object.entries(groupedPosts).map(([dateKey, dailyPosts]) => (
                <div key={dateKey} className="mb-10 bg-white p-6 rounded-[24px] border shadow-sm">
                   
                   <div className="flex items-center justify-between border-b pb-4 mb-4">
                      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                         <Calendar size={20} className="text-blue-600" /> Ngày đăng: {dateKey}
                      </h2>
                      <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                         Số bài chờ đăng: {dailyPosts.length}
                      </div>
                   </div>
                   
                   <div className="mb-3 text-xs font-black uppercase text-slate-400 tracking-widest px-2">Danh sách bài đăng:</div>
                   
                   <div className="flex flex-col gap-3">
                      {dailyPosts.map((post) => {
                         const d = new Date(post.scheduledAt || post.createdAt);
                         const timeString = `${d.getHours().toString().padStart(2, '0')}h:${d.getMinutes().toString().padStart(2, '0')}`;
                         
                         // Vì backend chưa trả về Tên Page cụ thể ở hàm getScheduledPosts, ta tạm để "Fanpage Mục Tiêu" 
                         // (Nếu backend bạn có trả về, bạn đổi `post.pageName` ở đây nhé)
                         const pageName = post.pageName || "Fanpage Mục Tiêu";

                         return (
                           <div key={post.id} className="flex flex-col md:flex-row md:items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors gap-4">
                              
                              {/* CỘT 1: Nội dung bài & Nút */}
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold text-slate-800 line-clamp-2" title={post.content}>
                                   {post.content}
                                 </p>
                                 <div className="flex gap-2 mt-2">
                                    <button onClick={() => handleEdit(post)} className="text-[10px] bg-white border border-slate-200 px-3 py-1 rounded-lg font-black text-blue-600 hover:bg-blue-50 transition-colors uppercase flex items-center gap-1">
                                      <Edit size={12}/> Chỉnh sửa
                                    </button>
                                    <button onClick={() => handleDelete(post.id)} className="text-[10px] bg-white border border-slate-200 px-3 py-1 rounded-lg font-black text-red-500 hover:bg-red-50 transition-colors uppercase flex items-center gap-1">
                                      <Trash2 size={12}/> Xóa
                                    </button>
                                 </div>
                              </div>
                              
                              {/* CỘT 2: Tên Fanpage */}
                              <div className="md:w-48 shrink-0 flex items-center gap-2 text-slate-600 text-sm font-medium border-l border-slate-200 pl-4">
                                  <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    {pageName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="truncate" title={pageName}>{pageName}</span>
                              </div>
                              
                              {/* CỘT 3: Thời gian đăng */}
                              <div className="md:w-40 shrink-0 flex items-center gap-2 text-slate-900 text-sm font-black border-l border-slate-200 pl-4">
                                  <Clock size={16} className="text-orange-500" /> Thời gian đăng: {timeString}
                              </div>
                           </div>
                         );
                      })}
                   </div>
                </div>
              ))}
              
              {sortedPosts.length === 0 && (
                 <div className="text-center py-20 text-slate-500">
                     <Calendar size={48} className="mx-auto mb-4 text-slate-300 opacity-50" />
                     <p className="font-medium">Chưa có bài viết nào được lên lịch.</p>
                 </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}