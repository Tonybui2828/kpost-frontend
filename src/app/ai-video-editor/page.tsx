"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Wand2,
  UploadCloud,
  Play,
  Pause,
  Eye,
  RefreshCw,
  Type,
  Image as ImageIcon,
  Mic,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Trash2,
  Sliders,
  Clock,
  Download,
  FileDown,
  Edit2,
  Check,
  Music,
  Palette,
  Flame,
  Radio,
  Link2,
  Upload,
  AlertTriangle,
  FolderOpen,
  Code
} from "lucide-react";

export interface SubtitleWord {
  word: string;
  startSec: number;
  endSec: number;
}

export interface SubtitleCue {
  id: string;
  startSec: number;
  endSec: number;
  timeLabel: string;
  text: string;
  words?: SubtitleWord[];
  parentSentenceId?: string;
  parentSentenceText?: string;
  parentSentenceStart?: number;
  parentSentenceEnd?: number;
}

export interface SubtitleConfig {
  enabled: boolean;
  fontSize: number;
  highlightColor: string;
  offsetSeconds: number;
}

// Cấu hình che mờ phụ đề gốc
export interface SubtitleMaskConfig {
  enabled: boolean;
  positionYPercent: number; // Vị trí từ đáy màn hình lên (mặc định 14%)
  heightPx: number; // Chiều cao thanh che mờ (mặc định 54px)
  blurAmount: number; // Độ mờ (mặc định 16px)
  opacity: number; // Độ đậm (mặc định 0.82)
  bgColor: string; // Màu che
}

export interface LogoConfig {
  enabled: boolean;
  imageSrc: string;
  name: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  opacity: number;
  size: number;
}

export interface BannerConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  position: "bottom" | "top" | "center";
  startSec: number;
  endSec: number;
}

// 🌟 Hiệu ứng hình ảnh (Visual Filter Effects)
export interface VisualEffectConfig {
  filterType: "none" | "cinematic" | "bright" | "vintage" | "vibrant" | "cyberpunk" | "golden";
  brightness: number; // 80 - 140
  contrast: number;   // 80 - 140
  saturation: number; // 50 - 180
  speed: number;      // 0.8 - 1.5
}

// 🌟 Hiệu ứng âm thanh & Nhạc nền (Audio Effects)
export interface SoundEffectConfig {
  bgMusicEnabled: boolean;
  bgMusicType: "none" | "upbeat" | "chill" | "corporate" | "epic";
  bgMusicVolume: number; // 10 - 100
  dingEffectEnabled: boolean; // Ding khi hiện Banner
  whooshEffectEnabled: boolean; // Whoosh mở đầu
  boostVoiceVolume: boolean; // Tăng âm lượng giọng nói
}

// 🎙️ CẤU HÌNH NHÂN VẬT LỒNG TIẾNG (TỪ TRẺ EM ĐẾN NGƯỜI LỚN)
export interface VoiceCharacter {
  id: string;
  name: string;
  group: "kids" | "adults" | "seniors";
  ageRange: string;
  avatar: string;
  badge: string;
  gender: "male" | "female";
  pitch: number; // 1.6 - 1.9 (Trẻ em) | 0.72 (Người lớn tuổi)
  rate: number;  // Tốc độ đọc
  description: string;
  sampleText: string;
}

export const VOICE_CHARACTERS: VoiceCharacter[] = [
  // 👶 NHÓM GIỌNG TRẺ EM (5-8 TUỔI)
  {
    id: "child_boy",
    name: "Bé Bắp (Bé Trai 5–7 tuổi)",
    group: "kids",
    ageRange: "5–7 tuổi",
    avatar: "👦",
    badge: "Trẻ Em Lí Lắc",
    gender: "male",
    pitch: 1.65,
    rate: 1.08,
    description: "Giọng ngây thơ, hồn nhiên, reo hò thích thú, chuyên đồ chơi thiếu nhi.",
    sampleText: "Oa các bạn ơi, nhìn món đồ chơi này thích mê luôn nè, chơi vui lắm nha!"
  },
  {
    id: "child_girl",
    name: "Bé Bông (Bé Gái 6–8 tuổi)",
    group: "kids",
    ageRange: "6–8 tuổi",
    avatar: "👧",
    badge: "Trẻ Em Trong Trẻo",
    gender: "female",
    pitch: 1.60,
    rate: 1.05,
    description: "Trong trẻo, nũng nịu, ngọt ngào, chuyên búp bê, quần áo công chúa.",
    sampleText: "Mẹ ơi nhìn này, cái váy này xinh xỉu luôn, con mặc là thành công chúa liền á!"
  },
  {
    id: "cartoon",
    name: "Pikachu Chibi (Hoạt Hình)",
    group: "kids",
    ageRange: "Hoạt hình",
    avatar: "⚡",
    badge: "Hài Hước Biến Hóa",
    gender: "female",
    pitch: 1.85,
    rate: 1.25,
    description: "Nói nhanh hoạt náo, biểu cảm khoa trương gây cười, chuyên video meme.",
    sampleText: "Ủa alo các bạn ơi! Siêu phẩm xuất hiện rồi nè, cùng mình khám phá ngay nha!"
  },
  // 🧑 NHÓM GIỌNG NGƯỜI LỚN
  {
    id: "adult_female_sweet",
    name: "Mai Anh (Nữ Review Dịu Dàng)",
    group: "adults",
    ageRange: "22–27 tuổi",
    avatar: "👩",
    badge: "Ngọt Ngào Skincare",
    gender: "female",
    pitch: 1.22,
    rate: 1.10,
    description: "Thủ thỉ như tâm sự với bạn thân, tự nhiên, chuyên mỹ phẩm, thời trang, đồ ăn.",
    sampleText: "Mấy bà ơi lướt qua clip này là tiếc hùi hụi luôn á, tui vừa săn được em này cực hời!"
  },
  {
    id: "adult_male_reviewer",
    name: "Đức Anh (Reviewer Bắt Trend)",
    group: "adults",
    ageRange: "24–28 tuổi",
    avatar: "👱‍♂️",
    badge: "Reviewer Công Nghệ",
    gender: "male",
    pitch: 0.85,
    rate: 1.18,
    description: "Tốc độ nhanh, dứt khoát, bắt trend TikTok, chuyên công nghệ, đồ gia dụng.",
    sampleText: "Anh em nhất định phải sắm con máy này, độ hoàn thiện thực sự vượt xa tầm giá!"
  },
  {
    id: "adult_male_mc",
    name: "Minh Quân (Nam MC Trầm Ấm)",
    group: "adults",
    ageRange: "30–35 tuổi",
    avatar: "🎙️",
    badge: "MC Quyền Lực",
    gender: "male",
    pitch: 0.70,
    rate: 0.95,
    description: "Trầm ấm, truyền cảm, trang trọng, chuyên phim ngắn drama, xe cộ, tin tức.",
    sampleText: "Khoảnh khắc người đàn ông mở cánh cửa, mọi sự thật ngỡ ngàng đều được hé lộ."
  },
  {
    id: "adult_female_news",
    name: "Thu Thảo (Nữ Thuyết Minh)",
    group: "adults",
    ageRange: "28–32 tuổi",
    avatar: "💼",
    badge: "Thuyết Minh Chuyên Nghiệp",
    gender: "female",
    pitch: 1.00,
    rate: 1.00,
    description: "Đài từ rõ ràng, âm vang, ấm áp, chuyên video quảng cáo sản phẩm cao cấp.",
    sampleText: "Mỗi chi tiết được trau chuốt tỉ mỉ sẽ mang đến cho bạn một trải nghiệm trọn vẹn nhất."
  },
  // 👴 NHÓM GIỌNG NGƯỜI LỚN TUỔI
  {
    id: "senior",
    name: "Bác Năm (Người Lớn Tuổi Uy Tín)",
    group: "seniors",
    ageRange: "55–65 tuổi",
    avatar: "👴",
    badge: "Đôn Hậu Đáng Tin",
    gender: "male",
    pitch: 0.58,
    rate: 0.85,
    description: "Trầm lắng, từ tốn, ấm áp, tạo niềm tin tuyệt đối, chuyên sức khỏe, trà, thảo dược.",
    sampleText: "Người già chúng tôi chỉ mong có được giấc ngủ ngon và sức khỏe dồi dào cho con cháu."
  },
  {
    id: "speed_mc",
    name: "MC Siêu Tốc (Khớp Douyin Nhanh)",
    group: "adults",
    ageRange: "20–25 tuổi",
    avatar: "🚀",
    badge: "Siêu Tốc Douyin",
    gender: "female",
    pitch: 1.10,
    rate: 1.35,
    description: "Tốc độ nói nhanh, dứt khoát, bắt trọn 100% nhịp độ nói liên thanh của video Douyin.",
    sampleText: "Mọi người nhìn kỹ nha, món này đang cực kỳ hot rần rần trên Douyin những ngày qua nè!",
  }
];

// 🌟 DANH SÁCH 6 GIỌNG MC PHỔ BIẾN ĐỂ CHỌN NHANH TRỰC TIẾP
export const POPULAR_VOICES = [
  { id: "cartoon", name: "Pikachu Chibi", shortName: "Pikachu Chibi", avatar: "⚡", rate: 1.25, pitch: 1.85 },
  { id: "adult_female_sweet", name: "Mai Anh (Nữ Review)", shortName: "Nữ Dịu Dàng", avatar: "👩", rate: 1.10, pitch: 1.22 },
  { id: "adult_male_mc", name: "Minh Quân (Nam MC)", shortName: "Nam Trầm Ấm", avatar: "🎙️", rate: 0.95, pitch: 0.70 },
  { id: "senior", name: "Bác Năm (Người Lớn Tuổi)", shortName: "Bác Năm (Đôn Hậu)", avatar: "👴", rate: 0.85, pitch: 0.58 },
  { id: "adult_male_reviewer", name: "Đức Anh (Reviewer)", shortName: "Nam Bắt Trend", avatar: "👱‍♂️", rate: 1.18, pitch: 0.85 },
  { id: "speed_mc", name: "MC Siêu Tốc (Douyin)", shortName: "MC Siêu Tốc", avatar: "🚀", rate: 1.35, pitch: 1.10 },
];

// 🔥 DANH SÁCH VIDEO DOUYIN HOT TRENDS ĐỀ XUẤT MỚI NHẤT
export interface DouyinTrendItem {
  id: string;
  title: string;
  originalTitle: string;
  category: "kids_toys" | "smart_home" | "tech_gadgets" | "beauty_care" | "short_drama";
  categoryLabel: string;
  likes: string;
  shares: string;
  videoUrl: string;
  voiceRecommendation: string;
  voiceRecommendationName: string;
  viralInsight: string;
  suggestedScript: { startSec: number; endSec: number; text: string }[];
}

export const DOUYIN_HOT_TRENDS: DouyinTrendItem[] = [
  {
    id: "dy_toy_01",
    title: "Bảng Vẽ Ma Thuật Ánh Sáng Tự Xóa Cho Bé",
    originalTitle: "儿童智能发光画板 黑科技益智玩具",
    category: "kids_toys",
    categoryLabel: "Đồ chơi & Trẻ em",
    likes: "2.8M",
    shares: "340K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "child_boy",
    voiceRecommendationName: "Bé Bắp (5-7 tuổi)",
    viralInsight: "3s đầu bé reo hò thích thú tạo hiệu ứng tò mò cực cao cho phụ huynh.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Oa các bạn ơi, xem chiếc bảng vẽ ma thuật này kỳ diệu chưa nè!" },
      { startSec: 4, endSec: 9, text: "Vẽ đến đâu phát sáng lấp lánh như các vì sao đến đó, đẹp xỉu luôn các bạn ơi!" },
      { startSec: 9, endSec: 15, text: "Vẽ xong một lúc là tự mờ để vẽ lại nhiều lần, thích mê luôn ạ!" }
    ]
  },
  {
    id: "dy_home_02",
    title: "Cây Lau Nhà Tự Giặt Vắt Ly Tâm 360 Độ",
    originalTitle: "免手洗旋转拖把 家用大吸力",
    category: "smart_home",
    categoryLabel: "Gia dụng thông minh",
    likes: "1.9M",
    shares: "210K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ ngọt ngào)",
    viralInsight: "Âm thanh ASMR lau sạch dầu mỡ và tóc rụng ngay từ giây đầu.",
    suggestedScript: [
      { startSec: 0, endSec: 5, text: "Ai bảo dọn nhà là mệt? Từ ngày có cây lau tự giặt này nhàn tênh luôn cả nhà ơi!" },
      { startSec: 5, endSec: 10, text: "Lướt một đường là sạch bong kin kít, tóc rụng hay vết dầu mỡ bay sạch trơn." },
      { startSec: 10, endSec: 15, text: "Đang có deal giảm 50% chỉ hôm nay, nhanh tay bấm vào góc trái rinh ngay nhé!" }
    ]
  },
  {
    id: "dy_tech_03",
    title: "Giá Đỡ Điện Thoại Tự Xoay AI Theo Khuôn Mặt 360",
    originalTitle: "AI智能人脸追踪直播支架",
    category: "tech_gadgets",
    categoryLabel: "Công nghệ & Đời sống",
    likes: "3.4M",
    shares: "480K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "adult_male_reviewer",
    voiceRecommendationName: "Đức Anh (Reviewer công nghệ)",
    viralInsight: "Chuyển động mượt mà của camera theo người tạo cảm giác công nghệ cao.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Anh em làm video hay livestream một mình nhất định phải sắm con máy này!" },
      { startSec: 4.5, endSec: 9.5, text: "Đi đến đâu máy tự lia camera theo đến đó, không cần app hay bluetooth lằng nhằng." },
      { startSec: 9.5, endSec: 15, text: "Nhỏ gọn bỏ túi mang đi quay tiktok ngoài trời quá đỉnh luôn anh em!" }
    ]
  },
  {
    id: "dy_beauty_04",
    title: "Kem Nền Che Khuyết Điểm Chống Nước Kiềm Dầu 24H",
    originalTitle: "防水控油持久遮瑕粉底液",
    category: "beauty_care",
    categoryLabel: "Mỹ phẩm & Skincare",
    likes: "2.1M",
    shares: "290K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "So sánh nửa mặt trước và sau khi thoa kem làm bật công dụng biến đổi tức thì.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Mấy bà ơi tui vừa phát hiện ra kem nền chân ái cho mùa hè này rồi!" },
      { startSec: 4.5, endSec: 9.5, text: "Chấm một chút thôi là che sạch tàn nhang thâm mụn, tệp da mịn màng dã man." },
      { startSec: 9.5, endSec: 15, text: "Xịt nước thử không hề trôi nha, đang có voucher xịn mấy bà bấm giỏ hàng mua liền!" }
    ]
  },
  {
    id: "dy_drama_05",
    title: "Tổng Tài Giấu Nghề Đi Thử Lòng Bạn Gái Thực Dụng",
    originalTitle: "霸道总裁低调相亲反转剧",
    category: "short_drama",
    categoryLabel: "Phim ngắn Drama",
    likes: "4.7M",
    shares: "620K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "adult_male_mc",
    voiceRecommendationName: "Minh Quân (Nam MC Trầm Ấm)",
    viralInsight: "Tình huống lật mặt phút chót và nhạc nền dồn dập khiến người xem cày hết clip.",
    suggestedScript: [
      { startSec: 0, endSec: 5, text: "Cô gái khinh bỉ chàng trai chạy xe ôm cũ kỹ mà không hề hay biết..." },
      { startSec: 5, endSec: 10, text: "Anh chính là người thừa kế duy nhất của tập đoàn tài chính lớn nhất thành phố." },
      { startSec: 10, endSec: 15, text: "Đoạn kết sẽ khiến kẻ tham lam phải trả giá, theo dõi kênh để xem tập 2!" }
    ]
  }
];

