"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { 
  PenTool, Loader2, Sparkles, Image as ImageIcon, 
  Globe, Edit3, Wand2, X, ListFilter, CheckCircle2, 
  Square, Download, FileText, UploadCloud, Clock, Calendar,
  ShoppingCart, FolderPlus, FolderCheck, Trash2
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://wsgjryobqfayxhdhujki.supabase.co", "sb_publishable__cTnEl5USBaraE6p6P0WDw_Q37Hmye7");

function AiMarketingContent() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const searchParams = useSearchParams();

  // --- STATE DỮ LIỆU ---
  const [topic, setTopic] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [editableContent, setEditableContent] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [posting, setPosting] = useState(false); 
  const [isEditing, setIsEditing] = useState(false);

  // --- QUẢN LÝ NHIỀU ẢNH ---
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  // --- QUẢN LÝ PAGE & FOLDER ---
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [pageGroups, setPageGroups] = useState<{name: string, ids: string[]}[]>([]);
  const [newGroupName, setNewGroupName] = useState("");

  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [productUrl, setProductUrl] = useState(""); 
  const [workspaceId, setWorkspaceId] = useState<string>("");

  useEffect(() => {
    const savedId = localStorage.getItem("workspaceId") || "workspace-01";
    setWorkspaceId(savedId);

    const savedGroups = localStorage.getItem("kpost_page_groups");
    if (savedGroups) setPageGroups(JSON.parse(savedGroups));
  }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!workspaceId) return;
      try {
        const res = await axios.get(`${API_URL}/social/accounts?workspaceId=${workspaceId}`);
        setAccounts(res.data || []);
      } catch (e) { console.error("Lỗi lấy danh sách Page"); }
    };
    fetchAccounts();

    const t = searchParams.get("topic");
    const imgs = searchParams.get("imgs");
    if (t) setTopic(t);
    if (imgs) {
        const imgList = imgs.split(',');
        setAvailableImages(imgList);
        setSelectedImages(imgList); 
    }
  }, [searchParams, API_URL, workspaceId]);

  const togglePageSelection = (pId: string) => {
    setSelectedPageIds(prev => 
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  const handleSaveGroup = () => {
    if (!newGroupName || selectedPageIds.length === 0) return alert("Vui lòng nhập tên Folder và chọn ít nhất 1 Page!");
    const updatedGroups = [...pageGroups, { name: newGroupName, ids: selectedPageIds }];
    setPageGroups(updatedGroups);
    localStorage.setItem("kpost_page_groups", JSON.stringify(updatedGroups));
    setNewGroupName("");
    alert(`✅ Đã lưu nhóm "${newGroupName}" thành công!`);
  };

  const deleteGroup = (name: string) => {
    const updated = pageGroups.filter(g => g.name !== name);
    setPageGroups(updated);
    localStorage.setItem("kpost_page_groups", JSON.stringify(updated));
  };

  const handleGenerateContent = async () => {
    if (!topic) return alert("Nhập chủ đề!");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/ai-content/generate`, { 
        topic: topic, userId: "admin-01", workspaceId 
      });
      setResult(res.data);
      setEditableContent(res.data.content);
    } catch (e) { alert("Lỗi kết nối AI!"); } finally { setLoading(false); }
  };

  const handlePostAction = async () => {
    if (!editableContent || selectedPageIds.length === 0) return alert("Chưa chọn Page!");
    if (selectedImages.length === 0) return alert("Chọn ít nhất 1 ảnh!");

    setPosting(true);
    try {
      if (isScheduling) {
        await axios.post(`${API_URL}/social/schedule`, {
          content: editableContent, workspaceId, scheduledAt: scheduleDate,
          imageUrls: selectedImages, productUrl: productUrl 
        });
        alert(`✅ Đã lên lịch thành công!`);
      } else {
        const pagesToPost = accounts.filter((acc: any) => selectedPageIds.includes(acc.platformId));
        for (const acc of pagesToPost) {
          await axios.post(`${API_URL}/social/facebook/post`, {
            pageId: acc.platformId, accessToken: acc.accessToken, 
            message: editableContent, imageUrls: selectedImages,
            productUrl: productUrl 
          });
        }
        alert(`🚀 Thành công! Đã đăng bài lên ${pagesToPost.length} Page.`);
      }
    } catch (error) { alert("Lỗi đẩy bài!"); } finally { setPosting(false); }
  };

  const handleManualUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `manual_${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
        setAvailableImages(prev => [publicUrl, ...prev]);
        setSelectedImages(prev => [publicUrl, ...prev]);
        alert("Đã tải ảnh lên thành công!");
      }
    } catch (e) { alert("Lỗi tải ảnh!"); } finally { setUploading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-black font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-black text-center mb-10 italic uppercase text-slate-900 tracking-tighter">KPOST AI MARKETING</h1>

        {/* CHỌN ẢNH */}
        <div className="mb-10 bg-white p-6 rounded-[32px] border shadow-sm text-black">
            <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                    <ImageIcon size={14} className="text-blue-600" /> Chọn ảnh bài đăng ({selectedImages.length}/10)
                </p>
                <label className="text-[9px] bg-white border px-3 py-1 rounded-full font-bold cursor-pointer hover:bg-slate-50 transition-all text-black">
                    + TẢI THÊM
                    <input type="file" className="hidden" accept="image/*" onChange={handleManualUpload} />
                </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-black">
                {availableImages.map((url, idx) => (
                    <div key={idx} onClick={() => setSelectedImages(prev => prev.includes(url) ? prev.filter(u => u !== url) : (prev.length < 10 ? [...prev, url] : prev))}
                         className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 transition-all ${selectedImages.includes(url) ? 'border-blue-600 scale-95' : 'border-slate-50 opacity-40'}`}>
                        <img src={url} className="w-full h-full object-cover" />
                        {selectedImages.includes(url) && <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1"><CheckCircle2 size={16} /></div>}
                    </div>
                ))}
            </div>
        </div>

        {/* VIẾT BÀI AI */}
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border mb-10 text-black">
          <textarea className="w-full p-6 bg-slate-50 border-none rounded-[32px] outline-none text-xl min-h-[140px] text-slate-900 font-bold focus:bg-white transition-all" placeholder="Ý tưởng của bạn..." value={topic} onChange={(e) => setTopic(e.target.value)} />
          <button onClick={handleGenerateContent} disabled={loading} className="w-full mt-6 bg-black text-white font-black py-5 rounded-3xl shadow-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95">
             {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={22} />} SÁNG TẠO BÀI VIẾT AI
          </button>
        </div>

        {/* BẢN THẢO VÀ ĐĂNG BÀI */}
        {result && (
          <div className="bg-white p-8 rounded-[45px] shadow-2xl border-l-[16px] border-blue-600 mb-10 text-black">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase italic">Bản thảo xuất bản</h2>
                <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-xl ${isEditing ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}><Edit3 size={18}/></button>
             </div>
             <textarea className={`w-full p-6 rounded-[24px] text-lg leading-relaxed outline-none border-2 transition-all mb-6 ${isEditing ? 'border-orange-200 bg-orange-50/10' : 'border-transparent bg-slate-50'}`} rows={10} value={editableContent} readOnly={!isEditing} onChange={(e) => setEditableContent(e.target.value)} />
             
             {/* PAGE FOLDERS */}
             <div className="mb-8 p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-black">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 text-black"><FolderCheck size={14} /> Nhóm Fanpage</h3>
                    <div className="flex gap-2 text-black">
                        <input placeholder="Tên Folder..." className="px-4 py-2 rounded-xl text-xs bg-white border font-bold text-black" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                        <button onClick={handleSaveGroup} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black">LƯU NHÓM</button>
                    </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 text-black">
                    {pageGroups.map((group, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                            <button onClick={() => setSelectedPageIds(group.ids)} className="bg-white border-2 border-blue-500 text-blue-600 px-5 py-2.5 rounded-2xl text-[10px] font-black whitespace-nowrap">📁 {group.name.toUpperCase()}</button>
                            <button onClick={() => deleteGroup(group.name)} className="p-2 text-slate-200 hover:text-red-500"><Trash2 size={12}/></button>
                        </div>
                    ))}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10 max-h-[300px] overflow-y-auto pr-2 text-black">
                {accounts.map((acc: any) => (
                    <div key={acc.platformId} onClick={() => togglePageSelection(acc.platformId)} 
                         className={`p-4 rounded-[20px] border-2 cursor-pointer transition-all flex items-center justify-between ${selectedPageIds.includes(acc.platformId) ? 'border-blue-500 bg-white shadow-md' : 'border-transparent bg-slate-50 opacity-40'}`}>
                        <p className="font-bold text-xs truncate pr-2 text-black">{acc.accountName}</p>
                        {selectedPageIds.includes(acc.platformId) ? <CheckCircle2 size={18} className="text-blue-600" /> : <Square size={18} className="text-slate-200" />}
                    </div>
                ))}
             </div>

             <button onClick={handlePostAction} disabled={posting} className="w-full bg-blue-600 text-white font-black py-6 rounded-[30px] shadow-2xl text-xl hover:bg-blue-700 transition-all active:scale-95">
                {posting ? <Loader2 className="animate-spin mx-auto" /> : <><Globe size={24} className="inline mr-2" /> ĐĂNG LÊN {selectedPageIds.length} PAGE ĐÃ CHỌN 🚀</>}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AiMarketingPage() {
  return (<Suspense fallback={<div className="p-20 text-center font-black animate-pulse text-slate-300">LOADING...</div>}><AiMarketingContent /></Suspense>);
}