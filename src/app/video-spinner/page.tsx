"use client";
import React, { useState, useRef } from "react";
import axios from "axios";
import {
  Film,
  Sparkles,
  UploadCloud,
  Layers,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  Download,
  FileVideo,
  ShieldCheck,
  Zap,
  Volume2,
  Trash2,
  FolderDown,
  RefreshCw,
  Eye,
  Check,
  ExternalLink
} from "lucide-react";

export default function VideoSpinnerPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.kpost.vn";
  
  // File video gốc
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cấu hình thông số nhân bản
  const [spinCount, setSpinCount] = useState<number>(5);
  const [isFlip, setIsFlip] = useState<boolean>(false);
  const [changeSpeed, setChangeSpeed] = useState<boolean>(true);
  const [changeColor, setChangeColor] = useState<boolean>(true);
  const [microZoom, setMicroZoom] = useState<boolean>(true);
  const [changeAudio, setChangeAudio] = useState<boolean>(true);
  const [addNoise, setAddNoise] = useState<boolean>(true);

  // Trạng thái xử lý
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentStepText, setCurrentStepText] = useState<string>("");
  
  // Kết quả sau khi render
  const [resultData, setResultData] = useState<{
    originalName: string;
    totalSpun: number;
    zipDownloadUrl?: string;
    videos: Array<{
      id: string;
      fileName: string;
      url: string;
      variantIndex: number;
      parameters: {
        speed: number;
        zoom: number;
        brightness: number;
        contrast: number;
        saturation: number;
        isFlipped: boolean;
      };
    }>;
  } | null>(null);

  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  // Chọn file video
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.includes("video") && !file.name.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
        alert("Vui lòng chọn đúng định dạng video (.mp4, .mov, .avi, .webm)!");
        return;
      }
      setSelectedFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setResultData(null);
    }
  };

  // Kéo thả file
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.includes("video") && !file.name.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
        alert("Vui lòng chọn đúng định dạng video (.mp4, .mov, .avi, .webm)!");
        return;
      }
      setSelectedFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setResultData(null);
    }
  };

  // Reset file đã chọn
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setResultData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Bắt đầu nhân bản video
  const handleStartSpin = async () => {
    if (!selectedFile) {
      alert("Vui lòng tải lên 1 video gốc trước khi nhân bản!");
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setCurrentStepText("Đang tải video lên máy chủ xử lý...");

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("count", spinCount.toString());
    formData.append("flip", isFlip.toString());
    formData.append("changeSpeed", changeSpeed.toString());
    formData.append("changeColor", changeColor.toString());
    formData.append("microZoom", microZoom.toString());
    formData.append("changeAudio", changeAudio.toString());
    formData.append("addNoise", addNoise.toString());

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        if (prev < 40) {
          setCurrentStepText("Đang phân tích khung hình & toạ độ pixel...");
          return prev + 6;
        } else if (prev < 70) {
          setCurrentStepText("Đang áp dụng bộ lọc AI chống quét & render biến thể...");
          return prev + 4;
        } else {
          setCurrentStepText("Đang xoá Metadata, đóng mã Hash mới & nén file ZIP...");
          return prev + 2;
        }
      });
    }, 1200);

    try {
      const res = await axios.post(`${API_URL}/video-spinner/spin`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStepText("Hoàn tất nhân bản!");
      
      setTimeout(() => {
        setIsProcessing(false);
        if (res.data && res.data.data) {
          setResultData(res.data.data);
        } else {
          setResultData(res.data);
        }
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsProcessing(false);
      console.error("Lỗi nhân bản video:", err);
      alert("Đã xảy ra sự cố khi render video trên server. Vui lòng kiểm tra lại kết nối API!");
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto pb-24">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                <Film size={26} />
              </span>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                AI Video Spinner & Lách Reup
                <span className="bg-red-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                  HOT PRO
                </span>
              </h1>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Nhân bản 1 video thành hàng loạt video độc nhất với mã Hash, MD5, toạ độ điểm ảnh và âm thanh khác biệt 100%, lách quét bản quyền TikTok, Facebook Reels & Shorts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold">
              <ShieldCheck size={16} /> 100% Khử Trùng MD5
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold">
              <Zap size={16} /> FFmpeg Siêu Tốc
            </span>
          </div>
        </div>

        {/* BỐ CỤC 2 CỘT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CỘT TRÁI: UPLOAD & CẤU HÌNH (7 CỘT) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* 1. KHU VỰC TẢI VIDEO GỐC */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <UploadCloud size={18} className="text-blue-600" />
                  1. Tải Lên Video Gốc Cần Nhân Bản
                </h2>
                {selectedFile && (
                  <button
                    onClick={handleRemoveFile}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-bold transition-colors"
                  >
                    <Trash2 size={14} /> Chọn video khác
                  </button>
                )}
              </div>

              {!selectedFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    dragActive
                      ? "border-blue-500 bg-blue-50/60 scale-[1.01]"
                      : "border-slate-300 hover:border-blue-500/60 hover:bg-slate-50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                    <FileVideo size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Kéo thả video vào đây hoặc <span className="text-blue-600 underline underline-offset-2">duyệt từ máy</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Hỗ trợ MP4, MOV, WebM, AVI (Dung lượng lên tới 300MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <FileVideo size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || "Video MP4"}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl shrink-0 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Sẵn sàng
                  </span>
                </div>
              )}
            </div>

            {/* 2. THIẾT LẬP THÔNG SỐ */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Sliders size={18} className="text-blue-600" />
                2. Thiết Lập Nhân Bản & Bộ Lọc Lách Thuật Toán
              </h2>

              {/* SỐ LƯỢNG */}
              <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Layers size={16} className="text-blue-600" />
                    Số lượng video muốn tạo:
                  </label>
                  <span className="text-xl font-black text-blue-600 bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-sm">
                    {spinCount} Video
                  </span>
                </div>

                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={spinCount}
                  onChange={(e) => setSpinCount(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />

                <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-semibold">
                  <span>2 video (rất nhanh)</span>
                  <span className="text-blue-600 font-bold">5 video (khuyên dùng)</span>
                  <span>10 video</span>
                  <span>20 video (tối đa)</span>
                </div>
              </div>

              {/* CÁC NÚT SWITCH */}
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Bộ lọc can thiệp luồng dữ liệu (Khuyên bật toàn bộ để lách 100%):
                </p>

                {/* Switch 1: Micro Zoom */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200 cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-600 mt-0.5">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Micro-Zoom & Lệch Pixel (1.01x - 1.03x)</p>
                      <p className="text-xs text-slate-500">
                        Phóng to nhẹ ngẫu nhiên và crop toạ độ, làm lệch vị trí điểm ảnh khiến AI không thể so khớp.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={microZoom}
                    onChange={(e) => setMicroZoom(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                {/* Switch 2: Biến thiên tốc độ */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200 cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 mt-0.5">
                      <Zap size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Biến thiên tốc độ vi mô (0.985x - 1.025x)</p>
                      <p className="text-xs text-slate-500">
                        Thay đổi tốc độ phát nhẹ nhàng, người xem không nhận ra nhưng làm lệch toàn bộ timecode.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={changeSpeed}
                    onChange={(e) => setChangeSpeed(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                {/* Switch 3: Chỉnh màu */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200 cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 mt-0.5">
                      <Sliders size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Cân chỉnh màu sắc tinh vi (EQ Contrast & Saturation)</p>
                      <p className="text-xs text-slate-500">
                        Đổi dải màu tương phản và độ sáng ±2%, phá vỡ biểu đồ quang phổ màu của bản gốc.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={changeColor}
                    onChange={(e) => setChangeColor(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                {/* Switch 4: Thay đổi âm thanh */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200 cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-pink-100 text-pink-600 mt-0.5">
                      <Volume2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Lách bản quyền âm thanh (Pitch & Equalizer)</p>
                      <p className="text-xs text-slate-500">
                        Can thiệp nhẹ vào tần số âm thanh, đánh lừa bộ quét Content ID của YouTube và TikTok.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={changeAudio}
                    onChange={(e) => setChangeAudio(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                {/* Switch 5: Lớp nhiễu vô hình */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200 cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-600 mt-0.5">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Chèn lớp hạt Noise vô hình (Khử trùng lặp Hash)</p>
                      <p className="text-xs text-slate-500">
                        Tạo lớp hạt nano mờ mắt thường không thấy nhưng khiến mã băm MD5 và SHA-256 hoàn toàn mới.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={addNoise}
                    onChange={(e) => setAddNoise(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                {/* Switch 6: Lật gương */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200 cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-cyan-100 text-cyan-600 mt-0.5">
                      <RotateCcw size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Lật gương ngang video (Horizontal Flip)</p>
                      <p className="text-xs text-slate-500">
                        Đảo chiều trái - phải (khuyến khích tắt nếu video có nhiều chữ/biển hiệu).
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFlip}
                    onChange={(e) => setIsFlip(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* NÚT ACTION */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={handleStartSpin}
                  disabled={!selectedFile || isProcessing}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-sm tracking-wider flex items-center justify-center gap-3 transition-all shadow-xl ${
                    !selectedFile || isProcessing
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:scale-[1.01]"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" /> Đang render {spinCount} video biến thể... ({progress}%)
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} /> Bắt Đầu Nhân Bản {spinCount} Video Độc Nhất
                    </>
                  )}
                </button>

                {isProcessing && (
                  <div className="mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-center text-blue-600 mt-2 font-bold animate-pulse">
                      {currentStepText}
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* CỘT PHẢI: XEM TRƯỚC & KẾT QUẢ (5 CỘT) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* PREVIEW VIDEO GỐC */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 flex items-center justify-between mb-3">
                <span className="flex items-center gap-2">
                  <Play size={18} className="text-blue-600" />
                  Xem Trước Video Gốc
                </span>
                {videoPreviewUrl && (
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Bản Gốc</span>
                )}
              </h2>

              <div className="w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
                {videoPreviewUrl ? (
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <Film size={40} className="mx-auto mb-2 opacity-40 text-white" />
                    <p className="text-xs font-semibold text-slate-300">Chưa có video được tải lên</p>
                  </div>
                )}
              </div>
            </div>

            {/* DANH SÁCH BIẾN THỂ */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Layers size={18} className="text-emerald-600" />
                  Kết Quả Biến Thể Độc Nhất
                </h2>
                {resultData && (
                  <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold rounded-lg">
                    {resultData.totalSpun} video
                  </span>
                )}
              </div>

              {!resultData ? (
                <div className="flex-1 min-h-[220px] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <Sparkles size={36} className="mb-2 opacity-40 text-blue-500" />
                  <p className="text-sm font-bold text-slate-600">Chưa có video được nhân bản</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Hãy bấm nút "Bắt đầu nhân bản" ở cột bên trái để hệ thống tự động xuất các video mới tại đây.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  
                  {/* NÚT TẢI TẤT CẢ FILE ZIP */}
                  {resultData.zipDownloadUrl && (
                    <a
                      href={resultData.zipDownloadUrl}
                      download
                      className="mb-4 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01]"
                    >
                      <FolderDown size={18} />
                      Tải Về Toàn Bộ {resultData.totalSpun} Video (File ZIP)
                    </a>
                  )}

                  {/* DANH SÁCH BẢN BIẾN THỂ */}
                  <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
                    {resultData.videos.map((vid, idx) => (
                      <div
                        key={vid.id || idx}
                        className="bg-slate-50 rounded-2xl p-3 border border-slate-200 hover:border-blue-400 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black shrink-0">
                              #{vid.variantIndex}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate" title={vid.fileName}>
                              {vid.fileName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setActiveVideoModal(vid.url)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                              title="Xem thử video này"
                            >
                              <Eye size={15} />
                            </button>

                            <a
                              href={vid.url}
                              download={vid.fileName}
                              className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1 text-[11px] font-bold px-2.5 shadow-sm"
                              title="Tải video này"
                            >
                              <Download size={13} /> Tải
                            </a>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500 bg-white p-2 rounded-xl border border-slate-100">
                          <div>
                            Tốc độ: <span className="font-bold text-slate-700">{vid.parameters.speed}x</span>
                          </div>
                          <div>
                            Zoom: <span className="font-bold text-slate-700">{vid.parameters.zoom}x</span>
                          </div>
                          <div>
                            Lật gương: <span className="font-bold text-slate-700">{vid.parameters.isFlipped ? "Có" : "Không"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Mỗi video đã được đóng mã hash và metadata riêng biệt hoàn toàn.</span>
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* MODAL PREVIEW VIDEO */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-4 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Play size={16} className="text-blue-600" /> Xem thử video biến thể
              </h3>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-1 rounded-xl font-bold"
              >
                Đóng
              </button>
            </div>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden">
              <video
                src={activeVideoModal}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}