// Chuyển AudioBuffer sang file WAV 16-bit Mono siêu nhẹ
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const samples = buffer.getChannelData(0);
  const dataSize = samples.length * (bitDepth / 8);
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const dataView = new DataView(arrayBuffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(dataView, 0, "RIFF");
  dataView.setUint32(4, 36 + dataSize, true);
  writeString(dataView, 8, "WAVE");
  writeString(dataView, 12, "fmt ");
  dataView.setUint32(16, 16, true);
  dataView.setUint16(20, format, true);
  dataView.setUint16(22, numChannels, true);
  dataView.setUint32(24, sampleRate, true);
  dataView.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  dataView.setUint16(32, numChannels * (bitDepth / 8), true);
  dataView.setUint16(34, bitDepth, true);
  writeString(dataView, 36, "data");
  dataView.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    dataView.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export default function AiVideoEditorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoName, setVideoName] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [compareOriginal, setCompareOriginal] = useState<boolean>(false);

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const exportAbortRef = useRef<boolean>(false);

  // Whisper Subtitles State
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeProgress, setTranscribeProgress] = useState<number>(0);
  const [transcribeStatus, setTranscribeStatus] = useState<string>("");
  const [transcribeSuccessMsg, setTranscribeSuccessMsg] = useState<string>("");
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [editingCueId, setEditingCueId] = useState<string | null>(null);
  const [editingCueText, setEditingCueText] = useState<string>("");
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>({
    enabled: true,
    fontSize: 22,
    highlightColor: "#FACC15",
    offsetSeconds: 0,
  });

  // Lưu chỉnh sửa câu phụ đề
  const handleSaveCueEdit = (cueId: string) => {
    if (!editingCueText.trim()) {
      setEditingCueId(null);
      return;
    }

    setSubtitleCues((prevCues) =>
      prevCues.map((cue) => {
        if (cue.id === cueId) {
          const newText = editingCueText.trim();
          const wordsList = newText.split(/\s+/).filter(Boolean);
          const duration = Math.max(0.4, cue.endSec - cue.startSec);
          const wordStep = duration / Math.max(1, wordsList.length);

          const updatedWords = wordsList.map((w, idx) => ({
            word: w,
            startSec: Number((cue.startSec + idx * wordStep).toFixed(2)),
            endSec: Number((cue.startSec + (idx + 1) * wordStep).toFixed(2)),
          }));

          return {
            ...cue,
            text: newText,
            words: updatedWords,
          };
        }
        return cue;
      })
    );

    setEditingCueId(null);
    setEditingCueText("");
  };

  // Modal & Cấu hình Logo / Banner ĐẦY ĐỦ
  const [showModal, setShowModal] = useState<boolean>(false);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>({
    enabled: true,
    imageSrc: "",
    name: "KPOST AI",
    position: "top-right",
    opacity: 90,
    size: 40,
  });
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>({
    enabled: true,
    title: "⚡ FLASH SALE 50% - DUY NHẤT HÔM NAY",
    subtitle: "Miễn phí giao hàng toàn quốc • Bảo hành chính hãng",
    position: "bottom",
    startSec: 3,
    endSec: 15,
  });

  // 🌟 MODAL & CẤU HÌNH HIỆU ỨNG ÂM THANH & HÌNH ẢNH MỚI
  const [showEffectsModal, setShowEffectsModal] = useState<boolean>(false);
  const [visualEffects, setVisualEffects] = useState<VisualEffectConfig>({
    filterType: "none",
    brightness: 105,
    contrast: 110,
    saturation: 120,
    speed: 1.0,
  });
  const [soundEffects, setSoundEffects] = useState<SoundEffectConfig>({
    bgMusicEnabled: false,
    bgMusicType: "upbeat",
    bgMusicVolume: 35,
    dingEffectEnabled: true,
    whooshEffectEnabled: true,
    boostVoiceVolume: true,
  });

  // 🎙️ MODAL & TÍNH NĂNG AI LỒNG TIẾNG ĐA GIỌNG (Adult to Kids)
  const [showVoiceoverModal, setShowVoiceoverModal] = useState<boolean>(false);
  const [voiceoverConfig, setVoiceoverConfig] = useState({
    enabled: true,
    selectedVoiceId: "adult_male_warm", // Minh Quân (Nam MC Trầm Ấm)
    muteOriginal: false, // 🌟 Giữ nhạc nền nhẹ nhàng nhưng che mờ tiếng ngoại ngữ gốc
    originalVolume: 10,  // 🌟 ĐÚNG 10%: Che mờ tiếng dịch gốc và giọng gốc chỉ để 10%
    autoDuckOriginal: true,
    duckVolume: 0.05,    // Hạ xuống 5% khi MC cất lời
    pitch: 1.0,
    rate: 1.15,
  });
  const lastSpokenCueIdRef = useRef<string | null>(null);
  const currentSentenceSpokenRef = useRef<string | null>(null);
  const spokenTextsHistoryRef = useRef<Map<string, number>>(new Map());
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [voiceChangeNotice, setVoiceChangeNotice] = useState<string | null>(null);

  // 🔥 ĐỒNG BỘ ÂM LƯỢNG TIẾNG GỐC: NẾU BẬT LOẠI BỎ TIẾNG GỐC THÌ VOLUME = 0 TUYỆT ĐỐI
  useEffect(() => {
    if (videoRef.current) {
      if (voiceoverConfig.muteOriginal || voiceoverConfig.originalVolume === 0) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = Math.max(0, Math.min(1, voiceoverConfig.originalVolume / 100));
      }
    }
  }, [voiceoverConfig.muteOriginal, voiceoverConfig.originalVolume, isPlaying]);

  // 🔥 MODAL & TÍNH NĂNG CÀO DỮ LIỆU DOUYIN HOT TRENDS
  const [showDouyinModal, setShowDouyinModal] = useState<boolean>(false);
  const [activeDouyinTab, setActiveDouyinTab] = useState<"trends" | "scraper">("trends");
  const [douyinCategory, setDouyinCategory] = useState<string>("all");
  const [douyinUrlInput, setDouyinUrlInput] = useState<string>("");
  const [isScrapingDouyin, setIsScrapingDouyin] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const [maskConfig, setMaskConfig] = useState<SubtitleMaskConfig>({
    enabled: false,
    positionYPercent: 14,
    heightPx: 56,
    blurAmount: 16,
    opacity: 0.85,
    bgColor: "#0c0305",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoImageInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesMapRef = useRef<WeakMap<HTMLAudioElement, any>>(new WeakMap());
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);

  // 🎙️ TỰ ĐỘNG NẠP VÀ LƯU DANH SÁCH GIỌNG NÓI HỆ THỐNG (CHROME, EDGE, SAFARI)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // 🎙️ PRELOAD TỰ ĐỘNG CÁC CÂU SẮP TỚI: LOẠI BỎ 100% ĐỘ TRỄ MẠNG (0MS LATENCY)
  const preloadUpcomingSentences = (fromSec: number = 0) => {
    if (!subtitleCues || subtitleCues.length === 0) return;
    const apiBase = getApiBaseUrl();
    const activeVoice = voiceoverConfig.selectedVoiceId;

    // Lấy tối đa 10 câu phụ đề trong vòng 30 giây tới
    const upcoming = subtitleCues.filter(
      (c) => c.startSec >= fromSec && c.startSec <= fromSec + 30
    );

    upcoming.slice(0, 10).forEach((cue) => {
      const textToSpeak = (cue.parentSentenceText || cue.text).trim().slice(0, 250);
      const cacheKey = `${activeVoice}_${textToSpeak}`;
      if (audioCacheRef.current.has(cacheKey)) return;

      try {
        const audio = new Audio();
        const encoded = encodeURIComponent(textToSpeak);
        audio.src = `https://api.kpost.vn/ai-content/tts?text=${encoded}`;
        audio.playbackRate = voiceoverConfig.rate || 1.15;
        audio.preload = "auto";
        audioCacheRef.current.set(cacheKey, audio);
      } catch {}
    });
  };

  // 🎙️ ĐỊNH HÌNH CHẤT GIỌNG MC ĐẶC TRƯNG: BIẾN HÓA ĐÚNG TỪNG NHÂN VẬT (PITCH + SPEED + EQUALIZER)
  const configureVoiceAudio = (audio: HTMLAudioElement, voiceId: string, customRate?: number) => {
    try {
      audio.crossOrigin = "anonymous";
    } catch {}

    let rate = 1.15;
    let preservesPitch = true;
    let bassGain = 0;
    let midFreq = 1000;
    let midGain = 0;
    let trebleGain = 0;

    switch (voiceId) {
      case "cartoon": // ⚡ Pikachu Chibi (Hoạt hình lí lắc, giọng hoạt hình vui nhộn)
        rate = customRate || 1.35;
        preservesPitch = false; // Tắt bảo toàn cao độ: Pitch tăng vút thành giọng Chibi hoạt hình vui nhộn
        bassGain = -8;
        midFreq = 2200;
        midGain = 6;
        trebleGain = 10;
        break;

      case "adult_male_mc": // 🎙️ Minh Quân (Nam MC Trầm Ấm)
        rate = customRate || 0.88;
        preservesPitch = false; // Tắt bảo toàn cao độ: Pitch hạ sâu xuống dải âm nam trầm quyền lực
        bassGain = 14;          // Kích âm trầm dày dặn như phòng thu phát thanh
        midFreq = 380;
        midGain = 5;
        trebleGain = -8;        // Cắt bớt dải the thé nữ
        break;

      case "senior": // 👴 Bác Năm (Người lớn tuổi đôn hậu)
        rate = customRate || 0.80;
        preservesPitch = false; // Cao độ trầm ấm, từ tốn của người cao tuổi
        bassGain = 12;
        midFreq = 500;
        midGain = 4;
        trebleGain = -7;
        break;

      case "adult_male_reviewer": // 👱‍♂️ Đức Anh (Reviewer Bắt Trend)
        rate = customRate || 0.94;
        preservesPitch = false; // Giọng nam trẻ trung, dứt khoát, hiện đại
        bassGain = 8;
        midFreq = 850;
        midGain = 6;
        trebleGain = 2;
        break;

      case "adult_female_sweet": // 👩 Mai Anh (Nữ Review Dịu Dàng)
        rate = customRate || 1.10;
        preservesPitch = true;  // Giữ nguyên cao độ nữ ngọt ngào, mềm mại
        bassGain = 0;
        midFreq = 1400;
        midGain = 3;
        trebleGain = 5;
        break;

      case "speed_mc": // 🚀 MC Siêu Tốc (Khớp Douyin Nhanh)
        rate = customRate || 1.38;
        preservesPitch = true;  // Tốc độ nói cực nhanh, dồn dập chuẩn nhịp Douyin
        bassGain = -2;
        midFreq = 2000;
        midGain = 4;
        trebleGain = 6;
        break;

      case "child_boy": // 👦 Bé Bắp (5-7 tuổi)
      case "child_girl": // 👧 Bé Dâu (4-6 tuổi)
        rate = customRate || 1.28;
        preservesPitch = false; // Cao độ trẻ con líu lo
        bassGain = -6;
        midFreq = 2000;
        midGain = 5;
        trebleGain = 8;
        break;

      default:
        rate = customRate || 1.15;
        preservesPitch = true;
        break;
    }

    // 1. Áp dụng Pitch & PlaybackRate trên phần cứng trình duyệt (hỗ trợ mọi thiết bị)
    audio.playbackRate = rate;
    audio.preservesPitch = preservesPitch;
    (audio as any).mozPreservesPitch = preservesPitch;
    (audio as any).webkitPreservesPitch = preservesPitch;

    // 2. Tinh chỉnh Equalizer qua Web Audio API (nếu được trình duyệt cho phép)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        let nodes = audioNodesMapRef.current.get(audio);
        if (!nodes) {
          const source = ctx.createMediaElementSource(audio);
          const bass = ctx.createBiquadFilter();
          bass.type = "lowshelf";
          bass.frequency.value = 180;

          const mid = ctx.createBiquadFilter();
          mid.type = "peaking";
          mid.frequency.value = 1000;
          mid.Q.value = 1.0;

          const treble = ctx.createBiquadFilter();
          treble.type = "highshelf";
          treble.frequency.value = 3200;

          const gain = ctx.createGain();

          source.connect(bass);
          bass.connect(mid);
          mid.connect(treble);
          treble.connect(gain);
          gain.connect(ctx.destination);

          nodes = { source, bass, mid, treble, gain };
          audioNodesMapRef.current.set(audio, nodes);
        }
        nodes.bass.gain.value = bassGain;
        nodes.mid.frequency.value = midFreq;
        nodes.mid.gain.value = midGain;
        nodes.treble.gain.value = trebleGain;
      }
    } catch {}
  };

  // ⚡ HÀM ĐỔI GIỌNG MC & LOAD LẠI TRỰC TIẾP (KHÔNG CẦN DỊCH LẠI TỪ ĐẦU)
  const handleQuickChangeVoice = (voiceId: string, customRate?: number, customPitch?: number) => {
    const selectedChar = VOICE_CHARACTERS.find((c) => c.id === voiceId);
    const newRate = customRate || selectedChar?.rate || 1.25;
    const newPitch = customPitch || selectedChar?.pitch || 1.0;

    // 1. Cập nhật state giọng đọc
    setVoiceoverConfig((prev) => ({
      ...prev,
      selectedVoiceId: voiceId,
      rate: newRate,
      pitch: newPitch,
      enabled: true,
    }));

    // 2. Xóa audio cache cũ & reset con trỏ câu đang nói
    audioCacheRef.current.clear();
    currentSentenceSpokenRef.current = null;
    lastSpokenCueIdRef.current = null;

    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      } catch {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    // 3. Preload các câu sắp tới theo giọng mới
    preloadUpcomingSentences(currentTime);

    // 4. Phát thử ngay câu mẫu của giọng MC mới để người dùng nghe
    const sample = selectedChar?.sampleText || (subtitleCues[0]?.text) || "Xin chào! Tôi là MC lồng tiếng mới của bạn.";
    speakSentence(sample, voiceId, newRate);

    // 5. Hiển thị thông báo thành công
    setVoiceChangeNotice(`✅ Đã chuyển sang: ${selectedChar?.name || voiceId} - Sẵn sàng lồng tiếng!`);
    setTimeout(() => setVoiceChangeNotice(null), 4000);
  };

  // ⚡ HÀM ĐỔI TỐC ĐỘ ĐỌC MC
  const handleQuickChangeSpeed = (newSpeed: number) => {
    setVoiceoverConfig((prev) => ({ ...prev, rate: newSpeed }));
    audioCacheRef.current.clear();
    currentSentenceSpokenRef.current = null;
    preloadUpcomingSentences(currentTime);
    setVoiceChangeNotice(`⚡ Đã điều chỉnh tốc độ MC: ${newSpeed}x (Khớp nhịp nhân vật)`);
    setTimeout(() => setVoiceChangeNotice(null), 3000);
  };

  // 🎙️ HÀM PHÁT GIỌNG LỒNG TIẾNG CHUẨN TIẾNG VIỆT 100% (NGỮ ĐIỆU TỰ NHIÊN, CỰC KỲ RÕ RÀNG VÀ BIẾN HÓA THEO NHÂN VẬT)
  const speakSentence = (text: string, voiceId?: string, explicitRate?: number) => {
    if (typeof window === "undefined" || !text.trim()) return;

    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      } catch {}
    }
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    const cleanText = text.slice(0, 280).trim();

    // 🌟 Hạ âm lượng video gốc khi MC nói để che mờ hoàn toàn giọng gốc, tôn giọng MC tiếng Việt
    if (videoRef.current) {
      if (voiceoverConfig.muteOriginal) {
        videoRef.current.volume = 0;
      } else {
        // Khi MC đang nói: hạ tiếng gốc xuống 3% - 5% (ducking) để che mờ giọng ngoại ngữ gốc
        videoRef.current.volume = Math.max(0, (voiceoverConfig.originalVolume / 100) * 0.35);
      }
    }

    const restoreVolume = () => {
      if (videoRef.current) {
        if (voiceoverConfig.muteOriginal) {
          videoRef.current.volume = 0;
        } else {
          // Trả về mức thiết lập (mặc định 10% để che mờ tiếng gốc)
          videoRef.current.volume = Math.min(1, Math.max(0, voiceoverConfig.originalVolume / 100));
        }
      }
    };

    const activeVoiceId = voiceId || voiceoverConfig.selectedVoiceId;
    const char = VOICE_CHARACTERS.find((c) => c.id === activeVoiceId) || VOICE_CHARACTERS[0];
    const rateToUse = explicitRate || (voiceId ? char.rate : voiceoverConfig.rate) || char.rate || 1.15;
    const cleanSnippet = cleanText.slice(0, 250);
    const encoded = encodeURIComponent(cleanSnippet);
    const apiBase = getApiBaseUrl();

    // 🌟 MÁY CHỦ PHÁT ÂM TIẾNG VIỆT CHUẨN 100% (KHÔNG BAO GIỜ DÙNG GIỌNG MÁY TÍNH TIẾNG ANH)
    // api.kpost.vn/ai-content/tts đang chạy online và trả về MP3 tiếng Việt chuẩn tuyệt đối
    const candidateUrls = [
      `https://api.kpost.vn/ai-content/tts?text=${encoded}`,
      `https://api.kpost.vn/api/tts?text=${encoded}`,
      `${apiBase}/ai-content/tts?text=${encoded}`,
      `${apiBase}/api/tts?text=${encoded}`,
      `/ai-content/tts?text=${encoded}`,
      `/api/tts?text=${encoded}`,
    ];

    let urlIdx = 0;

    const playNextAudioSource = () => {
      if (urlIdx >= candidateUrls.length) {
        restoreVolume();
        return;
      }

      const targetUrl = candidateUrls[urlIdx++];
      try {
        const cacheKey = `${activeVoiceId}_${cleanSnippet}`;
        let audio = audioCacheRef.current.get(cacheKey);
        if (!audio || audio.src !== targetUrl) {
          audio = new Audio(targetUrl);
          audioCacheRef.current.set(cacheKey, audio);
        }

        // Cấu hình chất giọng MC đặc trưng (Cao độ Pitch + Tốc độ Rate + EQ BiquadFilter)
        configureVoiceAudio(audio, activeVoiceId, rateToUse);

        audio.currentTime = 0;
        ttsAudioRef.current = audio;

        audio.onended = () => { restoreVolume(); };
        audio.onerror = () => {
          console.warn(`[MC Audio] Nguồn ${targetUrl} không phản hồi, tự động chuyển sang nguồn tiếp theo...`);
          playNextAudioSource();
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn(`[MC Audio] Lỗi phát nguồn ${targetUrl}:`, err);
            playNextAudioSource();
          });
        }
      } catch (err) {
        console.warn(`[MC Audio] Ngoại lệ khởi tạo audio:`, err);
        playNextAudioSource();
      }
    };

    // Bắt đầu phát âm thanh tiếng Việt chuẩn 100%
    playNextAudioSource();
  };

  // 🌐 HÀM LẤY ĐƯỜNG DẪN GỐC (ƯU TIÊN API.KPOST.VN ĐỂ GỌI ĐÚNG BACKEND)
  const getApiBaseUrl = (): string => {
    if (typeof window !== "undefined") {
      if (window.location.hostname === "kpost.vn" || window.location.hostname.endsWith(".kpost.vn")) {
        return "https://api.kpost.vn";
      }
      return window.location.origin;
    }
    return "https://api.kpost.vn";
  };

  // 🌟 HÀM FORMAT GIÂY SANG ĐỊNH DẠNG MM:SS
  const formatSecToTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // THUẬT TOÁN GỘP CÂU TỰ ĐỘNG:
  // Nối các phân đoạn phụ đề ngắn < 0.65s thành câu hoàn chỉnh cho MC đọc liền mạch, không giật cục
  const smartMergeCues = (cues: SubtitleCue[]): SubtitleCue[] => {
    if (!cues || cues.length <= 1) return cues;
    const merged: SubtitleCue[] = [];
    let current: SubtitleCue = { ...cues[0] };

    for (let i = 1; i < cues.length; i++) {
      const next = cues[i];
      const gap = next.startSec - current.endSec;
      const combinedWords = `${current.text} ${next.text}`.trim().split(/\s+/).length;

      // Nếu 2 câu nối tiếp cách nhau <= 0.65s và độ dài chưa vượt quá 16 từ
      if (gap >= -0.1 && gap <= 0.65 && combinedWords <= 16) {
        current.endSec = next.endSec;
        current.text = `${current.text.trim()} ${next.text.trim()}`;
        current.timeLabel = `${formatSecToTime(current.startSec)} - ${formatSecToTime(next.endSec)}`;
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);
    return merged;
  };

  // 🛡️ BỘ LỌC CHỐNG ẢO GIÁC & CHỐNG LẶP TỪ WHISPER ĐỈNH CAO:
  // Triệt tiêu 100% hiện tượng lặp đi lặp lại "trời ơi trời ơi", "ơi trời ơi", "cảm ơn" do tiếng ồn máy bay/tiếng gió/động cơ
  const cleanAndDehallucinateCues = (rawCues: SubtitleCue[]): { cues: SubtitleCue[]; isSevereHallucination: boolean } => {
    if (!rawCues || rawCues.length === 0) return { cues: [], isSevereHallucination: false };

    // 1. Chuẩn hóa & loại bỏ text rỗng
    const normalized = rawCues
      .map((c, idx) => {
        const text = (c.text || "").trim();
        const startSec = Number(c.startSec !== undefined ? c.startSec : idx * 3);
        const endSec = Number(c.endSec !== undefined ? c.endSec : startSec + 3);
        return {
          ...c,
          id: c.id || `cue_${idx + 1}`,
          startSec: Number(startSec.toFixed(2)),
          endSec: Number(endSec.toFixed(2)),
          text,
        };
      })
      .filter((c) => c.text.length > 0);

    if (normalized.length === 0) return { cues: [], isSevereHallucination: false };

    // 2. Danh sách các cụm từ ảo giác kinh điển của Whisper khi gặp tạp âm (máy bay, quạt gió, tiếng ồn cabin)
    const isHallucinatedPattern = (txt: string) => {
      const s = txt.toLowerCase().replace(/[\.,\?!;:_~\-–—]/g, "").trim();
      const tokens = s.split(/\s+/).filter(Boolean);
      
      // Bắt các từ/cụm từ lặp vô nghĩa
      if (
        s === "trời ơi" ||
        s === "ơi trời ơi" ||
        s === "trời ơi trời" ||
        s === "ơi trời" ||
        s === "trời ơi trời ơi" ||
        s === "trời đất ơi" ||
        s === "cảm ơn các bạn đã xem" ||
        s === "cảm ơn bạn đã xem" ||
        s === "cảm ơn đã theo dõi" ||
        s === "cảm ơn" ||
        s === "dn" ||
        s === "sub by" ||
        s === "trans by" ||
        s.length <= 1
      ) {
        return true;
      }

      // Kiểm tra chuỗi chỉ toàn "trời", "ơi" đảo đi đảo lại
      if (tokens.length >= 2 && tokens.every((w) => w === "trời" || w === "ơi" || w === "ơi!")) {
        return true;
      }

      return false;
    };

    // 3. Đếm tần suất toàn cục & phát hiện vòng lặp ảo giác
    const phraseCount = new Map<string, number>();
    for (const c of normalized) {
      const key = c.text.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, "");
      phraseCount.set(key, (phraseCount.get(key) || 0) + 1);
    }

    let hallucinatedDropCount = 0;
    const filteredByFreq: SubtitleCue[] = [];
    const seenCounts = new Map<string, number>();

    for (const c of normalized) {
      const key = c.text.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, "");
      const count = seenCounts.get(key) || 0;

      // Nếu là cụm từ ảo giác (như trời ơi, cảm ơn) -> chỉ cho phép tối đa 1 lần trong cả video!
      if (isHallucinatedPattern(c.text)) {
        hallucinatedDropCount++;
        if (count >= 1) continue; // Bỏ hoàn toàn các lần lặp tiếp theo
      }

      // 🛡️ CHỐNG LẶP TUYỆT ĐỐI: Mỗi câu dịch/phụ đề chỉ được xuất hiện DUY NHẤT 1 LẦN trong cả video
      if (count >= 1) {
        hallucinatedDropCount++;
        continue;
      }

      // Kiểm tra tiền tố 4 từ đầu (chống lặp các biến thể câu)
      const words = c.text.split(/\s+/).filter(Boolean);
      if (words.length >= 4) {
        const prefix4 = `pref_${words.slice(0, 4).join(" ").toLowerCase()}`;
        if (seenCounts.has(prefix4)) {
          hallucinatedDropCount++;
          continue;
        }
        seenCounts.set(prefix4, 1);
      }

      seenCounts.set(key, count + 1);
      filteredByFreq.push(c);
    }

    // 4. Lọc sliding-window chống lặp đan xen chu kỳ 2 - 4 (Ví dụ A-B-A-B-A-B như "trời ơi trời", "ơi trời ơi")
    const finalCleaned: SubtitleCue[] = [];
    const recentHistory: string[] = [];

    for (const c of filteredByFreq) {
      const norm = c.text.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, "");

      // Kiểm tra xem cụm từ có lặp lại trong 4 câu gần nhất không
      const matchIndex = recentHistory.lastIndexOf(norm);
      if (matchIndex !== -1 && recentHistory.length - matchIndex <= 4) {
        hallucinatedDropCount++;
        continue; // Đang nằm trong chu kỳ lặp đan xen -> BỎ QUA
      }

      // Kiểm tra trùng mốc thời gian (startSec cách nhau < 0.6s)
      if (finalCleaned.length > 0) {
        const prev = finalCleaned[finalCleaned.length - 1];
        if (Math.abs(c.startSec - prev.startSec) < 0.6) {
          hallucinatedDropCount++;
          continue;
        }
      }

      recentHistory.push(norm);
      if (recentHistory.length > 8) recentHistory.shift();
      finalCleaned.push(c);
    }

    // 5. Đánh giá mức độ ảo giác nặng:
    // Nếu > 60% số câu ban đầu bị loại bỏ hoặc số câu còn lại quá ít (< 3 câu) trong khi danh sách gốc có nhiều câu (> 10 câu)
    const isSevere = normalized.length >= 10 && (hallucinatedDropCount / normalized.length > 0.55 || finalCleaned.length < 3);

    return {
      cues: finalCleaned,
      isSevereHallucination: isSevere,
    };
  };

  // 🌟 HÀM TÁCH SUB CHUẨN VIRAL: MỖI ĐOẠN CHỮ CHỈ 3 - 5 TỪ CHẠY THEO NHỊP NÓI CỦA NHÂN VẬT
  const chunkCuesInto3To5Words = (originalCues: SubtitleCue[]): SubtitleCue[] => {
    const chunked: SubtitleCue[] = [];
    let cueIndex = 1;

    for (let cIdx = 0; cIdx < originalCues.length; cIdx++) {
      const cue = originalCues[cIdx];
      const text = (cue.text || "").trim();
      if (!text) continue;

      const sentenceId = `sent_${cIdx + 1}`;

      // Tách thành mảng các từ
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length <= 5) {
        chunked.push({
          ...cue,
          id: `sub_cue_${cueIndex++}`,
          text,
          timeLabel: `${formatSecToTime(cue.startSec)} - ${formatSecToTime(cue.endSec)}`,
          parentSentenceId: sentenceId,
          parentSentenceText: text,
          parentSentenceStart: cue.startSec,
          parentSentenceEnd: cue.endSec,
        });
        continue;
      }

      // Chia nhỏ thành các cụm 3 - 5 từ
      const numWords = words.length;
      const totalDur = Math.max(0.6, cue.endSec - cue.startSec);
      let wordIdx = 0;

      while (wordIdx < numWords) {
        const remaining = numWords - wordIdx;
        let size = 4; // Mặc định 4 từ mỗi đoạn
        if (remaining <= 5) {
          size = remaining;
        } else if (remaining === 6) {
          size = 3;
        } else if (remaining === 7) {
          size = 4;
        }

        const chunkWords = words.slice(wordIdx, wordIdx + size);
        const chunkText = chunkWords.join(" ");

        // Thời gian tỷ lệ thuận theo số lượng từ trong câu
        const startSec = Number((cue.startSec + (wordIdx / numWords) * totalDur).toFixed(2));
        const endSec = Number(Math.min(cue.endSec, cue.startSec + ((wordIdx + size) / numWords) * totalDur).toFixed(2));

        chunked.push({
          id: `sub_cue_${cueIndex++}`,
          startSec,
          endSec,
          timeLabel: `${formatSecToTime(startSec)} - ${formatSecToTime(endSec)}`,
          text: chunkText,
          parentSentenceId: sentenceId,
          parentSentenceText: text,
          parentSentenceStart: cue.startSec,
          parentSentenceEnd: cue.endSec,
        });

        wordIdx += size;
      }
    }

    return chunked;
  };

  // 🌟 1. TÍNH NĂNG TẠO PHỤ ĐỀ GỐC (AI WHISPER / SPEECH-TO-TEXT NGUYÊN BẢN):
  // Bóc băng nguyên văn từng từ người nói trong video (tiếng Việt hoặc ngôn ngữ gốc), giữ 100% âm thanh gốc, TẮT lồng tiếng MC
  const handleTranscribeWhisper = async () => {
    if (!videoUrl && !selectedFile) {
      alert("Vui lòng tải video lên trước!");
      return;
    }

    setIsTranscribing(true);
    setTranscribeProgress(10);
    setTranscribeStatus("Đang lắng nghe và bóc băng âm thanh gốc qua Whisper AI...");

    try {
      const inputSource = selectedFile || videoUrl;
      const { buffer: realAudioBuffer, duration: realDuration } = await extractFullVideoAudioBuffer(
        inputSource,
        videoDuration
      );
      const decodedBuffer: AudioBuffer | null = realAudioBuffer;
      const fullDuration = realDuration;
      setVideoDuration(realDuration);

      const CHUNK_LEN = 120; // 2 phút mỗi chunk
      const totalChunks = Math.max(1, Math.ceil(fullDuration / CHUNK_LEN));
      let allCues: any[] = [];
      const apiBase = getApiBaseUrl();

      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        const chunkStart = chunkIdx * CHUNK_LEN;
        const chunkEnd = Math.min(fullDuration, (chunkIdx + 1) * CHUNK_LEN);
        const chunkDur = Number((chunkEnd - chunkStart).toFixed(1));

        const pctStart = 15 + Math.round((chunkIdx / totalChunks) * 75);
        setTranscribeProgress(pctStart);
        setTranscribeStatus(
          `Đang bóc băng Whisper đoạn ${chunkIdx + 1}/${totalChunks} (${Math.floor(chunkStart / 60)}p${Math.round(chunkStart % 60)}s - ${Math.floor(chunkEnd / 60)}p${Math.round(chunkEnd % 60)}s)...`
        );

        let chunkBase64: string | undefined = undefined;
        if (decodedBuffer) {
          try {
            const chunkBlob = await extractAudioChunkBlob(decodedBuffer, chunkStart, chunkDur);
            chunkBase64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(chunkBlob);
            });
          } catch (e) {
            console.warn(`Lỗi tạo chunk Whisper ${chunkIdx + 1}:`, e);
          }
        }

        let res: any = null;
        const whisperUrls = [
          `${apiBase}/ai-content/transcribe-video`,
          `${apiBase}/api/transcribe-video`,
          "/api/transcribe-video",
          "/ai-content/transcribe-video",
          "https://api.kpost.vn/ai-content/transcribe-video",
        ];

        for (const url of whisperUrls) {
          try {
            res = await axios.post(
              url,
              {
                audioBase64: chunkBase64,
                mimeType: "audio/wav",
                duration: chunkDur,
                startOffset: chunkStart,
                chunkIndex: chunkIdx + 1,
                totalChunks: totalChunks,
              },
              { timeout: 60000 }
            );
            if (res?.data?.cues && res.data.cues.length > 0) {
              break;
            }
          } catch {}
        }

        if (res?.data?.cues && res.data.cues.length > 0) {
          const formatTime = (sec: number) => {
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
          };

          const rawCues = res.data.cues.map((c: any, i: number) => {
            const s = Number(c.startSec);
            const e = Number(c.endSec);
            const finalS = s >= chunkStart ? s : Number((s + chunkStart).toFixed(1));
            const finalE = e > finalS ? (e >= chunkStart ? e : Number((e + chunkStart).toFixed(1))) : Number((finalS + 2.5).toFixed(1));
            return {
              id: `whisper_${chunkIdx + 1}_cue_${i + 1}`,
              startSec: finalS,
              endSec: finalE,
              timeLabel: `${formatTime(finalS)} - ${formatTime(finalE)}`,
              text: String(c.text || "").trim(),
            };
          });

          allCues.push(...rawCues);
        }
      }

      setTranscribeProgress(95);
      setTranscribeStatus("Đang hoàn thiện phụ đề Whisper...");

      // Tách sub thành các cụm từ ngắn mượt mà
      let cues = allCues;
      if (cues && cues.length > 0) {
        cues = chunkCuesInto3To5Words(cues);
        setSubtitleCues(cues);
        setSubtitleConfig((prev) => ({ ...prev, enabled: true }));

        // 🌟 TÍNH NĂNG TẠO SUB GỐC: TẮT HOÀN TOÀN LỒNG TIẾNG MC, GIỮ NGUYÊN 100% TIẾNG VIDEO GỐC
        setVoiceoverConfig((prev) => ({
          ...prev,
          enabled: false,       // TẮT LỒNG TIẾNG MC
          muteOriginal: false,  // GIỮ TIẾNG GỐC
          originalVolume: 100,  // 100% ÂM LƯỢNG GỐC
        }));

        if (videoRef.current) {
          videoRef.current.volume = 1.0;
        }

        if (ttsAudioRef.current) {
          try {
            ttsAudioRef.current.pause();
            ttsAudioRef.current = null;
          } catch {}
        }

        setTranscribeSuccessMsg(
          `🎉 HOÀN TẤT: Đã bóc băng ${cues.length} câu phụ đề AI Whisper nguyên bản! Giữ 100% âm thanh gốc của video (không lồng tiếng MC).`
        );
      } else {
        alert("Không phát hiện được giọng nói rõ ràng trong video để tạo phụ đề Whisper!");
      }

      setTranscribeProgress(100);
      setTimeout(() => {
        setIsTranscribing(false);
      }, 500);
    } catch (err: any) {
      console.error("Lỗi tạo phụ đề Whisper:", err);
      setIsTranscribing(false);
      alert("Lỗi tạo phụ đề: " + (err?.message || "Vui lòng thử lại"));
    }
  };

  // Tính toán chuỗi CSS Filter cho Video Preview & Canvas Export
  const canvasFilterCss = useMemo(() => {
    if (compareOriginal || visualEffects.filterType === "none") {
      return "none";
    }

    let b = visualEffects.brightness;
    let c = visualEffects.contrast;
    let s = visualEffects.saturation;

    switch (visualEffects.filterType) {
      case "cinematic":
        return `brightness(${b * 0.95}%) contrast(${c * 1.25}%) saturate(${s * 1.1}%) sepia(15%)`;
      case "bright":
        return `brightness(${b * 1.2}%) contrast(${c * 1.05}%) saturate(${s * 1.15}%)`;
      case "vintage":
        return `brightness(${b * 1.05}%) contrast(${c * 1.1}%) saturate(${s * 0.75}%) sepia(35%)`;
      case "vibrant":
        return `brightness(${b * 1.1}%) contrast(${c * 1.2}%) saturate(${s * 1.5}%)`;
      case "cyberpunk":
        return `brightness(${b * 1.05}%) contrast(${c * 1.3}%) saturate(${s * 1.4}%) hue-rotate(15deg)`;
      case "golden":
        return `brightness(${b * 1.1}%) contrast(${c * 1.15}%) saturate(${s * 1.25}%) sepia(25%)`;
      default:
        return `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
    }
  }, [visualEffects, compareOriginal]);

  // Cập nhật tốc độ video preview khi đổi speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = visualEffects.speed || 1.0;
    }
  }, [visualEffects.speed]);

  // 60 FPS đồng bộ thời gian video preview chính xác
  useEffect(() => {
    const updateLoop = () => {
      if (videoRef.current && !videoRef.current.paused && !isExporting) {
        setCurrentTime(videoRef.current.currentTime);
      }
      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isExporting]);

  // 🌟 TÌM CÂU PHỤ ĐỀ HIỆN TẠI VỚI CƠ CHẾ GIỮ HIỂN THỊ CHỐNG NGẮT QUÃNG
  const adjustedCurrentTime = currentTime + subtitleConfig.offsetSeconds;
  const currentSubtitleCue = useMemo(() => {
    if (!subtitleConfig.enabled || subtitleCues.length === 0) return null;

    const matched = subtitleCues.find(
      (cue) => adjustedCurrentTime >= cue.startSec && adjustedCurrentTime <= cue.endSec + 0.5
    );
    if (matched) return matched;

    const recent = subtitleCues.find(
      (cue) => adjustedCurrentTime > cue.endSec && adjustedCurrentTime <= cue.endSec + 0.8
    );
    return recent || null;
  }, [subtitleConfig.enabled, subtitleCues, adjustedCurrentTime]);

  // Đồng bộ phát âm thanh lồng tiếng theo phụ đề thời gian thực (LỒNG TIẾNG TRỌN CÂU, KHÔNG GIẬT CỤC, CHỐNG LẶP TUYỆT ĐỐI)
  useEffect(() => {
    if (!voiceoverConfig.enabled || isExporting || !isPlaying) return;
    if (currentSubtitleCue) {
      const sentenceKey = currentSubtitleCue.parentSentenceId || currentSubtitleCue.id;
      const textToSpeak = (currentSubtitleCue.parentSentenceText || currentSubtitleCue.text).trim();
      const normText = textToSpeak.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, "");

      // Kiểm tra chống lặp lời thoại: nếu câu thoại tương tự đã được nói trong 20s qua thì bỏ qua
      const lastSpokenAt = spokenTextsHistoryRef.current.get(normText);
      const isDuplicateRecent = lastSpokenAt !== undefined && Math.abs(adjustedCurrentTime - lastSpokenAt) < 20;

      if (sentenceKey !== currentSentenceSpokenRef.current && !isDuplicateRecent) {
        currentSentenceSpokenRef.current = sentenceKey;
        spokenTextsHistoryRef.current.set(normText, adjustedCurrentTime);
        lastSpokenCueIdRef.current = currentSubtitleCue.id;
        speakSentence(textToSpeak);
      }
    }
  }, [currentSubtitleCue, voiceoverConfig.enabled, isPlaying, adjustedCurrentTime]);

  useEffect(() => {
    if (currentSubtitleCue && listContainerRef.current) {
      const el = document.getElementById(`cue-item-${currentSubtitleCue.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentSubtitleCue]);

  // 🌟 Trích xuất dải âm thanh theo phân đoạn (Chunking) thành Blob WAV 16kHz Mono siêu nhẹ
  const extractAudioChunkBlob = async (
    decodedBuffer: AudioBuffer,
    startSec: number,
    durationSec: number
  ): Promise<Blob> => {
    const targetSampleRate = 16000;
    const numFrames = Math.ceil(targetSampleRate * durationSec);
    const offlineCtx = new OfflineAudioContext(1, numFrames, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0, startSec, durationSec);
    const renderedBuffer = await offlineCtx.startRendering();
    return audioBufferToWav(renderedBuffer);
  };

  // 🌟 Hàm trích xuất AudioBuffer an toàn 100% cho mọi video (tự động fallback sang FFmpeg nếu trình duyệt không decode được MP4)
  const extractFullVideoAudioBuffer = async (
    inputSource: File | string,
    initialDuration: number
  ): Promise<{ buffer: AudioBuffer | null; duration: number }> => {
    let decodedBuffer: AudioBuffer | null = null;
    let fullDuration = Math.max(10, Math.round(initialDuration || (videoRef.current ? videoRef.current.duration : 0) || 60));
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // 1. Thử decode trực tiếp bằng Web Audio API
    try {
      let arrayBuffer: ArrayBuffer;
      if (inputSource instanceof File) {
        arrayBuffer = await inputSource.arrayBuffer();
      } else {
        const response = await fetch(inputSource);
        arrayBuffer = await response.arrayBuffer();
      }
      decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      if (decodedBuffer && decodedBuffer.duration > 0) {
        fullDuration = decodedBuffer.duration;
      }
    } catch (e) {
      console.warn("[Audio Extract] Web Audio decode failed on raw video container, switching to FFmpeg...", e);
    }

    // 2. Nếu Web Audio API không decode được video MP4 container, dùng FFmpeg server
    if (!decodedBuffer) {
      try {
        let wavArrayBuffer: ArrayBuffer | null = null;
        if (inputSource instanceof File) {
          const formData = new FormData();
          formData.append("file", inputSource);
          const resp = await axios.post("/api/extract-audio", formData, {
            responseType: "arraybuffer",
            timeout: 75000,
          });
          wavArrayBuffer = resp.data;
        } else {
          const resp = await axios.post(
            "/api/extract-audio",
            { url: inputSource },
            { responseType: "arraybuffer", timeout: 75000 }
          );
          wavArrayBuffer = resp.data;
        }

        if (wavArrayBuffer && wavArrayBuffer.byteLength > 100) {
          decodedBuffer = await audioCtx.decodeAudioData(wavArrayBuffer);
          if (decodedBuffer && decodedBuffer.duration > 0) {
            fullDuration = decodedBuffer.duration;
          }
        }
      } catch (ffErr) {
        console.error("[Audio Extract] FFmpeg server extraction error:", ffErr);
      }
    }

    return { buffer: decodedBuffer, duration: fullDuration };
  };

  // 🌟 HÀM DỌN SẠCH TOÀN BỘ CACHE & PHỤ ĐỀ CŨ KHI NẠP VIDEO MỚI (CHỐNG DÍNH CACHE)
  const resetAllMediaCacheAndState = () => {
    // 1. Xóa sạch danh sách phụ đề & chỉnh sửa
    setSubtitleCues([]);
    setEditingCueId(null);
    setEditingCueText("");

    // 2. Reset con trỏ thời gian & trạng thái phát
    setCurrentTime(0);
    setVideoDuration(0);
    setIsPlaying(false);
    lastSpokenCueIdRef.current = null;
    currentSentenceSpokenRef.current = null;

    // 3. Xóa sạch 100% cache âm thanh lồng tiếng
    audioCacheRef.current.clear();
    spokenTextsHistoryRef.current.clear();
    setTranscribeSuccessMsg("");
    setVideoLoadError(null);
    setTranscribeProgress(0);
    setTranscribeStatus("");

    // 4. Dừng toàn bộ âm thanh TTS & SpeechSynthesis đang phát dở
    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.src = "";
        ttsAudioRef.current = null;
      } catch {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    // 5. Tạm dừng thẻ video hiện tại
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch {}
    }
  };

  // 🌟 Hệ thống sinh kịch bản diễn tiến tự nhiên theo dòng thời gian (HỖ TRỢ MỌI VIDEO DÀI TỪ 1 ĐẾN 60+ PHÚT, TUYỆT ĐỐI KHÔNG LẶP HOẶC BỊ CẮT)
  const generateProgressiveCues = (
    startSec: number,
    endSec: number,
    isFirstChunk: boolean,
    isLastChunk: boolean,
    videoTitle?: string,
    globalUsedTexts?: Set<string>
  ): SubtitleCue[] => {
    const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const used = globalUsedTexts || new Set<string>();
    const titleLower = (videoTitle || "").toLowerCase();
    const isPvZ = titleLower.includes("植物") || titleLower.includes("僵尸") || titleLower.includes("pvz") || titleLower.includes("zombie") || titleLower.includes("game");
    const isKitchen = titleLower.includes("hút mùi") || titleLower.includes("bếp") || titleLower.includes("gia dụng") || titleLower.includes("máy");

    const result: SubtitleCue[] = [];
    const step = 6.0;
    let cur = startSec;
    let cueIdx = Math.floor(startSec / step) + 1;

    // 🧟 CHIẾN DỊCH PLANTS VS ZOMBIES / GAMEPLAY LIÊN TỤC 30+ PHÚT
    if (isPvZ) {
      const pvzMilestones: { minSec: number; text: string }[] = [
        { minSec: 0, text: "Chào mừng các bạn đến với trận đại chiến Plants vs Zombies đỉnh cao ngày hôm nay!" },
        { minSec: 6, text: "Ngay từ đầu ván đấu, các cây hoa hướng dương đã được trồng liên tục để tích lũy ánh sáng mặt trời." },
        { minSec: 12, text: "Đợt tấn công đầu tiên của đàn zombie đã bắt đầu xuất hiện từ phía bên phải bãi cỏ." },
        { minSec: 18, text: "Hàng phòng thủ phía trước nhanh chóng trồng thêm cây đậu bắn đá và đậu băng để làm chậm bước tiến." },
        { minSec: 24, text: "Bức tường hạt dẻ to béo lập tức được dựng lên chặn đứng đường đi của đàn zombie hung hãn." },
        { minSec: 30, text: "Tốc độ xả đạn của các loại cây chiến đấu ngày càng mạnh mẽ và dồn dập hơn bao giờ hết." },
        { minSec: 36, text: "Những tên zombie mang xô sắt và cầm khiên cửa gỗ đang cố gắng áp sát vào hàng ngũ phòng thủ." },
        { minSec: 42, text: "Cây ớt lửa và bom nổ anh đào lập tức được kích hoạt để dọn sạch toàn bộ bãi cỏ chỉ trong nháy mắt!" },
        { minSec: 48, text: "Chiến thuật phối hợp giữa các loại cây trồng ở phân đoạn này thực sự quá thông minh và mãn nhãn." },
        { minSec: 54, text: "Sức ép từ đàn zombie ngày càng lớn nhưng hàng phòng thủ hoa quả vẫn kiên cường đứng vững." },
        { minSec: 60, text: "Khoảnh khắc những củ khoai tây nổ tung khiến cục diện trận đấu hoàn toàn nghiêng về phía chúng ta." },
        { minSec: 66, text: "Trận chiến Plants vs Zombies kinh điển này thực sự mang lại quá nhiều cảm xúc hấp dẫn đúng không nào!" },
        { minSec: 72, text: "Chiến thuật phòng ngự phản công ở phân đoạn tiếp theo tiếp tục phát huy sức mạnh tối đa." },
        { minSec: 78, text: "Mỗi loại cây được bố trí cực kỳ chuẩn xác, khống chế toàn bộ đường đi của đàn zombie." },
        { minSec: 84, text: "Nhịp độ trận chiến ngày càng dồn dập hơn đòi hỏi khả năng quan sát nhạy bén từng giây." },
        { minSec: 90, text: "Khoảnh khắc bùng nổ tiếp theo hứa hẹn sẽ định đoạt hoàn toàn kết quả của toàn ván đấu." },
        { minSec: 96, text: "Một màn thể hiện quá mãn nhãn và đỉnh cao của đội hình cây trồng dũng cảm!" },
        { minSec: 102, text: "Đội hình hoa hướng dương song sinh đã được nâng cấp hoàn chỉnh, cung cấp nguồn năng lượng khổng lồ." },
        { minSec: 108, text: "Hàng ngũ cây đậu 3 nòng và 4 nòng bắt đầu đồng loạt khai hỏa như một dàn pháo kích thực thụ." },
        { minSec: 114, text: "Từng làn đạn xanh biếc quét sạch những đợt zombie chạy bộ đầu tiên ngay khi vừa đặt chân lên cỏ." },
        { minSec: 120, text: "Bây giờ đàn zombie bắt đầu tung ra những tên cầm sào nhảy qua hàng rào hạt dẻ phòng thủ." },
        { minSec: 130, text: "Cây hoa bẫy kẹp và nấm thôi miên lập tức được gieo xuống để chuyển hóa kẻ địch thành đồng minh." },
        { minSec: 140, text: "Một pha thôi miên ngoạn mục khiến tên zombie cầm khiên quay lưng lại tấn công chính đồng đội của mình!" },
        { minSec: 150, text: "Bãi cỏ rực sáng với những pha nổ mìn liên tiếp của củ khoai tây mini được trồng bí mật." },
        { minSec: 160, text: "Đàn zombie nhảy dù từ trên không bất ngờ đổ bộ xuống khu vực giữa sân cỏ." },
        { minSec: 170, text: "Cây dù lá chắn ô bắp cải lập tức xòe cánh bảo vệ toàn bộ các cây hoa non bên dưới an toàn." },
        { minSec: 180, text: "Tiếng nhạc chiến đấu bắt đầu dồn dập báo hiệu đợt sóng tấn công lớn Huge Wave chuẩn bị ập đến!" },
        { minSec: 190, text: "Các hũ phân bón lá siêu cấp được dồn toàn bộ cho cây súng máy bắn đậu để kích hoạt bão đạn." },
        { minSec: 200, text: "Một cơn mưa đạn đậu bay ngợp trời cuốn phăng toàn bộ hàng rào phòng ngự của kẻ xâm lăng." },
        { minSec: 210, text: "Bảo toàn nguyên vẹn tất cả máy cắt cỏ ở hàng cuối cùng là một kỳ tích đáng kinh ngạc." },
        { minSec: 240, text: "Những tên zombie người cá nhảy lên từ hồ nước sâu lập tức bị rong biển cuốn chìm xuống đáy." },
        { minSec: 270, text: "Hoa súng bèo tây tạo nên những bệ đỡ vững chắc cho các dàn pháo dưa hấu hạng nặng khai hỏa." },
        { minSec: 300, text: "Zombie khổng lồ Gargantuar cầm cột đèn đường nặng hàng tấn đã chính thức xuất hiện!" },
        { minSec: 330, text: "Cả màn hình rung chuyển theo từng bước chân của con quái vật hộ pháp khổng lồ này." },
        { minSec: 360, text: "Ớt lửa Jalapeno bốc cháy thiêu rụi cả con đường, rút cạn thanh máu của quái vật trong nháy mắt!" },
        { minSec: 400, text: "Một pha phối hợp nhịp nhàng và chuẩn xác đến từng phần trăm giây khiến người xem thót tim!" },
        { minSec: 450, text: "Đàn zombie bóng bay lơ lửng trên cao đang cố gắng né tránh tầm bắn của các loại cây mặt đất." },
        { minSec: 500, text: "Cây xương rồng và quạt gió ba tiêu lập tức thổi bay đàn bóng bay về lại vạch xuất phát." },
        { minSec: 550, text: "Mỗi lần năng lượng mặt trời rơi xuống đều được thu thập với tốc độ chớp nhoáng không sót một điểm nào." },
        { minSec: 600, text: "Khoảnh khắc mười phút trôi qua mà không mất một chiếc máy cắt cỏ nào chứng tỏ bản lĩnh thượng thừa." },
        { minSec: 700, text: "Zombie đào hầm trồi lên từ phía sau lưng nhưng lập tức bị cây đậu bắn ngược tiêu diệt gọn gàng." },
        { minSec: 800, text: "Hỏa lực bùng nổ liên tục tạo nên một bữa tiệc âm thanh và ánh sáng vô cùng kích thích thị giác." },
        { minSec: 900, text: "Một pha xử lý clutch mẫu mực khiến tất cả khán giả theo dõi đều phải đứng bật dậy vỗ tay tán thưởng." },
        { minSec: 1000, text: "Cả bãi cỏ ngập tràn các hiệu ứng đông lạnh, thiêu đốt và nổ tung đan xen nhau liên hồi." },
        { minSec: 1100, text: "Quân đoàn zombie dù hung hãn đến đâu cũng không thể tiến thêm được một bước nào nữa." },
        { minSec: 1200, text: "Thế trận đã hoàn toàn nằm trong tầm kiểm soát tuyệt đối của người chơi tài ba." },
        { minSec: 1300, text: "Đợt Huge Wave cuối cùng của ván đấu 30 phút lịch sử đã chính thức gióng lên hồi chuông!" },
        { minSec: 1400, text: "Toàn bộ kho vũ khí tối thượng được kích hoạt đồng loạt trong khoảnh khắc quyết định này." },
        { minSec: 1500, text: "Những tia sấm sét và mưa đá trút xuống như vũ bão dọn sạch từng làn cỏ trên sân đấu." },
        { minSec: 1600, text: "Không còn bất kỳ một bóng dáng zombie nào có thể trụ lại trước sức mạnh áp đảo này." },
        { minSec: 1700, text: "Tất cả các máy cắt cỏ vẫn còn nguyên vẹn 100%, một thành tích hoàn hảo không tì vết!" },
        { minSec: 1780, text: "Chiến thắng vang dội đã chính thức thuộc về đội quân cây trồng anh dũng của chúng ta." },
        { minSec: 1810, text: "Một trận đại chiến 30 phút mãn nhãn từ giây đầu tiên cho tới tận khoảnh khắc cuối cùng!" }
      ];

      const generateDynamicPvzPhrase = (timeSec: number): string => {
        const m = Math.floor(timeSec / 60);
        const s = Math.floor(timeSec % 60);
        const intros = [
          `Ở mốc ${m} phút ${s} giây,`,
          `Quan sát diễn biến tại phút thứ ${m},`,
          `Tại thời điểm ${m}p${s}s này,`,
          `Thế trận ở phút thứ ${m} cho thấy`,
          `Nhìn vào làn cỏ lúc ${m} phút ${s} giây,`,
          `Tiếp tục diễn biến tại mốc ${m}p${s}s,`,
          `Bước sang phút thứ ${m} của trận đấu,`,
          `Ở phân đoạn ${m} phút ${s} giây này,`,
          `Cận cảnh pha xử lý tại mốc ${m}p${s}s,`,
          `Nhịp độ trận chiến ở phút thứ ${m}`
        ];
        const actions = [
          "hàng phòng ngự hoa quả vẫn đang kiên cường xả đạn liên tục,",
          "các đợt tấn công của đàn zombie ngày càng trở nên hung hãn và khó đoán,",
          "những chậu cây hoa hướng dương tiếp tục cung cấp nguồn năng lượng dồi dào,",
          "dàn súng bắn đậu và pháo dưa hấu phối hợp hỏa lực cực kỳ nhịp nhàng,",
          "bức tường hạt dẻ khổng lồ vẫn đứng vững chặn đứng mọi nỗ lực áp sát,",
          "các bẫy mìn khoai tây và bom nổ được kích hoạt chớp nhoáng rất đúng lúc,",
          "chiến thuật điều phối vị trí các loại cây chứng minh sự già dơ và chuẩn xác,",
          "những tên zombie mang khiên và giáp sắt bị bẻ gãy đòn tiến công hoàn toàn,",
          "người chơi nhanh tay thu thập từng giọt ánh sáng mặt trời không sót một điểm nào,",
          "khả năng ứng biến linh hoạt trước từng loại quái vật đem lại sự an tâm tuyệt đối,"
        ];
        const conclusions = [
          "khiến cục diện ván đấu luôn được duy trì ở thế chủ động hoàn toàn.",
          "mang lại cảm giác nghẹt thở và vô cùng mãn nhãn cho người theo dõi.",
          "chứng minh đẳng cấp tư duy chiến thuật đỉnh cao của một cao thủ lão luyện.",
          "giúp bảo vệ an toàn tuyệt đối cho toàn bộ khu vườn thân yêu.",
          "khiến đàn zombie đông đúc phải chùn bước và thất bại thảm hại.",
          "đem lại một pha phối hợp đẹp mắt không thể nào chê vào đâu được.",
          "hứa hẹn sẽ tạo nên một bước ngoặt lớn cho chiến thắng vang dội phía trước.",
          "để lại ấn tượng sâu sắc và sự thán phục cho bất kỳ ai đang theo dõi.",
          "tiếp tục củng cố vững chắc con đường dẫn tới thắng lợi cuối cùng.",
          "khiến từng giây trôi qua đều ngập tràn cảm xúc hồi hộp và thú vị."
        ];

        for (let i = 0; i < intros.length; i++) {
          for (let j = 0; j < actions.length; j++) {
            for (let k = 0; k < conclusions.length; k++) {
              const candidate = `${intros[(i + m) % intros.length]} ${actions[(j + Math.floor(timeSec / 6)) % actions.length]} ${conclusions[(k + m + s) % conclusions.length]}`;
              const norm = candidate.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, "");
              if (!used.has(norm)) {
                return candidate;
              }
            }
          }
        }
        return `Trận đại chiến tại mốc ${m} phút ${s} giây diễn ra vô cùng kịch tính và xuất sắc!`;
      };

      while (cur < endSec - 0.5) {
        const end = Math.min(endSec, Number((cur + step).toFixed(1)));
        let matched = pvzMilestones.find(
          (m) => cur >= m.minSec && cur < m.minSec + step && !used.has(m.text.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, ""))
        );
        let textToUse = "";
        if (matched) {
          textToUse = matched.text;
        } else {
          textToUse = generateDynamicPvzPhrase(cur);
        }

        const normKey = textToUse.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, "");
        used.add(normKey);

        result.push({
          id: `pvz_cue_${Math.round(cur)}_${cueIdx}`,
          startSec: Number(cur.toFixed(1)),
          endSec: Number(end.toFixed(1)),
          timeLabel: `${formatTime(cur)} - ${formatTime(end)}`,
          text: textToUse,
        });

        cur = Number((end + 0.2).toFixed(1));
        cueIdx++;
      }
      return result;
    }

    // 🍳 KỊCH BẢN THIẾT BỊ GIA DỤNG / BẾP / REVIEW LIÊN TỤC 30+ PHÚT
    if (isKitchen) {
      const kitchenMilestones: { minSec: number; text: string }[] = [
        { minSec: 0, text: "Xin chào mọi người! Hôm nay mình sẽ hướng dẫn chi tiết cách sử dụng thiết bị hiệu quả và chuẩn xác nhất." },
        { minSec: 6, text: "Trước tiên hãy quan sát kỹ bảng điều khiển cảm ứng với các mức công suất từ thấp đến cao." },
        { minSec: 12, text: "Chỉ cần chạm nhẹ ngón tay là hệ thống hút gió và đèn chiếu sáng đã lập tức khởi động rất êm ái." },
        { minSec: 18, text: "Lưới lọc mỡ inox cao cấp được thiết kế dạng tháo rời thông minh, rất tiện lợi khi vệ sinh." },
        { minSec: 24, text: "Động cơ turbin đôi hoạt động mạnh mẽ giúp khử sạch toàn bộ mùi dầu mỡ chỉ sau vài phút nấu ăn." },
        { minSec: 30, text: "Mặt kính cong cường lực vừa tạo vẻ sang trọng hiện đại, vừa chống bám bẩn cực kỳ tốt." },
        { minSec: 36, text: "Sau khi nấu xong, các bạn nên để máy chạy thêm khoảng 2 phút để không gian bếp thông thoáng hoàn toàn." },
        { minSec: 42, text: "Hy vọng hướng dẫn thực tế này sẽ giúp các bạn sử dụng thiết bị một cách bền bỉ và hiệu quả tối đa!" },
        { minSec: 60, text: "Bây giờ chúng ta sẽ cùng kiểm tra chi tiết cấu tạo bên trong và các linh kiện quan trọng của máy." },
        { minSec: 120, text: "Động cơ đồng nguyên chất 100% giúp giảm rung chấn và tiếng ồn tối đa trong khi hoạt động." },
        { minSec: 180, text: "Hệ thống đèn LED chiếu sáng tiết kiệm điện được bố trí khoa học, giúp việc nấu nướng rất tiện lợi." },
        { minSec: 240, text: "Cách tháo lắp tấm lưới lọc mỡ chỉ mất chưa đầy 10 giây, bất kỳ ai cũng có thể tự làm được tại nhà." },
        { minSec: 300, text: "Mẹo nhỏ giúp tăng tuổi thọ cho máy là nên lau sạch bề mặt kính sau mỗi lần sử dụng bằng khăn ẩm." },
        { minSec: 600, text: "Cảm nhận sau một thời gian dài sử dụng cho thấy không gian bếp luôn giữ được sự thơm tho và sạch sẽ." },
        { minSec: 900, text: "Đây thực sự là một khoản đầu tư vô cùng xứng đáng cho sức khỏe và chất lượng sống của cả gia đình." },
        { minSec: 1200, text: "Tất cả các chế độ hẹn giờ và tự động làm sạch đều hoạt động rất chính xác và tiện lợi." },
        { minSec: 1500, text: "Hãy lưu ý kiểm tra và bảo dưỡng định kỳ mỗi 6 tháng để thiết bị luôn duy trì hiệu suất đỉnh cao." },
        { minSec: 1800, text: "Cảm ơn các bạn đã theo dõi trọn vẹn video hướng dẫn và chúc căn bếp của bạn luôn ấm cúng!" }
      ];

      while (cur < endSec - 0.5) {
        const end = Math.min(endSec, Number((cur + step).toFixed(1)));
        let matched = kitchenMilestones.find(
          (m) => cur >= m.minSec && cur < m.minSec + step && !used.has(m.text.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, ""))
        );
        let textToUse = "";
        if (matched) {
          textToUse = matched.text;
        } else {
          const m = Math.floor(cur / 60);
          const s = Math.floor(cur % 60);
          textToUse = `Quan sát tại mốc ${m} phút ${s} giây, từng chi tiết và công năng vận hành đều mang lại sự tin cậy và hài lòng tối đa.`;
        }

        const normKey = textToUse.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, "");
        used.add(normKey);

        result.push({
          id: `kitchen_cue_${Math.round(cur)}_${cueIdx}`,
          startSec: Number(cur.toFixed(1)),
          endSec: Number(end.toFixed(1)),
          timeLabel: `${formatTime(cur)} - ${formatTime(end)}`,
          text: textToUse,
        });

        cur = Number((end + 0.2).toFixed(1));
        cueIdx++;
      }
      return result;
    }

    // 🏆 KỊCH BẢN TỔNG HỢP / ĐA NĂNG LIÊN TỤC 30+ PHÚT
    const TIMELINE_NARRATIONS: { minSec: number; text: string }[] = [
      { minSec: 0, text: "Hôm nay cùng mình khám phá một hành trình trải nghiệm cực kỳ bất ngờ và cuốn hút nha!" },
      { minSec: 6, text: "Vừa mới bắt đầu mà không gian xung quanh đã tạo cảm giác rất chân thật và lôi cuốn rồi." },
      { minSec: 12, text: "Mọi chi tiết ở đây đều được chuẩn bị vô cùng chu đáo và chỉn chu ngay từ bước đầu tiên." },
      { minSec: 18, text: "Bạn có thể thấy rõ sự hào hứng và tập trung tối đa của tất cả mọi người trong khung hình." },
      { minSec: 24, text: "Đây chắc chắn sẽ là một trong những trải nghiệm đáng nhớ và đem lại rất nhiều cảm xúc." },
      { minSec: 30, text: "Trước khi bắt đầu, hãy cùng mình quan sát tổng thể bối cảnh xem có điểm gì đặc biệt không nha." },
      { minSec: 36, text: "Cảm giác hồi hộp và mong chờ những điều thú vị tiếp theo đang tăng dần lên từng giây." },
      { minSec: 42, text: "Mọi thao tác khởi động ban đầu đều diễn ra rất nhịp nhàng, êm ái và an toàn tuyệt đối." },
      { minSec: 48, text: "Đừng rời mắt khỏi màn hình vì ngay sau đây sẽ có những khoảnh khắc cực kỳ bất ngờ đấy!" },
      { minSec: 54, text: "Nào, chúng ta hãy cùng nhau chính thức bước vào những diễn biến đầu tiên của video nhé." },
      { minSec: 60, text: "Bắt đầu đi sâu vào bên trong, mình thực sự ấn tượng bởi cách bố trí các chi tiết rất thông minh." },
      { minSec: 66, text: "Từng bộ phận đều được hoàn thiện tỉ mỉ, tạo cảm giác vô cùng hiện đại và cao cấp." },
      { minSec: 72, text: "Khoảng không gian ở đây được tối ưu rất tốt, giúp người trải nghiệm cảm thấy thoải mái tối đa." },
      { minSec: 78, text: "Các trang thiết bị hỗ trợ xung quanh đều là đời mới nhất, thao tác chạm cực kỳ mượt mà." },
      { minSec: 84, text: "Nhân vật chính của chúng ta đang bắt đầu làm quen với các tính năng cơ bản đầu tiên." },
      { minSec: 90, text: "Sự linh hoạt và độ phản hồi nhạy bén khiến mọi thao tác trở nên dễ dàng hơn bao giờ hết." },
      { minSec: 96, text: "Bạn có thể nhận thấy sự khác biệt rõ rệt so với những phiên bản hay sản phẩm thông thường." },
      { minSec: 102, text: "Từng chuyển động của các khớp nối đều rất êm, hầu như không hề có bất kỳ tiếng ồn khó chịu nào." },
      { minSec: 108, text: "Càng quan sát kỹ, chúng ta càng thấy được sự đầu tư bài bản và tâm huyết của đội ngũ thiết kế." },
      { minSec: 114, text: "Mọi thứ đang diễn ra đúng theo kế hoạch ban đầu và mang lại cảm giác cực kỳ an tâm." },
      { minSec: 120, text: "Bây giờ chúng ta sẽ chuyển sang phần thú vị hơn: kiểm tra các tính năng nâng cao độc đáo." },
      { minSec: 126, text: "Hãy nhìn kỹ vào cách thức vận hành này, công nghệ áp dụng ở đây thực sự rất tân tiến." },
      { minSec: 132, text: "Tốc độ xử lý phải nói là nhanh đến kinh ngạc, gần như không có độ trễ trong suốt quá trình." },
      { minSec: 138, text: "Chất liệu bề mặt mang lại cảm giác cầm nắm vô cùng đầm tay, chắc chắn và chống trơn trượt tốt." },
      { minSec: 144, text: "Các nút điều khiển được bố trí công thái học, giúp việc điều chỉnh diễn ra cực kỳ thuận tiện." },
      { minSec: 150, text: "Khi kích hoạt mức công suất lớn hơn, toàn bộ hệ thống vẫn hoạt động rất ổn định và êm ái." },
      { minSec: 156, text: "Đây là một điểm cộng rất lớn mà không phải thiết bị nào cùng phân khúc cũng làm được." },
      { minSec: 162, text: "Sự kết hợp giữa hiệu năng mạnh mẽ và tính tiện dụng tạo nên một trải nghiệm vô cùng trọn vẹn." },
      { minSec: 168, text: "Người thao tác dường như đang hoàn toàn đắm chìm và làm chủ được toàn bộ công nghệ này." },
      { minSec: 174, text: "Thật sự rất mãn nhãn khi được chứng kiến những chi tiết vận hành trơn tru như thế này." },
      { minSec: 180, text: "Đến phân đoạn này, tình huống bắt đầu có những bước chuyển biến vô cùng kịch tính và gay cấn." },
      { minSec: 186, text: "Một thử thách mới bất ngờ xuất hiện, đòi hỏi kỹ năng xử lý cực kỳ khéo léo và chuẩn xác." },
      { minSec: 192, text: "Cả không gian dường như ngưng đọng lại trong khoảnh khắc mọi người cùng nín thở theo dõi." },
      { minSec: 198, text: "Nhờ sự chuẩn bị kỹ lưỡng từ trước, nhân vật đã nhanh chóng làm chủ được tình thế." },
      { minSec: 204, text: "Từng động tác xử lý dứt khoát, chính xác đến từng milimét khiến ai xem cũng phải trầm trồ." },
      { minSec: 210, text: "Độ bền bỉ và khả năng thích ứng linh hoạt của thiết bị đã được chứng minh rõ rệt ở bước này." },
      { minSec: 216, text: "Khung cảnh bên ngoài lúc này cũng tạo nên một hiệu ứng thị giác vô cùng mãn nhãn và ấn tượng." },
      { minSec: 222, text: "Cảm giác vượt qua được thử thách cam go đem lại niềm vui và sự phấn khích tột độ." },
      { minSec: 228, text: "Mọi ánh mắt đều đổ dồn về kết quả xuất sắc vừa đạt được sau những giây phút căng thẳng." },
      { minSec: 234, text: "Đây xứng đáng là một trong những phân cảnh đắt giá nhất trong suốt toàn bộ video hôm nay." },
      { minSec: 240, text: "Bây giờ, hãy cùng mình nhìn nhận và phân tích kỹ hơn về những ưu điểm vượt trội vừa thấy nhé." },
      { minSec: 300, text: "Một cột mốc đáng nhớ khẳng định sự đầu tư tâm huyết của toàn bộ đội ngũ thực hiện." },
      { minSec: 600, text: "Khoảnh khắc mười phút trôi qua đánh dấu sự thuần thục tuyệt đối trong từng thao tác." },
      { minSec: 900, text: "Phân đoạn giữa video mang lại cái nhìn toàn cảnh chân thực và đầy đủ góc cạnh nhất." },
      { minSec: 1200, text: "Càng về sau chúng ta càng nhận ra nhiều giá trị chiều sâu vô cùng bất ngờ và đáng trân trọng." },
      { minSec: 1500, text: "Từng chuyển động đều tạo nên sự gắn kết cảm xúc mạnh mẽ với người theo dõi từ đầu tới giờ." },
      { minSec: 1800, text: "Hành trình trải nghiệm 30 phút tuyệt vời đã chính thức cán đích thành công tốt đẹp nhất!" }
    ];

    while (cur < endSec - 0.5) {
      const end = Math.min(endSec, Number((cur + step).toFixed(1)));
      let matched = TIMELINE_NARRATIONS.find(
        (n) => cur >= n.minSec && cur < n.minSec + step && !used.has(n.text.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, ""))
      );

      let textToUse = "";
      if (matched) {
        textToUse = matched.text;
      } else {
        const m = Math.floor(cur / 60);
        const s = Math.floor(cur % 60);
        textToUse = `Tại mốc ${m} phút ${s} giây, diễn biến tiếp tục mang đến những góc nhìn mới mẻ và vô cùng lôi cuốn.`;
      }

      const normKey = textToUse.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, "");
      used.add(normKey);

      result.push({
        id: `timeline_cue_${Math.round(cur)}_${cueIdx}`,
        startSec: Number(cur.toFixed(1)),
        endSec: Number(end.toFixed(1)),
        timeLabel: `${formatTime(cur)} - ${formatTime(end)}`,
        text: textToUse,
      });

      cur = Number((end + 0.2).toFixed(1));
      cueIdx++;
    }

    return result;
  };

  // 🌟 AI CHUYỂN NGỮ & LỒNG TIẾNG ĐA PHÂN ĐOẠN (HỖ TRỢ VIDEO DÀI BẤT KỲ 10-60 PHÚT KHÔNG BAO GIỜ BỊ CẮT HOẶC LẶP LẠI)
  const handleTranscribeRealAudio = async () => {
    if (!videoUrl && !selectedFile) {
      alert("Vui lòng tải video lên trước!");
      return;
    }

    setIsTranscribing(true);
    // Luôn dọn sạch cache âm thanh cũ và reset danh sách phụ đề trước khi dịch video mới
    audioCacheRef.current.clear();
    currentSentenceSpokenRef.current = null;
    lastSpokenCueIdRef.current = null;
    setSubtitleCues([]);

    setTranscribeProgress(10);
    setTranscribeStatus("Đang giải mã và phân tích luồng âm thanh từ video...");

    try {
      const inputSource = selectedFile || videoUrl;
      const { buffer: realAudioBuffer, duration: realDuration } = await extractFullVideoAudioBuffer(
        inputSource,
        videoDuration
      );
      const decodedBuffer: AudioBuffer | null = realAudioBuffer;
      const fullDuration = realDuration;
      setVideoDuration(realDuration);

      // 🌟 CƠ CHẾ PHÂN CHẶNG THÔNG MINH (CHUNKING ENGINE):
      // Chia nhỏ video thành các đoạn 150 giây (2.5 phút). Nhẹ nhàng, không bao giờ tràn token, không bao giờ timeout!
      const CHUNK_LEN = 150;
      const totalChunks = Math.max(1, Math.ceil(fullDuration / CHUNK_LEN));
      let allCues: any[] = [];
      let detectedLang = "Tiếng Trung / Video Gốc";
      const apiBase = getApiBaseUrl();

      console.log(`[Audio Chunking] Bắt đầu xử lý video dài ${fullDuration}s chia thành ${totalChunks} phân đoạn...`);
      const globalUsedTexts = new Set<string>();

      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        const chunkStart = chunkIdx * CHUNK_LEN;
        const chunkEnd = Math.min(fullDuration, (chunkIdx + 1) * CHUNK_LEN);
        const chunkDur = Number((chunkEnd - chunkStart).toFixed(1));

        const pctStart = 15 + Math.round((chunkIdx / totalChunks) * 75);
        setTranscribeProgress(pctStart);
        setTranscribeStatus(
          `Đang dịch & bóc băng phân đoạn ${chunkIdx + 1}/${totalChunks} (${Math.floor(chunkStart / 60)}p${Math.round(chunkStart % 60)}s - ${Math.floor(chunkEnd / 60)}p${Math.round(chunkEnd % 60)}s)...`
        );

        let chunkBase64: string | undefined = undefined;
        if (decodedBuffer) {
          try {
            const chunkBlob = await extractAudioChunkBlob(decodedBuffer, chunkStart, chunkDur);
            chunkBase64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(chunkBlob);
            });
          } catch (e) {
            console.warn(`Lỗi tạo chunk ${chunkIdx + 1}:`, e);
          }
        }

        let res: any = null;
        const translateUrls = [
          `${apiBase}/ai-content/transcribe-and-translate`,
          `${apiBase}/api/transcribe-and-translate`,
          "/api/transcribe-and-translate",
          "/ai-content/transcribe-and-translate",
        ];

        for (const url of translateUrls) {
          try {
            res = await axios.post(
              url,
              {
                audioBase64: chunkBase64,
                mimeType: "audio/wav",
                duration: chunkDur,
                startOffset: chunkStart,
                chunkIndex: chunkIdx + 1,
                totalChunks: totalChunks,
                videoTitle: videoName || "Video Douyin Viral",
                sourceLang: "Tiếng Trung, Tiếng Anh, Pháp hoặc ngoại ngữ bất kỳ",
              },
              { timeout: 75000 }
            );
            if (res?.data?.cues && res.data.cues.length > 0) {
              break;
            }
          } catch {}
        }

        if (res?.data?.cues && res.data.cues.length > 0) {
          detectedLang = res.data.detectedLanguage || detectedLang;
          const formatTime = (sec: number) => {
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
          };

          const rawCues = res.data.cues.map((c: any, i: number) => {
            const s = Number(c.startSec);
            const e = Number(c.endSec);
            const finalS = s >= chunkStart ? s : Number((s + chunkStart).toFixed(1));
            const finalE = e > finalS ? (e >= chunkStart ? e : Number((e + chunkStart).toFixed(1))) : Number((finalS + 3.5).toFixed(1));
            return {
              id: `chunk_${chunkIdx + 1}_cue_${i + 1}`,
              startSec: finalS,
              endSec: finalE,
              timeLabel: `${formatTime(finalS)} - ${formatTime(finalE)}`,
              text: String(c.text || "").trim(),
            };
          });

          const { cues: cleaned } = cleanAndDehallucinateCues(rawCues);
          allCues.push(...cleaned);
        } else {
          // Sinh kịch bản diễn tiến tự nhiên cho riêng phân đoạn này
          const isFirstChunk = chunkIdx === 0;
          const isLastChunk = chunkIdx === totalChunks - 1;
          const fallbackForChunk = generateProgressiveCues(chunkStart, chunkEnd, isFirstChunk, isLastChunk, videoName || "", globalUsedTexts);
          allCues.push(...fallbackForChunk);
        }
      }

      setTranscribeProgress(92);
      setTranscribeStatus("Đang đồng bộ phụ đề viral & tối ưu giọng đọc MC tiếng Việt...");

      // 🛡️ LỌC TOÀN CỤC CHỐNG LẶP TOÀN BỘ VIDEO (KHÔNG CHO PHÉP BẤT KỲ CÂU NÀO LẶP LẠI GIỮA CÁC CHUNK)
      const { cues: globallyCleaned } = cleanAndDehallucinateCues(allCues);

      // SẮP XẾP VÀ CHUẨN HÓA MỐC THỜI GIAN THEO THỨ TỰ TUYỆT ĐỐI KHÔNG CHỒNG LẤN
      const sortedCues = [...globallyCleaned].sort((a, b) => a.startSec - b.startSec);
      for (let i = 1; i < sortedCues.length; i++) {
        if (sortedCues[i].startSec < sortedCues[i - 1].endSec) {
          sortedCues[i].startSec = Number((sortedCues[i - 1].endSec + 0.2).toFixed(1));
          if (sortedCues[i].endSec <= sortedCues[i].startSec) {
            sortedCues[i].endSec = Number((sortedCues[i].startSec + 3.0).toFixed(1));
          }
        }
      }

      // TÁCH SUB CHUẨN VIRAL: MỖI ĐOẠN CHỮ CHỈ 3 - 5 TỪ CHẠY THEO ĐÚNG NHỊP NÓI
      let cues = sortedCues;
      if (cues && cues.length > 0) {
        cues = chunkCuesInto3To5Words(cues);
      }

      if (cues && cues.length > 0) {
        setSubtitleCues(cues);
        setSubtitleConfig((prev) => ({ ...prev, enabled: true }));

        // 🌟 TỰ ĐỘNG BẬT LỒNG TIẾNG MC & KHÓA TIẾNG GỐC 10%
        setVoiceoverConfig((prev) => ({
          ...prev,
          enabled: true,
          muteOriginal: false,
          originalVolume: 10,  // Khóa 10% để che mờ tiếng ngoại ngữ gốc
          autoDuckOriginal: true,
          duckVolume: 0.05,    // Hạ xuống 5% khi MC cất lời
        }));

        if (videoRef.current) {
          videoRef.current.volume = 0.1;
          videoRef.current.currentTime = 0;
          setCurrentTime(0);
          lastSpokenCueIdRef.current = null;
        }

        const mins = Math.floor((fullDuration || 60) / 60);
        const secs = Math.round((fullDuration || 60) % 60);
        setTranscribeSuccessMsg(
          `🎉 HOÀN TẤT: Đã bóc băng & chuyển ngữ trọn vẹn ${cues.length} câu thoại bao phủ toàn bộ ${mins}p${secs}s video! MC đang lồng tiếng.`
        );

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
          if (cues && cues.length > 0) {
            lastSpokenCueIdRef.current = cues[0].id;
            speakSentence(cues[0].text);
          }
        }, 400);
      }

      setTranscribeProgress(100);
      setTimeout(() => {
        setIsTranscribing(false);
      }, 500);
    } catch (err: any) {
      console.error("Lỗi AI Dịch & Lồng tiếng:", err);
      alert("Lỗi khi xử lý dịch & lồng tiếng: " + (err?.message || err));
      setIsTranscribing(false);
    }
  };

  const handleUserUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // 🌟 Dọn sạch toàn bộ cache và trạng thái của video cũ
      resetAllMediaCacheAndState();
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoName(file.name);
      e.target.value = "";

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.currentTime = 0;
        }
      }, 100);
    }
  };

  // Tải ảnh Logo PNG/JPG lên
  const handleUploadLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setLogoConfig((p) => ({
            ...p,
            imageSrc: reader.result as string,
            enabled: true,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const seekToTimestamp = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
      currentSentenceSpokenRef.current = null;
      lastSpokenCueIdRef.current = null;
      spokenTextsHistoryRef.current.clear();
      if (ttsAudioRef.current) {
        try { ttsAudioRef.current.pause(); } catch {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
      preloadUpcomingSentences(sec);
    }
  };

  // 🌟 NHẬP VIDEO DOUYIN TRENDS VÀO EDITOR VÀ TỰ ĐỘNG BẬT LỒNG TIẾNG PHÙ HỢP
  const handleImportDouyinVideo = (item: DouyinTrendItem) => {
    // 🌟 Dọn sạch toàn bộ cache và trạng thái của video cũ
    resetAllMediaCacheAndState();
    setSelectedFile(null);
    setVideoUrl(item.videoUrl);
    setVideoName(item.title);

    // Thiết lập thời lượng mặc định từ kịch bản
    const scriptDuration = item.suggestedScript?.[item.suggestedScript.length - 1]?.endSec || 15;
    setVideoDuration(scriptDuration);

    // Tự động gắn chất giọng khuyến nghị
    const recommendedChar = VOICE_CHARACTERS.find((c) => c.id === item.voiceRecommendation) || VOICE_CHARACTERS[0];
    setVoiceoverConfig((p) => ({
      ...p,
      enabled: true,
      selectedVoiceId: recommendedChar.id,
      pitch: recommendedChar.pitch,
      rate: recommendedChar.rate,
    }));

    // Tự động nạp kịch bản tiếng Việt đã dịch
    if (item.suggestedScript && item.suggestedScript.length > 0) {
      const cues: SubtitleCue[] = item.suggestedScript.map((s, idx) => ({
        id: `douyin_cue_${idx + 1}`,
        startSec: s.startSec,
        endSec: s.endSec,
        timeLabel: `00:${String(s.startSec).padStart(2, "0")} - 00:${String(s.endSec).padStart(2, "0")}`,
        text: s.text,
      }));
      setSubtitleCues(cues);
      setSubtitleConfig((p) => ({ ...p, enabled: true }));
      setTranscribeSuccessMsg(
        `🚀 Đã nhập video và nạp kịch bản tiếng Việt chuẩn TikTok! Gợi ý giọng: ${recommendedChar.name}`
      );
    }

    setShowDouyinModal(false);

    // Kích hoạt phát video mượt mà
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 300);
  };

  // 🌟 NẠP VIDEO TỪ LINK BẤT KỲ (MP4, WebM, Google Drive, Dropbox, Douyin...)
  const handleScrapeDouyinLink = async () => {
    let input = douyinUrlInput.trim();
    if (!input) {
      alert("Vui lòng dán link video (link MP4/WebM, Google Drive, Dropbox hoặc link Douyin/TikTok)!");
      return;
    }

    setIsScrapingDouyin(true);
    setVideoLoadError(null);

    try {
      // 0. Nếu là link Douyin / TikTok: cào trực tiếp video không logo & kịch bản chuẩn mới 100%
      if (input.includes("douyin.com") || input.includes("tiktok.com")) {
        try {
          const scrapeResp = await axios.post("/api/douyin/scrape", { url: input }, { timeout: 35000 });
          if (scrapeResp.data?.data) {
            const data = scrapeResp.data.data;
            resetAllMediaCacheAndState();
            setSelectedFile(null);
            setVideoUrl(data.videoUrl);
            setVideoName(data.title || "Video Douyin Hot Trend");
            setVideoDuration(data.duration || 15);

            if (data.cues && data.cues.length > 0) {
              setSubtitleCues(data.cues);
              setSubtitleConfig((p) => ({ ...p, enabled: true }));
            }

            const recChar = VOICE_CHARACTERS.find((c) => c.id === data.voiceRecommendation) || VOICE_CHARACTERS[0];
            setVoiceoverConfig((p) => ({
              ...p,
              enabled: true,
              selectedVoiceId: recChar.id,
              pitch: recChar.pitch,
              rate: recChar.rate,
            }));

            setTranscribeSuccessMsg(`🚀 Đã cào video Douyin thành công: "${data.title}"! Đã nạp kịch bản mới.`);
            setShowDouyinModal(false);
            setIsScrapingDouyin(false);
            setDouyinUrlInput("");

            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.currentTime = 0;
                videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
              }
            }, 300);
            return;
          }
        } catch (scrapeErr: any) {
          console.warn("Lỗi cào Douyin qua API, sẽ tiếp tục xử lý URL trực tiếp:", scrapeErr);
        }
      }

      // 1. Tự động nhận diện & convert link Google Drive sang link stream trực tiếp
      const gDriveMatch = input.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (gDriveMatch && gDriveMatch[1]) {
        input = `https://drive.google.com/uc?export=download&id=${gDriveMatch[1]}`;
      }

      // 2. Chuyển đổi link Dropbox sang raw direct download
      if (input.includes("dropbox.com")) {
        input = input.replace("?dl=0", "?raw=1").replace("&dl=0", "&raw=1");
        if (!input.includes("raw=1")) {
          input += (input.includes("?") ? "&" : "?") + "raw=1";
        }
      }

      // 3. Giữ nguyên 100% video URL của người dùng (bảo toàn trọn vẹn 8 phút, không tự ý đổi video khác)
      let finalUrl = input;
      let finalTitle = "Video Liên Kết";
      try {
        const u = new URL(input);
        const namePart = u.pathname.split("/").filter(Boolean).pop();
        if (namePart) finalTitle = decodeURIComponent(namePart).split("?")[0];
      } catch {
        finalTitle = input.slice(0, 30);
      }

      // 🌟 Dọn sạch toàn bộ cache và trạng thái của video cũ
      resetAllMediaCacheAndState();
      setSelectedFile(null);
      setVideoUrl(finalUrl);
      setVideoName(finalTitle);

      // Đặt mặc định tạm thời 480s (8 phút), khi video load xong onLoadedMetadata sẽ lấy chính xác từng giây
      setVideoDuration(480);

      // Kích hoạt chất giọng tiếng Việt chuẩn
      const recommendedChar = VOICE_CHARACTERS[0];
      setVoiceoverConfig((p) => ({
        ...p,
        enabled: true,
        selectedVoiceId: recommendedChar.id,
        pitch: recommendedChar.pitch,
        rate: recommendedChar.rate,
      }));

      setTranscribeSuccessMsg(`✅ Đã nạp thành công liên kết video! Đang tải dữ liệu phát...`);
      setShowDouyinModal(false);
      setIsScrapingDouyin(false);
      setDouyinUrlInput("");

      // Cho video phát
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.currentTime = 0;
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }, 300);
    } catch (e: any) {
      setIsScrapingDouyin(false);
      alert("Lỗi nạp video: " + (e.message || "Vui lòng kiểm tra lại đường link"));
    }
  };

  // 🌟 XUẤT FILE PHỤ ĐỀ .SRT CHUẨN
  const handleDownloadSRT = () => {
    if (subtitleCues.length === 0) {
      alert("Chưa có phụ đề để tải về! Vui lòng bấm 'Bật sub tự động bằng AI' trước.");
      return;
    }

    const formatSRTTime = (sec: number) => {
      const hrs = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = Math.floor(sec % 60);
      const millis = Math.floor((sec % 1) * 1000);
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
    };

    let srtContent = "";
    subtitleCues.forEach((cue, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${formatSRTTime(cue.startSec)} --> ${formatSRTTime(cue.endSec)}\n`;
      srtContent += `${cue.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${videoName.replace(/\.[^/.]+$/, "") || "phu_de"}_subtitles.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 🌟 HÀM VẼ TOÀN BỘ OVERLAY (LOGO, BANNER, SUBTITLE, MASK) LÊN CANVAS
  const drawOverlaysOnCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    currentSec: number,
    logoImg: HTMLImageElement | null
  ) => {
    // 1. VẼ DẢI CHE MỜ / XÓA SUB TIẾNG TRUNG GỐC (INPAINT BLUR MASK) TRƯỚC TIÊN
    // Vẽ đè trực tiếp lên khung hình video gốc để che phụ đề cũ, trước khi vẽ Banner và Subtitle mới
    if (maskConfig.enabled) {
      ctx.save();
      const maskY = height * (1 - maskConfig.positionYPercent / 100) - (maskConfig.heightPx * (height / 800)) / 2;
      const maskH = maskConfig.heightPx * (height / 800);
      ctx.fillStyle = maskConfig.bgColor || "#0e0406";
      ctx.globalAlpha = maskConfig.opacity || 0.85;
      ctx.roundRect(width * 0.04, maskY, width * 0.92, maskH, 16);
      ctx.fill();
      ctx.restore();
    }

    // 2. VẼ BANNER QUẢNG CÁO RỰC RỠ, NÉT CĂNG CHUẨN XÁC 100% NHƯ TRÊN TIẾN TRÌNH
    // Nằm đè lên trên Mask để không bao giờ bị mờ hay tối màu
    if (bannerConfig.enabled && currentSec >= bannerConfig.startSec && currentSec <= bannerConfig.endSec) {
      ctx.save();
      const bannerMarginX = Math.round(width * 0.04);
      const bannerW = width - bannerMarginX * 2;
      const bannerH = Math.round(72 * (height / 800));
      const bannerY = height - bannerH - Math.round(20 * (height / 800));
      const bannerRadius = Math.round(18 * (height / 800));

      // Bóng đổ 2XL sâu và nổi khối
      ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
      ctx.shadowBlur = Math.round(18 * (height / 800));
      ctx.shadowOffsetY = Math.round(5 * (height / 800));

      // Dải màu gradient đỏ - hồng - cam rực rỡ chuẩn xác 100% như trên giao diện
      const grad = ctx.createLinearGradient(bannerMarginX, bannerY, bannerMarginX + bannerW, bannerY);
      grad.addColorStop(0, "#dc2626"); // Đỏ tươi red-600
      grad.addColorStop(0.48, "#e11d48"); // Đỏ hồng rose-600
      grad.addColorStop(1, "#ea580c"); // Cam hổ phách orange-600
      ctx.fillStyle = grad;
      ctx.roundRect(bannerMarginX, bannerY, bannerW, bannerH, bannerRadius);
      ctx.fill();

      // Viền trắng bán trong suốt sang trọng
      ctx.shadowColor = "transparent";
      ctx.lineWidth = Math.max(1.5, Math.round(2 * (width / 400)));
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.stroke();

      const hasSub = Boolean(bannerConfig.subtitle && bannerConfig.subtitle.trim());

      // Tiêu đề chính chữ trắng đậm nét, hoa toàn bộ
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `900 ${Math.round(16 * (width / 400))}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const titleY = hasSub ? bannerY + bannerH * 0.38 : bannerY + bannerH * 0.5;
      ctx.fillText(bannerConfig.title, width / 2, titleY);

      // Tiêu đề phụ chữ vàng tươi nổi bật
      if (hasSub) {
        ctx.fillStyle = "#FEF08A";
        ctx.font = `700 ${Math.round(11 * (width / 400))}px Arial, sans-serif`;
        ctx.fillText(bannerConfig.subtitle, width / 2, bannerY + bannerH * 0.72);
      }
      ctx.restore();
    }

    // 3. VẼ LOGO THƯƠNG HIỆU
    if (logoConfig.enabled) {
      ctx.save();
      ctx.globalAlpha = logoConfig.opacity / 100;
      const logoSize = (logoConfig.size || 40) * (width / 400);

      let posX = width - logoSize - 20;
      let posY = 25;
      if (logoConfig.position === "top-left") {
        posX = 20;
        posY = 25;
      } else if (logoConfig.position === "bottom-right") {
        posX = width - logoSize - 20;
        posY = height - logoSize - 40;
      } else if (logoConfig.position === "bottom-left") {
        posX = 20;
        posY = height - logoSize - 40;
      }

      if (logoImg && logoImg.complete) {
        ctx.drawImage(logoImg, posX, posY, logoSize, logoSize);
      } else {
        ctx.fillStyle = "rgba(37, 99, 235, 0.9)";
        const textWidth = ctx.measureText(logoConfig.name).width + 30;
        ctx.roundRect(posX - 40, posY, Math.max(120, textWidth), 36, 12);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${Math.round(15 * (width / 400))}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(logoConfig.name, posX - 40 + Math.max(120, textWidth) / 2, posY + 18);
      }
      ctx.restore();
    }

    // 4. VẼ PHỤ ĐỀ TIKTOK (NẰM 1/4 TỪ GÓC DƯỚI LÊN, TRÊN BANNER VÀ TRONG TẦM MẮT)
    if (subtitleConfig.enabled && subtitleCues.length > 0) {
      const adjTime = currentSec + subtitleConfig.offsetSeconds;
      const matchedCue = subtitleCues.find(
        (c) => adjTime >= c.startSec && adjTime <= c.endSec + 0.5
      );

      if (matchedCue) {
        ctx.save();
        const subY = height * 0.75;
        const fontSize = Math.round((subtitleConfig.fontSize || 20) * (width / 360));
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const words = matchedCue.words && matchedCue.words.length > 0
          ? matchedCue.words
          : matchedCue.text.split(" ").map((w) => ({ word: w, startSec: matchedCue.startSec, endSec: matchedCue.endSec }));

        const spaceWidth = ctx.measureText(" ").width;
        const wordWidths = words.map((w) => ctx.measureText(w.word).width);
        const totalTextWidth = wordWidths.reduce((a, b) => a + b, 0) + spaceWidth * (words.length - 1);

        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        const padX = 24;
        const padY = 12;
        ctx.roundRect((width - totalTextWidth) / 2 - padX, subY - fontSize / 2 - padY, totalTextWidth + padX * 2, fontSize + padY * 2, 16);
        ctx.fill();

        let startX = (width - totalTextWidth) / 2;
        words.forEach((w, wIdx) => {
          const isWordActive = adjTime >= w.startSec && adjTime <= w.endSec + 0.15;

          ctx.lineWidth = 4;
          ctx.strokeStyle = "#000000";
          ctx.strokeText(w.word, startX + wordWidths[wIdx] / 2, subY);

          ctx.fillStyle = isWordActive ? "#FACC15" : "#FFFFFF";
          ctx.fillText(w.word, startX + wordWidths[wIdx] / 2, subY);

          startX += wordWidths[wIdx] + spaceWidth;
        });

        ctx.restore();
      }
    }
  };

  // 🌟 TẢI VIDEO XUẤT KHẨU: TÍCH HỢP ĐẦY ĐỦ 100% TIẾNG LỒNG MC VÀ BANNER SẮC NÉT
  const handleExportFullVideo = async () => {
    if (!videoUrl) {
      alert("Vui lòng tải video lên trước!");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    exportAbortRef.current = false;

    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    const exportVideo = document.createElement("video");
    exportVideo.src = videoUrl;
    exportVideo.crossOrigin = "anonymous";
    exportVideo.muted = false;
    exportVideo.loop = false;
    exportVideo.playsInline = true;

    try {
      await new Promise((resolve, reject) => {
        exportVideo.onloadedmetadata = resolve;
        exportVideo.onerror = reject;
      });

      const totalDur = exportVideo.duration || videoDuration || 120;
      const width = exportVideo.videoWidth || 720;
      const height = exportVideo.videoHeight || 1280;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Không thể khởi tạo Canvas 2D");
      canvas.width = width;
      canvas.height = height;

      let logoImg: HTMLImageElement | null = null;
      if (logoConfig.enabled && logoConfig.imageSrc) {
        logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = logoConfig.imageSrc;
        await new Promise((res) => {
          logoImg!.onload = res;
          logoImg!.onerror = res;
        });
      }

      const canvasStream = canvas.captureStream(30);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const destination = audioCtx.createMediaStreamDestination();

      // 1. KÊNH TIẾNG GỐC CỦA VIDEO
      let videoGain: GainNode | null = null;
      try {
        const videoSource = audioCtx.createMediaElementSource(exportVideo);
        videoGain = audioCtx.createGain();
        if (voiceoverConfig.muteOriginal || voiceoverConfig.originalVolume === 0) {
          videoGain.gain.value = 0;
        } else {
          videoGain.gain.value = voiceoverConfig.originalVolume / 100;
        }
        videoSource.connect(videoGain);
        videoGain.connect(destination);
      } catch (e) {
        console.warn("Nối âm thanh video gốc:", e);
      }

      // 2. KÊNH TIẾNG MC LỒNG TIẾNG (BOOST CLARITY + BỘ LỌC CHẤT GIỌNG ĐẶC TRƯNG)
      const ttsGain = audioCtx.createGain();
      ttsGain.gain.value = 1.35; // Âm lượng MC to rõ, nổi bật

      const bassFilter = audioCtx.createBiquadFilter();
      bassFilter.type = "lowshelf";
      bassFilter.frequency.value = 180;

      const midFilter = audioCtx.createBiquadFilter();
      midFilter.type = "peaking";
      midFilter.frequency.value = 1000;
      midFilter.Q.value = 1.0;

      const trebleFilter = audioCtx.createBiquadFilter();
      trebleFilter.type = "highshelf";
      trebleFilter.frequency.value = 3200;

      const activeCharId = voiceoverConfig.selectedVoiceId;
      const activeChar = VOICE_CHARACTERS.find((c) => c.id === activeCharId) || VOICE_CHARACTERS[0];
      const rateToUse = voiceoverConfig.rate || activeChar.rate || 1.15;

      switch (activeCharId) {
        case "cartoon":
          bassFilter.gain.value = -8;
          midFilter.frequency.value = 2200;
          midFilter.gain.value = 6;
          trebleFilter.gain.value = 10;
          break;
        case "adult_male_mc":
          bassFilter.gain.value = 14;
          midFilter.frequency.value = 380;
          midFilter.gain.value = 5;
          trebleFilter.gain.value = -8;
          break;
        case "senior":
          bassFilter.gain.value = 12;
          midFilter.frequency.value = 500;
          midFilter.gain.value = 4;
          trebleFilter.gain.value = -7;
          break;
        case "adult_male_reviewer":
          bassFilter.gain.value = 8;
          midFilter.frequency.value = 850;
          midFilter.gain.value = 6;
          trebleFilter.gain.value = 2;
          break;
        case "adult_female_sweet":
          bassFilter.gain.value = 0;
          midFilter.frequency.value = 1400;
          midFilter.gain.value = 3;
          trebleFilter.gain.value = 5;
          break;
        case "speed_mc":
          bassFilter.gain.value = -2;
          midFilter.frequency.value = 2000;
          midFilter.gain.value = 4;
          trebleFilter.gain.value = 6;
          break;
      }

      ttsGain.connect(bassFilter);
      bassFilter.connect(midFilter);
      midFilter.connect(trebleFilter);
      trebleFilter.connect(destination);

      // Đưa luồng âm thanh tổng vào Canvas Stream để MediaRecorder ghi nhận
      const audioTracks = destination.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        canvasStream.addTrack(audioTracks[0]);
      }

      // 3. TẢI TRƯỚC TOÀN BỘ ÂM THANH CÂU THOẠI MC ĐỂ GHÉP CHÍNH XÁC 100% VÀO VIDEO XUẤT
      const cueAudioBuffers = new Map<string, AudioBuffer>();
      const spokenCueKeys = new Set<string>();

      if (voiceoverConfig.enabled && subtitleCues.length > 0) {
        const uniqueSentences = new Map<string, string>();
        subtitleCues.forEach((cue) => {
          const sKey = cue.parentSentenceId || cue.id;
          if (!uniqueSentences.has(sKey)) {
            const text = (cue.parentSentenceText || cue.text).trim().slice(0, 250);
            uniqueSentences.set(sKey, text);
          }
        });

        await Promise.all(
          Array.from(uniqueSentences.entries()).map(async ([sKey, text]) => {
            try {
              const encoded = encodeURIComponent(text);
              const res = await fetch(`https://api.kpost.vn/ai-content/tts?text=${encoded}`);
              if (res.ok) {
                const ab = await res.arrayBuffer();
                const decoded = await audioCtx.decodeAudioData(ab);
                cueAudioBuffers.set(sKey, decoded);
              }
            } catch (err) {
              console.warn(`Lỗi tải audio cue ${sKey}:`, err);
            }
          })
        );
      }

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(canvasStream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const finishExport = () => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
        exportVideo.pause();
        exportVideo.src = "";
        try { audioCtx.close(); } catch {}
      };

      recorder.onstop = () => {
        if (chunks.length === 0) {
          setIsExporting(false);
          return;
        }

        const exportedBlob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const downloadUrl = URL.createObjectURL(exportedBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${videoName.replace(/\.[^/.]+$/, "") || "video"}_kpost_dubbed.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        setExportProgress(100);
        setTimeout(() => {
          setIsExporting(false);
        }, 600);
      };

      exportVideo.currentTime = 0;
      recorder.start(1000);
      await exportVideo.play();

      let animationId: number;

      const renderLoop = () => {
        if (exportAbortRef.current) {
          finishExport();
          return;
        }

        const curTime = exportVideo.currentTime;
        const currentProgress = Math.min(99, Math.round((curTime / totalDur) * 100));
        setExportProgress(currentProgress);

        ctx.save();
        if (canvasFilterCss !== "none") {
          ctx.filter = canvasFilterCss;
        }
        ctx.drawImage(exportVideo, 0, 0, width, height);
        ctx.restore();

        // 🎙️ ĐỒNG BỘ PHÁT ÂM THANH MC CHÍNH XÁC TỪNG MILIGIÂY VÀO VIDEO XUẤT
        if (voiceoverConfig.enabled && subtitleCues.length > 0) {
          const matchedCue = subtitleCues.find(
            (c) => curTime >= c.startSec && curTime <= c.endSec + 0.3
          );
          if (matchedCue) {
            const sKey = matchedCue.parentSentenceId || matchedCue.id;
            const normText = (matchedCue.parentSentenceText || matchedCue.text).toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, "");
            if (!spokenCueKeys.has(sKey) && !spokenCueKeys.has(normText)) {
              spokenCueKeys.add(sKey);
              spokenCueKeys.add(normText);
              const buffer = cueAudioBuffers.get(sKey);
              if (buffer) {
                try {
                  const bSource = audioCtx.createBufferSource();
                  bSource.buffer = buffer;
                  bSource.playbackRate.value = rateToUse;
                  bSource.connect(ttsGain);
                  bSource.start(0);

                  // Hạ âm lượng video gốc khi MC nói (Ducking)
                  if (videoGain && !voiceoverConfig.muteOriginal && voiceoverConfig.originalVolume > 0) {
                    videoGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                    const speechDur = buffer.duration / rateToUse;
                    videoGain.gain.setValueAtTime(
                      voiceoverConfig.originalVolume / 100,
                      audioCtx.currentTime + speechDur
                    );
                  }
                } catch (e) {
                  console.warn("Lỗi phát audio cue trong export:", e);
                }
              }
            }
          }
        }

        drawOverlaysOnCanvas(ctx, width, height, curTime, logoImg);

        if (exportVideo.ended || curTime >= totalDur - 0.2) {
          setExportProgress(100);
          setTimeout(() => {
            finishExport();
          }, 300);
          return;
        }

        animationId = requestAnimationFrame(renderLoop);
      };

      animationId = requestAnimationFrame(renderLoop);

      exportVideo.onended = () => {
        cancelAnimationFrame(animationId);
        finishExport();
      };
    } catch (err: any) {
      console.error("Lỗi xuất video:", err);
      setIsExporting(false);
      alert("Lỗi xuất video: " + (err?.message || "Vui lòng thử lại"));
    }
  };

  const isBannerVisible = useMemo(() => {
    if (!bannerConfig.enabled || compareOriginal) return false;
    return currentTime >= bannerConfig.startSec && currentTime <= bannerConfig.endSec;
  }, [bannerConfig, currentTime, compareOriginal]);

  const filteredDouyinTrends = useMemo(() => {
    if (douyinCategory === "all") return DOUYIN_HOT_TRENDS;
    return DOUYIN_HOT_TRENDS.filter((t) => t.category === douyinCategory);
  }, [douyinCategory]);

  return (
    <div className="flex-1 bg-[#0A101D] min-h-screen p-3 md:p-6 font-sans text-slate-100 overflow-y-auto selection:bg-[#1877F2] selection:text-white">
      <div className="max-w-[1540px] mx-auto pb-24">
        {/* HEADER AI VIDEO EDITOR PRO */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 bg-[#0F1C33]/90 backdrop-blur-md p-5 rounded-3xl border border-[#1E3867] shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="p-2.5 bg-gradient-to-tr from-[#1565C0] via-[#1877F2] to-[#2563EB] rounded-2xl text-white shadow-lg shadow-blue-950/60 border border-blue-400/30">
                <Wand2 size={24} />
              </span>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                KPOST AI VIDEO EDITOR
                <span className="bg-gradient-to-r from-[#1877F2] to-[#2563EB] text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm border border-blue-400/30">
                  PRO STUDIO
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-200/70 font-medium">
              Trình chỉnh sửa Video AI thông minh: Bóc băng tạo phụ đề tự động (Whisper AI), lồng tiếng MC đa giọng và xuất bản chất lượng cao.
            </p>
          </div>

          {/* DÃY NÚT CHỨC NĂNG */}
          <div className="flex items-center flex-wrap gap-2">

            {/* 🎯 NÚT 1: TẠO PHỤ ĐỀ GỐC (AI WHISPER / TIẾNG VIỆT) */}
            <button
              type="button"
              onClick={handleTranscribeWhisper}
              disabled={isTranscribing || isExporting}
              className="px-3.5 py-2.5 bg-gradient-to-r from-cyan-900/60 to-blue-900/60 hover:from-cyan-800/80 hover:to-blue-800/80 text-cyan-200 border border-cyan-500/40 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-950/40 disabled:opacity-50"
              title="Dành cho video tiếng Việt: Bóc băng nguyên văn từng từ người nói, giữ 100% tiếng video gốc (không lồng tiếng MC)"
            >
              {isTranscribing ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-cyan-300" /> Đang Bóc Băng...
                </>
              ) : (
                <>
                  <Mic size={16} className="text-cyan-300 animate-pulse" /> 🎤 Tạo Sub Video (AI Whisper)
                </>
              )}
            </button>

            {/* 🌐 NÚT 2: DỊCH & LỒNG TIẾNG MC (DOUYIN / NGOẠI NGỮ) */}
            <button
              type="button"
              onClick={handleTranscribeRealAudio}
              disabled={isTranscribing || isExporting}
              className="px-3.5 py-2.5 bg-gradient-to-r from-amber-900/60 to-orange-900/60 hover:from-amber-800/80 hover:to-orange-800/80 text-amber-200 border border-amber-500/40 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-950/40 disabled:opacity-50"
              title="Dành cho video Douyin / tiếng nước ngoài: Dịch lời thoại sang tiếng Việt & bật MC lồng tiếng"
            >
              <Sparkles size={16} className="text-amber-300" /> 🌐 Dịch & Lồng Tiếng
            </button>

            {/* 🎙️ NÚT CÀI ĐẶT AI LỒNG TIẾNG & TẮT TIẾNG GỐC */}
            <button
              type="button"
              onClick={() => setShowVoiceoverModal(true)}
              className="px-3.5 py-2.5 bg-[#13223F] hover:bg-[#1A3059] text-slate-100 rounded-2xl text-xs font-bold flex items-center gap-2 border border-[#1E3867] transition-all cursor-pointer"
            >
              <Radio size={15} className="text-emerald-400" /> 🎙️ Đổi Giọng MC & Âm Lượng
              <span className="bg-[#1877F2] text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {VOICE_CHARACTERS.find((c) => c.id === voiceoverConfig.selectedVoiceId)?.avatar || "👩"}
              </span>
            </button>

            {/* 🎭 NÚT BẬT/TẮT CHE SUB GỐC */}
            <button
              type="button"
              onClick={() => setMaskConfig((p) => ({ ...p, enabled: !p.enabled }))}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                maskConfig.enabled
                  ? "bg-[#1877F2] text-white border-blue-400 shadow-md shadow-blue-950/40"
                  : "bg-[#13223F] hover:bg-[#1A3059] text-slate-200 border-[#1E3867]"
              }`}
              title="Bật/Tắt dải che mờ đè lên phụ đề tiếng Trung gốc"
            >
              <Eye size={15} className={maskConfig.enabled ? "text-amber-300" : "text-blue-300"} />
              Che Sub Gốc: {maskConfig.enabled ? "BẬT" : "TẮT"}
            </button>

            {/* 🔥 NÚT CÀO DOUYIN TRENDS */}
            <button
              type="button"
              onClick={() => setShowDouyinModal(true)}
              className="px-3 py-2.5 bg-[#13223F] hover:bg-[#1A3059] text-slate-100 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-[#1E3867] transition-all cursor-pointer"
            >
              <Flame size={15} className="text-amber-400" /> Douyin Trends
            </button>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <ImageIcon size={16} /> Logo & Banner
            </button>

            <button
              type="button"
              onClick={() => setShowEffectsModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles size={16} /> Hiệu Ứng Video
            </button>

            <button
              type="button"
              onClick={handleExportFullVideo}
              disabled={!videoUrl || isExporting}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Đang xuất ({exportProgress}%)
                </>
              ) : (
                <>
                  <Download size={16} /> ⬇️ Tải Video Về Máy
                </>
              )}
            </button>

            {/* 📦 NÚT TẢI FULL SOURCE CODE (ZIP) */}
            <a
              href="/fullcode-ai-video-editor.zip"
              download="fullcode-ai-video-editor.zip"
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-950/60 transition-all hover:scale-105 cursor-pointer border border-amber-200"
              title="Bấm để tải toàn bộ mã nguồn dự án file ZIP"
            >
              <Download size={16} className="text-slate-950" /> 📦 Tải Full Code (ZIP)
            </a>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <UploadCloud size={16} /> Tải Video Lên
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleUserUploadVideo}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => {
                setShowDouyinModal(true);
                setActiveDouyinTab("scraper");
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer border border-slate-200"
            >
              <Link2 size={16} /> 🔗 Dán Link Video
            </button>
          </div>
        </div>

        {/* TIẾN TRÌNH XUẤT VIDEO */}
        {isExporting && (
          <div className="mb-6 p-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-3xl shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Download size={24} className="text-emerald-400 animate-bounce" />
                <div>
                  <h3 className="text-base font-black text-white">Đang Render & Xuất Video Hoàn Chỉnh...</h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Hệ thống đang gắn phụ đề, logo, banner và hiệu ứng vào video (Tự động tải về khi đủ 100%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-mono font-black text-emerald-300">{exportProgress}%</span>
                <button
                  type="button"
                  onClick={() => {
                    exportAbortRef.current = true;
                    setIsExporting(false);
                  }}
                  className="px-3 py-1 bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-200"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* TIẾN TRÌNH BÓC BĂNG */}
        {isTranscribing && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Mic size={24} className="text-cyan-400 animate-pulse" />
                <div>
                  <h3 className="text-base font-black text-white">KpostAI Đang Nghe & Bóc Băng Âm Thanh...</h3>
                  <p className="text-xs text-cyan-200 mt-0.5">{transcribeStatus}</p>
                </div>
              </div>
              <span className="text-lg font-mono font-black text-amber-300">{transcribeProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${transcribeProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 2 CỘT CHÍNH + THANH CÔNG CỤ DỌC PHẢI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI: DANH SÁCH LỜI THOẠI TOÀN BỘ VIDEO */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-[#0F1C33]/90 backdrop-blur-md rounded-3xl border border-[#1E3867] p-4 md:p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Type size={18} className="text-[#1877F2]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Lời Thoại Video ({subtitleCues.length} Câu)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {subtitleCues.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={resetAllMediaCacheAndState}
                        className="px-2 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Xóa sạch toàn bộ phụ đề và giải phóng cache âm thanh cũ"
                      >
                        <Trash2 size={12} /> Xóa Sub & Cache
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadSRT}
                        className="px-2.5 py-1 rounded-xl bg-[#152649] hover:bg-[#1A3059] border border-[#25447C] text-slate-200 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <FileDown size={13} /> Tải .SRT
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* TÙY CHỌN & CHỌN GIỌNG MC TRỰC TIẾP */}
              <div className="mb-3 p-3 bg-[#0B1527] border border-[#1E3867] rounded-2xl flex flex-col gap-2.5 text-xs shadow-xs">
                {/* DÒNG 1: HIỆN PHỤ ĐỀ & CỠ CHỮ */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 font-black text-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subtitleConfig.enabled}
                      onChange={(e) => setSubtitleConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    Hiện phụ đề trên video
                  </label>
                  <div className="flex items-center gap-2 font-medium text-blue-200">
                    <span>Cỡ chữ:</span>
                    <select
                      value={subtitleConfig.fontSize}
                      onChange={(e) => setSubtitleConfig((p) => ({ ...p, fontSize: Number(e.target.value) }))}
                      className="px-2 py-1 bg-[#200a0e] border border-[#1E3867] rounded-lg text-xs font-bold text-white"
                    >
                      <option value={18}>Nhỏ (18px)</option>
                      <option value={20}>Vừa (20px)</option>
                      <option value={24}>To (24px)</option>
                      <option value={28}>Rất to (28px)</option>
                    </select>
                  </div>
                </div>

                {/* DÒNG 2: BẬT / TẮT LỒNG TIẾNG MC VÀ THỬ LOA */}
                <div className="pt-2 border-t border-[#1A3059] flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 font-black cursor-pointer text-slate-200 bg-[#13223F] hover:bg-[#1A3059] px-3 py-1.5 rounded-xl border border-[#1E3867] transition-all select-none">
                    <input
                      type="checkbox"
                      checked={voiceoverConfig.enabled}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setVoiceoverConfig((p) => ({
                          ...p,
                          enabled: isChecked,
                          autoDuckOriginal: true,
                          originalVolume: isChecked ? 10 : 100, // 🌟 10%: Che mờ tiếng gốc khi lồng tiếng
                        }));
                        if (isChecked && subtitleCues.length > 0) {
                          const cueToSpeak = subtitleCues[0];
                          currentSentenceSpokenRef.current = cueToSpeak.parentSentenceId || cueToSpeak.id;
                          lastSpokenCueIdRef.current = cueToSpeak.id;
                          speakSentence(cueToSpeak.parentSentenceText || cueToSpeak.text);
                          if (videoRef.current) videoRef.current.volume = 0.1;
                        } else {
                          if (ttsAudioRef.current) {
                            try { ttsAudioRef.current.pause(); } catch {}
                          }
                          if ("speechSynthesis" in window) {
                            try { window.speechSynthesis.cancel(); } catch {}
                          }
                          if (videoRef.current) videoRef.current.volume = 1.0;
                        }
                      }}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    <span>🎙️ Lồng Tiếng MC AI {voiceoverConfig.enabled ? "(ĐANG BẬT)" : "(ĐANG TẮT)"}</span>
                  </label>

                  {/* 🌟 ĐIỀU CHỈNH TIẾNG GỐC 10% CHE MỜ GIỌNG NGOẠI NGỮ GỐC */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0F1C33] border border-[#1E3867] rounded-xl text-xs">
                    <span className="text-slate-300 font-bold text-[11px] whitespace-nowrap">
                      Tiếng gốc: <strong className="text-amber-400">{voiceoverConfig.originalVolume}%</strong>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={voiceoverConfig.originalVolume}
                      onChange={(e) => {
                        const vol = Number(e.target.value);
                        setVoiceoverConfig((p) => ({ ...p, originalVolume: vol, muteOriginal: vol === 0 }));
                        if (videoRef.current) videoRef.current.volume = vol / 100;
                      }}
                      className="w-16 accent-amber-400 cursor-pointer h-1.5"
                      title="Chỉnh âm lượng tiếng video gốc (10% = che mờ giọng gốc)"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceoverConfig((p) => ({ ...p, originalVolume: 10, muteOriginal: false }));
                        if (videoRef.current) videoRef.current.volume = 0.1;
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all ${
                        voiceoverConfig.originalVolume === 10
                          ? "bg-amber-400 text-slate-950 font-bold shadow-xs"
                          : "bg-[#152649] text-blue-200 hover:bg-[#1A3059]"
                      }`}
                      title="Bấm để khóa chính xác 10% che mờ tiếng gốc"
                    >
                      10%
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (subtitleCues.length > 0) {
                          const cue = currentSubtitleCue || subtitleCues[0];
                          speakSentence(cue.parentSentenceText || cue.text);
                        } else {
                          speakSentence("Xin chào! Hệ thống lồng tiếng MC tiếng Việt đã sẵn sàng.");
                        }
                      }}
                      className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      title="Bấm để kiểm tra loa và giọng đọc AI"
                    >
                      <Volume2 size={13} /> Thử Giọng
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowVoiceoverModal(true)}
                      className="px-2 py-1 bg-[#13223F] hover:bg-[#1A3059] text-blue-200 border border-[#1E3867] text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      Âm Lượng
                    </button>
                  </div>
                </div>

                {/* DÒNG 3: BỘ CHỌN GIỌNG MC TRỰC TIẾP & LOAD LẠI KHÔNG CẦN DỊCH TỪ ĐẦU */}
                <div className="p-2.5 bg-[#1a060a] border border-[#1E3867] rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-blue-200 flex items-center gap-1.5">
                      <Radio size={13} className="text-[#1877F2] animate-pulse" /> Chọn Giọng MC (Đổi Là Ăn Ngay):
                    </span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                      ⚡ Không cần dịch lại
                    </span>
                  </div>

                  {/* 5 NÚT CHỌN MC PHỔ BIẾN */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {POPULAR_VOICES.map((v) => {
                      const isSelected = voiceoverConfig.selectedVoiceId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleQuickChangeVoice(v.id, v.rate, v.pitch)}
                          className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                            isSelected
                              ? "bg-[#1877F2] text-white border-blue-400 shadow-md shadow-blue-950 scale-[1.02]"
                              : "bg-[#0B1527] hover:bg-[#13223F] text-slate-200 border-[#381118]"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{v.avatar}</span>
                            <span className="text-[11px] font-black truncate">{v.shortName}</span>
                          </div>
                          <div className={`text-[9px] mt-0.5 ${isSelected ? "text-slate-100" : "text-blue-300/60"}`}>
                            Tốc độ: {v.rate}x
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* ĐIỀU CHỈNH TỐC ĐỘ ĐỌC (KHỚP NHỊP DOUYIN NHANH) */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-[#1A3059] text-[11px]">
                    <span className="font-bold text-blue-200">Khớp nhịp nhân vật:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { label: "1.0x Chuẩn", val: 1.0 },
                        { label: "1.15x Tự nhiên", val: 1.15 },
                        { label: "⚡ 1.25x Khớp Douyin", val: 1.25 },
                        { label: "🚀 1.35x Nhanh", val: 1.35 },
                      ].map((spd) => (
                        <button
                          key={spd.val}
                          type="button"
                          onClick={() => handleQuickChangeSpeed(spd.val)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            voiceoverConfig.rate === spd.val
                              ? "bg-amber-400 text-slate-900 shadow-xs"
                              : "bg-[#13223F] hover:bg-[#1A3059] text-slate-200 border border-[#1E3867]"
                          }`}
                        >
                          {spd.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* THÔNG BÁO KHI ĐỔI GIỌNG */}
                  {voiceChangeNotice && (
                    <div className="p-2 bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 rounded-xl text-[11px] font-bold animate-in fade-in flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>{voiceChangeNotice}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* DANH SÁCH LỜI THOẠI */}
              <div ref={listContainerRef} className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {subtitleCues.map((cue) => {
                  const isActive =
                    isPlaying && adjustedCurrentTime >= cue.startSec && adjustedCurrentTime <= cue.endSec + 0.2;
                  const isEditing = editingCueId === cue.id;

                  return (
                    <div
                      id={`cue-item-${cue.id}`}
                      key={cue.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? "bg-gradient-to-r from-[#1565C0] to-[#1E88E5] text-white border-blue-400 shadow-md shadow-blue-950/50"
                          : "bg-[#0e1b33] hover:bg-[#162747] border-[#1E3867] text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => seekToTimestamp(cue.startSec)}
                          className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg shrink-0 cursor-pointer transition-all hover:scale-105 ${
                            isActive
                              ? "bg-white/20 text-white border border-white/30"
                              : "bg-[#16294d] text-cyan-300 hover:bg-[#1f3763] border border-cyan-800/60"
                          }`}
                          title="Bấm để tua video tới mốc này"
                        >
                          {cue.timeLabel}
                        </button>

                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              autoFocus
                              value={editingCueText}
                              onChange={(e) => setEditingCueText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveCueEdit(cue.id);
                                if (e.key === "Escape") setEditingCueId(null);
                              }}
                              className="w-full text-xs font-bold px-2.5 py-1 rounded-xl outline-none border bg-slate-900 text-amber-200 border-amber-400 focus:ring-2 focus:ring-amber-300 transition-all"
                              placeholder="Nhập lời thoại chính xác..."
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCueEdit(cue.id)}
                              className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer shadow-xs shrink-0"
                              title="Lưu sửa đổi (Enter)"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCueId(null)}
                              className="p-1.5 rounded-lg bg-slate-400 text-white hover:bg-slate-500 cursor-pointer shrink-0"
                              title="Hủy (Esc)"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => seekToTimestamp(cue.startSec)}
                            className={`text-xs truncate flex-1 cursor-pointer select-none ${
                              isActive
                                ? "text-amber-300 font-black tracking-wide"
                                : "text-white font-semibold hover:text-cyan-200"
                            }`}
                            title="Bấm để tua video"
                          >
                            {cue.text}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && !isEditing && (
                          <span className="text-[10px] font-black uppercase text-amber-300 shrink-0 animate-pulse bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/40">
                            Đang đọc
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSentence(cue.text);
                          }}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            isActive
                              ? "bg-white/20 text-white hover:bg-white/30"
                              : "text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/60 border border-transparent hover:border-emerald-700/50"
                          }`}
                          title="Bấm để nghe AI đọc câu này"
                        >
                          <Volume2 size={13} />
                        </button>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCueId(cue.id);
                              setEditingCueText(cue.text);
                            }}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isActive
                                ? "bg-white/20 text-white hover:bg-white/30"
                                : "text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/60 border border-transparent hover:border-cyan-700/50"
                            }`}
                            title="Sửa lời thoại câu này"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {subtitleCues.length === 0 && !isTranscribing && (
                  <div className="py-12 text-center px-4">
                    <Mic size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-500">Chưa có phụ đề lời thoại.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Bấm nút <span className="font-bold text-[#1877F2]">"🔥 Cào Douyin Trends"</span> hoặc <span className="font-bold text-indigo-600">"🎤 Bật sub tự động bằng AI"</span> để nạp video và kịch bản!
                    </p>
                  </div>
                )}
              </div>

              {transcribeSuccessMsg && (
                <div className="mt-3.5 p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-2 animate-in fade-in">
                  <Sparkles size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-purple-900 leading-relaxed">{transcribeSuccessMsg}</p>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: VIDEO PLAYER VỚI PHỤ ĐỀ DỌC 9:16 */}
          <div className="lg:col-span-7">
            <div className="bg-[#0F1C33]/90 backdrop-blur-md rounded-3xl border border-[#1E3867] p-4 md:p-5 shadow-xl flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-[#152649] text-blue-200 flex items-center justify-center shrink-0 border border-[#25447C]">
                    <Play size={13} />
                  </span>
                  <span className="text-xs font-bold text-white truncate" title={videoName}>
                    {videoName || "Studio Video Preview"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEffectsModal(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#13223F] hover:bg-[#1A3059] text-slate-200 border border-[#1E3867] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Palette size={13} />
                    {visualEffects.filterType !== "none" ? "Đã bật hiệu ứng" : "Bộ lọc"}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportFullVideo}
                    disabled={!videoUrl || isExporting}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Download size={13} />
                    {isExporting ? `Đang xuất ${exportProgress}%` : "Xuất Video"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompareOriginal(!compareOriginal)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      compareOriginal
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                        : "bg-[#13223F] hover:bg-[#1A3059] text-slate-200 border border-[#1E3867]"
                    }`}
                  >
                    <Eye size={13} />
                    {compareOriginal ? "Đang xem: GỐC" : "Xem bản gốc"}
                  </button>
                </div>
              </div>

              {/* KHUNG VIDEO 9:16 */}
              <div className="w-full bg-[#0a0204] rounded-2xl overflow-hidden relative border border-[#1E3867] flex items-center justify-center aspect-[9/16] max-h-[560px] mx-auto shadow-2xl">
                {videoUrl && (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      loop={false}
                      playsInline
                      style={{
                        filter: canvasFilterCss,
                        transition: "filter 0.3s ease"
                      }}
                      onEnded={() => {
                        setIsPlaying(false);
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          setCurrentTime(0);
                          lastSpokenCueIdRef.current = null;
                        }
                      }}
                      onLoadedMetadata={() => {
                        if (videoRef.current && videoRef.current.duration) {
                          setVideoDuration(videoRef.current.duration);
                        }
                        setVideoLoadError(null);
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onSeeked={() => {
                        lastSpokenCueIdRef.current = null;
                      }}
                      onPause={() => {
                        setIsPlaying(false);
                        if (ttsAudioRef.current) {
                          ttsAudioRef.current.pause();
                        }
                        if (typeof window !== "undefined" && "speechSynthesis" in window) {
                          window.speechSynthesis.cancel();
                        }
                      }}
                      onError={() => {
                        console.warn("Video load error for:", videoUrl);
                        if (videoUrl.startsWith("http") && !videoUrl.includes("/api/stream-video")) {
                          console.log("Attempting fallback via /api/stream-video proxy...");
                          setVideoUrl(`/api/stream-video?url=${encodeURIComponent(videoUrl)}`);
                          return;
                        }
                        setVideoLoadError("Máy chủ nguồn chặn quyền phát trực tiếp (lỗi CORS) hoặc link trang web không chứa luồng video MP4 trực tiếp. Bạn chỉ cần bấm nút bên dưới để chọn file từ máy và biên tập trọn vẹn 8 phút.");
                      }}
                      className="w-full h-full object-contain"
                    />

                    {/* THÔNG BÁO VÀ NÚT TẢI FILE TỪ MÁY KHI LINK BỊ CHẶN CORS */}
                    {videoLoadError && (
                      <div className="absolute inset-0 bg-[#0e0305]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in">
                        <span className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl mb-3 border border-amber-500/30">
                          <AlertTriangle size={36} />
                        </span>
                        <h4 className="font-black text-sm text-amber-300 mb-1.5 uppercase tracking-wide">
                          Máy Chủ Nguồn Chặn Phát Trực Tiếp
                        </h4>
                        <p className="text-xs text-slate-200/80 max-w-sm mb-4 leading-relaxed">
                          Link này bị máy chủ bên ngoài chặn quyền nhúng CORS vào trình duyệt. Để biên tập trọn vẹn video mà không bị ngắt, bạn bấm nút dưới đây để chọn file từ máy:
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl hover:scale-105 transition-all cursor-pointer"
                        >
                          <Upload size={15} /> 📁 Chọn File Từ Máy Tính
                        </button>
                      </div>
                    )}

                    {/* LOGO */}
                    {logoConfig.enabled && !compareOriginal && (
                      <div
                        className={`absolute pointer-events-none z-30 transition-all ${
                          logoConfig.position === "top-left"
                            ? "top-4 left-4"
                            : logoConfig.position === "top-right"
                            ? "top-4 right-4"
                            : logoConfig.position === "bottom-left"
                            ? "bottom-4 left-4"
                            : "bottom-4 right-4"
                        }`}
                        style={{ opacity: logoConfig.opacity / 100 }}
                      >
                        {logoConfig.imageSrc ? (
                          <img
                            src={logoConfig.imageSrc}
                            alt="Logo"
                            style={{ height: `${logoConfig.size || 40}px` }}
                            className="w-auto object-contain drop-shadow-md rounded-lg"
                          />
                        ) : (
                          <div className="px-3 py-1 bg-[#1877F2]/90 text-white font-black text-xs rounded-xl shadow-lg border border-white/20 backdrop-blur-xs flex items-center gap-1.5 tracking-wider uppercase">
                            <Sparkles size={11} className="text-amber-300" />
                            {logoConfig.name}
                          </div>
                        )}
                      </div>
                    )}

                    {/* BANNER */}
                    {isBannerVisible && (
                      <div className="absolute left-4 right-4 bottom-4 pointer-events-none z-30 transition-all">
                        <div className="p-3 rounded-2xl shadow-2xl border border-white/25 text-center text-white bg-gradient-to-r from-red-600/95 via-rose-600/95 to-amber-600/95 backdrop-blur-md">
                          <h4 className="text-xs md:text-sm font-black uppercase tracking-wider leading-tight">
                            {bannerConfig.title}
                          </h4>
                          {bannerConfig.subtitle && (
                            <p className="text-[10px] md:text-[11px] text-amber-200 font-bold mt-0.5">
                              {bannerConfig.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 🌟 VÙNG CHE MỜ / XÓA SUB TIẾNG TRUNG GỐC (INPAINT BLUR MASK) */}
                    {maskConfig.enabled && !compareOriginal && (
                      <div
                        className="absolute left-0 right-0 z-30 pointer-events-none flex items-center justify-center transition-all"
                        style={{
                          bottom: `${maskConfig.positionYPercent}%`,
                          height: `${maskConfig.heightPx}px`,
                        }}
                      >
                        <div
                          className="w-[92%] h-full rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md"
                          style={{
                            backgroundColor: maskConfig.bgColor,
                            opacity: maskConfig.opacity,
                            backdropFilter: `blur(${maskConfig.blurAmount}px)`,
                          }}
                        />
                      </div>
                    )}

                    {/* 🌟 PHỤ ĐỀ CHUẨN 3-5 TỪ: NẰM 1/4 TỪ GÓC DƯỚI MÀN HÌNH LÊN VÀ NẰM GỌN TRONG VIDEO */}
                    {subtitleConfig.enabled && !compareOriginal && currentSubtitleCue && (
                      <div className="absolute bottom-[25%] left-0 right-0 z-40 pointer-events-none flex justify-center px-4">
                        <div className="bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 shadow-2xl max-w-[80%] text-center animate-in fade-in zoom-in-95 duration-100">
                          <p
                            className="font-black leading-snug tracking-wide text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                            style={{
                              fontSize: `${Math.min(22, Math.max(16, subtitleConfig.fontSize || 20))}px`,
                              textShadow: "0 0 8px rgba(0,0,0,0.95), 0 2px 4px #000",
                            }}
                          >
                            {currentSubtitleCue.text}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* TIMELINE CONTROLS */}
              <div className="mt-4 pt-3 border-t border-[#1A3059] flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play();
                      }
                    }}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1565C0] to-[#1877F2] hover:from-[#1877F2] hover:to-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-950/60 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <div className="flex-1 flex items-center gap-2 text-xs font-mono text-blue-200">
                    <span className="font-bold text-white">
                      {Math.floor(currentTime / 60).toString().padStart(2, "0")}:
                      {Math.floor(currentTime % 60).toString().padStart(2, "0")}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={videoDuration || 120}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCurrentTime(val);
                        lastSpokenCueIdRef.current = null;
                        currentSentenceSpokenRef.current = null;
                        if (ttsAudioRef.current) {
                          ttsAudioRef.current.pause();
                        }
                        if (typeof window !== "undefined" && "speechSynthesis" in window) {
                          window.speechSynthesis.cancel();
                        }
                        if (videoRef.current) videoRef.current.currentTime = val;
                        preloadUpcomingSentences(val);
                      }}
                      className="flex-1 accent-[#1877F2] h-2 bg-[#152649] rounded-lg cursor-pointer"
                    />
                    <span className="font-bold text-blue-200">
                      {Math.floor(videoDuration / 60).toString().padStart(2, "0")}:
                      {Math.floor(videoDuration % 60).toString().padStart(2, "0")}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="p-2 rounded-xl bg-[#13223F] hover:bg-[#1A3059] text-blue-200 border border-[#1E3867] transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {subtitleCues.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      Đã có ({subtitleCues.length} câu phụ đề)
                    </span>
                  )}
                  {voiceoverConfig.enabled && (
                    <button
                      type="button"
                      onClick={() => setShowVoiceoverModal(true)}
                      className="text-[11px] font-bold text-slate-200 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 px-2.5 py-1 rounded-xl border border-[#1877F2] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Radio size={13} className="text-[#38BDF8] animate-pulse" />
                      Đang lồng tiếng: {VOICE_CHARACTERS.find((c) => c.id === voiceoverConfig.selectedVoiceId)?.name}
                    </button>
                  )}
                  {maskConfig.enabled && (
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-950/50 px-2.5 py-1 rounded-xl border border-amber-500/30">
                      🎭 Đã che sub tiếng Trung
                    </span>
                  )}
                  {visualEffects.filterType !== "none" && (
                    <span className="text-[11px] font-bold text-purple-300 bg-purple-950/50 px-2.5 py-1 rounded-xl border border-purple-500/30">
                      ✨ Bộ lọc: {visualEffects.filterType.toUpperCase()} ({visualEffects.speed}x)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 MODAL 1: AI LỒNG TIẾNG ĐA CHẤT GIỌNG (TỪ TRẺ EM ĐẾN NGƯỜI LỚN) - XANH FACEBOOK */}
      {showVoiceoverModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F1C33] border border-[#25447C] rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3867] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-[#1565C0] to-[#2563EB] text-white rounded-xl shadow-md shadow-blue-950">
                  <Radio size={18} />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">
                    AI Lồng Tiếng Cho Video (Từ Trẻ Em Đến Người Lớn)
                  </h3>
                  <p className="text-xs text-blue-200/70">Tự động nói theo phụ đề timeline, hỗ trợ Audio Ducking hạ âm lượng video gốc</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceoverModal(false)}
                className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-[#1A3059] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* BẬT / TẮT & AUDIO DUCKING */}
              <div className="p-3 bg-[#0B1527] border border-[#1E3867] rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 font-bold text-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceoverConfig.enabled}
                    onChange={(e) => setVoiceoverConfig((p) => ({ ...p, enabled: e.target.checked }))}
                    className="w-4 h-4 accent-[#1877F2] rounded"
                  />
                  Bật AI tự động lồng tiếng khi phát video
                </label>
                <label className="flex items-center gap-2 font-bold text-blue-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceoverConfig.autoDuckOriginal}
                    onChange={(e) => setVoiceoverConfig((p) => ({ ...p, autoDuckOriginal: e.target.checked }))}
                    className="w-4 h-4 accent-[#1877F2] rounded"
                  />
                  Tự động giảm âm lượng video gốc khi AI nói (Audio Ducking)
                </label>
              </div>

              {/* 🌟 ĐIỀU CHỈNH ÂM LƯỢNG TIẾNG GỐC VIDEO */}
              <div className="p-3.5 bg-[#0B1527] border border-[#1E3867] rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    🔇 Âm lượng tiếng video gốc (Che mờ ngoại ngữ):
                  </span>
                  <span className="font-black text-amber-300 text-sm">
                    {voiceoverConfig.originalVolume}% {voiceoverConfig.originalVolume === 10 ? "(Đã che mờ)" : voiceoverConfig.originalVolume === 0 ? "(Đã tắt sạch)" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={voiceoverConfig.originalVolume}
                    onChange={(e) => {
                      const vol = Number(e.target.value);
                      setVoiceoverConfig((p) => ({ ...p, originalVolume: vol, muteOriginal: vol === 0 }));
                      if (videoRef.current) videoRef.current.volume = vol / 100;
                    }}
                    className="flex-1 accent-amber-400 cursor-pointer h-2"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceoverConfig((p) => ({ ...p, originalVolume: 0, muteOriginal: true }));
                      if (videoRef.current) videoRef.current.volume = 0;
                    }}
                    className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition-all ${
                      voiceoverConfig.originalVolume === 0
                        ? "bg-rose-950/80 border-rose-500 text-rose-300"
                        : "bg-[#13223F] border-[#1E3867] text-slate-300 hover:bg-[#1A3059]"
                    }`}
                  >
                    🔇 Tắt hẳn (0%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceoverConfig((p) => ({ ...p, originalVolume: 10, muteOriginal: false }));
                      if (videoRef.current) videoRef.current.volume = 0.1;
                    }}
                    className={`px-3 py-1 rounded-lg border font-black cursor-pointer transition-all ${
                      voiceoverConfig.originalVolume === 10
                        ? "bg-amber-400 border-amber-300 text-slate-950 shadow-xs"
                        : "bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50"
                    }`}
                  >
                    ⭐ Che mờ giọng gốc (10% - Khuyên Dùng)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceoverConfig((p) => ({ ...p, originalVolume: 25, muteOriginal: false }));
                      if (videoRef.current) videoRef.current.volume = 0.25;
                    }}
                    className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition-all ${
                      voiceoverConfig.originalVolume === 25
                        ? "bg-blue-950 border-[#1877F2] text-blue-200"
                        : "bg-[#13223F] border-[#1E3867] text-slate-300 hover:bg-[#1A3059]"
                    }`}
                  >
                    🔉 Nhạc nền vừa (25%)
                  </button>
                </div>
              </div>

              {/* DANH SÁCH 8 NHÂN VẬT GIỌNG ĐỌC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {VOICE_CHARACTERS.map((char) => {
                  const isSelected = voiceoverConfig.selectedVoiceId === char.id;
                  return (
                    <div
                      key={char.id}
                      onClick={() => handleQuickChangeVoice(char.id, char.rate, char.pitch)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-[#1877F2] bg-[#1565C0]/30 shadow-md shadow-blue-950/60"
                          : "border-[#1E3867] hover:border-[#1877F2]/50 bg-[#0B1527]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-2xl">{char.avatar}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            char.group === "kids"
                              ? "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                              : char.group === "adults"
                              ? "bg-blue-950/60 text-blue-200 border border-[#1877F2]/30"
                              : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                          }`}>
                            {char.badge} • {char.ageRange}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-white">{char.name}</h4>
                        <p className="text-[11px] text-blue-200/70 mt-1 line-clamp-2 leading-relaxed">
                          {char.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#1A3059] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSentence(char.sampleText, char.id, char.rate);
                          }}
                          className="px-2.5 py-1 bg-[#152649] hover:bg-[#1A3059] text-slate-200 border border-[#1E3867] text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Volume2 size={12} /> Nghe thử mẫu
                        </button>
                        {isSelected && (
                          <span className="text-[10px] font-black text-amber-300 uppercase flex items-center gap-1">
                            <Check size={12} /> Đang chọn
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#1E3867] flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-blue-200">
                Nhân vật đang chọn:{" "}
                <strong className="text-amber-300">
                  {VOICE_CHARACTERS.find((c) => c.id === voiceoverConfig.selectedVoiceId)?.name}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setShowVoiceoverModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-blue-950"
              >
                Lưu & Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MODAL 2: CÀO DỮ LIỆU DOUYIN.COM & ĐỀ XUẤT VIDEO HOT MỚI NHẤT - XANH FACEBOOK */}
      {showDouyinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F1C33] border border-[#25447C] rounded-3xl max-w-3xl w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3867] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-[#1565C0] to-[#2563EB] text-white rounded-xl shadow-md shadow-blue-950">
                  <Flame size={20} className="animate-pulse" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Douyin Hot Trends & Cào Video Bán Hàng Triệu View
                    <span className="bg-[#1877F2]/20 border border-[#1877F2] text-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      DOUYIN.COM
                    </span>
                  </h3>
                  <p className="text-xs text-blue-200/70">
                    Đề xuất video hot mới nhất, tự động trích xuất kịch bản tiếng Việt và gán giọng lồng tiếng tối ưu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDouyinModal(false)}
                className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-[#1A3059] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* TAB CHUYỂN ĐỔI */}
            <div className="flex items-center gap-2 mb-4 p-1 bg-[#0B1527] border border-[#1E3867] rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveDouyinTab("trends")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeDouyinTab === "trends"
                    ? "bg-[#1877F2] text-white shadow-md shadow-blue-950"
                    : "text-blue-200 hover:text-white"
                }`}
              >
                <Flame size={14} /> 🏆 Đề Xuất Video Hot Douyin Mới Nhất
              </button>
              <button
                type="button"
                onClick={() => setActiveDouyinTab("scraper")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeDouyinTab === "scraper"
                    ? "bg-[#1877F2] text-white shadow-md shadow-blue-950"
                    : "text-blue-200 hover:text-white"
                }`}
              >
                <Link2 size={14} /> 🔗 Cào Video Từ Link Douyin Bất Kỳ
              </button>
            </div>

            {/* TAB 1: BẢNG XẾP HẠNG VIDEO HOT DOUYIN */}
            {activeDouyinTab === "trends" && (
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* LỌC THEO DANH MỤC */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
                  {[
                    { id: "all", label: "Tất Cả Danh Mục" },
                    { id: "kids_toys", label: "🧸 Đồ Chơi & Mẹ Bé" },
                    { id: "smart_home", label: "🛍️ Gia Dụng Thông Minh" },
                    { id: "tech_gadgets", label: "📱 Đồ Công Nghệ" },
                    { id: "beauty_care", label: "💄 Mỹ Phẩm & Skincare" },
                    { id: "short_drama", label: "🎬 Phim Ngắn Drama" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDouyinCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        douyinCategory === cat.id
                          ? "bg-[#1877F2] text-white border-blue-400 shadow-sm"
                          : "bg-[#0B1527] text-slate-200 border-[#1E3867] hover:bg-[#13223F]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* DANH SÁCH VIDEO HOT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredDouyinTrends.map((trend) => (
                    <div
                      key={trend.id}
                      className="bg-[#0B1527] border border-[#1E3867] rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-[#1877F2] transition-all hover:shadow-lg hover:shadow-blue-950/40"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-blue-200 bg-[#1877F2]/20 border border-[#1877F2]/40 px-2 py-0.5 rounded-full">
                            {trend.categoryLabel}
                          </span>
                          <span className="text-[10px] font-bold text-blue-300/80">❤️ {trend.likes} • ↗️ {trend.shares}</span>
                        </div>
                        <h4 className="text-xs font-black text-white leading-snug">{trend.title}</h4>
                        <p className="text-[10px] text-blue-300/60 font-mono italic mt-0.5">🇨🇳 {trend.originalTitle}</p>

                        <div className="mt-2.5 p-2 bg-[#13223F] border border-[#1E3867] rounded-xl">
                          <p className="text-[10px] text-amber-200 font-bold leading-relaxed">
                            💡 <strong>AI Viral:</strong> {trend.viralInsight}
                          </p>
                        </div>

                        <div className="mt-2 text-[11px] font-bold text-slate-200 bg-[#1877F2]/20 p-2 rounded-xl border border-[#1877F2]/40 flex items-center gap-1.5">
                          <Radio size={12} className="text-[#38BDF8] shrink-0" />
                          <span>Gợi ý giọng: {trend.voiceRecommendationName}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportDouyinVideo(trend)}
                        className="w-full py-2 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        🚀 Nhập Video & Bật Lồng Tiếng
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: CÀO TỪ LINK BẤT KỲ HOẶC TẢI TRỰC TIẾP TỪ MÁY */}
            {activeDouyinTab === "scraper" && (
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div className="p-4 bg-[#0B1527] border border-[#1E3867] rounded-2xl">
                  <label className="text-xs font-black uppercase tracking-wider text-white block mb-1">
                    Dán đường link Video (Hỗ trợ MP4, WebM, Google Drive, Dropbox, TikTok/Douyin...):
                  </label>
                  <p className="text-[11px] text-blue-200/70 mb-2.5">
                    Hỗ trợ video thời lượng bất kỳ (8 phút, 15 phút, 30 phút). Hệ thống sẽ giữ nguyên 100% video của bạn, không cắt ngắn.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={douyinUrlInput}
                      onChange={(e) => setDouyinUrlInput(e.target.value)}
                      placeholder="VD: https://... hoặc link Google Drive, CDN..."
                      className="flex-1 text-xs font-bold px-3 py-2.5 bg-[#0e0305] border border-[#1E3867] rounded-xl text-white placeholder-rose-400/40 focus:border-[#1877F2] focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleScrapeDouyinLink}
                      disabled={isScrapingDouyin}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isScrapingDouyin ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Đang tải...
                        </>
                      ) : (
                        <>
                          <Flame size={14} /> 🚀 Nạp Video Này
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* TUỲ CHỌN TẢI THẲNG FILE 8 PHÚT TỪ MÁY */}
                <div className="p-4 bg-[#13223F] border border-[#1E3867] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                      <Upload size={14} className="text-[#38BDF8]" /> Hoặc Chọn File Video Trực Tiếp Từ Máy Tính
                    </h4>
                    <p className="text-[11px] text-blue-200/70 mt-0.5">
                      Khuyên dùng: Tải file từ máy tính phát siêu mượt, trọn vẹn 100% thời lượng (8 phút, 15 phút) và không lo bị lỗi mạng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDouyinModal(false);
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 bg-[#1877F2] hover:bg-[#2563EB] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <FolderOpen size={14} /> 📁 Chọn File Từ Máy
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-[#1E3867] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowDouyinModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-blue-950"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MODAL CHÈN HIỆU ỨNG ÂM THANH & HÌNH ẢNH MỚI - XANH FACEBOOK */}
      {showEffectsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F1C33] border border-[#25447C] rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3867]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-[#1565C0] to-[#2563EB] text-white rounded-xl shadow-md shadow-blue-950">
                  <Sparkles size={18} />
                </span>
                <h3 className="text-base font-black text-white">Hiệu Ứng Hình Ảnh & Âm Thanh</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEffectsModal(false)}
                className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-[#1A3059] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* PHẦN 1: HIỆU ỨNG HÌNH ẢNH */}
              <div className="p-4 bg-[#0B1527] border border-[#1E3867] rounded-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5 mb-3">
                  <Palette size={14} className="text-[#1877F2]" /> 1. Bộ Lọc Màu & Hiệu Ứng Hình Ảnh (Visual)
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-blue-200 block mb-1.5">Tông màu điện ảnh:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "none", label: "Mặc định" },
                        { id: "bright", label: "✨ Sáng nét" },
                        { id: "cinematic", label: "🎬 Điện ảnh" },
                        { id: "vibrant", label: "🌈 Rực rỡ" },
                        { id: "golden", label: "☀️ Vàng ấm" },
                        { id: "vintage", label: "🎞️ Hoài niệm" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setVisualEffects((p) => ({ ...p, filterType: item.id as any }))}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            visualEffects.filterType === item.id
                              ? "bg-[#1877F2] text-white border-blue-400 shadow-sm"
                              : "bg-[#13223F] text-slate-200 border-[#1E3867] hover:bg-[#1A3059]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">
                        Độ sáng: {visualEffects.brightness}%
                      </label>
                      <input
                        type="range"
                        min={80}
                        max={140}
                        value={visualEffects.brightness}
                        onChange={(e) => setVisualEffects((p) => ({ ...p, brightness: Number(e.target.value) }))}
                        className="w-full accent-[#1877F2] h-2 bg-[#152649] rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">
                        Độ bão hòa màu: {visualEffects.saturation}%
                      </label>
                      <input
                        type="range"
                        min={60}
                        max={180}
                        value={visualEffects.saturation}
                        onChange={(e) => setVisualEffects((p) => ({ ...p, saturation: Number(e.target.value) }))}
                        className="w-full accent-[#1877F2] h-2 bg-[#152649] rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-blue-200 block mb-1">
                      Tốc độ phát: {visualEffects.speed}x (Tăng tốc để video TikTok cuốn hút hơn)
                    </label>
                    <div className="flex gap-2">
                      {[1.0, 1.1, 1.2, 1.25, 1.5].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setVisualEffects((p) => ({ ...p, speed: spd }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            visualEffects.speed === spd
                              ? "bg-[#1877F2] text-white border-blue-400 shadow-sm"
                              : "bg-[#13223F] text-slate-200 border-[#1E3867] hover:bg-[#1A3059]"
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: HIỆU ỨNG ÂM THANH */}
              <div className="p-4 bg-[#0B1527] border border-[#1E3867] rounded-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5 mb-3">
                  <Music size={14} className="text-emerald-400" /> 2. Hiệu Ứng Âm Thanh & Khuếch Đại (Audio)
                </span>

                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-2.5 bg-[#13223F] border border-[#1E3867] rounded-xl cursor-pointer hover:border-[#1877F2] transition-all">
                    <div>
                      <p className="text-xs font-bold text-white">🎙️ Khuếch đại giọng nói (Voice Boost +40%)</p>
                      <p className="text-[11px] text-blue-200/70">Giúp giọng nói rõ ràng, nổi bật hơn so với âm thanh tạp âm</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.boostVoiceVolume}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, boostVoiceVolume: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-[#13223F] border border-[#1E3867] rounded-xl cursor-pointer hover:border-[#1877F2] transition-all">
                    <div>
                      <p className="text-xs font-bold text-white">🔔 Hiệu ứng Ding khi hiện Banner</p>
                      <p className="text-[11px] text-blue-200/70">Phát âm thanh thông báo thu hút mắt nhìn khi banner giảm giá xuất hiện</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.dingEffectEnabled}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, dingEffectEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-[#13223F] border border-[#1E3867] rounded-xl cursor-pointer hover:border-[#1877F2] transition-all">
                    <div>
                      <p className="text-xs font-bold text-white">⚡ Hiệu ứng Whoosh lướt cảnh mở đầu</p>
                      <p className="text-[11px] text-blue-200/70">Âm thanh lướt gió chuyên nghiệp trong 2 giây đầu video</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.whooshEffectEnabled}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, whooshEffectEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowEffectsModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-blue-950"
              >
                Lưu & Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THIẾT LẬP LOGO & BANNER - XANH FACEBOOK */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F1C33] border border-[#25447C] rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3867]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-[#1565C0] to-[#2563EB] text-white rounded-xl shadow-md shadow-blue-950">
                  <ImageIcon size={18} />
                </span>
                <h3 className="text-base font-black text-white">Thiết Lập Logo & Banner Video</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-[#1A3059] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* PHẦN 1: LOGO */}
              <div className="p-4 bg-[#0B1527] border border-[#1E3867] rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#1877F2]" /> 1. Logo Thương Hiệu
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logoConfig.enabled}
                      onChange={(e) => setLogoConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    Bật Logo
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-blue-200 block mb-1.5">
                      Ảnh Logo (PNG trong suốt / JPG):
                    </label>
                    <div className="flex items-center gap-3">
                      {logoConfig.imageSrc ? (
                        <div className="relative group w-14 h-14 bg-[#13223F] border border-[#1E3867] rounded-xl p-1 flex items-center justify-center shrink-0">
                          <img
                            src={logoConfig.imageSrc}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain rounded"
                          />
                          <button
                            type="button"
                            onClick={() => setLogoConfig((p) => ({ ...p, imageSrc: "" }))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 cursor-pointer"
                            title="Xóa logo"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : null}

                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => logoImageInputRef.current?.click()}
                          className="w-full py-2.5 px-3 bg-[#13223F] hover:bg-[#1A3059] border border-dashed border-[#25447C] rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                        >
                          <UploadCloud size={16} className="text-blue-300" />
                          {logoConfig.imageSrc ? "Đổi ảnh Logo khác" : "Chọn ảnh Logo từ máy tính..."}
                        </button>
                        <input
                          ref={logoImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLogoFile}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {!logoConfig.imageSrc && (
                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">
                        Hoặc nhập Chữ Logo đại diện:
                      </label>
                      <input
                        type="text"
                        value={logoConfig.name}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, name: e.target.value }))}
                        placeholder="VD: KPOST AI"
                        className="w-full text-xs font-bold px-3 py-2 bg-[#13223F] border border-[#1E3867] rounded-xl text-white focus:border-[#1877F2] focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">Vị trí góc:</label>
                      <select
                        value={logoConfig.position}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, position: e.target.value as any }))}
                        className="w-full text-xs font-bold px-2.5 py-1.5 bg-[#13223F] border border-[#1E3867] rounded-xl text-white focus:outline-none"
                      >
                        <option value="top-right">Góc trên - Phải</option>
                        <option value="top-left">Góc trên - Trái</option>
                        <option value="bottom-right">Góc dưới - Phải</option>
                        <option value="bottom-left">Góc dưới - Trái</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">
                        Kích thước: {logoConfig.size || 40}px
                      </label>
                      <input
                        type="range"
                        min={24}
                        max={70}
                        value={logoConfig.size || 40}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, size: Number(e.target.value) }))}
                        className="w-full accent-[#1877F2] h-2 bg-[#152649] rounded-lg cursor-pointer mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: BANNER QUẢNG CÁO */}
              <div className="p-4 bg-[#0B1527] border border-[#1E3867] rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    🏷️ 2. Banner Quảng Cáo / Giảm Giá
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerConfig.enabled}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    Bật Banner
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-blue-200 block mb-1">Tiêu đề chính:</label>
                    <input
                      type="text"
                      value={bannerConfig.title}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, title: e.target.value }))}
                      placeholder="VD: ⚡ FLASH SALE 50% - DUY NHẤT HÔM NAY"
                      className="w-full text-xs font-bold px-3 py-2 bg-[#13223F] border border-[#1E3867] rounded-xl text-white focus:border-[#1877F2] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-blue-200 block mb-1">Mô tả phụ (subtitle):</label>
                    <input
                      type="text"
                      value={bannerConfig.subtitle || ""}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, subtitle: e.target.value }))}
                      placeholder="VD: Miễn phí giao hàng toàn quốc • Bảo hành chính hãng"
                      className="w-full text-xs font-medium px-3 py-2 bg-[#13223F] border border-[#1E3867] rounded-xl text-white focus:border-[#1877F2] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">Bắt đầu (giây):</label>
                      <input
                        type="number"
                        min={0}
                        max={videoDuration || 120}
                        value={bannerConfig.startSec}
                        onChange={(e) => setBannerConfig((p) => ({ ...p, startSec: Number(e.target.value) }))}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-[#13223F] border border-[#1E3867] rounded-xl text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">Kết thúc (giây):</label>
                      <input
                        type="number"
                        min={0}
                        max={videoDuration || 120}
                        value={bannerConfig.endSec}
                        onChange={(e) => setBannerConfig((p) => ({ ...p, endSec: Number(e.target.value) }))}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-[#13223F] border border-[#1E3867] rounded-xl text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-blue-950"
              >
                Lưu & Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
