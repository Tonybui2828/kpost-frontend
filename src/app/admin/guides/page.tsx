'use client';
import { useState, useEffect } from "react";
import { Trash2, Plus, FileText, Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

export default function AdminGuideManager() {
  const [guides, setGuides] = useState<{title: string, url: string}[]>([]);
  const [prompts, setPrompts] = useState<{title: string, content: string}[]>([]);
  
  const [newGuide, setNewGuide] = useState({ title: "", url: "" });
  const [newPrompt, setNewPrompt] = useState({ title: "", content: "" });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Gọi API để lấy dữ liệu thực từ Server
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/admin/guides');
        setGuides(res.data.guides || []);
        setPrompts(res.data.prompts || []);
      } catch (error) {
        toast.error("Lỗi khi tải dữ liệu từ máy chủ");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Gọi API để lưu dữ liệu thực lên Server
  const saveToDB = async (updatedGuides: any, updatedPrompts: any) => {
    setSaving(true);
    try {
      await axios.post('/api/admin/guides', {
        guides: updatedGuides,
        prompts: updatedPrompts
      });
      toast.success("Đã lưu đồng bộ lên hệ thống!");
    } catch (error) {
      toast.error("Lỗi khi lưu dữ liệu");
    } finally {
      setSaving(false);
    }
  };

  const handleAddGuide = () => {
    if (!newGuide.title || !newGuide.url) return toast.error("Vui lòng điền đủ Tên và Link!");
    const updated = [...guides, newGuide];
    setGuides(updated);
    saveToDB(updated, prompts);
    setNewGuide({ title: "", url: "" });
  };

  const handleAddPrompt = () => {
    if (!newPrompt.title || !newPrompt.content) return toast.error("Vui lòng điền đủ Tên và Nội dung!");
    const updated = [...prompts, newPrompt];
    setPrompts(updated);
    saveToDB(guides, updated);
    setNewPrompt({ title: "", content: "" });
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="p-8 text-black space-y-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Quản lý Hướng dẫn & Tài liệu</h2>
        {saving && <span className="text-sm font-bold text-blue-600 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Đang đồng bộ...</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* BÊN TRÁI: QUẢN LÝ TÀI LIỆU */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
          <h3 className="font-black text-lg mb-6 flex items-center gap-2"><FileText className="text-blue-600"/> Đăng Tài liệu biểu mẫu (Link tải)</h3>
          
          <div className="space-y-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <input className="w-full p-4 rounded-xl border outline-none font-bold text-sm" placeholder="Tên tài liệu (VD: Bảng tính lợi nhuận)" value={newGuide.title} onChange={e => setNewGuide({...newGuide, title: e.target.value})} />
            <input className="w-full p-4 rounded-xl border outline-none font-bold text-sm" placeholder="Đường link tải (Google Drive...)" value={newGuide.url} onChange={e => setNewGuide({...newGuide, url: e.target.value})} />
            <button onClick={handleAddGuide} disabled={saving} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95"><Plus size={18}/> ĐĂNG TÀI LIỆU NÀY</button>
          </div>

          <div className="space-y-3">
            {guides.map((g, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
                <p className="font-bold text-sm truncate pr-4">{g.title}</p>
                <button onClick={() => {
                  const updated = guides.filter((_, idx) => idx !== i);
                  setGuides(updated); saveToDB(updated, prompts);
                }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* BÊN PHẢI: QUẢN LÝ PROMPT AI */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
          <h3 className="font-black text-lg mb-6 flex items-center gap-2"><Sparkles className="text-orange-500"/> Thêm Mẫu Prompt AI mới nhất</h3>
          
          <div className="space-y-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <input className="w-full p-4 rounded-xl border outline-none font-bold text-sm" placeholder="Tên mẫu (VD: Prompt viết bài Sale Áo Thun)" value={newPrompt.title} onChange={e => setNewPrompt({...newPrompt, title: e.target.value})} />
            <textarea className="w-full p-4 rounded-xl border outline-none font-medium text-sm" rows={4} placeholder="Nội dung câu lệnh Prompt..." value={newPrompt.content} onChange={e => setNewPrompt({...newPrompt, content: e.target.value})} />
            <button onClick={handleAddPrompt} disabled={saving} className="w-full bg-orange-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 active:scale-95"><Save size={18}/> LƯU PROMPT NÀY</button>
          </div>

          <div className="space-y-3">
            {prompts.map((p, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border relative group">
                <p className="font-bold text-sm mb-2">{p.title}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{p.content}</p>
                <button onClick={() => {
                  const updated = prompts.filter((_, idx) => idx !== i);
                  setPrompts(updated); saveToDB(guides, updated);
                }} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 p-2 rounded-lg transition-all"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}