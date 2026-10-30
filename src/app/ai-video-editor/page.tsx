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
  Code,
  Key,
  Scissors,
  Film,
  Layers,
  ExternalLink,
  Settings,
  Plus,
  Languages,
  ShieldCheck,
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

export const SUPPORTED_TRANSLATION_LANGUAGES = [
  { code: "vi", name: "Tiếng Việt", nativeName: "Tiếng Việt", flag: "🇻🇳", voiceLang: "vi-VN", description: "Bản dịch tự nhiên, chuẩn văn phong Việt Nam" },
  { code: "en", name: "Tiếng Anh", nativeName: "English (US)", flag: "🇺🇸", voiceLang: "en-US", description: "Phổ biến toàn cầu, ngữ điệu Mỹ chuẩn" },
  { code: "ja", name: "Tiếng Nhật", nativeName: "日本語 (Japanese)", flag: "🇯🇵", voiceLang: "ja-JP", description: "Phong cách anime, drama Nhật Bản cuốn hút" },
  { code: "ru", name: "Tiếng Nga", nativeName: "Русский (Russian)", flag: "🇷🇺", voiceLang: "ru-RU", description: "Phát âm chuẩn tiếng Nga, truyền cảm" },
  { code: "ko", name: "Tiếng Hàn", nativeName: "한국어 (Korean)", flag: "🇰🇷", voiceLang: "ko-KR", description: "Chuẩn phim truyền hình Hàn Quốc, K-Drama" },
  { code: "id", name: "Tiếng Indonesia", nativeName: "Bahasa Indonesia", flag: "🇮🇩", voiceLang: "id-ID", description: "Thị trường Đông Nam Á cực kỳ tiềm năng" },
  { code: "hi", name: "Tiếng Ấn Độ", nativeName: "हिन्दी (Hindi)", flag: "🇮🇳", voiceLang: "hi-IN", description: "Tiếp cận hơn 1.4 tỷ khán giả thị trường Ấn Độ" },
  { code: "ar", name: "Tiếng Ả Rập", nativeName: "العربية (Arabic)", flag: "🇸🇦", voiceLang: "ar-SA", description: "Thị trường Trung Đông giàu có & lượt xem khủng" },
  { code: "es", name: "Tiếng Tây Ban Nha", nativeName: "Español (Spanish)", flag: "🇪🇸", voiceLang: "es-ES", description: "Thị trường Mỹ Latinh và Châu Âu bùng nổ" },
  { code: "pt", name: "Tiếng Bồ Đào Nha", nativeName: "Português", flag: "🇵🇹", voiceLang: "pt-BR", description: "Phục vụ thị trường Brazil và Bồ Đào Nha" },
  { code: "fr", name: "Tiếng Pháp", nativeName: "Français", flag: "🇫🇷", voiceLang: "fr-FR", description: "Sang trọng, đài từ rõ ràng chuẩn Châu Âu" },
  { code: "th", name: "Tiếng Thái", nativeName: "ไทย (Thai)", flag: "🇹🇭", voiceLang: "th-TH", description: "Ngữ điệu hài hước, bắt trend TikTok Thái Lan" },
];

export const DOUYIN_HOT_TRENDS: DouyinTrendItem[] = [
  // 🧸 1. ĐỒ CHƠI & TRẺ EM (10 items)
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
    id: "dy_toy_02",
    title: "Robot Nhảy Múa Thông Minh Cảm Biến Cử Chỉ",
    originalTitle: "智能感应跳舞机器儿童玩具",
    category: "kids_toys",
    categoryLabel: "Đồ chơi & Trẻ em",
    likes: "3.2M",
    shares: "410K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "cartoon",
    voiceRecommendationName: "Pikachu Chibi",
    viralInsight: "Robot nhảy theo điệu nhạc bắt tai, trẻ em bắt chước nhảy theo.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Cười xỉu với chú robot này luôn nè mọi người, nhảy siêu điệu nghệ luôn!" },
      { startSec: 4.5, endSec: 9.5, text: "Chỉ cần vẫy tay là tự động xoay 360 độ và phát nhạc sôi động cực vui." },
      { startSec: 9.5, endSec: 15, text: "Bé nhà mình mê tít từ sáng tới tối, ba mẹ rinh ngay một con nha!" }
    ]
  },
  {
    id: "dy_toy_03",
    title: "Bộ Xếp Hình Nam Châm Đa Chiều 3D Phát Sáng",
    originalTitle: "磁力片积木 3D空间建构玩具",
    category: "kids_toys",
    categoryLabel: "Đồ chơi & Trẻ em",
    likes: "1.7M",
    shares: "190K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "child_girl",
    voiceRecommendationName: "Bé Bông (6-8 tuổi)",
    viralInsight: "Lắp ráp lâu đài cầu vồng chỉ trong 10 giây thu hút tương tác cực tốt.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Mẹ ơi nhìn này, lâu đài cầu vồng phát sáng của con lộng lẫy chưa!" },
      { startSec: 4, endSec: 9, text: "Miếng nam châm hít chặt lắm nha, xếp xe ô tô hay phi thuyền đều được hết." },
      { startSec: 9, endSec: 15, text: "Giúp bé phát triển tư duy sáng tạo cực kỳ tốt, ba mẹ mua liền nha!" }
    ]
  },
  {
    id: "dy_toy_04",
    title: "Xe Biến Hình Transformer Điều Khiển Từ Xa Bằng Cử Chỉ",
    originalTitle: "手势感应变形遥控特技车",
    category: "kids_toys",
    categoryLabel: "Đồ chơi & Trẻ em",
    likes: "4.1M",
    shares: "530K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "speed_mc",
    voiceRecommendationName: "MC Siêu Tốc",
    viralInsight: "Cú vẫy tay biến xe đua thành robot khổng lồ tạo hiệu ứng giật mình cực mạnh.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Chiếc xe biến hình đỉnh nhất năm nay đây rồi anh em ơi!" },
      { startSec: 4, endSec: 9, text: "Vẫy tay một cái xe lập tức biến hình thành robot và drift xoay tròn siêu tốc." },
      { startSec: 9, endSec: 15, text: "Pin trâu chơi thỏa thích cả ngày, món quà sinh nhật đỉnh cao cho bé trai!" }
    ]
  },
  {
    id: "dy_toy_05",
    title: "Súng Bắn Bong Bóng Khổng Lồ 69 Lỗ Tên Lửa",
    originalTitle: "火箭筒泡泡机 69孔大功率出泡",
    category: "kids_toys",
    categoryLabel: "Đồ chơi & Trẻ em",
    likes: "2.9M",
    shares: "360K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "child_boy",
    voiceRecommendationName: "Bé Bắp (5-7 tuổi)",
    viralInsight: "Hàng ngàn bong bóng cầu vồng bắn ra ngợp trời bối cảnh công viên.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Trời ơi bong bóng ngập tràn cả công viên luôn, đẹp như trong truyện cổ tích!" },
      { startSec: 4.5, endSec: 9.5, text: "Có đèn led phát sáng ban đêm lấp lánh như pháo hoa, bé nào cũng thích mê." },
      { startSec: 9.5, endSec: 15, text: "Đi chơi dã ngoại mang theo súng bong bóng này là nổi bật nhất hội luôn nha!" }
    ]
  },
  {
    id: "dy_toy_06",
    title: "Đất Sét Ma Thuật Tự Khô Không Dính Tay Siêu Đàn Hồi",
    originalTitle: "超轻粘土 无毒不粘手手工彩泥",
    category: "kids_toys",
    categoryLabel: "Đồ chơi & Trẻ em",
    likes: "1.5M",
    shares: "140K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "child_girl",
    voiceRecommendationName: "Bé Bông (6-8 tuổi)",
    viralInsight: "Tạo hình bánh kem mini siêu mịn màng, âm thanh nhào nặn ASMR thư giãn.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Đất sét siêu nhẹ nặn hình cực kỳ dễ, mịn màng và không hề dính tay đâu nè!" },
      { startSec: 4.5, endSec: 9.5, text: "Nặn xong để khô tự nhiên là thành món đồ trang trí dễ thương xỉu luôn." },
      { startSec: 9.5, endSec: 15, text: "Bộ 36 màu tặng kèm dụng cụ tạo hình, giá đang sale cực rẻ trong giỏ hàng!" }
    ]
  },
  {
    id: "dy_toy_07",
    title: "Đàn Piano Mini 37 Phím Kèm Micro Thu Âm Cho Bé",
    originalTitle: "儿童多功能电子琴 带麦克风早教玩具",
    category: "kids_toys",
    categoryLabel: "Đồ chơi & Trẻ em",
    likes: "2.3M",
    shares: "280K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Bé nhỏ đánh bản nhạc thiếu nhi cực đáng yêu kích thích phụ huynh mua sắm.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Ươm mầm tài năng âm nhạc cho con yêu ngay từ nhỏ với chiếc đàn xinh xắn này." },
      { startSec: 4, endSec: 9.5, text: "Có sẵn micro để bé vừa đánh đàn vừa hát líu lo, phím bấm cực êm và chuẩn âm." },
      { startSec: 9.5, endSec: 15, text: "Tích hợp sẵn nhiều điệu nhạc mẫu, giúp bé tránh xa điện thoại và tivi!" }
    ]
  },
  {
    id: "dy_toy_08",
    title: "Bộ Thẻ Học Thông Minh Phát Âm Song Ngữ Anh - Việt",
    originalTitle: "中英双语早教插卡学习机",
    category: "kids_toys",
    categoryLabel: "Đồ chơi & Trẻ em",
    likes: "3.7M",
    shares: "620K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Bé phát âm tiếng Anh chuẩn bản xứ theo máy học thẻ.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Bí quyết giúp con nói tiếng Anh vanh vách như người bản xứ là đây nè ba mẹ ơi!" },
      { startSec: 4.5, endSec: 9.5, text: "Chỉ cần cắm thẻ vào máy là phát âm song ngữ chuẩn kèm tiếng kêu sinh động." },
      { startSec: 9.5, endSec: 15, text: "Hơn 500 từ vựng phong phú, đầu tư cho con học chữ thông minh ba mẹ nhé!" }
    ]
  },
  {
    id: "dy_toy_09",
    title: "Bộ Trò Chơi Thử Thách Đập Băng Khỉ Cứu Chim Cánh Cụt",
    originalTitle: "破冰企鹅桌游 亲子互动益智玩具",
    category: "kids_toys",
    categoryLabel: "Đồ chơi & Trẻ em",
    likes: "1.9M",
    shares: "230K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "cartoon",
    voiceRecommendationName: "Pikachu Chibi",
    viralInsight: "Tiếng đập đá căng thẳng và cú rơi bất ngờ tạo tiếng cười giòn giã.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Trò chơi gia đình cười ra nước mắt những ngày cuối tuần là đây chứ đâu!" },
      { startSec: 4, endSec: 9, text: "Gõ từng tảng băng sao cho chú chim cánh cụt không bị rơi xuống nước nha." },
      { startSec: 9, endSec: 15, text: "Ai làm rơi trước là bị phạt quẹt nhọ nồi, vui nhộn gắn kết cả nhà luôn ạ!" }
    ]
  },
  {
    id: "dy_toy_10",
    title: "Kính Thiên Văn Mini Khám Phá Mặt Trăng & Các Vì Sao",
    originalTitle: "高清天文望远镜 学生科学探索",
    category: "kids_toys",
    categoryLabel: "Đồ chơi & Trẻ em",
    likes: "2.6M",
    shares: "310K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_male_reviewer",
    voiceRecommendationName: "Đức Anh (Reviewer Bắt Trend)",
    viralInsight: "Phóng to bề mặt mặt trăng rõ nét từng miệng núi lửa kích thích đam mê khoa học.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Không thể tin được là chiếc kính thiên văn mini này nhìn rõ bề mặt mặt trăng đến vậy!" },
      { startSec: 4.5, endSec: 9.5, text: "Độ phóng đại cực nét, quan sát sao Hỏa, sao Thổ và ngắm chim chóc phong cảnh siêu đỉnh." },
      { startSec: 9.5, endSec: 15, text: "Món quà tuyệt vời nuôi dưỡng ước mơ phi hành gia của các bạn nhỏ!" }
    ]
  },

  // 🛍️ 2. GIA DỤNG THÔNG MINH (10 items)
  {
    id: "dy_home_01",
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
    id: "dy_home_02",
    title: "Máy Hút Bụi Giường Nệm Tia UV Diệt Khuẩn 99.9%",
    originalTitle: "超声波除螨仪 家用大吸力紫外线杀菌",
    category: "smart_home",
    categoryLabel: "Gia dụng thông minh",
    likes: "3.5M",
    shares: "490K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "adult_male_reviewer",
    voiceRecommendationName: "Đức Anh (Reviewer Bắt Trend)",
    viralInsight: "Cận cảnh khoang chứa bụi hút ra cả búi bụi mịn và mạt rệp sau 1 phút.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Xem hộp bụi sau 1 phút hút nệm mà mình rùng cả mình luôn anh em ơi!" },
      { startSec: 4.5, endSec: 9.5, text: "Tia cực tím UV diệt sạch 99% mạt bụi và vi khuẩn gây ngứa ngáy dị ứng da." },
      { startSec: 9.5, endSec: 15, text: "Nhà có con nhỏ hay người già nhất định phải có một em này để ngủ ngon giấc!" }
    ]
  },
  {
    id: "dy_home_03",
    title: "Thùng Rác Cảm Ứng Thông Minh Tự Động Đóng Gói Túi",
    originalTitle: "智能感应垃圾桶 自动打包换袋",
    category: "smart_home",
    categoryLabel: "Gia dụng thông minh",
    likes: "4.2M",
    shares: "580K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "speed_mc",
    voiceRecommendationName: "MC Siêu Tốc",
    viralInsight: "Đưa tay tới là nắp tự mở, bấm nút là tự hàn kín túi rác sạch sẽ không bẩn tay.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Đỉnh cao lười biếng nhưng cực kỳ sạch sẽ là chiếc thùng rác này nè!" },
      { startSec: 4, endSec: 9.5, text: "Vẫy tay mở nắp trong 0.2 giây, khi đầy rác bấm 1 nút là tự niêm phong túi sạch bong." },
      { startSec: 9.5, endSec: 15, text: "Không sợ mùi hôi khó chịu, thiết kế sang chảnh đặt phòng khách hay bếp đều đẹp!" }
    ]
  },
  {
    id: "dy_home_04",
    title: "Máy Rửa Kính Mắt & Trang Sức Bằng Sóng Siêu Âm 45000Hz",
    originalTitle: "超声波清洗机 眼镜手表首饰深度清洁",
    category: "smart_home",
    categoryLabel: "Gia dụng thông minh",
    likes: "2.4M",
    shares: "310K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Các hạt bụi bẩn li ti phụt ra khỏi khe kính mắt tạo cảm giác cực kỳ đã mắt.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Thả chiếc kính đeo 1 tuần vào máy mà bụi bẩn li ti bắn ra nhìn sướng mắt thực sự!" },
      { startSec: 4.5, endSec: 9.5, text: "Sóng siêu âm len lỏi vào từng kẽ ốc, rửa đồng hồ hay trang sức bạc sáng bóng như mới." },
      { startSec: 9.5, endSec: 15, text: "Nhỏ gọn tiện lợi cắm sạc type-C mang đi làm, deal hời hôm nay bấm góc trái nha!" }
    ]
  },
  {
    id: "dy_home_05",
    title: "Máy Xay Sinh Tố Mini Cầm Tay Sạc Type-C Lưỡi Dao Kép",
    originalTitle: "便携式随行榨汁机 无线充电果汁杯",
    category: "smart_home",
    categoryLabel: "Gia dụng thông minh",
    likes: "1.8M",
    shares: "220K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Xay mịn đá viên và dâu tây chỉ trong 30 giây ngay tại văn phòng làm việc.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Team mê nước ép detox mỗi ngày nhất định phải sắm em cối xay mini này nha!" },
      { startSec: 4, endSec: 9, text: "Xay được cả đá bi và hoa quả đông lạnh, mở nắp ra là uống trực tiếp như bình nước." },
      { startSec: 9, endSec: 15, text: "Mang đi tập gym hay đi làm cực kỳ tiện, bấm vào giỏ hàng săn voucher ngay nha!" }
    ]
  },
  {
    id: "dy_home_06",
    title: "Đèn Cảm Ứng Chuyển Động Dán Bậc Cầu Thang & Tủ Quần Áo",
    originalTitle: "人体感应小夜灯 衣柜楼梯间免布线磁吸灯",
    category: "smart_home",
    categoryLabel: "Gia dụng thông minh",
    likes: "2.7M",
    shares: "340K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_male_mc",
    voiceRecommendationName: "Minh Quân (Nam MC Trầm Ấm)",
    viralInsight: "Người đi tới đâu đèn tự bừng sáng ấm áp sang trọng như khách sạn 5 sao.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Biến ngôi nhà trở nên sang trọng như khách sạn cao cấp chỉ với chiếc đèn từ tính này." },
      { startSec: 4.5, endSec: 9.5, text: "Không cần đục tường đi dây, bước chân tới là đèn tự động sáng dịu mắt ban đêm." },
      { startSec: 9.5, endSec: 15, text: "Pin dùng nửa năm mới phải sạc 1 lần, an toàn tuyệt đối cho người già và trẻ nhỏ." }
    ]
  },
  {
    id: "dy_home_07",
    title: "Keo Dán Tường Đa Năng Siêu Dính Chịu Lực 50kg Không Khoan",
    originalTitle: "强力免钉胶 家用无痕承重多功能胶水",
    category: "smart_home",
    categoryLabel: "Gia dụng thông minh",
    likes: "3.1M",
    shares: "420K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "senior",
    voiceRecommendationName: "Bác Năm (Người lớn tuổi)",
    viralInsight: "Treo can nước 20 lít và xà đơn lên tường mà không hề rơi vỡ gạch men.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Nhà thuê không được khoan tường thì bà con dùng ngay tuýp keo dán siêu dính này!" },
      { startSec: 4, endSec: 9, text: "Bôi lên giá để đồ dán vào gạch men, treo cả can nước nặng trịch vẫn chắc như đinh đóng cột." },
      { startSec: 9, endSec: 15, text: "Chống nước chống ẩm mốc tuyệt đối, tháo ra không để lại một vết xước nào!" }
    ]
  },
  {
    id: "dy_home_08",
    title: "Bộ Kệ Góc Nhà Tắm Dán Tường Khô Ráo Thoát Nước Thông Minh",
    originalTitle: "卫生间三角置物架 沥水免打孔收纳神器",
    category: "smart_home",
    categoryLabel: "Gia dụng thông minh",
    likes: "1.6M",
    shares: "180K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Góc phòng tắm bừa bộn lập tức trở nên gọn gàng sạch sẽ sau khi lắp kệ.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Phòng tắm chật chội bừa bộn chai lọ thì gắn ngay kệ góc thông minh này vào nhé." },
      { startSec: 4.5, endSec: 9.5, text: "Thiết kế rãnh thoát nước đáy giúp xà bông luôn khô ráo, không lo đóng rong rêu." },
      { startSec: 9.5, endSec: 15, text: "Nhựa ABS cao cấp bền bỉ, gom trọn bộ 2 chiếc đang có giá cực ưu đãi luôn nè!" }
    ]
  },
  {
    id: "dy_home_09",
    title: "Máy Hút Bọt Rửa Tay Cảm Ứng Tự Động Khử Khuẩn",
    originalTitle: "自动感应洗手液机 泡沫丰富卫生防交叉感染",
    category: "smart_home",
    categoryLabel: "Gia dụng thông minh",
    likes: "2.1M",
    shares: "260K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "child_boy",
    voiceRecommendationName: "Bé Bắp (5-7 tuổi)",
    viralInsight: "Đưa tay ra là bọt tuyết mịn như mây tự phun ra tay tạo sự thích thú cho cả nhà.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Đưa tay vào là bọt tuyết mịn xốp như mây tự rơi ra tay, rửa tay thích mê luôn!" },
      { startSec: 4, endSec: 9, text: "Không cần chạm tay vào vòi tránh lây nhiễm vi khuẩn, giúp bé chăm rửa tay hơn." },
      { startSec: 9, endSec: 15, text: "Tiết kiệm nước rửa tay gấp 3 lần bình thường, cắm sạc một lần dùng cả tháng!" }
    ]
  },
  {
    id: "dy_home_10",
    title: "Cây Lăn Bụi Và Lông Chó Mèo Tự Xoay Tự Làm Sạch Đa Năng",
    originalTitle: "静电除毛刷 宠物粘毛清理神器",
    category: "smart_home",
    categoryLabel: "Gia dụng thông minh",
    likes: "3.8M",
    shares: "510K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_male_reviewer",
    voiceRecommendationName: "Đức Anh (Reviewer Bắt Trend)",
    viralInsight: "Lăn qua ghế sofa đầy lông mèo 1 lượt là sạch bong, không tốn băng dính cuộn.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Anh em nào nuôi chó mèo mà quần áo ghế sofa đầy lông thì xem ngay chiếc lăn này!" },
      { startSec: 4.5, endSec: 9.5, text: "Lăn đi lăn lại vài đường là lông dính sạch vào khoang chứa, chỉ cần bật nắp đổ rác là xong." },
      { startSec: 9.5, endSec: 15, text: "Dùng vĩnh viễn không cần thay lõi giấy dính tốn kém, giá rẻ như cốc trà sữa!" }
    ]
  },

  // 📱 3. CÔNG NGHỆ & ĐỜI SỐNG (10 items)
  {
    id: "dy_tech_01",
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
    id: "dy_tech_02",
    title: "Micro Thu Âm Cài Áo Không Dây Khử Ồn Kép Chuyên Nghiệp",
    originalTitle: "无线领夹麦克风 降噪直播录音神器",
    category: "tech_gadgets",
    categoryLabel: "Công nghệ & Đời sống",
    likes: "4.5M",
    shares: "640K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "speed_mc",
    voiceRecommendationName: "MC Siêu Tốc",
    viralInsight: "So sánh tiếng gió rít bên ngoài đường với tiếng nói trong veo khi bật micro lọc ồn.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Bật mí chiếc mic giúp âm thanh video của các idol TikTok lúc nào cũng trong vắt!" },
      { startSec: 4, endSec: 9.5, text: "Đứng cạnh công trường hay giữa trời mưa gió nói vẫn rõ từng chữ, lọc sạch 98% tạp âm." },
      { startSec: 9.5, endSec: 15, text: "Cắm trực tiếp vào điện thoại là thu âm ngay, giá học sinh sinh viên cực mềm!" }
    ]
  },
  {
    id: "dy_tech_03",
    title: "Quạt Mini Đeo Cổ 3 Cánh Gió Làm Lạnh Cấp Tốc Bằng Sò Lạnh",
    originalTitle: "半导体制冷挂脖风扇 夏日便携随身降温",
    category: "tech_gadgets",
    categoryLabel: "Công nghệ & Đời sống",
    likes: "2.8M",
    shares: "370K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "adult_male_reviewer",
    voiceRecommendationName: "Đức Anh (Reviewer Bắt Trend)",
    viralInsight: "Tấm sò lạnh bám hơi nước đông sương trong 3 giây xua tan cơn nóng mùa hè.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Trời nóng 40 độ ngoài đường mà đeo con quạt này vào là mát lạnh sống lưng luôn!" },
      { startSec: 4.5, endSec: 9.5, text: "Tích hợp tấm bán dẫn làm lạnh như điều hòa mini, gió thổi 360 độ quanh cổ không bí bách." },
      { startSec: 9.5, endSec: 15, text: "Pin trâu 6000mAh thổi liên tục 12 tiếng, hè này đi phượt hay làm shipper thì hết ý!" }
    ]
  },
  {
    id: "dy_tech_04",
    title: "Sạc Dự Phòng Nam Châm Từ Tính Magsafe Siêu Mỏng Bỏ Ví",
    originalTitle: "超薄磁吸无线充电宝 便携大容量",
    category: "tech_gadgets",
    categoryLabel: "Công nghệ & Đời sống",
    likes: "3.1M",
    shares: "410K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Ốp vào lưng điện thoại hít chặt mỏng dính không vướng víu dây sạc.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Tạm biệt những cục sạc dự phòng nặng nề dây nhợ chằng chịt đi mấy bà ơi!" },
      { startSec: 4, endSec: 9, text: "Cục sạc Magsafe này mỏng chỉ 8mm, đặt nhẹ lưng điện thoại là hít chặt sạc nhanh 20W." },
      { startSec: 9, endSec: 15, text: "Màu pastel xinh xỉu bỏ túi xách siêu nhẹ, đang sale sốc hôm nay rinh liền nha!" }
    ]
  },
  {
    id: "dy_tech_05",
    title: "Máy Chiếu Mini Bỏ Túi Rạp Phim Full HD 1080p Kết Nối Wifi",
    originalTitle: "家用高清微型投影仪 手机同屏便携影院",
    category: "tech_gadgets",
    categoryLabel: "Công nghệ & Đời sống",
    likes: "4.8M",
    shares: "710K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "adult_male_mc",
    voiceRecommendationName: "Minh Quân (Nam MC Trầm Ấm)",
    viralInsight: "Chiếu thẳng lên trần phòng ngủ màn hình 150 inch xem phim cực chill.",
    suggestedScript: [
      { startSec: 0, endSec: 5, text: "Biến căn phòng ngủ thành rạp chiếu phim chuẩn CGV chưa bao giờ dễ dàng đến thế." },
      { startSec: 5, endSec: 10, text: "Chiếu trực tiếp lên tường hoặc trần nhà màn hình 150 inch siêu sắc nét, loa kép sống động." },
      { startSec: 10, endSec: 15, text: "Kết nối điện thoại qua wifi xem Netflix cực đã, bấm vào giỏ hàng để nhận giá ưu đãi!" }
    ]
  },
  {
    id: "dy_tech_06",
    title: "Tai Nghe Bluetooth Chống Ồn Chủ Động ANC Âm Bass Trầm Ấm",
    originalTitle: "主动降噪蓝牙耳机 空间音频长续航",
    category: "tech_gadgets",
    categoryLabel: "Công nghệ & Đời sống",
    likes: "2.2M",
    shares: "290K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "adult_male_reviewer",
    voiceRecommendationName: "Đức Anh (Reviewer Bắt Trend)",
    viralInsight: "Âm thanh vòm 360 độ và tính năng xuyên âm như tai nghe cao cấp chục triệu.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Chất âm con này làm mình giật mình luôn, bass đập căng đét không kém gì tai nghe tiền triệu!" },
      { startSec: 4.5, endSec: 9.5, text: "Bật chế độ chống ồn ANC một cái là không gian xung quanh tĩnh lặng như tờ, tập trung làm việc." },
      { startSec: 9.5, endSec: 15, text: "Thiết kế đeo êm tai không đau nhức, pin 35 tiếng sạc nhanh 10 phút nghe cả buổi!" }
    ]
  },
  {
    id: "dy_tech_07",
    title: "Gậy Chụp Ảnh Selfie 3 Chân Bluetooth Kèm Đèn Led Trợ Sáng",
    originalTitle: "四脚折叠自拍杆 带补光灯防抖遥控器",
    category: "tech_gadgets",
    categoryLabel: "Công nghệ & Đời sống",
    likes: "1.9M",
    shares: "240K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Gấp gọn chỉ bằng bàn tay nhưng kéo dài 1m6 chân đế 4 chấu đứng siêu vững trước gió.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Đi du lịch một mình mà vẫn có ảnh đẹp triệu view là nhờ em gậy selfie này đó nha!" },
      { startSec: 4, endSec: 9, text: "Chân đế 4 chấu chống đổ gió mạnh, kèm remote bluetooth bấm chụp từ xa 10 mét tiện lợi." },
      { startSec: 9, endSec: 15, text: "Tích hợp đèn trợ sáng tôn da mịn đẹp, con gái tụi mình nhất định phải có trong túi xách!" }
    ]
  },
  {
    id: "dy_tech_08",
    title: "Cáp Sạc Nhanh 100W 3 Trong 1 Tự Thu Gọn Dây Đèn Led Báo Watts",
    originalTitle: "一拖三伸缩快充线 100W数显数码线",
    category: "tech_gadgets",
    categoryLabel: "Công nghệ & Đời sống",
    likes: "3.9M",
    shares: "530K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "speed_mc",
    voiceRecommendationName: "MC Siêu Tốc",
    viralInsight: "Kéo giãn ra và tự thu gọn chỉ trong 1 giây, màn hình hiển thị công suất watts thực tế.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Sợi cáp sạc đa năng tiện nhất quả đất, sạc cùng lúc cả iPhone, Type-C và Micro USB!" },
      { startSec: 4.5, endSec: 9.5, text: "Kéo ra thu vào gọn gàng không sợ rối dây, màn hình hiển thị công suất sạc nhanh cực chất." },
      { startSec: 9.5, endSec: 15, text: "Chịu lực kéo gập 20.000 lần siêu bền bỉ, anh em bấm giỏ hàng rinh ngay kẻo hết sale!" }
    ]
  },
  {
    id: "dy_tech_09",
    title: "Đồng Hồ Thông Minh Theo Dõi Sức Khỏe Đo Nhịp Tim SpO2",
    originalTitle: "智能健康运动手表 测心率血氧多功能",
    category: "tech_gadgets",
    categoryLabel: "Công nghệ & Đời sống",
    likes: "2.5M",
    shares: "320K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "adult_male_mc",
    voiceRecommendationName: "Minh Quân (Nam MC Trầm Ấm)",
    viralInsight: "Màn hình cong AMOLED rực rỡ dưới ánh nắng và tính năng nghe gọi trực tiếp trên đồng hồ.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Một chiếc đồng hồ thông minh ngoại hình sang trọng chuẩn doanh nhân nhưng giá cực kỳ hời." },
      { startSec: 4.5, endSec: 9.5, text: "Đo nhịp tim, nồng độ oxy trong máu SpO2, theo dõi giấc ngủ và nghe gọi đàm thoại rõ ràng." },
      { startSec: 9.5, endSec: 15, text: "Chống nước đi bơi thoải mái, món quà ý nghĩa chăm sóc sức khỏe cho người thân!" }
    ]
  },
  {
    id: "dy_tech_10",
    title: "Chuột Không Dây Công Thái Học Siêu Êm Giảm Mỏi Cổ Tay",
    originalTitle: "人体工学静音无线鼠标 护腕办公神器",
    category: "tech_gadgets",
    categoryLabel: "Công nghệ & Đời sống",
    likes: "1.8M",
    shares: "210K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "adult_male_reviewer",
    voiceRecommendationName: "Đức Anh (Reviewer Bắt Trend)",
    viralInsight: "Góc nghiêng 57 độ ôm sát lòng bàn tay giúp dân văn phòng làm việc 8 tiếng không bị đau mỏi.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Dân văn phòng hay bị mỏi cổ tay thì đổi ngay sang con chuột công thái học này đi anh em!" },
      { startSec: 4, endSec: 9, text: "Cầm nghiêng tự nhiên như bắt tay, phím bấm êm tuyệt đối không phát ra tiếng động." },
      { startSec: 9, endSec: 15, text: "Kết nối cả Bluetooth lẫn USB Receiver, chuyển đổi máy tính và iPad chỉ bằng 1 nút bấm!" }
    ]
  },

  // 💄 4. MỸ PHẨM & SKINCARE (10 items)
  {
    id: "dy_beauty_01",
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
    id: "dy_beauty_02",
    title: "Son Kem Lì Mềm Môi Kháng Nước Không Dính Cốc Khi Uống Trà",
    originalTitle: "不掉色不沾杯雾面唇釉",
    category: "beauty_care",
    categoryLabel: "Mỹ phẩm & Skincare",
    likes: "4.3M",
    shares: "610K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Thử nghiệm uống trà sữa và quẹt khăn giấy môi vẫn nguyên màu đỏ cam tươi tắn.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Cây son kem lì đỉnh chóp nhất năm nay đây rồi các nàng thơ ơi!" },
      { startSec: 4, endSec: 9, text: "Chất son nhung mịn như lụa không hề lộ vân môi, uống nước không dính mép cốc tí nào." },
      { startSec: 9, endSec: 15, text: "Tone màu đỏ đất tôn da trắng răng đỉnh cao, đang mua 1 tặng 1 bấm giỏ hàng liền nha!" }
    ]
  },
  {
    id: "dy_beauty_03",
    title: "Mascara Chuốt Mi Tơi Dài Cong Vút Chống Nước Đầu Cọ Siêu Mảnh",
    originalTitle: "超细刷头防水卷翘睫毛膏",
    category: "beauty_care",
    categoryLabel: "Mỹ phẩm & Skincare",
    likes: "3.1M",
    shares: "380K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Đầu cọ 1mm chuốt tới tận chân mi mí mắt dưới tơi xốp không hề vón cục.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Bí quyết có hàng mi cong vút như búp bê mà không cần đi nối mi tốn kém đây nè!" },
      { startSec: 4.5, endSec: 9.5, text: "Đầu cọ siêu mảnh chuốt sợi nào tơi sợi đó, giữ nếp cong vút suốt 12 tiếng không sợ lem." },
      { startSec: 9.5, endSec: 15, text: "Rửa nước hay đi mưa thoải mái, tẩy trang bằng nước ấm là sạch trơn nha các nàng!" }
    ]
  },
  {
    id: "dy_beauty_04",
    title: "Serum Cấp Ẩm Phục Hồi Da B5 Làm Sáng Căng Bóng Tức Thì",
    originalTitle: "B5玻尿酸精华原液 补水修护修护敏肌",
    category: "beauty_care",
    categoryLabel: "Mỹ phẩm & Skincare",
    likes: "2.6M",
    shares: "340K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Thoa vài giọt serum lên da tạo hiệu ứng bóng gương chuẩn gái Hàn căng mướt.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Da bà nào đang bị khô rát, bong tróc hay sần sùi thì dùng ngay chai serum B5 này." },
      { startSec: 4, endSec: 9, text: "Chứa Hyaluronic Acid đa tầng ngậm nước, vỗ nhẹ lên da là thẩm thấu mướt rượt." },
      { startSec: 9, endSec: 15, text: "Phục hồi hàng rào bảo vệ da căng bóng khỏe khoắn, deal sốc hôm nay đừng bỏ lỡ!" }
    ]
  },
  {
    id: "dy_beauty_05",
    title: "Kem Chống Nắng Kiềm Dầu Nâng Tone Trắng Hồng Tự Nhiên SPF50+",
    originalTitle: "清爽控油防晒霜 自然提亮美白隔离",
    category: "beauty_care",
    categoryLabel: "Mỹ phẩm & Skincare",
    likes: "3.7M",
    shares: "520K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Chấm nửa mặt da nâng tone sáng mịn rạng rỡ không hề bết rít hay trắng bệch.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Buổi sáng vội đi làm chỉ cần thoa một lớp kem chống nắng này là tự tin ra đường luôn!" },
      { startSec: 4.5, endSec: 9.5, text: "Nâng tone trắng hồng tự nhiên thay thế kem lót, kiềm dầu khô thoáng cả ngày không bết rít." },
      { startSec: 9.5, endSec: 15, text: "Chỉ số chống nắng SPF50+ PA++++ bảo vệ da tối đa trước ánh nắng gay gắt mùa hè!" }
    ]
  },
  {
    id: "dy_beauty_06",
    title: "Xịt Khoáng Khóa Lớp Trang Điểm Cố Định Make-Up 16 Tiếng",
    originalTitle: "持久定妆喷雾 水光成膜防脱妆",
    category: "beauty_care",
    categoryLabel: "Mỹ phẩm & Skincare",
    likes: "2.3M",
    shares: "270K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Vòi xịt sương siêu mịn phủ đều tạo màng chắn chống trôi phấn tuyệt đối.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Đeo khẩu trang cả ngày mà lớp nền vẫn nguyên vẹn không lem một giọt phấn nào." },
      { startSec: 4, endSec: 9, text: "Tia xịt sương nano mỏng mịn như làn khói, tạo lớp màng khóa ẩm cố định make up 16 tiếng." },
      { startSec: 9, endSec: 15, text: "Không sợ đổ dầu hay mốc nền, bí kíp của các chuyên gia trang điểm đó nha mấy bà!" }
    ]
  },
  {
    id: "dy_beauty_07",
    title: "Mặt Nạ Đất Sét Khoáng Sủi Bọt Hút Sạch Mụn Đầu Đen & Dầu Thừa",
    originalTitle: "发泡泥膜 深层清洁毛孔去黑头",
    category: "beauty_care",
    categoryLabel: "Mỹ phẩm & Skincare",
    likes: "4.0M",
    shares: "590K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "adult_male_reviewer",
    voiceRecommendationName: "Đức Anh (Reviewer Bắt Trend)",
    viralInsight: "Bọt sủi bồng bềnh sau 60 giây hút sạch cặn bã dầu nhờn cánh mũi.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Cảm giác bọt sủi xèo xèo trên mặt lấy đi sạch mụn đầu đen bã nhờn sướng dã man!" },
      { startSec: 4.5, endSec: 9.5, text: "Đất sét khoáng thiên nhiên hút sạch dầu thừa từ sâu lỗ chân lông mà không hề gây khô rát." },
      { startSec: 9.5, endSec: 15, text: "Dùng tuần 2 lần là da mịn màng se khít lỗ chân lông rõ rệt, săn deal hời ngay góc trái!" }
    ]
  },
  {
    id: "dy_beauty_08",
    title: "Máy Rửa Mặt Sóng Âm Silicon Kháng Khuẩn Làm Sạch Sâu",
    originalTitle: "声波硅胶洁面仪 深入毛孔清洁",
    category: "beauty_care",
    categoryLabel: "Mỹ phẩm & Skincare",
    likes: "1.7M",
    shares: "190K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Rửa sạch vết son lì trên bề mặt quả cam thử nghiệm chứng minh độ sạch sâu.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Rửa mặt bằng tay thông thường chỉ sạch được 30% bụi bẩn bám trên bề mặt thôi." },
      { startSec: 4, endSec: 9, text: "Máy rửa mặt sóng âm rung 8000 lần mỗi phút, đẩy sạch cặn trang điểm và mụn cám ra ngoài." },
      { startSec: 9, endSec: 15, text: "Đầu silicon y tế siêu mềm không làm xệ da, sạc không dây sang chảnh bỏ túi mang đi làm!" }
    ]
  },
  {
    id: "dy_beauty_09",
    title: "Chì Kẻ Mày Phẩy Sợi 4D Kháng Nước Tự Nhiên Như Điêu Khắc",
    originalTitle: "四叉水眉笔 防水防汗自然根根分明",
    category: "beauty_care",
    categoryLabel: "Mỹ phẩm & Skincare",
    likes: "2.9M",
    shares: "360K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Đầu bút 4 nhánh kẻ từng sợi lông mày tự nhiên như vừa điêu khắc tiền triệu.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Ai không biết kẻ lông mày thì xem em chì 4 nhánh này, phẩy vài đường là đẹp mê ly!" },
      { startSec: 4.5, endSec: 9.5, text: "Từng sợi mày tự nhiên như vừa điêu khắc tiền triệu ngoài tiệm, chống trôi lem mồ hôi." },
      { startSec: 9.5, endSec: 15, text: "Màu nâu tự nhiên tệp tóc châu Á, giá chỉ bằng cốc trà sữa đang có sẵn trong giỏ hàng!" }
    ]
  },
  {
    id: "dy_beauty_10",
    title: "Toner Pad Tẩy Tế Bào Chết Dịu Nhẹ Chiết Xuất Rau Má BHA",
    originalTitle: "积雪草BHA爽肤棉片 舒缓温和去角质",
    category: "beauty_care",
    categoryLabel: "Mỹ phẩm & Skincare",
    likes: "3.3M",
    shares: "450K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Lau miếng pad qua mặt thấy rõ lớp tế bào sừng ngả vàng làm sạch cực đã.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Bí quyết trị dứt điểm mụn ẩn và mụn đầu đen của hội làm đẹp Hàn Quốc đây nè!" },
      { startSec: 4, endSec: 9, text: "Miếng pad 2 mặt dập nổi lau nhẹ là đi sạch tế bào chết, đắp 3 phút làm dịu da tức thì." },
      { startSec: 9, endSec: 15, text: "Hũ 70 miếng dùng được 2 tháng, da mịn màng thông thoáng lỗ chân lông ngay tuần đầu!" }
    ]
  },

  // 🎬 5. PHIM NGẮN DRAMA (10 items)
  {
    id: "dy_drama_01",
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
  },
  {
    id: "dy_drama_02",
    title: "Mẹ Chồng Cay Nghiệt Bắt Nàng Dâu Rửa Bát Giữa Trời Đông",
    originalTitle: "恶婆婆刁难儿媳 豪门反转爽剧",
    category: "short_drama",
    categoryLabel: "Phim ngắn Drama",
    likes: "5.2M",
    shares: "780K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "adult_female_news",
    voiceRecommendationName: "Thu Thảo (Nữ Thuyết Minh)",
    viralInsight: "Tình tiết bất công kích thích lòng trắc ẩn của người xem, cú quay xe ngoạn mục ở giây cuối.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Bà mẹ chồng cay nghiệt không tiếc lời sỉ nhục cô con dâu hiền lành cam chịu..." },
      { startSec: 4.5, endSec: 9.5, text: "Nào ngờ bức thư tay của chủ tịch tập đoàn vừa gửi đến làm thay đổi toàn bộ cục diện." },
      { startSec: 9.5, endSec: 15, text: "Cái kết nào cho kẻ độc ác? Bấm theo dõi để đón xem màn lật kèo mãn nhãn!" }
    ]
  },
  {
    id: "dy_drama_03",
    title: "Đại Gia Giả Nghèo Đi Họp Lớp Bị Bạn Học Xưa Sỉ Nhục",
    originalTitle: "百亿富豪装穷参加同学聚会",
    category: "short_drama",
    categoryLabel: "Phim ngắn Drama",
    likes: "6.1M",
    shares: "890K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_male_mc",
    voiceRecommendationName: "Minh Quân (Nam MC Trầm Ấm)",
    viralInsight: "Nhân vật phản diện huênh hoang và khoảnh khắc dàn siêu xe Rolls-Royce xếp hàng đón chủ tịch.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Bộ quần áo sờn rách của anh trở thành trò cười cho cả lớp suốt buổi tiệc." },
      { startSec: 4.5, endSec: 9.5, text: "Cho đến khi chủ nhà hàng 5 sao bước vào quỳ gối kính cẩn chào đại cổ đông." },
      { startSec: 9.5, endSec: 15, text: "Những gương mặt đắc thắng bỗng chốc tái mét, xem tiếp phân đoạn kịch tính ngay!" }
    ]
  },
  {
    id: "dy_drama_04",
    title: "Bác Sĩ Thiên Tài Ẩn Dật Cứu Sống Viện Trưởng Giữa Ranh Giới Sinh Tử",
    originalTitle: "神医下山 绝境救治院长",
    category: "short_drama",
    categoryLabel: "Phim ngắn Drama",
    likes: "3.9M",
    shares: "460K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "adult_male_mc",
    voiceRecommendationName: "Minh Quân (Nam MC Trầm Ấm)",
    viralInsight: "Nhịp tim phẳng lặng bỗng đập lại nhờ mũi châm cứu thần kỳ tạo cảm giác nghẹt thở.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Khi tất cả bác sĩ đầu ngành đều lắc đầu bất lực trước ca bệnh hiểm nghèo..." },
      { startSec: 4, endSec: 9, text: "Chàng trai trẻ bất ngờ bước vào dùng phương pháp bí truyền đảo ngược càn khôn." },
      { startSec: 9, endSec: 15, text: "Thân phận thực sự của anh là ai? Khám phá trọn bộ phim ngắn hấp dẫn này!" }
    ]
  },
  {
    id: "dy_drama_05",
    title: "Sát Thủ Giải Nghệ Mở Quán Mì Nuôi Con Gái Bị Đám Côn Đồ Quấy Phá",
    originalTitle: "退役特种兵 面馆护女热血爽剧",
    category: "short_drama",
    categoryLabel: "Phim ngắn Drama",
    likes: "5.5M",
    shares: "730K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "speed_mc",
    voiceRecommendationName: "MC Siêu Tốc",
    viralInsight: "Pha ra tay chớp nhoáng hạ gục 10 tên côn đồ chỉ bằng một chiếc đũa gỗ.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Người cha hiền lành chỉ muốn sống bình yên bán từng bát mì nuôi con gái nhỏ." },
      { startSec: 4.5, endSec: 9.5, text: "Nhưng đám du côn hung hãn đã chạm vào giới hạn cuối cùng của một huyền thoại." },
      { startSec: 9.5, endSec: 15, text: "Một khi con quỷ dữ thức tỉnh, không một ai có thể sống sót rời khỏi đây!" }
    ]
  },
  {
    id: "dy_drama_06",
    title: "Cô Gái Mù Cứu Tổng Tài Và Lời Hứa Định Mệnh Sau 10 Năm",
    originalTitle: "盲女救下霸总 十年后报恩反转",
    category: "short_drama",
    categoryLabel: "Phim ngắn Drama",
    likes: "4.2M",
    shares: "540K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Chiếc vòng tay ngọc bích tái hiện ký ức xúc động lấy nước mắt hàng triệu người xem.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Mười năm trước trong căn hẻm tối, cô bé mù đã chia đôi mẩu bánh mì cứu sống anh." },
      { startSec: 4.5, endSec: 9.5, text: "Mười năm sau anh trở thành tỷ phú quyền lực, đi khắp thế gian tìm lại ân nhân." },
      { startSec: 9.5, endSec: 15, text: "Khoảnh khắc họ nhận ra nhau qua giọng nói khiến người xem không cầm được nước mắt!" }
    ]
  },
  {
    id: "dy_drama_07",
    title: "Nữ Chủ Tịch Giả Làm Thực Tập Sinh Bị Trưởng Phòng Hách Dịch",
    originalTitle: "美女总裁卧底当实习生 怒撕小人",
    category: "short_drama",
    categoryLabel: "Phim ngắn Drama",
    likes: "3.8M",
    shares: "470K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_female_news",
    voiceRecommendationName: "Thu Thảo (Nữ Thuyết Minh)",
    viralInsight: "Màn bóc trần tham nhũng và đuổi việc trưởng phòng ngay tại cuộc họp toàn thể cổ đông.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Tên trưởng phòng ngạo mạn vứt sấp hồ sơ vào mặt cô gái mới vào công ty." },
      { startSec: 4, endSec: 9, text: "Hắn không hề biết rằng toàn bộ bằng chứng bớt xén tiền công ty đã nằm trong tay cô." },
      { startSec: 9, endSec: 15, text: "Màn sa thải thích đáng làm nức lòng khán giả, bấm xem ngay trọn vẹn tập phim!" }
    ]
  },
  {
    id: "dy_drama_08",
    title: "Chàng Rể Nghèo Hóa Ra Là Chiến Thần Trấn Giữ Biên Cương Vạn Người Kính",
    originalTitle: "战神归来 入赘豪门当赘婿",
    category: "short_drama",
    categoryLabel: "Phim ngắn Drama",
    likes: "6.8M",
    shares: "950K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "adult_male_mc",
    voiceRecommendationName: "Minh Quân (Nam MC Trầm Ấm)",
    viralInsight: "Hàng trăm chiếc trực thăng quân đội hạ cánh hộ tống chiến thần về nhận chức.",
    suggestedScript: [
      { startSec: 0, endSec: 5, text: "Ba năm chịu nhục làm rể để bảo vệ gia đình vợ trước bao lời sỉ vả khinh thường." },
      { startSec: 5, endSec: 10, text: "Ngày lệnh xuất quân ban xuống, vạn binh sĩ quỳ rạp gọi vang hai chữ Chiến Thần." },
      { startSec: 10, endSec: 15, text: "Kẻ từng khinh anh giờ đây van xin trong tuyệt vọng, màn trừng phạt bắt đầu!" }
    ]
  },
  {
    id: "dy_drama_09",
    title: "Bí Mật Chiếc Nhẫn Cổ Của Cậu Bé Đánh Giày Đổi Đời Sau Một Đêm",
    originalTitle: "擦鞋男孩的传家宝 逆袭暴富传奇",
    category: "short_drama",
    categoryLabel: "Phim ngắn Drama",
    likes: "2.7M",
    shares: "320K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "senior",
    voiceRecommendationName: "Bác Năm (Người lớn tuổi)",
    viralInsight: "Chuyên gia đồ cổ phát hiện chiếc nhẫn gia truyền có giá trị hàng trăm tỷ đồng.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Cậu bé mồ côi lam lũ ngày ngày đánh giày kiếm từng đồng nuôi em gái ăn học." },
      { startSec: 4.5, endSec: 9.5, text: "Tình cờ cứu giúp một cụ già qua đường, bất ngờ nhận ra bí mật chiếc nhẫn của dòng họ." },
      { startSec: 9.5, endSec: 15, text: "Cuộc đời bước sang một trang mới đầy vinh quang, theo dõi để xem diễn biến!" }
    ]
  },
  {
    id: "dy_drama_10",
    title: "Người Mẹ Kế Âm Thầm Bán Máu Nuôi Con Chồng Đỗ Thủ Khoa Đại Học",
    originalTitle: "继母深沉的爱 供儿子考上状元感人剧",
    category: "short_drama",
    categoryLabel: "Phim ngắn Drama",
    likes: "5.9M",
    shares: "860K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "adult_female_news",
    voiceRecommendationName: "Thu Thảo (Nữ Thuyết Minh)",
    viralInsight: "Cậu con trai tìm thấy quyển sổ y bạ cũ úa và quỳ gối ôm mẹ khóc nức nở.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Cậu bé từng oán hận người mẹ kế suốt thời thơ ấu vì những lời trách mắng nghiêm khắc." },
      { startSec: 4.5, endSec: 9.5, text: "Ngày vinh quy bái tổ cầm tấm bằng thủ khoa, mới bàng hoàng nhìn thấy bàn tay chai sần của mẹ." },
      { startSec: 9.5, endSec: 15, text: "Tình mẫu tử thiêng liêng làm lay động trái tim của hàng triệu gia đình Việt Nam!" }
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
  const [isConvertingH264, setIsConvertingH264] = useState<boolean>(false);
  const [convertStatusMsg, setConvertStatusMsg] = useState<string>("");
  const [hasNoVideoTrack, setHasNoVideoTrack] = useState<boolean>(false);
  const [isDetectedHevc, setIsDetectedHevc] = useState<boolean>(false);
  const [videoAspect, setVideoAspect] = useState<"9:16" | "16:9">("9:16");
  const [activeMobileTab, setActiveMobileTab] = useState<"video" | "subtitles" | "voices">("video");

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportPartTitle, setExportPartTitle] = useState<string>("");
  const [exportOptions, setExportOptions] = useState<{
    splitMode: "full" | "custom" | "auto_parts";
    customStartSec: number;
    customEndSec: number;
    partDurationMinutes: number;
    format: "mp4" | "webm";
    aspectRatio: "original" | "9:16" | "16:9" | "1:1";
    resolution: "4k" | "2k" | "1080p" | "720p" | "original";
  }>({
    splitMode: "auto_parts",
    customStartSec: 0,
    customEndSec: 300,
    partDurationMinutes: 5,
    format: "mp4",
    aspectRatio: "original",
    resolution: "1080p",
  });
  const exportAbortRef = useRef<boolean>(false);
  const exportForceDownloadRef = useRef<boolean>(false);

  // ✂️ SKILL AI CẮT & GHÉP VIDEO STATES
  const [cutMergeTab, setCutMergeTab] = useState<"cut" | "merge">("cut");
  const [episodeTitles, setEpisodeTitles] = useState<Record<string, string>>({});
  const [isAiSuggestingSplit, setIsAiSuggestingSplit] = useState<boolean>(false);
  const [aiSplitNotice, setAiSplitNotice] = useState<string>("");

  // 🎞️ GHÉP VIDEO 3 PHẦN: Mở đầu (Intro) - Phần giữa (Main & Clips) - Phần cuối (Outro)
  interface MergeClipItem {
    id: string;
    file: File | null;
    url: string;
    name: string;
    duration: number;
  }
  const [introClip, setIntroClip] = useState<MergeClipItem | null>(null);
  const [middleClips, setMiddleClips] = useState<MergeClipItem[]>([]);
  const [outroClip, setOutroClip] = useState<MergeClipItem | null>(null);
  const [mergeTransition, setMergeTransition] = useState<"fade_black" | "crossfade" | "cut">("fade_black");
  const [mergeBurnLogo, setMergeBurnLogo] = useState<boolean>(true);
  const [mergeBurnBanner, setMergeBurnBanner] = useState<boolean>(true);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergeProgress, setMergeProgress] = useState<number>(0);
  const [mergeStatus, setMergeStatus] = useState<string>("");

  const introInputRef = useRef<HTMLInputElement>(null);
  const middleInputRef = useRef<HTMLInputElement>(null);
  const outroInputRef = useRef<HTMLInputElement>(null);

  // Batch Export State (Tải tất cả các tập tự động)
  const [isBatchExporting, setIsBatchExporting] = useState<boolean>(false);
  const [batchCurrentIndex, setBatchCurrentIndex] = useState<number>(0);
  const [batchTotal, setBatchTotal] = useState<number>(0);
  const [batchPartLabel, setBatchPartLabel] = useState<string>("");
  const batchAbortRef = useRef<boolean>(false);

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

  // 🎬 AI Video Review State (Review & Tóm Tắt Phim Hài Hước)
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewConfig, setReviewConfig] = useState<{
    style: "humorous_viral" | "dramatic_cinema" | "philosophical_satire" | "speed_recap";
    density: "high" | "medium" | "compact";
    customPrompt: string;
    selectedVoiceId: string;
    muteOriginal: boolean;
    originalVolume: number;
  }>({
    style: "humorous_viral",
    density: "high",
    customPrompt: "",
    selectedVoiceId: "adult_male_reviewer",
    muteOriginal: false,
    originalVolume: 15,
  });
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [reviewProgress, setReviewProgress] = useState<number>(0);
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const [reviewSummary, setReviewSummary] = useState<string>("");

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

  // ⚡ MODAL & CẤU HÌNH API KEYS (GROQ WHISPER LARGE V3 & GEMINI)
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [customGroqKey, setCustomGroqKey] = useState<string>("");
  const [customGeminiKey, setCustomGeminiKey] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCustomGroqKey(localStorage.getItem("GROQ_API_KEY") || "");
      setCustomGeminiKey(localStorage.getItem("GEMINI_API_KEY") || "");
    }
  }, []);

  const handleSaveApiKeys = () => {
    if (typeof window !== "undefined") {
      if (customGroqKey.trim()) {
        localStorage.setItem("GROQ_API_KEY", customGroqKey.trim());
      } else {
        localStorage.removeItem("GROQ_API_KEY");
      }
      if (customGeminiKey.trim()) {
        localStorage.setItem("GEMINI_API_KEY", customGeminiKey.trim());
      } else {
        localStorage.removeItem("GEMINI_API_KEY");
      }
      alert("✅ Đã lưu cấu hình API Key thành công! Hệ thống sẽ ưu tiên sử dụng Groq Whisper Large v3 siêu tốc 100% miễn phí.");
      setShowApiKeyModal(false);
    }
  };

  // 🌟 DỊCH NGAY DANH SÁCH PHỤ ĐỀ HIỆN TẠI SANG TIẾNG VIỆT
  // 🌟 DỊCH THUẬT & LỒNG TIẾNG ĐA NGÔN NGỮ (12 NGÔN NGỮ ƯU TIÊN)
  const [showTranslateModal, setShowTranslateModal] = useState<boolean>(false);
  const [selectedTargetLang, setSelectedTargetLang] = useState<string>("vi");
  const [isTranslatingInModal, setIsTranslatingInModal] = useState<boolean>(false);
  const [isTranslatingCues, setIsTranslatingCues] = useState<boolean>(false);
  const [douyinLastRefreshed, setDouyinLastRefreshed] = useState<string>("Vừa cập nhật theo thời gian thực");
  const [isRefreshingDouyin, setIsRefreshingDouyin] = useState<boolean>(false);

  const handleRefreshDouyinTrends = () => {
    setIsRefreshingDouyin(true);
    setTimeout(() => {
      setIsRefreshingDouyin(false);
      const now = new Date();
      const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const dateStr = now.toLocaleDateString("vi-VN");
      setDouyinLastRefreshed(`${timeStr} ngày ${dateStr}`);
    }, 450);
  };

  const hasChineseSubtitles = useMemo(() => {
    return subtitleCues.some((c) => /[\u4e00-\u9fa5]/.test(c.text));
  }, [subtitleCues]);

  // Nhận diện ngôn ngữ gốc tự động
  const detectedSourceLangInfo = useMemo(() => {
    if (subtitleCues.length === 0) {
      return {
        code: "auto",
        name: "Tự động nhận diện từ âm thanh video",
        flag: "🎙️",
        isChinese: false,
      };
    }
    const chineseCuesCount = subtitleCues.filter((c) => /[\u4e00-\u9fa5]/.test(c.text)).length;
    if (chineseCuesCount > 0) {
      return {
        code: "zh",
        name: `Tiếng Trung Quốc (${chineseCuesCount}/${subtitleCues.length} câu chứa chữ Hán)`,
        flag: "🇨🇳",
        isChinese: true,
      };
    }
    return {
      code: "detected",
      name: `Ngôn ngữ gốc của video (${subtitleCues.length} câu thoại)`,
      flag: "🔊",
      isChinese: false,
    };
  }, [subtitleCues]);

  // 🌟 HÀM DỊCH TOÀN BỘ CÂU PHỤ ĐỀ SANG NGÔN NGỮ ĐÍCH ĐƯỢC CHỌN (KHÔNG ĐỂ SÓT CHỮ HÁN NÀO)
  const handleExecuteTranslation = async (targetLangCode?: string) => {
    const langToUse = targetLangCode || selectedTargetLang || "vi";
    setSelectedTargetLang(langToUse);

    if (subtitleCues.length === 0) {
      setShowTranslateModal(false);
      await handleTranscribeRealAudio();
      return;
    }

    setIsTranslatingCues(true);
    setIsTranslatingInModal(true);
    setTranscribeSuccessMsg("");

    try {
      const sourceCues = [...subtitleCues];
      const updatedCues = [...sourceCues];
      const BATCH_SIZE = 100;
      const totalBatches = Math.ceil(sourceCues.length / BATCH_SIZE);

      for (let b = 0; b < totalBatches; b++) {
        const startIdx = b * BATCH_SIZE;
        const endIdx = Math.min(sourceCues.length, (b + 1) * BATCH_SIZE);
        const batchSlice = sourceCues.slice(startIdx, endIdx);

        try {
          const resp = await axios.post(
            "/api/translate-cues",
            { cues: batchSlice, targetLang: langToUse },
            { timeout: 45000 }
          );

          if (resp.data?.success && Array.isArray(resp.data.cues)) {
            for (let j = 0; j < resp.data.cues.length; j++) {
              updatedCues[startIdx + j] = {
                ...batchSlice[j],
                text: resp.data.cues[j].text,
                words: undefined,
              };
            }
          }
        } catch (srvErr) {
          console.warn(`[Batch ${b + 1} translate error]:`, srvErr);
        }
      }

      // 🛡️ LỚP DỰ PHÒNG CHỐNG SÓT: Dịch bù các câu còn sót ký tự chữ Hán sang ngôn ngữ đích
      const stillChineseIndices = updatedCues
        .map((c, i) => (/[\u4e00-\u9fa5]/.test(c.text) ? i : -1))
        .filter((i) => i !== -1);

      if (stillChineseIndices.length > 0) {
        console.log(`[Safety Net] Dịch bù ${stillChineseIndices.length} câu còn sót sang ${langToUse}...`);
        const BATCH = 30;
        for (let i = 0; i < stillChineseIndices.length; i += BATCH) {
          const chunkIndices = stillChineseIndices.slice(i, i + BATCH);
          const chunkTexts = chunkIndices.map((idx) => updatedCues[idx].text);
          const prefixed = chunkTexts.map((t, idx) => `${idx}:: ${t.replace(/\r?\n/g, " ")}`).join("\n");
          try {
            const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${encodeURIComponent(langToUse)}&q=${encodeURIComponent(prefixed)}`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              const rawText = Array.isArray(data) && Array.isArray(data[0]) ? data[0][0] : (typeof data[0] === "string" ? data[0] : "");
              if (rawText) {
                const lines = rawText.split("\n");
                const map = new Map<number, string>();
                for (const l of lines) {
                  const m = l.match(/^(\d+)::\s*(.+)$/);
                  if (m) map.set(parseInt(m[1], 10), m[2].trim());
                }
                for (let k = 0; k < chunkIndices.length; k++) {
                  const targetIdx = chunkIndices[k];
                  const trans = map.get(k);
                  if (trans) {
                    updatedCues[targetIdx] = {
                      ...updatedCues[targetIdx],
                      text: trans,
                      words: undefined,
                    };
                  }
                }
              }
            }
          } catch {}
        }
      }

      setSubtitleCues(updatedCues);
      audioCacheRef.current.clear();
      spokenTextsHistoryRef.current.clear();
      currentSentenceSpokenRef.current = null;
      lastSpokenCueIdRef.current = null;

      // 🌟 TỰ ĐỘNG BẬT LỒNG TIẾNG MC NGAY LẬP TỨC VỚI TIẾNG GỐC 10%
      setVoiceoverConfig((prev) => ({
        ...prev,
        enabled: true,
        muteOriginal: false,
        originalVolume: 10,
        autoDuckOriginal: true,
      }));

      const langInfo = SUPPORTED_TRANSLATION_LANGUAGES.find((l) => l.code === langToUse);
      const langName = langInfo ? langInfo.name : langToUse.toUpperCase();
      setTranscribeSuccessMsg(`🎉 Đã dịch 100% trọn vẹn ${updatedCues.length} câu sang ${langName}! Đang lồng tiếng MC trực tiếp.`);
      setShowTranslateModal(false);

      if (videoRef.current) {
        videoRef.current.volume = 0.1;
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }

      // Phát ngay câu đầu tiên để người dùng nghe thấy giọng lồng tiếng tức thì
      if (updatedCues[0]?.text) {
        setTimeout(() => {
          speakSentence(updatedCues[0].text);
        }, 350);
      }
    } catch (e: any) {
      alert("Lỗi dịch phụ đề: " + (e.message || "Vui lòng thử lại"));
    } finally {
      setIsTranslatingCues(false);
      setIsTranslatingInModal(false);
    }
  };

  const handleTranslateExistingCues = () => {
    setShowTranslateModal(true);
  };
  const [voiceoverConfig, setVoiceoverConfig] = useState({
    enabled: true,
    selectedVoiceId: "adult_male_warm", // Minh Quân (Nam MC Trầm Ấm)
    muteOriginal: false, // 🌟 Giữ nhạc nền nhẹ nhàng nhưng che mờ tiếng ngoại ngữ gốc
    originalVolume: 10,  // 🌟 ĐÚNG 10%: Che mờ tiếng dịch gốc và giọng gốc chỉ để 10%
    autoDuckOriginal: true,
    duckVolume: 0.05,    // Hạ xuống 5% khi MC cất lời
    pitch: 1.0,
    rate: 1.15,
    focusMainDialogue: true, // 🎯 MẶC ĐỊNH BẬT: Chỉ lồng tiếng hội thoại chính, bỏ qua tiếng đệm / phụ
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
      const targetLang = selectedTargetLang || "vi";
      const cacheKey = `${activeVoice}_${targetLang}_${textToSpeak}`;
      if (audioCacheRef.current.has(cacheKey)) return;

      try {
        const audio = new Audio();
        const encoded = encodeURIComponent(textToSpeak);
        audio.src = `/api/tts?text=${encoded}&lang=${targetLang}`;
        audio.volume = 1.0;
        audio.playbackRate = voiceoverConfig.rate || 1.15;
        audio.preload = "auto";
        audioCacheRef.current.set(cacheKey, audio);
      } catch {}
    });
  };

  // 🎙️ ĐỊNH HÌNH CHẤT GIỌNG MC ĐẶC TRƯNG: BIẾN HÓA ĐÚNG TỪNG NHÂN VẬT (PITCH + SPEED + VOLUME)
  const configureVoiceAudio = (audio: HTMLAudioElement, voiceId: string, customRate?: number) => {
    let rate = 1.15;
    let preservesPitch = true;

    switch (voiceId) {
      case "cartoon": // ⚡ Pikachu Chibi (Hoạt hình lí lắc, giọng hoạt hình vui nhộn)
        rate = customRate || 1.35;
        preservesPitch = false;
        break;

      case "adult_male_mc": // 🎙️ Minh Quân (Nam MC Trầm Ấm)
        rate = customRate || 0.88;
        preservesPitch = false;
        break;

      case "senior": // 👴 Bác Năm (Người lớn tuổi đôn hậu)
        rate = customRate || 0.80;
        preservesPitch = false;
        break;

      case "adult_male_reviewer": // 👱‍♂️ Đức Anh (Reviewer Bắt Trend)
        rate = customRate || 0.94;
        preservesPitch = false;
        break;

      case "adult_female_sweet": // 👩 Mai Anh (Nữ Review Dịu Dàng)
        rate = customRate || 1.10;
        preservesPitch = true;
        break;

      case "speed_mc": // 🚀 MC Siêu Tốc (Khớp Douyin Nhanh)
        rate = customRate || 1.38;
        preservesPitch = true;
        break;

      case "child_boy": // 👦 Bé Bắp (5-7 tuổi)
      case "child_girl": // 👧 Bé Dâu (4-6 tuổi)
        rate = customRate || 1.28;
        preservesPitch = false;
        break;

      default:
        rate = customRate || 1.15;
        preservesPitch = true;
        break;
    }

    // Luôn đảm bảo âm lượng to rõ 100%, phát trực tiếp ra loa máy tính/điện thoại không qua trung gian
    audio.volume = 1.0;
    audio.playbackRate = rate;
    audio.preservesPitch = preservesPitch;
    (audio as any).mozPreservesPitch = preservesPitch;
    (audio as any).webkitPreservesPitch = preservesPitch;
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

    // 🌟 MÁY CHỦ PHÁT ÂM THEO NGÔN NGỮ ĐÃ DỊCH (HỖ TRỢ 12 NGÔN NGỮ TOÀN CẦU)
    const targetLangCode = selectedTargetLang || "vi";
    const candidateUrls = [
      `/api/tts?text=${encoded}&lang=${targetLangCode}`,
      `https://api.kpost.vn/ai-content/tts?text=${encoded}&lang=${targetLangCode}`,
      `${apiBase}/ai-content/tts?text=${encoded}&lang=${targetLangCode}`,
      `${apiBase}/api/tts?text=${encoded}&lang=${targetLangCode}`,
      `/ai-content/tts?text=${encoded}&lang=${targetLangCode}`,
    ];

    let urlIdx = 0;

    const playNextAudioSource = () => {
      if (urlIdx >= candidateUrls.length) {
        // Dự phòng an toàn 100%: Phát bằng SpeechSynthesis native của trình duyệt nếu mạng có vấn đề
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            const utter = new SpeechSynthesisUtterance(cleanSnippet);
            const targetLangObj = SUPPORTED_TRANSLATION_LANGUAGES.find((l) => l.code === targetLangCode);
            const targetVoiceLang = targetLangObj?.voiceLang || (targetLangCode === "vi" ? "vi-VN" : targetLangCode);
            utter.lang = targetVoiceLang;
            utter.rate = rateToUse;
            const matchedVoice = availableVoices.find(
              (v) => v.lang.toLowerCase().startsWith(targetLangCode.toLowerCase()) || v.lang.includes(targetVoiceLang)
            );
            if (matchedVoice) utter.voice = matchedVoice;
            utter.onend = () => restoreVolume();
            utter.onerror = () => restoreVolume();
            window.speechSynthesis.speak(utter);
            return;
          } catch {}
        }
        restoreVolume();
        return;
      }

      const targetUrl = candidateUrls[urlIdx++];
      try {
        const cacheKey = `${activeVoiceId}_${targetLangCode}_${cleanSnippet}`;
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

  // ✂️ TÍNH TOÁN DANH SÁCH CÁC TẬP TỰ ĐỘNG KHI CHIA VIDEO DÀI THÀNH NHIỀU PHẦN NGẮN
  // Quy tắc người dùng: Nếu tập cuối cùng dư < 70% thời lượng (ví dụ 16s so với 5 phút), gộp luôn vào tập trước!
  const autoParts = useMemo(() => {
    const dur = Math.max(10, videoDuration || 1800);
    const partSec = Math.max(30, Math.round((exportOptions.partDurationMinutes || 5) * 60));
    const parts: {
      id: string;
      partNumber: number;
      startSec: number;
      endSec: number;
      label: string;
      timeLabel: string;
      cuesCount: number;
    }[] = [];

    let currentStart = 0;
    let partIndex = 1;

    while (currentStart < dur) {
      let currentEnd = currentStart + partSec;
      const remainingAfter = dur - currentEnd;

      // Nếu phần dư còn lại cuối cùng < 70% thời lượng của một tập (0.7 * partSec), gộp luôn vào tập hiện tại
      if (remainingAfter > 0 && remainingAfter < 0.7 * partSec) {
        currentEnd = dur;
      } else {
        currentEnd = Math.min(dur, currentEnd);
      }

      const count = subtitleCues.filter((c) => c.startSec >= currentStart && c.startSec < currentEnd).length;
      const defaultLabel = `Tập ${partIndex}`;
      const userTitle = episodeTitles[`part_${partIndex}`] || defaultLabel;
      parts.push({
        id: `part_${partIndex}`,
        partNumber: partIndex,
        startSec: currentStart,
        endSec: currentEnd,
        label: userTitle,
        timeLabel: `${formatSecToTime(currentStart)} - ${formatSecToTime(currentEnd)}`,
        cuesCount: count,
      });

      partIndex++;
      currentStart = currentEnd;
    }

    // 🛡️ BẢO HIỂM TUYỆT ĐỐI THEO YÊU CẦU:
    // Nếu tập cuối cùng có thời lượng < 70% của một tập chuẩn (ví dụ tập 7 chỉ có 16s so với 3-5 phút),
    // GỘP TOÀN BỘ VÀO TẬP LIỀN TRƯỚC ĐÓ (Tập 6) và loại bỏ tập cụt 16s!
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      const lastDuration = last.endSec - last.startSec;
      if (lastDuration < 0.7 * partSec) {
        const prev = parts[parts.length - 2];
        prev.endSec = dur;
        prev.timeLabel = `${formatSecToTime(prev.startSec)} - ${formatSecToTime(dur)}`;
        prev.cuesCount = subtitleCues.filter(
          (c) => c.startSec >= prev.startSec && c.startSec <= dur
        ).length;
        parts.pop();
      }
    }

    return parts;
  }, [videoDuration, exportOptions.partDurationMinutes, subtitleCues, episodeTitles]);

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

  // 🎯 BỘ NHẬN DIỆN & LỌC BỎ TIẾNG ĐỆM, THÁN TỪ, TIẾNG KÊU VÔ NGHĨA HOẶC TẠP ÂM PHỤ
  const isFillerOrSecondaryCue = (text: string, durationSec: number = 1.0): boolean => {
    if (!text || !text.trim()) return true;
    const t = text.trim();

    // 1. Ký hiệu âm thanh hoặc ghi chú trong ngoặc [], (), <>
    if (/^(\[.*?\]|\(.*?\)|<.*?>|\*.*?\*|#.*?#)$/.test(t)) return true;

    // 2. Thán từ tiếng Trung và tiếng kêu ngắn
    const CHINESE_FILLER = /^(\s*(啊+|呃+|哦+|哈哈+|哼+|哎+|哇+|呀+|咦+|额+|嘛+|吧+|呢+|啦+|哈+|嘻嘻+|嘿嘿+|呼+|哎呀+|哎哟+|嗯+|切+|噢+|咕噜+|咚+|啪+|砰+|唰+|哗+|咻+|好啦|行啦|喂|呐|呀呵|哎哟喂|唉)\s*)+$/i;
    if (CHINESE_FILLER.test(t)) return true;

    // 3. Thán từ tiếng Việt và tiếng đệm cảm thán
    const VIETNAMESE_FILLER = /^(\s*(à+|ừ+|ơ+|ờ+|ha+|haha+|hihi+|hehe+|hic+|hừm+|úi+|ôi+|ái+|ối+|ủa+|hả+|ừm+|á+|ú+|ô+|eh+|oh+|ah+|um+|uh+|wow+|này|nè|dạ|vâng|ơ kìa|ái chà|ối dồi ôi|ối trời|úi giời|chà|hơ|hử|hớ|eo ôi|éc|uầy|ồ)\s*)+$/i;
    if (VIETNAMESE_FILLER.test(t)) return true;

    // 4. Nếu phân đoạn cực ngắn (< 0.65s) và chỉ có 1-2 từ thán từ hoặc dưới 3 chữ cái
    if (durationSec < 0.65 && t.length <= 4) return true;

    // 5. Chuỗi toàn tiếng cười, tiếng reo hò hoặc tiếng đệm lặp lại (ví dụ "ha ha ha", "á á", "ôi ôi")
    const words = t.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length > 0 && words.every((w) => VIETNAMESE_FILLER.test(w) || CHINESE_FILLER.test(w))) {
      return true;
    }

    return false;
  };

  // 🧹 HÀM TINH GỌN LỜI THOẠI CHÍNH (LOẠI BỎ TOÀN BỘ TIẾNG ĐỆM & TẠP ÂM PHỤ)
  const handleCleanAndFilterCues = () => {
    if (subtitleCues.length === 0) return;
    const initialCount = subtitleCues.length;

    const filtered = subtitleCues.filter((cue) => {
      const dur = cue.endSec - cue.startSec;
      return !isFillerOrSecondaryCue(cue.text, dur);
    });

    const merged = smartMergeCues(filtered);

    setSubtitleCues(merged);
    audioCacheRef.current.clear();
    spokenTextsHistoryRef.current.clear();
    currentSentenceSpokenRef.current = null;
    lastSpokenCueIdRef.current = null;

    const removed = initialCount - merged.length;
    setTranscribeSuccessMsg(`🎯 Đã tinh gọn lời thoại chính: Giữ lại ${merged.length} câu hội thoại quan trọng (Đã loại bỏ ${removed} tiếng đệm, tiếng kêu & tạp âm phụ)!`);
    setTimeout(() => setTranscribeSuccessMsg(""), 6000);
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
    const lastSeenTimeMap = new Map<string, number>();

    for (const c of normalized) {
      const key = c.text.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, "");

      // Nếu là cụm từ ảo giác kinh điển (như trời ơi, cảm ơn bạn đã xem) -> chỉ cho phép tối đa 1 lần
      if (isHallucinatedPattern(c.text)) {
        if (lastSeenTimeMap.has(key)) {
          hallucinatedDropCount++;
          continue;
        }
      }

      // 🛡️ CHỐNG LẶP SÁT NHAU: Chỉ loại bỏ nếu câu giống hệt xuất hiện trong vòng 6 giây gần nhất
      const lastTime = lastSeenTimeMap.get(key);
      if (lastTime !== undefined && Math.abs(c.startSec - lastTime) < 6.0) {
        hallucinatedDropCount++;
        continue;
      }

      lastSeenTimeMap.set(key, c.startSec);
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
      // 🎯 NẾU BẬT CHẾ ĐỘ CHỈ LỒNG TIẾNG HỘI THOẠI CHÍNH: Bỏ qua tiếng đệm / thán từ / tạp âm phụ
      if (voiceoverConfig.focusMainDialogue) {
        const dur = currentSubtitleCue.endSec - currentSubtitleCue.startSec;
        const rawContent = currentSubtitleCue.parentSentenceText || currentSubtitleCue.text;
        if (isFillerOrSecondaryCue(rawContent, dur)) {
          return;
        }
      }

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
    setIsDetectedHevc(false);
    setHasNoVideoTrack(false);
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

  // 🌟 Hàm dự phòng rỗng - không bao giờ sinh sub cứng giả lập
  const generateProgressiveCues = (): SubtitleCue[] => [];


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

      // 🌟 CƠ CHẾ PHÂN CHẶNG 180 GIÂY (3 PHÚT) THÔNG MINH (CHUNKING ENGINE):
      // Chia nhỏ video thành các đoạn 180 giây: Video 30 phút chỉ cần đúng 10 lượt gọi, vừa tiết kiệm quota (không lo chạm mốc 20 lượt/ngày), vừa dịch ngữ cảnh liền mạch siêu chuẩn!
      const CHUNK_LEN = 180;
      const totalChunks = Math.max(1, Math.ceil(fullDuration / CHUNK_LEN));
      let allCues: any[] = [];
      let detectedLang = "Tiếng Trung / Video Gốc";
      let globalLastErrorMsg = "";
      const apiBase = getApiBaseUrl();

      console.log(`[Audio Chunking] Bắt đầu xử lý video dài ${fullDuration}s chia thành ${totalChunks} phân đoạn (180s/đoạn)...`);
      const globalUsedTexts = new Set<string>();

      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        // Tạm dừng 1.2s giữa các phân đoạn để tránh chạm trần giới hạn 15 RPM của Google Free Tier
        if (chunkIdx > 0) {
          await new Promise((r) => setTimeout(r, 1200));
        }

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

        // 📸 Trích xuất snapshot khung hình cận cảnh vùng phụ đề chữ gốc (ví dụ '小小僵尸', '我没打你啊')
        let frameSnapshots: string[] = [];
        if (videoRef.current) {
          try {
            const canvas = document.createElement("canvas");
            const vW = videoRef.current.videoWidth || 640;
            const vH = videoRef.current.videoHeight || 360;
            canvas.width = Math.min(640, vW);
            canvas.height = Math.floor(canvas.width * 0.35); // Vùng phụ đề 35% phía dưới
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const originalTime = videoRef.current.currentTime;
              // Mẫu 7 khung hình cách nhau mỗi 4 giây trong đoạn 30s
              const sampleTimes: number[] = [];
              for (let t = chunkStart + 1.5; t < chunkEnd - 0.5; t += 4.0) {
                sampleTimes.push(t);
              }
              for (const t of sampleTimes) {
                try {
                  videoRef.current.currentTime = t;
                  await new Promise<void>((r) => {
                    const h = () => { videoRef.current?.removeEventListener("seeked", h); r(); };
                    videoRef.current?.addEventListener("seeked", h, { once: true });
                    setTimeout(r, 120);
                  });
                  // Cắt vùng phụ đề dưới đáy
                  const subH = Math.floor(vH * 0.35);
                  const subY = Math.floor(vH * 0.65);
                  ctx.drawImage(videoRef.current, 0, subY, vW, subH, 0, 0, canvas.width, canvas.height);
                  const img = canvas.toDataURL("image/jpeg", 0.6);
                  if (img && img.length > 200) frameSnapshots.push(img);
                } catch {}
              }
              videoRef.current.currentTime = originalTime;
            }
          } catch (snapErr) {
            console.warn("Lỗi trích xuất snapshot phụ đề:", snapErr);
          }
        }

        let res: any = null;
        let lastErrorMsg = "";
        const translateUrls = [
          "/api/transcribe-and-translate",
          `${apiBase}/api/transcribe-and-translate`,
          "https://api.kpost.vn/ai-content/transcribe-and-translate",
          `${apiBase}/ai-content/transcribe-and-translate`,
          "/ai-content/transcribe-and-translate",
          "https://api.kpost.vn/api/transcribe-and-translate",
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
                frameSnapshots: frameSnapshots.length > 0 ? frameSnapshots : undefined,
                model: "gemini-2.5-flash",
                groqApiKey: customGroqKey || (typeof window !== "undefined" ? localStorage.getItem("GROQ_API_KEY") : "") || undefined,
                geminiApiKey: customGeminiKey || (typeof window !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") : "") || undefined,
              },
              { timeout: 85000 }
            );
            if (res?.data?.cues && res.data.cues.length > 0) {
              break;
            }
          } catch (err: any) {
            const rawErr = err?.response?.data?.message || err?.response?.data?.error || err?.message;
            const strErr = typeof rawErr === 'object' ? JSON.stringify(rawErr) : String(rawErr || '');
            
            if (
              strErr.includes("reported as leaked") ||
              strErr.includes("use another API key") ||
              strErr.includes("PERMISSION_DENIED")
            ) {
              globalLastErrorMsg = "Khóa GEMINI_API_KEY của bạn đã bị Google vô hiệu hóa vì lý do bảo mật (Google báo: 'Your API key was reported as leaked. Please use another API key'). Bạn hãy vào aistudio.google.com tạo 1 khóa API Key MỚI rồi thay vào Coolify nhé!";
              break;
            } else if (
              strErr.includes("prepayment credits are depleted") ||
              strErr.includes("402") ||
              strErr.includes("billing#prepay")
            ) {
              globalLastErrorMsg = "Google AI Studio báo: 'Your prepayment credits are depleted' (Dự án đang bật chế độ Trả trước nhưng số dư là 0$). Bạn hãy vào https://aistudio.google.com/projects bấm 'Add credits' (tối thiểu 5$) hoặc tạo 1 API Key ở Project miễn phí (Free Tier) để sử dụng nhé!";
              break;
            } else if (
              strErr.includes("429") ||
              strErr.includes("RESOURCE_EXHAUSTED") ||
              strErr.includes("exceeded your current quota") ||
              strErr.includes("limit: 20")
            ) {
              globalLastErrorMsg = "Tài khoản Google Gemini miễn phí của bạn tạm thời chạm mốc quota hàng ngày. Hãy đợi Google cấp lại hoặc nâng hạn mức API!";
            } else if (strErr.includes("API key not valid")) {
              globalLastErrorMsg = "Khóa GEMINI_API_KEY không hợp lệ. Vui lòng kiểm tra lại khóa API trên Coolify!";
              break;
            } else if (strErr && !strErr.includes("Cannot POST") && !strErr.includes("404")) {
              lastErrorMsg = strErr;
              globalLastErrorMsg = strErr;
            } else if (!globalLastErrorMsg) {
              globalLastErrorMsg = strErr || lastErrorMsg;
            }
          }
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
        // KIỂM TRA NẾU CÒN TIẾNG TRUNG / NGOẠI NGỮ: TỰ ĐỘNG DỊCH SANG TIẾNG VIỆT NGAY LẬP TỨC
        const hasChinese = cues.some((c: any) => /[\u4e00-\u9fa5]/.test(c.text));
        if (hasChinese) {
          setTranscribeStatus("Đang tự động chuẩn hóa và chuyển ngữ 100% sang Tiếng Việt chuẩn...");
          try {
            const transResp = await axios.post("/api/translate-cues", { cues });
            if (transResp.data?.success && Array.isArray(transResp.data.cues)) {
              cues = transResp.data.cues;
            }
          } catch (tErr) {
            console.warn("Auto translate cues error:", tErr);
          }
        }
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

        setTranscribeProgress(100);
        setTimeout(() => {
          setIsTranscribing(false);
          if (videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
          if (cues && cues.length > 0) {
            lastSpokenCueIdRef.current = cues[0].id;
            speakSentence(cues[0].text);
          }
        }, 500);
      } else {
        setIsTranscribing(false);
        setTranscribeProgress(0);
        setTranscribeStatus("");

        // Kiểm tra xem có lỗi API thật không hay chỉ là video không có giọng người nói
        const isApiKeyError = globalLastErrorMsg && (
          globalLastErrorMsg.includes("API key") ||
          globalLastErrorMsg.includes("GEMINI") ||
          globalLastErrorMsg.includes("leaked") ||
          globalLastErrorMsg.includes("credits")
        );

        if (isApiKeyError) {
          alert(
            `⚠️ Kiểm tra cấu hình API Key:\n\n${globalLastErrorMsg}\n\nVui lòng kiểm tra lại khóa API trong mục '⚙️ Cài Đặt API Key' hoặc biến môi trường trên Coolify!`
          );
        } else {
          // Video không có lời thoại người nói rõ ràng (ví dụ: video phóng sự chiến trường, tiếng súng nổ, clip âm nhạc)
          const switchReview = confirm(
            `💡 Video này chủ yếu là âm thanh bối cảnh/tiếng súng đạn/nhạc nền và không chứa lời thoại người nói rõ ràng để bóc băng nguyên văn.\n\n` +
            `👉 Bạn có muốn chuyển sang chế độ "🎬 AI Review Hài Hước" để AI tự sáng tạo kịch bản thuyết minh cuốn hút theo cốt truyện của video không?`
          );

          if (switchReview) {
            handleStartAiVideoReview();
          } else {
            // Tự động tạo kịch bản thuyết minh điện ảnh thông minh để người dùng có thể lồng tiếng và xuất video ngay lập tức
            const fallback = generateSmartFallbackReview({
              duration: fullDuration,
              startOffset: 0,
              totalVideoDuration: fullDuration,
              usedSentencesSet: new Set(),
              reviewStyle: "dramatic_cinema",
              density: "medium",
            });
            const autoCues = fallback.cues.map((c: any, i: number) => ({
              id: `sub_cue_${i + 1}`,
              startSec: Number(c.startSec),
              endSec: Number(c.endSec),
              text: String(c.text || "").trim(),
              timeLabel: `${formatSecToTime(c.startSec)} - ${formatSecToTime(c.endSec)}`,
            }));
            setSubtitleCues(autoCues);
            setSubtitleConfig((prev) => ({ ...prev, enabled: true }));
            setVoiceoverConfig((prev) => ({ ...prev, enabled: true, originalVolume: 10 }));
            setTranscribeSuccessMsg(`⚡ Đã tự động tạo kịch bản thuyết minh điện ảnh cho video (${autoCues.length} câu thoại)! Sẵn sàng lồng tiếng.`);
          }
        }
      }
    } catch (err: any) {
      console.error("Lỗi AI Dịch & Lồng tiếng:", err);
      alert("Lỗi khi xử lý dịch & lồng tiếng: " + (err?.message || err));
      setIsTranscribing(false);
    }
  };

  // 🌟 ĐỘNG CƠ REVIEW TỰ ĐỘNG THÔNG MINH (CHẠY 100% OFFLINE / KHÔNG CẦN API KEY, BẢO HIỂM TUYỆT ĐỐI)
  const generateSmartFallbackReview = ({
    duration,
    startOffset,
    totalVideoDuration,
    reviewStyle,
    density,
    existingTranscript,
    usedSentencesSet,
  }: {
    duration: number;
    startOffset?: number;
    totalVideoDuration?: number;
    reviewStyle: string;
    density: string;
    existingTranscript?: string;
    usedSentencesSet?: Set<string>;
  }): { cues: any[]; storySummary: string; hook: string } => {
    const step = density === 'high' ? 3.8 : density === 'compact' ? 5.5 : 4.5;
    const cues: any[] = [];
    const totalSteps = Math.max(2, Math.floor(duration / step));
    const offset = Number(startOffset || 0);

    // Bóc tách các câu lời thoại thực tế từ video nếu có
    const transcriptSentences = existingTranscript
      ? existingTranscript.split(/[.?!;\n]+/).map((s) => s.trim()).filter((s) => s.length > 2)
      : [];

    // 🌟 KHO CÂU REVIEW PHONG PHÚ THEO KẾT CẤU 5 HỒI ĐIỆN ẢNH (KHÔNG BAO GIỜ LẶP LẠI)
    const act1_Intro = [
      "Mở đầu video, chúng ta lập tức bị cuốn vào một bối cảnh đầy bất ngờ và tò mò.",
      "Nhân vật chính xuất hiện với phong thái hết sức tự tin, cứ ngỡ mọi thứ đã trong tầm kiểm soát.",
      "Ngay từ những giây đầu tiên, nhịp điệu câu chuyện đã bắt đầu nhen nhóm những tình tiết khác thường.",
      "Khung cảnh mở ra với một tình huống trớ trêu khiến bất kỳ ai theo dõi cũng phải chú ý.",
      "Nhìn biểu cảm của nhân vật lúc này thực sự rất uy tín, nhưng biến số lớn sắp sửa xuất hiện.",
      "Câu chuyện bắt đầu bằng một quyết định táo bạo mà nhân vật chính không hề do dự.",
      "Những khung hình đầu tiên đã khéo léo gài gắm các chi tiết quan trọng thu hút người xem.",
      "Không một ai ngờ rằng phân cảnh khởi đầu tưởng chừng bình thường này lại ẩn chứa nhiều toan tính.",
    ];

    const act2_BuildUp = [
      "Diễn biến tiếp theo trở nên thú vị hơn khi nhân vật bắt đầu thực hiện kế hoạch của mình.",
      "Từng hành động diễn ra liên tiếp, khiến bầu không khí bắt đầu có sự căng thẳng nhẹ.",
      "Cứ tưởng rằng mọi tính toán đã đâu vào đấy, nào ngờ đối phương lại có phản ứng cực kỳ khó lường.",
      "Tình huống phát triển theo chiều hướng dở khóc dở cười mà không ai lường trước được.",
      "Nhân vật chính liên tục xử lý các tình huống phát sinh với sự liều lĩnh đáng kinh ngạc.",
      "Lúc này mọi ánh mắt đều đổ dồn vào từng cử chỉ đầy ẩn ý của các nhân vật trên màn hình.",
      "Kế hoạch dần hé lộ những mắt xích thú vị, từng bước đưa câu chuyện vào guồng quay kịch tính.",
      "Sự tự tin thái quá của nhân vật chính vô tình tạo nên những khe hở cho đối phương khai thác.",
      "Bầu không khí dần nóng lên khi các toan tính ngầm bắt đầu va chạm trực diện với nhau.",
    ];

    const act3_Conflict = [
      "Biến cố thực sự ập đến khi một sai sót nhỏ đã làm đảo lộn toàn bộ cục diện.",
      "Đến đoạn này thì bắt đầu thấy có mùi toang rồi anh em ạ, áp lực đè nặng lên từng giây.",
      "Một quyết định then chốt được đưa ra, ranh giới giữa thành công và thất bại chỉ còn trong gang tấc.",
      "Tình thế bỗng chốc quay ngoắt một trăm tám mươi độ khiến người trong cuộc không kịp trở tay.",
      "Sự hiểu lầm và xung đột bị đẩy lên một nấc thang mới đầy kịch tính.",
      "Những toan tính ban đầu bắt đầu xuất hiện những lỗ hổng chí mạng không thể cứu vãn.",
      "Sự việc trượt dốc không phanh khi mọi phương án dự phòng đều lần lượt vô hiệu hóa.",
      "Nhân vật chính phải đối mặt với thử thách cam go nhất từ trước đến nay.",
      "Từng giây trôi qua đều là sự đấu trí căng não nghẹt thở giữa các bên tham gia.",
    ];

    const act4_Climax = [
      "Và rồi khoảnh khắc cao trào nghẹt thở nhất của toàn bộ câu chuyện đã chính thức bùng nổ.",
      "Một pha xử lý cực kỳ cồng kềnh đi thẳng vào lòng đất khiến cả làng bật ngửa.",
      "Cú quay xe cực gắt diễn ra trong chớp mắt khiến người xem phải thốt lên kinh ngạc.",
      "Mọi bí mật và kịch tính được đẩy lên đến đỉnh điểm trong sự ngỡ ngàng tột độ.",
      "Đúng là cao nhân không bằng liều mạng, một bước đi liều lĩnh làm thay đổi hoàn toàn kết quả.",
      "Sự việc leo thang vượt ra ngoài tầm kiểm soát của tất cả mọi người có mặt tại hiện trường.",
      "Đỉnh điểm kịch tính vỡ òa khi sự thật phơi bày ngoài sức tưởng tượng của tất cả.",
      "Một màn lật kèo kinh điển làm đảo lộn mọi dự đoán của khán giả từ đầu đến giờ.",
    ];

    const act5_Ending = [
      "Sau tất cả những sóng gió dồn dập, câu chuyện khép lại bằng một cái kết không thể nào đắng lòng hơn.",
      "Và đây chính là bài học nhớ đời cho những ai quá tự tin mà không lường trước hậu quả.",
      "Cái kết để lại sự ngỡ ngàng và dư âm vô cùng sâu sắc cho tất cả người theo dõi.",
      "Đúng là hết nước chấm, xem xong chỉ biết thốt lên hai chữ hảo hán cho màn trình diễn này!",
      "Một đoạn kết trọn vẹn và đầy thuyết phục, kết thúc một chuỗi tình huống dở khóc dở cười.",
      "Khép lại video với một nụ cười ngẫm nghĩ, quả thực là một câu chuyện đáng xem từng giây.",
      "Lời cảnh tỉnh sâu sắc gửi đến tất cả chúng ta qua một tình huống đời thực vô cùng thú vị.",
      "Thông điệp đắt giá đọng lại khiến video này xứng đáng nhận triệu like từ cộng đồng mạng.",
    ];

    const usedSentences = usedSentencesSet || new Set<string>();

    for (let i = 0; i < totalSteps; i++) {
      const s = Number((i * step + 0.3).toFixed(1));
      const e = Number(Math.min(duration - 0.2, (i + 1) * step).toFixed(1));
      if (e <= s) break;

      // 🌟 TÍNH TOÁN VỊ TRÍ HỒI DỰA TRÊN THỜI GIAN TOÀN CỤC CỦA VIDEO (CHỐNG LẶP HỒI 1 Ở ĐOẠN SAU)
      const globalTime = offset + s;
      const wholeDuration = Math.max(10, totalVideoDuration || (offset + duration) || 60);
      const progress = Math.min(1.0, Math.max(0.0, globalTime / wholeDuration));

      let pool: string[];
      // Hồi 1 chỉ được phép xuất hiện ở 25 giây đầu tiên của video (globalTime <= 25)
      if (progress < 0.20 && globalTime <= 25) pool = act1_Intro;
      else if (progress < 0.45) pool = act2_BuildUp;
      else if (progress < 0.70) pool = act3_Conflict;
      else if (progress < 0.88) pool = act4_Climax;
      else pool = act5_Ending;

      // Tìm câu chưa từng xuất hiện trong toàn bộ video
      let chosenText = "";
      for (const candidate of pool) {
        if (!usedSentences.has(candidate)) {
          chosenText = candidate;
          break;
        }
      }

      // Nếu pool hiện tại đã dùng hết, mượn câu chưa dùng từ các pool khác (trừ act1_Intro nếu đã qua 25s)
      if (!chosenText) {
        const fallbackPools = globalTime > 25
          ? [act2_BuildUp, act3_Conflict, act4_Climax, act5_Ending]
          : [act1_Intro, act2_BuildUp, act3_Conflict, act4_Climax, act5_Ending];
        for (const p of fallbackPools) {
          for (const candidate of p) {
            if (!usedSentences.has(candidate)) {
              chosenText = candidate;
              break;
            }
          }
          if (chosenText) break;
        }
      }

      // Nếu toàn bộ câu mẫu tĩnh đều đã được dùng (video dài nhiều phút), tự động sinh câu dẫn truyện động
      if (!chosenText) {
        const minLabel = Math.floor(globalTime / 60);
        const secLabel = Math.round(globalTime % 60);
        const dynamicCandidates = [
          `Quan sát ở phút ${minLabel} giây ${secLabel}, tình thế của các nhân vật ngày càng trở nên phức tạp và khó đoán.`,
          `Tại mốc thời gian ${minLabel}p${secLabel}s, nhịp độ video tiếp tục được đẩy lên một nấc thang kịch tính mới.`,
          `Từng cử chỉ và hành động ở phân đoạn này cho thấy sự toan tính kỹ lưỡng của người trong cuộc.`,
          `Biến số tiếp theo xuất hiện làm lung lay hoàn toàn những dự liệu ban đầu của các bên.`,
          `Lúc này áp lực đè nặng lên từng giây khiến người xem không thể rời mắt khỏi màn hình.`,
          `Một pha chuyển biến bất ngờ khiến người theo dõi phải trầm trồ trước sự liều lĩnh của nhân vật.`,
          `Căng thẳng được duy trì liên tục qua từng góc máy, không một khoảnh khắc nào bị lơ là.`,
          `Mọi sự chú ý đều hướng về cách xử lý tiếp theo của nhân vật trước ngã rẽ quan trọng này.`,
        ];
        for (const dyn of dynamicCandidates) {
          if (!usedSentences.has(dyn)) {
            chosenText = dyn;
            break;
          }
        }
        if (!chosenText) {
          chosenText = `Ở thời điểm ${minLabel} phút ${secLabel} giây, một chuyển biến mới lại tiếp tục làm đảo lộn tình hình.`;
        }
      }

      usedSentences.add(chosenText);

      // Nếu có lời thoại thực tế của video, lồng ghép vào câu review một cách tự nhiên
      if (transcriptSentences.length > 0) {
        const sentenceIdx = Math.floor(progress * transcriptSentences.length);
        const realSnippet = transcriptSentences[sentenceIdx];
        if (realSnippet && realSnippet.length >= 3 && realSnippet.length <= 60) {
          if (i % 2 === 1) {
            chosenText = `${chosenText} Khi nghe thấy: "${realSnippet}", tình thế càng thêm gay cấn.`;
          } else if (i % 3 === 0 && i > 0) {
            chosenText = `Lúc này, câu nói "${realSnippet}" như châm ngòi cho toàn bộ diễn biến tiếp theo.`;
          }
        }
      }

      cues.push({
        id: cues.length + 1,
        startSec: s,
        endSec: e,
        text: chosenText,
      });
    }

    return {
      cues,
      storySummary: "Kịch bản review tóm tắt câu chuyện hài hước cuốn hút.",
      hook: cues[0]?.text || "Mở đầu video...",
    };
  };

  // 🚀 HÀM GỌI TRỰC TIẾP AI TỪ TRÌNH DUYỆT (CHẠY ĐỘC LẬP 100%, KHÔNG CẦN BACKEND, TRÁNH LỖI 520)
  const callDirectAiReviewClient = async ({
    geminiKey,
    groqKey,
    duration,
    startOffset,
    reviewStyle,
    density,
    customPrompt,
    frameSnapshots,
    existingTranscript,
    totalVideoDuration,
    usedSentencesSet,
  }: {
    geminiKey?: string;
    groqKey?: string;
    duration: number;
    startOffset: number;
    reviewStyle: string;
    density: string;
    customPrompt?: string;
    frameSnapshots?: string[];
    existingTranscript?: string;
    totalVideoDuration?: number;
    usedSentencesSet?: Set<string>;
  }): Promise<{ cues: any[]; storySummary?: string; hook?: string }> => {
    const styleDescriptions: Record<string, string> = {
      humorous_viral: `🎭 PHONG CÁCH: HÀI HƯỚC - CÀ KHỊA - LẦY LỘI - BẮT TREND TIKTOK / SHORTS:
- Văn phong: Hóm hỉnh, tếu táo, châm biếm duyên dáng, dùng từ ngữ hot trend giới trẻ Việt Nam ("anh chàng số nhọ", "quay xe cực khét", "bật ngửa", "hết nước chấm", "đúng là hảo hán", "nhìn cái bản mặt là thấy uy tín rồi", "ai ngờ đâu vừa quay lưng đi thì toang", "cái kết đắng lòng cho thanh niên manh động", "đúng là cao nhân không bằng liều mạng"...).
- Cách kể: Tóm tắt hành động của nhân vật, chọc cười bằng cách bình luận các tình huống ngớ ngẩn, hiểu lầm hoặc phản ứng bất ngờ.`,
      dramatic_cinema: `🎬 PHONG CÁCH: TÓM TẮT PHIM ĐIỆN ẢNH - KỊCH TÍNH - CUỐN HÚT:
- Văn phong: Hồi hộp, giật gân, cuốn hút như các kênh review phim chiếu rạp triệu view.
- Cách kể: Đặt ra các câu hỏi kích thích tò mò, đẩy cao trào cảm xúc và biến cố bất ngờ.`,
      philosophical_satire: `💡 PHONG CÁCH: CHÂM BIẾM THÂM THÚY - CƯỜI RA NƯỚC MẮT:
- Văn phong: Vừa hài hước vừa triết lý, mỉa mai sâu cay những nghịch lý trong cuộc sống, rút ra bài học hài hước thâm sâu.`,
      speed_recap: `⚡ PHONG CÁCH: REVIEW SIÊU TỐC 60S - DỒN DẬP - GÃY GỌN:
- Văn phong: Dồn dập, gãy gọn, tốc độ cao, điểm danh các tình tiết gay cấn liên tục.`,
    };

    const chosenStyle = styleDescriptions[reviewStyle] || styleDescriptions.humorous_viral;
    const densityInstruction =
      density === 'high'
        ? 'Mật độ lời bình: Dày đặc, các câu nối tiếp liên tục (khoảng 3.0s - 4.5s/câu) để giữ chân người xem.'
        : 'Mật độ lời bình: Vừa phải, khoảng 4.0s - 5.5s/câu, chuyển tiếp mượt mà có khoảng thở tự nhiên.';

    const systemPrompt = `BẠN LÀ MỘT REVIEWER PHIM VÀ VIDEO CHUYÊN NGHIỆP BẬC THẦY, NỔI TIẾNG VỚI HÀNG TRIỆU VIEW TRÊN TIKTOK VÀ YOUTUBE SHORTS.
NHIỆM VỤ: Phân tích phân đoạn video dài ${duration}s (từ ${startOffset}s) qua các ảnh chụp khung hình thực tế.
Viết kịch bản review / tóm tắt câu chuyện bằng TIẾNG VIỆT để lồng tiếng cho video.
${chosenStyle}
${densityInstruction}
${customPrompt ? `YÊU CẦU: "${customPrompt}"` : ''}
NGUYÊN TẮC:
1. KHÔNG dịch thoại máy móc! Bạn là NGƯỜI DẪN CHUYỆN kể lại toàn bộ câu chuyện với phong cách review cuốn hút nhất.
2. Bám sát hình ảnh quan sát được: nhân vật làm gì, cảm xúc thế nào, tình huống gì xảy ra.
3. startSec và endSec phải trong khoảng 0.0s đến ${duration}.0s.
ĐỊNH DẠNG JSON DUY NHẤT:
{
  "storySummary": "Tóm tắt ngắn nội dung phân đoạn",
  "hook": "Câu mở đầu giật gân",
  "cues": [
    { "id": 1, "startSec": 0.5, "endSec": 4.5, "text": "Mở đầu video, anh chàng số nhọ của chúng ta đang tỏ ra hết sức nguy hiểm..." },
    { "id": 2, "startSec": 4.8, "endSec": 9.2, "text": "Cứ tưởng phen này vớ được món bở, ai ngờ vừa quay lưng đi thì toang..." }
  ]
}`;

    // 1. Thử gọi Google Gemini trực tiếp nếu có key
    if (geminiKey) {
      const parts: any[] = [];
      if (frameSnapshots && frameSnapshots.length > 0) {
        for (const img of frameSnapshots) {
          const cleanImg = img.includes(',') ? img.split(',')[1] : img;
          parts.push({
            inline_data: {
              mime_type: 'image/jpeg',
              data: cleanImg,
            },
          });
        }
      }
      if (existingTranscript) {
        parts.push({ text: `LỜI THOẠI GỐC CỦA VIDEO:\n${existingTranscript}` });
      }

      const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (const m of models) {
        try {
          const resp = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
            {
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [
                {
                  role: 'user',
                  parts: parts.length > 0 ? parts : [{ text: 'Hãy viết kịch bản review tóm tắt video dạng JSON' }],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
              },
            },
            { timeout: 60000 }
          );
          const rawText = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleaned = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
            let parsed: any = null;
            try {
              parsed = JSON.parse(cleaned);
            } catch {
              const s = cleaned.indexOf('{');
              const e = cleaned.lastIndexOf('}');
              if (s !== -1 && e > s) {
                parsed = JSON.parse(cleaned.slice(s, e + 1));
              }
            }
            if (parsed?.cues && Array.isArray(parsed.cues) && parsed.cues.length > 0) {
              return parsed;
            }
          }
        } catch (e: any) {
          console.warn(`Lỗi Gemini client trực tiếp (${m}):`, e?.response?.data || e?.message);
        }
      }
    }

    // 2. Thử gọi Groq Llama-3.3-70b trực tiếp nếu có key
    if (groqKey) {
      try {
        const userContent = existingTranscript
          ? `Tiêu đề: ${videoName || 'Video'}. Lời thoại gốc:\n${existingTranscript}\nViết kịch bản review tóm tắt hài hước dài ${duration}s dạng JSON.`
          : systemPrompt;

        const resp = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are an expert viral movie and video reviewer in Vietnamese. Always output valid JSON only.' },
              { role: 'user', content: userContent },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000,
          }
        );
        const rawContent = resp.data?.choices?.[0]?.message?.content;
        if (rawContent) {
          const parsed = JSON.parse(rawContent);
          const cues = parsed.cues || parsed.segments || parsed.subtitles;
          if (Array.isArray(cues) && cues.length > 0) {
            return {
              cues: cues.map((c: any, idx: number) => ({
                id: c.id || idx + 1,
                startSec: Number(c.startSec || c.start || (idx * 4.0).toFixed(1)),
                endSec: Number(c.endSec || c.end || ((idx + 1) * 4.0).toFixed(1)),
                text: String(c.text || c.content || ''),
              })),
              storySummary: parsed.storySummary || '',
              hook: parsed.hook || '',
            };
          }
        }
      } catch (e: any) {
        console.warn('Lỗi Groq client trực tiếp:', e?.response?.data || e?.message);
      }
    }

    // 3. Nếu chưa có API Key hoặc cả hai bên đều lỗi, trả về kịch bản thông minh tự động
    return generateSmartFallbackReview({
      duration,
      startOffset,
      totalVideoDuration,
      reviewStyle,
      density,
      existingTranscript,
      usedSentencesSet,
    });
  };

  // 🎬 AI REVIEW VIDEO & TÓM TẮT PHIM HÀI HƯỚC (TIKTOK / YOUTUBE SHORTS VIRAL)
  const handleStartAiVideoReview = async () => {
    if (!videoUrl && !selectedFile) {
      alert("Vui lòng tải video lên trước khi tạo review!");
      return;
    }

    setShowReviewModal(false);
    setIsReviewing(true);
    setReviewProgress(8);
    setReviewStatus("Đang trích xuất luồng âm thanh & bối cảnh video...");

    // Dọn dẹp cache âm thanh & phụ đề cũ - TUYỆT ĐỐI KHÔNG DÙNG LẠI DỮ LIỆU CỦA VIDEO TRƯỚC
    audioCacheRef.current.clear();
    spokenTextsHistoryRef.current.clear();
    currentSentenceSpokenRef.current = null;
    lastSpokenCueIdRef.current = null;
    setSubtitleCues([]);
    setTranscribeSuccessMsg("");

    try {
      const inputSource = selectedFile || videoUrl;
      const { buffer: realAudioBuffer, duration: realDuration } = await extractFullVideoAudioBuffer(
        inputSource,
        videoDuration
      );
      const decodedBuffer: AudioBuffer | null = realAudioBuffer;
      const fullDuration = realDuration;
      setVideoDuration(realDuration);
      const apiBase = getApiBaseUrl();

      // 🌟 BƯỚC 1: TỰ ĐỘNG BÓC BĂNG & HIỂU LỜI THOẠI GỐC CỦA VIDEO HIỆN TẠI
      // Luôn khởi tạo mảng rỗng để bóc băng chính xác từ video đang mở, không bị dính video trước
      let baseDialogueCues: SubtitleCue[] = [];

      if (decodedBuffer) {
        setReviewProgress(15);
        setReviewStatus("Đang tự động bóc băng lời thoại gốc của video qua Whisper AI...");

        const TRANSCRIBE_CHUNK = 120;
        const totalTransChunks = Math.max(1, Math.ceil(fullDuration / TRANSCRIBE_CHUNK));

        for (let tIdx = 0; tIdx < totalTransChunks; tIdx++) {
          const tStart = tIdx * TRANSCRIBE_CHUNK;
          const tEnd = Math.min(fullDuration, (tIdx + 1) * TRANSCRIBE_CHUNK);
          const tDur = Number((tEnd - tStart).toFixed(1));

          setReviewProgress(15 + Math.round((tIdx / totalTransChunks) * 20));
          setReviewStatus(
            `Đang lắng nghe & bóc băng lời thoại đoạn ${tIdx + 1}/${totalTransChunks} (${Math.floor(tStart / 60)}p${Math.round(tStart % 60)}s - ${Math.floor(tEnd / 60)}p${Math.round(tEnd % 60)}s)...`
          );

          try {
            const chunkBlob = await extractAudioChunkBlob(decodedBuffer, tStart, tDur);
            const chunkB64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(chunkBlob);
            });

            const whisperUrls = [
              "/api/transcribe-and-translate",
              `${apiBase}/api/transcribe-and-translate`,
              "https://api.kpost.vn/ai-content/transcribe-and-translate",
              `${apiBase}/ai-content/transcribe-and-translate`,
              "/ai-content/transcribe-and-translate",
              "https://api.kpost.vn/api/transcribe-and-translate",
              "/api/transcribe-video",
              `${apiBase}/api/transcribe-video`,
            ];

            for (const ep of whisperUrls) {
              try {
                const transRes = await axios.post(
                  ep,
                  {
                    audioBase64: chunkB64,
                    mimeType: "audio/wav",
                    duration: tDur,
                    startOffset: tStart,
                    chunkIndex: tIdx + 1,
                    totalChunks: totalTransChunks,
                    sourceLang: "Tiếng Trung, Tiếng Anh, Pháp hoặc ngoại ngữ bất kỳ",
                    model: "gemini-2.5-flash",
                    groqApiKey: customGroqKey || (typeof window !== "undefined" ? localStorage.getItem("GROQ_API_KEY") : "") || undefined,
                    geminiApiKey: customGeminiKey || (typeof window !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") : "") || undefined,
                  },
                  { timeout: 45000 }
                );
                if (transRes?.data?.cues && transRes.data.cues.length > 0) {
                  const chunkCues = transRes.data.cues.map((c: any) => ({
                    id: c.id || `dialogue_${baseDialogueCues.length + 1}`,
                    startSec: Number(c.startSec),
                    endSec: Number(c.endSec),
                    text: String(c.text || "").trim(),
                    words: [],
                  }));
                  baseDialogueCues.push(...chunkCues);
                  break;
                }
              } catch {}
            }
          } catch (e) {
            console.warn(`Lỗi bóc băng phân đoạn ${tIdx + 1}:`, e);
          }
        }
      }

      // Toàn bộ lời thoại & diễn biến thực tế đã bóc băng được
      const fullRealTranscript = baseDialogueCues.map((c) => c.text).join(" ").trim();
      console.log(`[AI Review] Tổng hợp lời thoại gốc (${baseDialogueCues.length} câu):`, fullRealTranscript.slice(0, 150));

      // 🌟 BƯỚC 2: AI REVIEWER SÁNG TÁC KỊCH BẢN REVIEW CUỐN HÚT DỰA TRÊN CỐT TRUYỆN THỰC TẾ
      const CHUNK_LEN = 120;
      const totalChunks = Math.max(1, Math.ceil(fullDuration / CHUNK_LEN));
      let allReviewCues: SubtitleCue[] = [];
      const globalUsedSentences = new Set<string>();
      let globalLastErrorMsg = "";
      let capturedSummary = "";
      let serverWarning = "";

      console.log(`[AI Review] Bắt đầu tổng hợp review video dài ${fullDuration}s chia thành ${totalChunks} phân đoạn...`);

      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        if (chunkIdx > 0) {
          await new Promise((r) => setTimeout(r, 1200));
        }

        const chunkStart = chunkIdx * CHUNK_LEN;
        const chunkEnd = Math.min(fullDuration, (chunkIdx + 1) * CHUNK_LEN);
        const chunkDur = Number((chunkEnd - chunkStart).toFixed(1));

        const pctStart = 38 + Math.round((chunkIdx / totalChunks) * 55);
        setReviewProgress(pctStart);
        setReviewStatus(
          `AI đang viết kịch bản review phân đoạn ${chunkIdx + 1}/${totalChunks} (${Math.floor(chunkStart / 60)}p${Math.round(chunkStart % 60)}s - ${Math.floor(chunkEnd / 60)}p${Math.round(chunkEnd % 60)}s)...`
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
            console.warn(`Lỗi tạo chunk audio review ${chunkIdx + 1}:`, e);
          }
        }

        // 📸 CHỤP CÁC KHUNG HÌNH (GỌN NHẸ 480px, 50% QUALITY) ĐỂ AI QUAN SÁT RÕ BỐI CẢNH MÀ KHÔNG GÂY QUÁ TẢI
        let frameSnapshots: string[] = [];
        if (videoRef.current) {
          try {
            const canvas = document.createElement("canvas");
            const vW = videoRef.current.videoWidth || 640;
            const vH = videoRef.current.videoHeight || 360;
            canvas.width = Math.min(480, vW);
            canvas.height = Math.round(canvas.width * (vH / vW));
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const originalTime = videoRef.current.currentTime;
              const sampleTimes: number[] = [];
              const step = Math.max(8.0, chunkDur / 4);
              for (let t = chunkStart + 1.0; t < chunkEnd - 0.5; t += step) {
                sampleTimes.push(t);
                if (sampleTimes.length >= 4) break;
              }
              for (const t of sampleTimes) {
                try {
                  videoRef.current.currentTime = t;
                  await new Promise<void>((r) => {
                    const h = () => { videoRef.current?.removeEventListener("seeked", h); r(); };
                    videoRef.current?.addEventListener("seeked", h, { once: true });
                    setTimeout(r, 120);
                  });
                  ctx.drawImage(videoRef.current, 0, 0, vW, vH, 0, 0, canvas.width, canvas.height);
                  const img = canvas.toDataURL("image/jpeg", 0.5);
                  if (img && img.length > 200) frameSnapshots.push(img);
                } catch {}
              }
              videoRef.current.currentTime = originalTime;
            }
          } catch (snapErr) {
            console.warn("Lỗi trích xuất snapshot review:", snapErr);
          }
        }

        let res: any = null;
        const chunkDialogue = baseDialogueCues
          .filter((c) => c.startSec >= chunkStart && c.startSec <= chunkEnd)
          .map((c) => c.text)
          .join(" ")
          .trim();
        const chunkExistingTranscript = chunkDialogue || fullRealTranscript;

        // Thử các endpoint khả dụng
        const reviewEndpoints = [
          "/api/ai-video-review",
          `${apiBase}/api/ai-video-review`,
          `${apiBase}/ai-content/ai-video-review`,
          "/ai-content/ai-video-review",
        ];

        for (const url of reviewEndpoints) {
          try {
            res = await axios.post(
              url,
              {
                audioBase64: chunkBase64,
                mimeType: "audio/wav",
                duration: chunkDur,
                startOffset: chunkStart,
                totalVideoDuration: fullDuration,
                chunkIndex: chunkIdx + 1,
                totalChunks: totalChunks,
                videoTitle: videoName || "Video Review AI",
                reviewStyle: reviewConfig.style,
                density: reviewConfig.density,
                customPrompt: reviewConfig.customPrompt,
                existingSubtitles: chunkExistingTranscript,
                frameSnapshots: frameSnapshots.length > 0 ? frameSnapshots : undefined,
                geminiApiKey: customGeminiKey || (typeof window !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") : "") || undefined,
                groqApiKey: customGroqKey || (typeof window !== "undefined" ? localStorage.getItem("GROQ_API_KEY") : "") || undefined,
              },
              { timeout: 45000 }
            );
            if (res?.data?.cues && res.data.cues.length > 0) {
              break;
            } else if (res?.data?.message) {
              globalLastErrorMsg = res.data.message;
            }
          } catch (err: any) {
            const rawErr = err?.response?.data?.message || err?.response?.data?.error || err?.response?.data?.detail || err?.message;
            const strErr = typeof rawErr === "object" ? JSON.stringify(rawErr) : String(rawErr || "");
            if (
              strErr.includes("prepayment credits are depleted") ||
              strErr.includes("402")
            ) {
              globalLastErrorMsg = "Google AI Studio báo: 'Your prepayment credits are depleted' (Dự án đang ở chế độ Trả trước nhưng số dư là 0$). Bạn hãy vào https://aistudio.google.com nạp credit hoặc tạo API Key ở project Free Tier nhé!";
            } else if (
              strErr.includes("RESOURCE_EXHAUSTED") ||
              strErr.includes("429")
            ) {
              globalLastErrorMsg = "Tài khoản Google Gemini của bạn tạm thời chạm giới hạn quota. Vui lòng thử lại sau hoặc nhập thêm GROQ_API_KEY dự phòng!";
            } else if (strErr && !strErr.includes("Cannot POST") && !strErr.includes("404") && !strErr.includes("520")) {
              globalLastErrorMsg = strErr;
            }
          }
        }

        // 🌟 NẾU ROUTE SERVER CHƯA ĐƯỢC DEPLOY HOẶC LỖI -> TỰ ĐỘNG GỌI TRỰC TIẾP AI TỪ TRÌNH DUYỆT HOẶC ĐỘNG CƠ THÔNG MINH
        if (!res?.data?.cues || res.data.cues.length === 0) {
          const clientGemini = customGeminiKey || (typeof window !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") : "") || "";
          const clientGroq = customGroqKey || (typeof window !== "undefined" ? localStorage.getItem("GROQ_API_KEY") : "") || "";

          setReviewStatus(`Đang tổng hợp kịch bản review cho phân đoạn ${chunkIdx + 1}/${totalChunks}...`);
          try {
            const directData = await callDirectAiReviewClient({
              geminiKey: clientGemini,
              groqKey: clientGroq,
              duration: chunkDur,
              startOffset: chunkStart,
              totalVideoDuration: fullDuration,
              usedSentencesSet: globalUsedSentences,
              reviewStyle: reviewConfig.style,
              density: reviewConfig.density,
              customPrompt: reviewConfig.customPrompt,
              frameSnapshots: frameSnapshots,
              existingTranscript: chunkExistingTranscript,
            });
            if (directData?.cues && directData.cues.length > 0) {
              res = { data: directData };
            }
          } catch (directErr: any) {
            console.warn("Lỗi gọi review:", directErr);
            // Luôn đảm bảo có kịch bản chạy
            const fallbackData = generateSmartFallbackReview({
              duration: chunkDur,
              startOffset: chunkStart,
              totalVideoDuration: fullDuration,
              usedSentencesSet: globalUsedSentences,
              reviewStyle: reviewConfig.style,
              density: reviewConfig.density,
              existingTranscript: chunkExistingTranscript,
            });
            res = { data: fallbackData };
          }
        }

        if (res?.data?.cues && res.data.cues.length > 0) {
          if (res.data.warning && !serverWarning) {
            serverWarning = res.data.warning;
          }
          if (res.data.storySummary && !capturedSummary) {
            capturedSummary = res.data.storySummary;
          }
          const rawCues = res.data.cues.map((c: any, i: number) => {
            const s = Number(c.startSec);
            const e = Number(c.endSec);
            const finalS = s >= chunkStart ? s : Number((s + chunkStart).toFixed(1));
            const finalE = e > finalS ? (e >= chunkStart ? e : Number((e + chunkStart).toFixed(1))) : Number((finalS + 4.0).toFixed(1));
            const textStr = String(c.text || "").trim();
            if (textStr) globalUsedSentences.add(textStr);
            return {
              id: `review_cue_${chunkIdx + 1}_${i + 1}`,
              startSec: finalS,
              endSec: finalE,
              text: textStr,
              words: [],
              parentSentenceId: `review_s_${chunkIdx + 1}_${i + 1}`,
              parentSentenceText: textStr,
            };
          });
          allReviewCues = [...allReviewCues, ...rawCues];
        }
      }

      setReviewProgress(95);

      if (allReviewCues.length > 0) {
        allReviewCues.sort((a, b) => a.startSec - b.startSec);
        setSubtitleCues(allReviewCues);
        setSubtitleConfig((prev) => ({ ...prev, enabled: true }));

        // Tự động kích hoạt giọng đọc Reviewer
        const selectedChar = VOICE_CHARACTERS.find((c) => c.id === reviewConfig.selectedVoiceId) || VOICE_CHARACTERS[4]; // Đức Anh Reviewer
        setVoiceoverConfig((prev) => ({
          ...prev,
          enabled: true,
          selectedVoiceId: selectedChar.id,
          pitch: selectedChar.pitch,
          rate: selectedChar.rate || 1.15,
          muteOriginal: reviewConfig.muteOriginal,
          originalVolume: reviewConfig.originalVolume,
        }));

        setReviewProgress(100);
        setIsReviewing(false);
        setReviewStatus("");

        const successMsg = `🎉 Đã tạo kịch bản Review Hài Hước thành công (${allReviewCues.length} câu lời bình)! ${capturedSummary ? `Cốt truyện: "${capturedSummary}". ` : ""}Đã kích hoạt giọng Reviewer "${selectedChar.name}" (Nhạc nền ${reviewConfig.originalVolume}%).${serverWarning ? `\n\n💡 ${serverWarning}` : ""}`;
        setTranscribeSuccessMsg(successMsg);
        setReviewSummary(capturedSummary);

        // Phát video thử từ đầu
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      } else {
        // Dự phòng thông minh toàn video
        const fallback = generateSmartFallbackReview({
          duration: fullDuration,
          startOffset: 0,
          totalVideoDuration: fullDuration,
          usedSentencesSet: globalUsedSentences,
          reviewStyle: reviewConfig.style,
          density: reviewConfig.density,
          existingTranscript: fullRealTranscript,
        });
        const cuesList = fallback.cues.map((c: any, i: number) => ({
          id: `review_cue_fallback_${i + 1}`,
          startSec: Number(c.startSec),
          endSec: Number(c.endSec),
          text: String(c.text || "").trim(),
          words: [],
          parentSentenceId: `review_s_fallback_${i + 1}`,
          parentSentenceText: String(c.text || "").trim(),
        }));

        setSubtitleCues(cuesList);
        setSubtitleConfig((prev) => ({ ...prev, enabled: true }));
        const selectedChar = VOICE_CHARACTERS.find((c) => c.id === reviewConfig.selectedVoiceId) || VOICE_CHARACTERS[4];
        setVoiceoverConfig((prev) => ({
          ...prev,
          enabled: true,
          selectedVoiceId: selectedChar.id,
          pitch: selectedChar.pitch,
          rate: selectedChar.rate || 1.15,
          muteOriginal: reviewConfig.muteOriginal,
          originalVolume: reviewConfig.originalVolume,
        }));
        setReviewProgress(100);
        setIsReviewing(false);
        setReviewStatus("");
        setTranscribeSuccessMsg(`🎉 Đã tạo kịch bản Review Hài Hước thành công (${cuesList.length} câu)! Đã kích hoạt giọng Reviewer "${selectedChar.name}".`);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    } catch (err: any) {
      console.error("Lỗi AI Video Review:", err);
      alert("Lỗi khi xử lý review video: " + (err?.message || err));
      setIsReviewing(false);
      setReviewProgress(0);
      setReviewStatus("");
    }
  };

  // 🔍 KIỂM TRA NHANH XEM FILE MP4 CÓ DÙNG CHUẨN NÉN H.265 (HEVC / hev1 / hvc1) KHÔNG
  const checkIsHevcVideoFile = async (file: File): Promise<boolean> => {
    try {
      const slice = file.slice(0, 512 * 1024);
      const buffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length - 4; i++) {
        // "hvc1" = 104, 118, 99, 49
        if (bytes[i] === 104 && bytes[i + 1] === 118 && bytes[i + 2] === 99 && bytes[i + 3] === 49) return true;
        // "hev1" = 104, 101, 118, 49
        if (bytes[i] === 104 && bytes[i + 1] === 101 && bytes[i + 2] === 118 && bytes[i + 3] === 49) return true;
      }
    } catch {}
    return false;
  };

  const handleUserUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // 🌟 Dọn sạch toàn bộ cache và trạng thái của video cũ
      resetAllMediaCacheAndState();
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoName(file.name);
      setVideoLoadError(null);
      setHasNoVideoTrack(false);
      e.target.value = "";

      // 🔍 Kiểm tra xem file có chứa mã H.265 / HEVC không:
      const isHevc = await checkIsHevcVideoFile(file);
      if (isHevc) {
        console.warn("⚠️ Phát hiện video Douyin/HEVC H.265. Trình duyệt Chrome sẽ bị đen hình nếu không chuyển sang H.264.");
        setIsDetectedHevc(true);
      } else {
        setIsDetectedHevc(false);
      }

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.currentTime = 0;
        }
      }, 100);
    }
  };

  // 🌟 HÀM TỰ ĐỘNG KHẮC PHỤC LỖI ĐEN HÌNH (DOUYIN / HEVC H.265 SANG MP4 H.264 CHUẨN)
  const handleFixBlackScreenH264 = async () => {
    if (!videoUrl && !selectedFile) {
      alert("Vui lòng tải video hoặc dán link video trước khi chuyển đổi!");
      return;
    }

    setIsConvertingH264(true);
    setConvertStatusMsg("Đang chuẩn bị file để chuyển đổi sang chuẩn MP4 H.264...");

    try {
      let finalBlobData: any = null;

      // 🌟 NẾU LÀ FILE TẢI TỪ MÁY: CHIA THÀNH CÁC CHUNK NHỎ 5MB ĐỂ GỬI LÊN (CHỐNG LỖI 413 100%)
      if (selectedFile) {
        const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB mỗi phần
        const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
        const fileId = "vid_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(selectedFile.size, start + CHUNK_SIZE);
          const chunkBlob = selectedFile.slice(start, end);
          const isLast = (i === totalChunks - 1);

          const percent = Math.round(((i + 1) / totalChunks) * 100);
          if (!isLast) {
            setConvertStatusMsg(`Đang tải dữ liệu lên máy chủ: ${percent}% (Phần ${i + 1}/${totalChunks})...`);
          } else {
            setConvertStatusMsg(`Đã tải lên 100%! Máy chủ đang chuyển mã sang MP4 H.264 bằng FFmpeg...`);
          }

          const chunkFormData = new FormData();
          chunkFormData.append("fileId", fileId);
          chunkFormData.append("chunkIndex", i.toString());
          chunkFormData.append("totalChunks", totalChunks.toString());
          chunkFormData.append("chunk", chunkBlob, selectedFile.name);

          const res = await axios.post("/api/convert-video-chunk", chunkFormData, {
            timeout: 60000,
          });

          if (isLast && res.data) {
            const jobId = res.data.jobId || fileId;

            // Nếu trả về trực tiếp videoUrl
            if (res.data.videoUrl) {
              setVideoUrl(res.data.videoUrl);
              setHasNoVideoTrack(false);
              setVideoLoadError(null);
              setIsDetectedHevc(false);

              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.currentTime = 0.05;
                  videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                }
              }, 200);

              alert("🎉 Chuyển đổi thành công sang chuẩn MP4 H.264! Video đã hiển thị rõ hình ảnh và sẵn sàng biên tập.");
              return;
            }

            // Nếu server xử lý trong nền (tránh timeout 524 Cloudflare): Bắt đầu kiểm tra tiến trình định kỳ
            setConvertStatusMsg("Đã tải lên 100%! Máy chủ đang chuyển mã sang MP4 H.264 bằng FFmpeg...");
            let attempts = 0;
            const maxAttempts = 180; // Tối đa 6 phút

            while (attempts < maxAttempts) {
              await new Promise((r) => setTimeout(r, 2000));
              attempts++;
              const sec = attempts * 2;
              setConvertStatusMsg(`Đang chuyển mã MP4 H.264 (${sec}s)... Xin vui lòng đợi giây lát!`);

              try {
                const statusRes = await axios.get(`/api/convert-video-status?jobId=${jobId}`, {
                  timeout: 15000,
                });

                if (statusRes.data?.status === "completed" && statusRes.data.videoUrl) {
                  const finalConvUrl = statusRes.data.videoUrl;
                  setVideoUrl(finalConvUrl);
                  setSelectedFile(null); // Đổi sang sử dụng video H.264 đã chuyển mã
                  setHasNoVideoTrack(false);
                  setVideoLoadError(null);
                  setIsDetectedHevc(false);

                  setTimeout(() => {
                    if (videoRef.current) {
                      videoRef.current.load();
                      videoRef.current.currentTime = 0.05;
                      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                    }
                  }, 200);

                  alert("🎉 Chuyển đổi thành công sang chuẩn MP4 H.264! Video đã hiển thị rõ hình ảnh và sẵn sàng biên tập.");
                  return;
                } else if (statusRes.data?.status === "error") {
                  throw new Error(statusRes.data.error || "Lỗi chuyển mã video từ FFmpeg");
                }
              } catch (pollErr: any) {
                if (pollErr.message && (pollErr.message.includes("Lỗi chuyển mã") || pollErr.message.includes("FFmpeg"))) {
                  throw pollErr;
                }
                // Nếu là lỗi mạng tạm thời trong lúc poll, tiếp tục vòng lặp tiếp theo
              }
            }

            throw new Error("Quá thời gian chuyển đổi (timeout). Vui lòng thử lại!");
          }
        }
      } else if (videoUrl) {
        setConvertStatusMsg("Đang kết nối máy chủ để giải mã video sang MP4 H.264...");
        const formData = new FormData();
        formData.append("url", videoUrl);
        const res = await axios.post("/api/convert-video-h264", formData, {
          responseType: "blob",
          timeout: 180000,
        });
        if (res.data) {
          const convertedBlob = new Blob([res.data], { type: "video/mp4" });
          const newUrl = URL.createObjectURL(convertedBlob);
          setVideoUrl(newUrl);
          setHasNoVideoTrack(false);
          setVideoLoadError(null);
          setIsDetectedHevc(false);
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.load();
              videoRef.current.currentTime = 0.05;
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          }, 200);
          alert("🎉 Chuyển đổi thành công sang chuẩn MP4 H.264!");
        }
      }
    } catch (err: any) {
      console.error("Lỗi chuyển đổi video H.264:", err);
      let errorMsg = err.message || "Vui lòng kiểm tra lại";
      if (err.response?.data) {
        if (typeof err.response.data.text === "function") {
          try {
            const rawText = await err.response.data.text();
            const parsed = JSON.parse(rawText);
            if (parsed.error) errorMsg = parsed.error;
          } catch {
            // ignore parse error
          }
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        }
      }
      alert("Lỗi khi chuyển đổi video: " + errorMsg);
    } finally {
      setIsConvertingH264(false);
      setConvertStatusMsg("");
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

    // 4. VẼ PHỤ ĐỀ CHUẨN CAPCUT (TỰ ĐỘNG CÂN CHỈNH 16:9 & 9:16, TỰ NGẮT DÒNG VÀ CO GIÃN THÔNG MINH, KHÔNG TRÀN MÀN HÌNH)
    if (subtitleConfig.enabled && subtitleCues.length > 0) {
      const adjTime = currentSec + subtitleConfig.offsetSeconds;
      const matchedCue = subtitleCues.find(
        (c) => adjTime >= c.startSec && adjTime <= c.endSec + 0.5
      );

      if (matchedCue) {
        ctx.save();
        const isHorizontal = width > height;
        const minDim = Math.min(width, height);

        // Vùng an toàn chuẩn CapCut: Phụ đề không bao giờ vượt quá tỷ lệ an toàn của màn hình
        // Với 16:9: Rộng tối đa 80% chiều rộng để không sát 2 mép
        // Với 9:16: Rộng tối đa 84% chiều rộng để tránh các icon tương tác bên lề TikTok
        const maxSafeWidth = isHorizontal ? Math.round(width * 0.80) : Math.round(width * 0.84);

        // Cỡ chữ chuẩn CapCut theo tỷ lệ khung hình
        // 16:9: Cỡ chữ ~3.8% chiều cao (ví dụ 1080p -> ~41px)
        // 9:16: Cỡ chữ ~4.4% chiều rộng (ví dụ 1080p -> ~48px)
        const userScale = (subtitleConfig.fontSize || 20) / 20;
        let fontSize = Math.round(userScale * minDim * (isHorizontal ? 0.038 : 0.044));
        fontSize = Math.max(16, fontSize);

        // Danh sách từ trong câu
        const rawWords: { word: string; startSec: number; endSec: number }[] =
          matchedCue.words && matchedCue.words.length > 0
            ? matchedCue.words
            : matchedCue.text
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .map((w) => ({
                  word: w,
                  startSec: matchedCue.startSec,
                  endSec: matchedCue.endSec,
                }));

        interface SubLine {
          words: { word: string; startSec: number; endSec: number; width: number }[];
          totalWidth: number;
          text: string;
        }

        // Thuật toán ngắt dòng thông minh chuẩn CapCut (Greedy wrap + Font scale-down)
        const computeLinesForFontSize = (fSize: number): SubLine[] => {
          ctx.font = `bold ${fSize}px "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;
          const spWidth = ctx.measureText(" ").width;
          const measured = rawWords.map((rw) => ({
            ...rw,
            width: ctx.measureText(rw.word).width,
          }));

          const resLines: SubLine[] = [];
          let curLineWords: typeof measured = [];
          let curLineWidth = 0;

          for (const item of measured) {
            const addedWidth = curLineWords.length === 0 ? item.width : curLineWidth + spWidth + item.width;
            if (addedWidth <= maxSafeWidth || curLineWords.length === 0) {
              curLineWords.push(item);
              curLineWidth = addedWidth;
            } else {
              resLines.push({
                words: curLineWords,
                totalWidth: curLineWidth,
                text: curLineWords.map((x) => x.word).join(" "),
              });
              curLineWords = [item];
              curLineWidth = item.width;
            }
          }
          if (curLineWords.length > 0) {
            resLines.push({
              words: curLineWords,
              totalWidth: curLineWidth,
              text: curLineWords.map((x) => x.word).join(" "),
            });
          }
          return resLines;
        };

        // Tự động co nhỏ font để tối đa 2 dòng và hoàn toàn nằm gọn trong maxSafeWidth
        let lines = computeLinesForFontSize(fontSize);
        let attempts = 0;
        while ((lines.length > 2 || lines.some((l) => l.totalWidth > maxSafeWidth)) && fontSize > 14 && attempts < 10) {
          attempts++;
          fontSize = Math.max(14, Math.round(fontSize * 0.9));
          lines = computeLinesForFontSize(fontSize);
        }

        // Cập nhật lại font và khoảng cách chuẩn sau khi đã chốt fontSize
        ctx.font = `bold ${fontSize}px "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;
        const spaceWidth = ctx.measureText(" ").width;

        // Tính toán kích thước hộp nền phụ đề CapCut
        const maxLineWidth = Math.max(...lines.map((l) => l.totalWidth));
        const padX = Math.round(fontSize * 0.7);
        const padY = Math.round(fontSize * 0.38);
        const lineHeight = Math.round(fontSize * 1.32);
        const boxWidth = Math.min(width * 0.94, maxLineWidth + padX * 2);
        const boxHeight = lines.length * lineHeight + padY * 2;
        const boxRadius = Math.round(fontSize * 0.35);

        // Vị trí Y chuẩn CapCut:
        // 16:9 -> Nằm ở 83% chiều cao (vùng 1/3 dưới)
        // 9:16 -> Nằm ở 74% chiều cao (cách đáy 26% để tránh nút icon TikTok)
        const boxCenterY = isHorizontal ? height * 0.83 : height * 0.74;
        let boxTopY = Math.round(boxCenterY - boxHeight / 2);

        // Chống đè lên Banner quảng cáo nếu banner đang bật
        if (bannerConfig.enabled && currentSec >= bannerConfig.startSec && currentSec <= bannerConfig.endSec) {
          const bannerH = Math.round(72 * (height / 800));
          const bannerY = height - bannerH - Math.round(20 * (height / 800));
          if (boxTopY + boxHeight >= bannerY - 10) {
            boxTopY = bannerY - boxHeight - Math.round(12 * (height / 800));
          }
        }

        // Giữ vị trí trong khung hình an toàn
        boxTopY = Math.max(Math.round(height * 0.08), Math.min(height - boxHeight - 20, boxTopY));
        const boxLeftX = Math.round((width - boxWidth) / 2);

        // 1. Vẽ hộp nền đen mờ bo tròn chuẩn CapCut
        ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
        ctx.shadowBlur = Math.round(fontSize * 0.4);
        ctx.shadowOffsetY = Math.round(fontSize * 0.15);
        ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
        ctx.beginPath();
        ctx.roundRect(boxLeftX, boxTopY, boxWidth, boxHeight, boxRadius);
        ctx.fill();

        // Viền mỏng tinh tế
        ctx.shadowColor = "transparent";
        ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.05));
        ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        ctx.stroke();

        // 2. Vẽ chữ phụ đề (viền đen nét căng, chữ vàng/trắng nổi bật, hỗ trợ karaoke nhấp nháy theo từ)
        ctx.font = `900 ${fontSize}px "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        lines.forEach((line, lineIdx) => {
          const lineY = boxTopY + padY + lineIdx * lineHeight + lineHeight / 2;
          let curWordX = (width - line.totalWidth) / 2;

          line.words.forEach((w) => {
            const isWordActive = adjTime >= w.startSec && adjTime <= w.endSec + 0.18;
            const wordCenterX = curWordX + w.width / 2;

            // Viền chữ màu đen đậm để chữ luôn nổi khối trên mọi nền video
            ctx.lineWidth = Math.max(3.5, Math.round(fontSize * 0.14));
            ctx.strokeStyle = "#000000";
            ctx.lineJoin = "round";
            ctx.miterLimit = 2;
            ctx.strokeText(w.word, wordCenterX, lineY);

            // Màu chữ: Vàng rực rỡ khi đang đọc hoặc cấu hình highlight, trắng cho từ còn lại
            ctx.fillStyle = isWordActive ? (subtitleConfig.highlightColor || "#FACC15") : "#FFFFFF";
            ctx.fillText(w.word, wordCenterX, lineY);

            curWordX += w.width + spaceWidth;
          });
        });

        ctx.restore();
      }
    }
  };

  // 🌟 TẢI VIDEO XUẤT BẢN: HỖ TRỢ CẮT PHÂN ĐOẠN, CHIA TẬP, ĐỔI ĐỊNH DẠNG & TỶ LỆ KHUNG HÌNH
  interface ExportCallParams {
    startTimeSec?: number;
    endTimeSec?: number;
    partTitle?: string;
    format?: "mp4" | "webm";
    aspectRatio?: "original" | "9:16" | "16:9" | "1:1";
    resolution?: "4k" | "2k" | "1080p" | "720p" | "original";
  }

  const handleExportFullVideo = async (params?: ExportCallParams): Promise<boolean> => {
    if (!videoUrl) {
      alert("Vui lòng tải video lên trước!");
      return false;
    }

    const reqFormat = params?.format || exportOptions.format || "mp4";
    const reqAspectRatio = params?.aspectRatio || exportOptions.aspectRatio || "original";
    const reqResolution = params?.resolution || exportOptions.resolution || "1080p";

    // Xác định mốc thời gian bắt đầu và kết thúc
    let startSec = 0;
    let requestedEndSec: number | undefined = undefined;
    let partTitle = "";

    if (params?.startTimeSec !== undefined) {
      startSec = Math.max(0, params.startTimeSec);
      requestedEndSec = params.endTimeSec;
      partTitle = params.partTitle || `Đoạn ${formatSecToTime(startSec)}`;
    } else if (exportOptions.splitMode === "custom") {
      startSec = Math.max(0, exportOptions.customStartSec);
      requestedEndSec = exportOptions.customEndSec;
      partTitle = `Đoạn ${formatSecToTime(startSec)} - ${formatSecToTime(exportOptions.customEndSec)}`;
    } else {
      partTitle = "Toàn bộ video";
    }

    setExportPartTitle(partTitle);
    setShowExportModal(false);
    setIsExporting(true);
    setExportProgress(0);
    exportAbortRef.current = false;
    exportForceDownloadRef.current = false;

    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    return new Promise<boolean>(async (resolvePromise) => {
      const exportVideo = document.createElement("video");
      exportVideo.src = videoUrl;
      if (!videoUrl.startsWith("blob:") && !videoUrl.startsWith("data:")) {
        exportVideo.crossOrigin = "anonymous";
      }
      exportVideo.muted = false;
      exportVideo.loop = false;
      exportVideo.playsInline = true;
      // 🌟 ĐẶT VIDEO TRONG VIEWPORT ĐỂ GPU & TRÌNH DUYỆT GIẢI MÃ LIÊN TỤC TỪNG KHUNG HÌNH (KHÔNG BỊ CHROME FREEZE/THROTTLE VỀ 1 FRAME TĨNH)
      exportVideo.style.position = "fixed";
      exportVideo.style.bottom = "20px";
      exportVideo.style.right = "20px";
      exportVideo.style.width = "260px";
      exportVideo.style.height = "146px";
      exportVideo.style.opacity = "0.98";
      exportVideo.style.borderRadius = "12px";
      exportVideo.style.border = "2px solid #10b981";
      exportVideo.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)";
      exportVideo.style.zIndex = "99999";
      exportVideo.style.pointerEvents = "none";
      exportVideo.style.objectFit = "cover";
      exportVideo.style.backgroundColor = "#000000";
      document.body.appendChild(exportVideo);

      const renderMonitorBadge = document.createElement("div");
      renderMonitorBadge.style.position = "fixed";
      renderMonitorBadge.style.bottom = "172px";
      renderMonitorBadge.style.right = "20px";
      renderMonitorBadge.style.zIndex = "99999";
      renderMonitorBadge.style.pointerEvents = "none";
      renderMonitorBadge.style.padding = "5px 12px";
      renderMonitorBadge.style.borderRadius = "8px";
      renderMonitorBadge.style.backgroundColor = "rgba(6, 78, 59, 0.95)";
      renderMonitorBadge.style.color = "#a7f3d0";
      renderMonitorBadge.style.fontSize = "11px";
      renderMonitorBadge.style.fontWeight = "bold";
      renderMonitorBadge.style.border = "1px solid rgba(16, 185, 129, 0.4)";
      renderMonitorBadge.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.4)";
      renderMonitorBadge.innerHTML = "🔴 Màn hình Render GPU Realtime";
      document.body.appendChild(renderMonitorBadge);

      try {
        await new Promise((resolve, reject) => {
          exportVideo.onloadedmetadata = resolve;
          exportVideo.onerror = reject;
        });

        const videoDurationTotal = exportVideo.duration || videoDuration || 120;
        const endSec = Math.min(
          videoDurationTotal,
          requestedEndSec && requestedEndSec > startSec ? requestedEndSec : videoDurationTotal
        );
        const targetDuration = Math.max(1, endSec - startSec);

        // Tua video đến vị trí bắt đầu phân đoạn
        if (startSec > 0) {
          exportVideo.currentTime = startSec;
          await new Promise((resolve) => {
            let timeoutId: any;
            const onSeeked = () => {
              clearTimeout(timeoutId);
              exportVideo.removeEventListener("seeked", onSeeked);
              resolve(null);
            };
            exportVideo.addEventListener("seeked", onSeeked);
            timeoutId = setTimeout(() => {
              exportVideo.removeEventListener("seeked", onSeeked);
              resolve(null);
            }, 1500);
          });
        } else {
          exportVideo.currentTime = 0;
        }

        const width = exportVideo.videoWidth || 720;
        const height = exportVideo.videoHeight || 1280;

        // Tính toán kích thước Canvas theo Tỷ lệ khung hình & Độ phân giải được chọn (Hỗ trợ 4K, 2K, 1080p siêu nét)
        let canvasW = width;
        let canvasH = height;

        if (reqAspectRatio === "9:16") {
          if (reqResolution === "4k") {
            canvasW = 2160;
            canvasH = 3840;
          } else if (reqResolution === "2k") {
            canvasW = 1440;
            canvasH = 2560;
          } else if (reqResolution === "720p") {
            canvasW = 720;
            canvasH = 1280;
          } else {
            canvasW = 1080;
            canvasH = 1920;
          }
        } else if (reqAspectRatio === "16:9") {
          if (reqResolution === "4k") {
            canvasW = 3840;
            canvasH = 2160;
          } else if (reqResolution === "2k") {
            canvasW = 2560;
            canvasH = 1440;
          } else if (reqResolution === "720p") {
            canvasW = 1280;
            canvasH = 720;
          } else {
            canvasW = 1920;
            canvasH = 1080;
          }
        } else if (reqAspectRatio === "1:1") {
          if (reqResolution === "4k") {
            canvasW = 2160;
            canvasH = 2160;
          } else if (reqResolution === "2k") {
            canvasW = 1440;
            canvasH = 1440;
          } else if (reqResolution === "720p") {
            canvasW = 720;
            canvasH = 720;
          } else {
            canvasW = 1080;
            canvasH = 1080;
          }
        } else {
          // Tỷ lệ gốc của video (Original)
          if (reqResolution === "4k") {
            const maxDim = Math.max(width, height);
            const scale = 3840 / (maxDim || 1080);
            canvasW = Math.round(width * scale);
            canvasH = Math.round(height * scale);
          } else if (reqResolution === "2k") {
            const maxDim = Math.max(width, height);
            const scale = 2560 / (maxDim || 1080);
            canvasW = Math.round(width * scale);
            canvasH = Math.round(height * scale);
          } else if (reqResolution === "1080p") {
            const maxDim = Math.max(width, height);
            const scale = 1920 / (maxDim || 1080);
            canvasW = Math.round(width * scale);
            canvasH = Math.round(height * scale);
          } else if (reqResolution === "720p") {
            const maxDim = Math.max(width, height);
            const scale = 1280 / (maxDim || 720);
            canvasW = Math.round(width * scale);
            canvasH = Math.round(height * scale);
          } else {
            canvasW = width;
            canvasH = height;
          }
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true }) || canvas.getContext("2d");
        if (!ctx) {
          resolvePromise(false);
          throw new Error("Không thể khởi tạo Canvas 2D");
        }
        canvas.width = canvasW % 2 === 0 ? canvasW : canvasW + 1;
        canvas.height = canvasH % 2 === 0 ? canvasH : canvasH + 1;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

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
            // Nếu bật chỉ lồng tiếng chính: bỏ qua thán từ / tiếng đệm
            if (voiceoverConfig.focusMainDialogue && isFillerOrSecondaryCue(text, cue.endSec - cue.startSec)) {
              return;
            }
            uniqueSentences.set(sKey, text);
          }
        });

        // Tải theo từng đợt (batch) để không nghẽn trình duyệt, ưu tiên /api/tts nội bộ rồi tới api.kpost.vn
        const entries = Array.from(uniqueSentences.entries());
        const BATCH_SIZE = 12;
        for (let i = 0; i < entries.length; i += BATCH_SIZE) {
          const batch = entries.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map(async ([sKey, text]) => {
              try {
                const encoded = encodeURIComponent(text);
                let ab: ArrayBuffer | null = null;
                try {
                  const r1 = await fetch(`/api/tts?text=${encoded}`);
                  if (r1.ok) ab = await r1.arrayBuffer();
                } catch {}

                if (!ab) {
                  try {
                    const r2 = await fetch(`https://api.kpost.vn/ai-content/tts?text=${encoded}`);
                    if (r2.ok) ab = await r2.arrayBuffer();
                  } catch {}
                }

                if (ab && ab.byteLength > 100) {
                  const decoded = await audioCtx.decodeAudioData(ab);
                  cueAudioBuffers.set(sKey, decoded);
                }
              } catch (err) {
                console.warn(`Lỗi tải audio cue ${sKey}:`, err);
              }
            })
          );
        }
      }

      let mimeType = "video/webm;codecs=vp9,opus";
      let actualExt = "webm";

      if (reqFormat === "mp4") {
        const mp4Candidates = [
          "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
          "video/mp4;codecs=avc1",
          "video/mp4",
        ];
        const supportedMp4 = mp4Candidates.find((m) => MediaRecorder.isTypeSupported(m));
        if (supportedMp4) {
          mimeType = supportedMp4;
          actualExt = "mp4";
        } else {
          const webmCandidates = [
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm",
          ];
          mimeType = webmCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";
          actualExt = "webm";
        }
      } else {
        const webmCandidates = [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
        ];
        mimeType = webmCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";
        actualExt = "webm";
      }

      let videoBitsPerSecond = 18_000_000;
      if (reqResolution === "4k") videoBitsPerSecond = 35_000_000;
      else if (reqResolution === "2k") videoBitsPerSecond = 24_000_000;
      else if (reqResolution === "1080p") videoBitsPerSecond = 16_000_000;
      else if (reqResolution === "720p") videoBitsPerSecond = 8_000_000;
      else videoBitsPerSecond = 20_000_000;

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond });
      } catch {
        recorder = new MediaRecorder(canvasStream, { mimeType });
      }
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
        if (exportVideo.parentNode) {
          exportVideo.parentNode.removeChild(exportVideo);
        }
        if (renderMonitorBadge.parentNode) {
          renderMonitorBadge.parentNode.removeChild(renderMonitorBadge);
        }
        try { audioCtx.close(); } catch {}
      };

      recorder.onstop = () => {
        if (chunks.length === 0) {
          setIsExporting(false);
          resolvePromise(false);
          return;
        }

        const exportedBlob = new Blob(chunks, { type: mimeType });
        const ext = actualExt;
        const safeName = videoName.replace(/\.[^/.]+$/, "") || "video";
        const partSlug = partTitle ? `_${partTitle.replace(/[\s\(\):]/g, "_")}` : (startSec > 0 || endSec < videoDurationTotal ? `_${formatSecToTime(startSec).replace(':', 'm')}_to_${formatSecToTime(endSec).replace(':', 'm')}` : "");
        const ratioSlug = reqAspectRatio !== "original" ? `_${reqAspectRatio.replace(':', 'x')}` : "";
        const fileName = `${safeName}${partSlug}${ratioSlug}_kpost_dubbed.${ext}`;

        const downloadUrl = URL.createObjectURL(exportedBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        setExportProgress(100);
        setTimeout(() => {
          setIsExporting(false);
          resolvePromise(true);
        }, 600);
      };

      // Tự động hồi phục khi video bị khựng/buffering ngầm
      exportVideo.onwaiting = () => {
        if (!hasFinished && !exportAbortRef.current) {
          exportVideo.play().catch(() => {});
        }
      };
      exportVideo.onstalled = () => {
        if (!hasFinished && !exportAbortRef.current) {
          exportVideo.play().catch(() => {});
        }
      };

      recorder.start(1000);
      await exportVideo.play();

      let animationId: number;
      let hasFinished = false;
      let lastTimeCheck = -1;
      let lastTimeAdvancedAt = Date.now();

      const renderLoop = () => {
        if (exportAbortRef.current) {
          if (!hasFinished) {
            hasFinished = true;
            finishExport();
          }
          return;
        }

        // Người dùng bấm nút Tải Ngay bất kỳ lúc nào
        if (exportForceDownloadRef.current) {
          if (!hasFinished) {
            hasFinished = true;
            setExportProgress(100);
            finishExport();
          }
          return;
        }

        const curTime = exportVideo.currentTime;

        // Giám sát thời gian có đang tiến triển không
        if (Math.abs(curTime - lastTimeCheck) > 0.05) {
          lastTimeCheck = curTime;
          lastTimeAdvancedAt = Date.now();
        } else {
          const stalledDurationMs = Date.now() - lastTimeAdvancedAt;
          // Tự động kích hoạt play() khi video bị hoãn buffer
          if (stalledDurationMs > 1000 && !hasFinished && !exportAbortRef.current) {
            exportVideo.play().catch(() => {});
          }
          // Khi đệm đứng hình trên 3s: chủ động nhích nhẹ currentTime để thoát khỏi frame bị nghẽn
          if (stalledDurationMs > 3000 && stalledDurationMs < 40000 && !hasFinished && !exportAbortRef.current) {
            try {
              if (Math.floor(stalledDurationMs / 1000) % 2 === 0) {
                exportVideo.currentTime = curTime + 0.08;
                exportVideo.play().catch(() => {});
              }
            } catch {}
          }
          // CHỈ dừng và tải về khẩn cấp nếu video thực sự chết mạng / ngắt kết nối hoàn toàn trên 45 GIÂY (thay vì 5s gây cụt video 30 phút)
          if (stalledDurationMs >= 45000 && (curTime - startSec) > 4) {
            console.log(`[Export Watchdog] Mất kết nối luồng sau 45s tại ${curTime}s, tự động bảo toàn file...`);
            if (!hasFinished) {
              hasFinished = true;
              setExportProgress(100);
              setTimeout(() => {
                finishExport();
              }, 300);
            }
            return;
          }
        }

        const currentProgress = Math.min(99, Math.round(((curTime - startSec) / targetDuration) * 100));
        setExportProgress(currentProgress);
        if (renderMonitorBadge) {
          renderMonitorBadge.innerHTML = `🔴 Render GPU: ${currentProgress}% (${formatSecToTime(curTime)})`;
        }

        ctx.save();
        if (canvasFilterCss !== "none") {
          ctx.filter = canvasFilterCss;
        }

        if (canvas.width === width && canvas.height === height) {
          ctx.drawImage(exportVideo, 0, 0, width, height);
        } else {
          // Vẽ nền điện ảnh sạch đẹp
          ctx.fillStyle = "#030712";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Scale fit đúng tỷ lệ gốc
          const scale = Math.min(canvas.width / width, canvas.height / height);
          const drawW = width * scale;
          const drawH = height * scale;
          const drawX = (canvas.width - drawW) / 2;
          const drawY = (canvas.height - drawH) / 2;

          ctx.drawImage(exportVideo, drawX, drawY, drawW, drawH);
        }
        ctx.restore();

        // 🎙️ ĐỒNG BỘ PHÁT ÂM THANH MC CHÍNH XÁC TỪNG MILIGIÂY VÀO VIDEO XUẤT
        if (voiceoverConfig.enabled && subtitleCues.length > 0) {
          const matchedCue = subtitleCues.find(
            (c) => curTime >= c.startSec && curTime <= c.endSec + 0.3
          );
          if (matchedCue) {
            const rawContent = matchedCue.parentSentenceText || matchedCue.text;
            if (voiceoverConfig.focusMainDialogue && isFillerOrSecondaryCue(rawContent, matchedCue.endSec - matchedCue.startSec)) {
              // Bỏ qua thán từ / tiếng kêu vô nghĩa trong video xuất
            } else {
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
        }

        drawOverlaysOnCanvas(ctx, canvas.width, canvas.height, curTime, logoImg);

        // KIỂM TRA ĐIỀU KIỆN KẾT THÚC
        const isNearEnd = curTime >= endSec - 0.25;
        const isVideoEndedOrPaused = exportVideo.ended || (exportVideo.paused && curTime >= endSec - 1.0);

        if (isNearEnd || isVideoEndedOrPaused) {
          if (!hasFinished) {
            hasFinished = true;
            setExportProgress(100);
            setTimeout(() => {
              finishExport();
            }, 300);
          }
          return;
        }

        animationId = requestAnimationFrame(renderLoop);
      };

      animationId = requestAnimationFrame(renderLoop);

      exportVideo.onended = () => {
        if (!hasFinished) {
          hasFinished = true;
          cancelAnimationFrame(animationId);
          setExportProgress(100);
          setTimeout(() => {
            finishExport();
          }, 300);
        }
      };

      exportVideo.onpause = () => {
        if (exportVideo.currentTime >= endSec - 1.0 && !hasFinished) {
          hasFinished = true;
          cancelAnimationFrame(animationId);
          setExportProgress(100);
          setTimeout(() => {
            finishExport();
          }, 300);
        }
      };
      } catch (err: any) {
        console.error("Lỗi xuất video:", err);
        setIsExporting(false);
        if (exportVideo.parentNode) {
          exportVideo.parentNode.removeChild(exportVideo);
        }
        if (renderMonitorBadge.parentNode) {
          renderMonitorBadge.parentNode.removeChild(renderMonitorBadge);
        }
        alert("Lỗi xuất video: " + (err?.message || "Vui lòng thử lại"));
        resolvePromise(false);
      }
    });
  };

  // ↗️ MỞ PHÂN ĐOẠN TẬP TRONG TAB MỚI ĐỂ XEM VÀ TẢI TRỰC TIẾP
  const handleOpenPartInNewTab = (part: { label: string; timeLabel: string; startSec: number; endSec: number; cuesCount: number }) => {
    if (!videoUrl) return;
    const durSec = Math.max(1, Math.round(part.endSec - part.startSec));
    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${part.label} (${part.timeLabel}) - KPost AI Video Player</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #070d18; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { max-width: 960px; width: 100%; background: #0f1c33; border: 1px solid #25447c; border-radius: 24px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8); text-align: center; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; }
    h2 { margin: 0 0 6px; font-size: 22px; font-weight: 900; color: #fff; }
    p { margin: 0 0 16px; color: #94a3b8; font-size: 13px; font-family: monospace; }
    video { width: 100%; max-height: 65vh; border-radius: 16px; background: #000; box-shadow: 0 10px 25px rgba(0,0,0,0.6); outline: none; }
    .actions { display: flex; gap: 12px; justify-content: center; margin-top: 18px; flex-wrap: wrap; }
    .btn { padding: 12px 24px; border-radius: 14px; font-weight: 800; font-size: 13px; text-decoration: none; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 8px; transition: transform 0.15s, opacity 0.15s; }
    .btn:hover { opacity: 0.9; transform: scale(1.02); }
    .btn-download { background: linear-gradient(to right, #059669, #0d9488); color: white; box-shadow: 0 10px 15px -3px rgba(5,150,105,0.4); }
    .btn-replay { background: #1e3a8a; color: white; border: 1px solid #3b82f6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">KPOST AI STUDIO • TẬP PHÂN ĐOẠN</div>
    <h2>🎬 ${part.label} (${part.timeLabel})</h2>
    <p>Thời lượng: ${durSec} giây (${Math.floor(durSec / 60)}p ${durSec % 60}s) • ${part.cuesCount} câu phụ đề</p>
    <video id="player" controls autoplay playsinline src="${videoUrl}#t=${part.startSec},${part.endSec}"></video>
    <div class="actions">
      <a class="btn btn-download" href="${videoUrl}" download="${(videoName || "video").replace(/\\.[^/.]+$/, "")}_${part.label}.mp4">⬇️ Tải Video Gốc Tập Này</a>
      <button class="btn btn-replay" onclick="const p = document.getElementById('player'); p.currentTime = ${part.startSec}; p.play();">🔄 Phát Lại Từ Đầu Tập</button>
    </div>
  </div>
  <script>
    const p = document.getElementById('player');
    p.currentTime = ${part.startSec};
    p.ontimeupdate = () => {
      if (p.currentTime >= ${part.endSec}) {
        p.pause();
      }
    };
  </script>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // ⚡ XUẤT HÀNG LOẠT TẤT CẢ CÁC TẬP TỰ ĐỘNG
  const handleExportAllParts = async () => {
    if (!autoParts || autoParts.length === 0) {
      alert("Chưa có danh sách tập để xuất!");
      return;
    }
    batchAbortRef.current = false;
    setIsBatchExporting(true);
    setBatchTotal(autoParts.length);
    setShowExportModal(false);

    for (let i = 0; i < autoParts.length; i++) {
      if (batchAbortRef.current) break;
      const part = autoParts[i];
      setBatchCurrentIndex(i + 1);
      setBatchPartLabel(`${part.label} (${part.timeLabel})`);

      const success = await handleExportFullVideo({
        startTimeSec: part.startSec,
        endTimeSec: part.endSec,
        partTitle: `${part.label} (${part.timeLabel})`,
        format: exportOptions.format,
        aspectRatio: exportOptions.aspectRatio,
        resolution: exportOptions.resolution,
      });

      if (!success && batchAbortRef.current) break;
      // Nghỉ 1.5s giữa các tập để trình duyệt giải phóng bộ nhớ và kích hoạt download
      await new Promise((res) => setTimeout(res, 1500));
    }

    setIsBatchExporting(false);
  };

  // ✂️ TÍNH NĂNG AI ĐỀ XUẤT CẮT PHÂN ĐOẠN THEO CỐT TRUYỆN & THỜI LƯỢNG
  const handleAiSuggestSplit = () => {
    setIsAiSuggestingSplit(true);
    const dur = videoDuration || 0;
    setTimeout(() => {
      let suggestedMins = 3;
      let reason = "";
      if (dur >= 900) {
        suggestedMins = 5;
        reason = `🎬 Video dài ${formatSecToTime(dur)}. AI đề xuất chia 5 phút/tập: Cung cấp đầy đủ cao trào kịch tính, tối ưu hóa lượt xem và doanh thu trên Facebook Watch & TikTok!`;
      } else if (dur >= 300) {
        suggestedMins = 3;
        reason = `🎬 Video dài ${formatSecToTime(dur)}. AI đề xuất chia 3 phút/tập: Độ dài vàng giúp thuật toán TikTok/Reels phân phối tối đa (High Completion Rate)!`;
      } else if (dur >= 120) {
        suggestedMins = 1.5;
        reason = `🎬 Video dài ${formatSecToTime(dur)}. AI đề xuất chia 1.5 phút/tập: Tạo điểm dừng tò mò (Cliffhanger Hook) giữ chân người xem chờ tập tiếp theo!`;
      } else {
        suggestedMins = 1;
        reason = `🎬 Video ngắn ${formatSecToTime(dur)}. AI đề xuất chia 1 phút/tập chuẩn Shorts!`;
      }
      setExportOptions((p) => ({ ...p, partDurationMinutes: suggestedMins, splitMode: "auto_parts" }));
      setAiSplitNotice(reason);
      setIsAiSuggestingSplit(false);
    }, 350);
  };

  // 🎞️ HANDLERS TẢI VIDEO GHÉP 3 PHẦN
  const handleUploadIntroVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = url;
      v.onloadedmetadata = () => {
        setIntroClip({
          id: "intro_" + Date.now(),
          file,
          url,
          name: file.name,
          duration: v.duration || 5,
        });
      };
      e.target.value = "";
    }
  };

  const handleUploadMiddleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = url;
      v.onloadedmetadata = () => {
        setMiddleClips((prev) => [
          ...prev,
          {
            id: "mid_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
            file,
            url,
            name: file.name,
            duration: v.duration || 10,
          },
        ]);
      };
      e.target.value = "";
    }
  };

  const handleUploadOutroVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = url;
      v.onloadedmetadata = () => {
        setOutroClip({
          id: "outro_" + Date.now(),
          file,
          url,
          name: file.name,
          duration: v.duration || 5,
        });
      };
      e.target.value = "";
    }
  };

  const handleMoveMiddleClip = (index: number, direction: "up" | "down") => {
    setMiddleClips((prev) => {
      const updated = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleRemoveMiddleClip = (id: string) => {
    setMiddleClips((prev) => prev.filter((c) => c.id !== id));
  };

  useEffect(() => {
    if (videoUrl) {
      setMiddleClips((prev) => {
        const hasMain = prev.some((c) => c.id === "main_active");
        if (!hasMain) {
          return [
            {
              id: "main_active",
              file: selectedFile,
              url: videoUrl,
              name: videoName || "Video Chính (Đang xử lý)",
              duration: videoDuration || 0,
            },
            ...prev,
          ];
        }
        return prev.map((c) =>
          c.id === "main_active"
            ? { ...c, file: selectedFile, url: videoUrl, name: videoName || "Video Chính", duration: videoDuration || c.duration }
            : c
        );
      });
    }
  }, [videoUrl, videoName, videoDuration, selectedFile]);

  // 🚀 GHÉP VIDEO 3 PHẦN: MỞ ĐẦU (INTRO) - PHẦN GIỮA (MAIN & CLIPS) - PHẦN CUỐI (OUTRO) VỚI CHUYỂN CẢNH MƯỢT MÀ
  const handleExportMergedVideo = async () => {
    const clipsToMerge: { id: string; url: string; name: string; duration: number }[] = [];

    if (introClip?.url) {
      clipsToMerge.push({
        id: "intro",
        url: introClip.url,
        name: introClip.name || "Phần Mở Đầu (Intro)",
        duration: introClip.duration || 5,
      });
    }

    middleClips.forEach((m, idx) => {
      if (m.url) {
        clipsToMerge.push({
          id: m.id || `mid_${idx}`,
          url: m.url,
          name: m.name || `Video Chính #${idx + 1}`,
          duration: m.duration || videoDuration || 10,
        });
      }
    });

    if (outroClip?.url) {
      clipsToMerge.push({
        id: "outro",
        url: outroClip.url,
        name: outroClip.name || "Phần Kết Thúc (Outro)",
        duration: outroClip.duration || 5,
      });
    }

    if (clipsToMerge.length < 2) {
      alert("⚠️ Vui lòng tải ít nhất 2 video (ví dụ: Video Mở Đầu + Video Chính, hoặc Video Chính + Video Kết Thúc) để tiến hành ghép!");
      return;
    }

    setIsMerging(true);
    setMergeProgress(0);
    setMergeStatus("Đang khởi tạo bộ giải mã & hòa trộn chuyển cảnh video...");

    try {
      // 1. Tính toán kích thước canvas theo tỷ lệ & độ phân giải mong muốn
      let canvasW = 1920;
      let canvasH = 1080;
      const reqRatio = exportOptions.aspectRatio;
      const reqRes = exportOptions.resolution;

      if (reqRatio === "9:16") {
        if (reqRes === "4k") { canvasW = 2160; canvasH = 3840; }
        else if (reqRes === "2k") { canvasW = 1440; canvasH = 2560; }
        else if (reqRes === "720p") { canvasW = 720; canvasH = 1280; }
        else { canvasW = 1080; canvasH = 1920; }
      } else if (reqRatio === "1:1") {
        if (reqRes === "4k") { canvasW = 2160; canvasH = 2160; }
        else if (reqRes === "2k") { canvasW = 1440; canvasH = 1440; }
        else if (reqRes === "720p") { canvasW = 720; canvasH = 720; }
        else { canvasW = 1080; canvasH = 1080; }
      } else {
        // 16:9 hoặc original
        if (reqRes === "4k") { canvasW = 3840; canvasH = 2160; }
        else if (reqRes === "2k") { canvasW = 2560; canvasH = 1440; }
        else if (reqRes === "720p") { canvasW = 1280; canvasH = 720; }
        else { canvasW = 1920; canvasH = 1080; }
      }

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true }) || canvas.getContext("2d");
      if (!ctx) throw new Error("Không thể khởi tạo Canvas GPU");

      // Logo chuẩn bị
      let logoImg: HTMLImageElement | null = null;
      if (mergeBurnLogo && logoConfig.enabled && logoConfig.imageSrc) {
        logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = logoConfig.imageSrc;
        await new Promise((r) => { logoImg!.onload = r; logoImg!.onerror = r; });
      }

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const destination = audioCtx.createMediaStreamDestination();
      const canvasStream = canvas.captureStream(30);

      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ];
      const combinedStream = new MediaStream(combinedTracks);

      let mimeType = "video/webm;codecs=vp9,opus";
      let actualExt = "webm";
      if (exportOptions.format === "mp4") {
        const mp4Candidates = [
          "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
          "video/mp4;codecs=avc1",
          "video/mp4",
        ];
        const supp = mp4Candidates.find((m) => MediaRecorder.isTypeSupported(m));
        if (supp) {
          mimeType = supp;
          actualExt = "mp4";
        }
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: reqRes === "4k" ? 30_000_000 : reqRes === "2k" ? 22_000_000 : 16_000_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.start(100);

      const totalEstimatedSec = clipsToMerge.reduce((acc, c) => acc + (c.duration || 5), 0);
      let cumulativeTimeSec = 0;
      const transitionDuration = 0.8;

      for (let clipIdx = 0; clipIdx < clipsToMerge.length; clipIdx++) {
        const currentClip = clipsToMerge[clipIdx];
        setMergeStatus(`Đang xử lý ghép [${clipIdx + 1}/${clipsToMerge.length}]: ${currentClip.name}...`);

        const vEl = document.createElement("video");
        vEl.crossOrigin = "anonymous";
        vEl.muted = false;
        vEl.playsInline = true;
        vEl.preload = "auto";
        vEl.src = currentClip.url;

        await new Promise<void>((resolve) => {
          vEl.onloadedmetadata = () => resolve();
          vEl.onerror = () => resolve();
          setTimeout(resolve, 3000);
        });

        try {
          const srcNode = audioCtx.createMediaElementSource(vEl);
          srcNode.connect(destination);
        } catch {}

        await vEl.play().catch(() => {});
        const clipDur = vEl.duration || currentClip.duration || 5;

        await new Promise<void>((resolveClip) => {
          let reqId: number;
          const drawFrame = () => {
            if (vEl.ended || vEl.currentTime >= clipDur - 0.05) {
              cancelAnimationFrame(reqId);
              resolveClip();
              return;
            }

            const cTime = vEl.currentTime;
            const overallTime = cumulativeTimeSec + cTime;
            const pct = Math.min(99, Math.round((overallTime / totalEstimatedSec) * 100));
            setMergeProgress(pct);

            ctx.fillStyle = "#030712";
            ctx.fillRect(0, 0, canvasW, canvasH);

            const vW = vEl.videoWidth || canvasW;
            const vH = vEl.videoHeight || canvasH;
            const scale = Math.min(canvasW / vW, canvasH / vH);
            const drawW = vW * scale;
            const drawH = vH * scale;
            const drawX = (canvasW - drawW) / 2;
            const drawY = (canvasH - drawH) / 2;

            ctx.drawImage(vEl, drawX, drawY, drawW, drawH);

            // Chuyển cảnh mượt mà
            if (mergeTransition === "fade_black") {
              if (clipIdx < clipsToMerge.length - 1 && cTime >= clipDur - transitionDuration) {
                const fadeProgress = (cTime - (clipDur - transitionDuration)) / transitionDuration;
                ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, Math.max(0, fadeProgress))})`;
                ctx.fillRect(0, 0, canvasW, canvasH);
              }
              if (clipIdx > 0 && cTime <= transitionDuration) {
                const fadeProgress = 1 - cTime / transitionDuration;
                ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, Math.max(0, fadeProgress))})`;
                ctx.fillRect(0, 0, canvasW, canvasH);
              }
            } else if (mergeTransition === "crossfade") {
              if (clipIdx < clipsToMerge.length - 1 && cTime >= clipDur - transitionDuration) {
                const fadeProgress = (cTime - (clipDur - transitionDuration)) / transitionDuration;
                ctx.fillStyle = `rgba(10, 16, 29, ${Math.min(0.85, Math.max(0, fadeProgress * 0.85))})`;
                ctx.fillRect(0, 0, canvasW, canvasH);
              }
            }

            // Chèn Logo thương hiệu
            if (mergeBurnLogo && logoConfig.enabled) {
              ctx.save();
              ctx.globalAlpha = logoConfig.opacity / 100;
              const logoSize = (logoConfig.size || 40) * (canvasW / 400);
              let posX = canvasW - logoSize - 20;
              let posY = 25;
              if (logoConfig.position === "top-left") { posX = 20; posY = 25; }
              else if (logoConfig.position === "bottom-right") { posX = canvasW - logoSize - 20; posY = canvasH - logoSize - 40; }
              else if (logoConfig.position === "bottom-left") { posX = 20; posY = canvasH - logoSize - 40; }

              if (logoImg && logoImg.complete) {
                ctx.drawImage(logoImg, posX, posY, logoSize, logoSize);
              } else {
                ctx.fillStyle = "rgba(37, 99, 235, 0.9)";
                const textWidth = ctx.measureText(logoConfig.name).width + 30;
                ctx.roundRect(posX - 40, posY, Math.max(120, textWidth), 36, 12);
                ctx.fill();
                ctx.fillStyle = "#FFFFFF";
                ctx.font = `bold ${Math.round(15 * (canvasW / 400))}px Arial, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(logoConfig.name, posX - 40 + Math.max(120, textWidth) / 2, posY + 18);
              }
              ctx.restore();
            }

            // Chèn Banner quảng cáo
            if (mergeBurnBanner && bannerConfig.enabled) {
              ctx.save();
              const bannerMarginX = Math.round(canvasW * 0.04);
              const bW = canvasW - bannerMarginX * 2;
              const bH = Math.round(72 * (canvasH / 800));
              const bY = canvasH - bH - Math.round(20 * (canvasH / 800));
              const bRadius = Math.round(18 * (canvasH / 800));

              ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
              ctx.shadowBlur = Math.round(18 * (canvasH / 800));
              ctx.shadowOffsetY = Math.round(5 * (canvasH / 800));

              const grad = ctx.createLinearGradient(bannerMarginX, bY, bannerMarginX + bW, bY);
              grad.addColorStop(0, "#dc2626");
              grad.addColorStop(0.48, "#e11d48");
              grad.addColorStop(1, "#ea580c");
              ctx.fillStyle = grad;
              ctx.roundRect(bannerMarginX, bY, bW, bH, bRadius);
              ctx.fill();

              ctx.fillStyle = "#FFFFFF";
              ctx.font = `900 ${Math.round(16 * (canvasW / 400))}px Arial, sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(bannerConfig.title, canvasW / 2, bannerConfig.subtitle ? bY + bH * 0.38 : bY + bH * 0.5);

              if (bannerConfig.subtitle) {
                ctx.fillStyle = "#FEF08A";
                ctx.font = `700 ${Math.round(11 * (canvasW / 400))}px Arial, sans-serif`;
                ctx.fillText(bannerConfig.subtitle, canvasW / 2, bY + bH * 0.72);
              }
              ctx.restore();
            }

            reqId = requestAnimationFrame(drawFrame);
          };

          reqId = requestAnimationFrame(drawFrame);
        });

        cumulativeTimeSec += clipDur;
        vEl.pause();
        vEl.src = "";
      }

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType });
        const downloadUrl = URL.createObjectURL(finalBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        const safeName = (videoName || "kpost").replace(/\.[^/.]+$/, "");
        a.download = `${safeName}_3part_merged_${reqRatio.replace(':', 'x')}_${reqRes}.${actualExt}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        setMergeProgress(100);
        setMergeStatus("✅ Đã ghép video 3 phần thành công!");
        setTimeout(() => {
          setIsMerging(false);
          setShowExportModal(false);
        }, 1200);
      };

      recorder.stop();
      audioCtx.close().catch(() => {});
    } catch (err: any) {
      console.error("Lỗi ghép video:", err);
      alert("Lỗi khi ghép video: " + (err?.message || "Vui lòng thử lại"));
      setIsMerging(false);
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
    <div className="flex-1 bg-[#F8FAFC] min-h-screen p-3 md:p-6 font-sans text-slate-800 overflow-y-auto selection:bg-orange-500 selection:text-white">
      <div className="max-w-[1540px] mx-auto pb-24">
        {/* HEADER PRO STUDIO - TONE CAM & TRẮNG HIỆN ĐẠI */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/90 shadow-sm p-4 md:p-6 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="p-3 bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 rounded-2xl text-white shadow-md shadow-orange-500/25 shrink-0">
                <Wand2 size={24} />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
                    KPOST AI VIDEO EDITOR
                  </h1>
                  <span className="bg-orange-50 border border-orange-200 text-orange-600 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-2xs">
                    PRO STUDIO
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Trình chỉnh sửa Video AI thông minh của Kpost AI : Bóc băng tạo phụ đề tự động , dịch và lồng tiếng MC đa giọng và xuất bản chất lượng cao...
                </p>
              </div>
            </div>

            {/* HÀNG NÚT HÀNH ĐỘNG CHÍNH */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-orange-500/25 active:scale-95 cursor-pointer"
              >
                <UploadCloud size={16} /> <span>Tải Video Lên</span>
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
                className="px-4 py-2.5 bg-white hover:bg-orange-50/50 text-slate-700 hover:text-orange-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-slate-200 hover:border-orange-300 shadow-2xs cursor-pointer active:scale-95"
              >
                <Link2 size={16} className="text-orange-500" /> <span>Dán Link Video</span>
              </button>

              <button
                type="button"
                onClick={() => setShowApiKeyModal(true)}
                className="px-3.5 py-2.5 bg-white hover:bg-orange-50/50 text-slate-700 hover:text-orange-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 hover:border-orange-300 shadow-2xs transition-all cursor-pointer"
                title="Cài đặt GEMINI_API_KEY hoặc GROQ_API_KEY (miễn phí)"
              >
                <Settings size={15} className="text-orange-500" />
                <span>API Key</span>
                {(customGeminiKey || customGroqKey) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Đã có API Key"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMaskConfig((p) => ({ ...p, enabled: !p.enabled }))}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  maskConfig.enabled
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                    : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                }`}
                title="Bật/Tắt dải che mờ đè lên phụ đề tiếng Trung gốc"
              >
                <Eye size={15} className={maskConfig.enabled ? "text-white" : "text-orange-500"} />
                <span>Che Sub Gốc: {maskConfig.enabled ? "BẬT" : "TẮT"}</span>
              </button>

              <a
                href="/fullcode-ai-video-editor.zip"
                download="fullcode-ai-video-editor.zip"
                className="px-3.5 py-2.5 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Tải toàn bộ source code ZIP"
              >
                <Download size={14} className="text-orange-500" /> <span>Tải Code ZIP</span>
              </a>
            </div>
          </div>

          {/* TOOL SHOWCASE RIBBON */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-orange-500" /> Công Cụ Biên Tập AI Nhanh:
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {/* Card 1: Tạo Sub Video (AI Whisper) */}
              <button
                type="button"
                onClick={handleTranscribeWhisper}
                disabled={isTranscribing || isExporting}
                className="p-3 bg-white hover:bg-orange-50/50 border border-slate-200/90 hover:border-orange-300 rounded-2xl text-left transition-all group shadow-2xs cursor-pointer disabled:opacity-50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors">
                    <Mic size={16} />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full">
                    Miễn phí
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                    {isTranscribing ? "Đang bóc băng..." : "Tạo Sub Video"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">AI Whisper chuẩn xác</div>
                </div>
              </button>

              {/* Card 2: Dịch & Lồng Tiếng MC */}
              <button
                type="button"
                onClick={() => setShowTranslateModal(true)}
                disabled={isTranscribing || isReviewing || isExporting}
                className="p-3 bg-white hover:bg-orange-50/50 border border-slate-200/90 hover:border-orange-300 rounded-2xl text-left transition-all group shadow-2xs cursor-pointer disabled:opacity-50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors">
                    <Languages size={16} />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                    12 Ngôn Ngữ
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                    Dịch & Lồng Tiếng
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {detectedSourceLangInfo.isChinese ? "Tiếng Trung sang 12 thứ tiếng" : "Chọn ngôn ngữ & âm thanh gốc"}
                  </div>
                </div>
              </button>

              {/* Card 3: AI Review (HOT) */}
              <button
                type="button"
                onClick={() => {
                  if (!videoUrl && !selectedFile) {
                    alert("Vui lòng tải video lên trước khi tạo review!");
                    return;
                  }
                  setShowReviewModal(true);
                }}
                disabled={isTranscribing || isReviewing || isExporting}
                className="p-3 bg-gradient-to-br from-white to-orange-50/50 hover:to-orange-100/50 border border-orange-200 hover:border-orange-400 rounded-2xl text-left transition-all group shadow-xs cursor-pointer disabled:opacity-50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-2 bg-orange-500 text-white rounded-xl shadow-xs">
                    <Film size={16} />
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                    HOT
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-orange-950 group-hover:text-orange-600 transition-colors">
                    🎬 AI Review
                  </div>
                  <div className="text-[10px] text-orange-700/80 mt-0.5 line-clamp-1">Kịch bản hài hước viral</div>
                </div>
              </button>

              {/* Card 4: AI Cắt & Ghép Video */}
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                disabled={!videoUrl || isExporting}
                className="p-3 bg-white hover:bg-orange-50/50 border border-slate-200/90 hover:border-orange-300 rounded-2xl text-left transition-all group shadow-2xs cursor-pointer disabled:opacity-50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors">
                    <Scissors size={16} />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                    Mới
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                    Cắt & Ghép AI
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Tách tập & ghép intro/outro</div>
                </div>
              </button>

              {/* Card 5: Đổi Giọng MC & Âm Lượng */}
              <button
                type="button"
                onClick={() => setShowVoiceoverModal(true)}
                className="p-3 bg-white hover:bg-orange-50/50 border border-slate-200/90 hover:border-orange-300 rounded-2xl text-left transition-all group shadow-2xs cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors">
                    <Volume2 size={16} />
                  </span>
                  <span className="text-xs">
                    {VOICE_CHARACTERS.find((c) => c.id === voiceoverConfig.selectedVoiceId)?.avatar || "👩"}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                    Đổi Giọng MC
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Hạ tiếng gốc 10%</div>
                </div>
              </button>

              {/* Card 6: Logo & Banner */}
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="p-3 bg-white hover:bg-orange-50/50 border border-slate-200/90 hover:border-orange-300 rounded-2xl text-left transition-all group shadow-2xs cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors">
                    <ImageIcon size={16} />
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                    Logo & Banner
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Chèn watermark & tiêu đề</div>
                </div>
              </button>

              {/* Card 7: Hiệu Ứng Video */}
              <button
                type="button"
                onClick={() => setShowEffectsModal(true)}
                className="p-3 bg-white hover:bg-orange-50/50 border border-slate-200/90 hover:border-orange-300 rounded-2xl text-left transition-all group shadow-2xs cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors">
                    <Palette size={16} />
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                    Bộ Lọc & Hiệu Ứng
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Màu điện ảnh & tốc độ</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* BẬT / TẮT THANH TAB CHUYỂN ĐỔI GIAO DIỆN TRÊN MOBILE */}
        <div className="lg:hidden mb-4 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => setActiveMobileTab("video")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeMobileTab === "video"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Play size={13} />
            <span>Trình phát</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab("subtitles")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeMobileTab === "subtitles"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Type size={13} />
            <span>Phụ đề ({subtitleCues.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab("voices")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeMobileTab === "voices"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Mic size={13} />
            <span>Giọng MC</span>
          </button>
        </div>

        {/* TIẾN TRÌNH XUẤT VIDEO (HỖ TRỢ XUẤT ĐƠN LẺ & HÀNG LOẠT) */}
        {(isExporting || isBatchExporting) && (
          <div className="mb-6 p-5 bg-white border border-emerald-200 text-slate-800 rounded-3xl shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Download size={20} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    {isBatchExporting ? (
                      <>
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-xs font-black shadow-xs">
                          ⚡ XUẤT HÀNG LOẠT: TẬP {batchCurrentIndex}/{batchTotal}
                        </span>
                        <span className="text-slate-800">{batchPartLabel}</span>
                      </>
                    ) : (
                      `Đang Render & Xuất Video ${exportPartTitle ? `• ${exportPartTitle}` : ""} (${exportOptions.format.toUpperCase()} • ${exportOptions.resolution.toUpperCase()})...`
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isBatchExporting
                      ? `Đang xuất tập ${batchCurrentIndex}/${batchTotal}. Mỗi tập khi xuất xong sẽ tự động tải file về máy!`
                      : "Hệ thống đang gắn phụ đề, logo, banner và hiệu ứng vào video (Tự động tải về khi đủ 100%)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-base font-mono font-black text-emerald-600">{exportProgress}%</span>
                {exportProgress >= 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      exportForceDownloadRef.current = true;
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs animate-pulse flex items-center gap-1.5"
                    title="Bấm để hoàn tất và tải ngay phần video đã render về máy"
                  >
                    <Download size={13} /> ⚡ Tải Ngay ({exportProgress}%)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    batchAbortRef.current = true;
                    exportAbortRef.current = true;
                    setIsBatchExporting(false);
                    setIsExporting(false);
                  }}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  {isBatchExporting ? "Dừng Hàng Loạt" : "Hủy"}
                </button>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-200"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* TIẾN TRÌNH BÓC BĂNG */}
        {isTranscribing && (
          <div className="mb-6 p-5 bg-white border border-orange-200 text-slate-800 rounded-3xl shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Mic size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Kpost AI Đang Nghe & Bóc Băng Âm Thanh...</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{transcribeStatus}</p>
                </div>
              </div>
              <span className="text-base font-mono font-black text-orange-600">{transcribeProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${transcribeProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* TIẾN TRÌNH REVIEW VIDEO */}
        {isReviewing && (
          <div className="mb-6 p-5 bg-white border border-purple-200 text-slate-800 rounded-3xl shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Film size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span>🎬 Kpost AI Đang Tổng Hợp & Viết Lời Review...</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                      {reviewConfig.style === "humorous_viral"
                        ? "Hài Hước Bắt Trend"
                        : reviewConfig.style === "dramatic_cinema"
                        ? "Kịch Tính Cuốn Hút"
                        : reviewConfig.style === "philosophical_satire"
                        ? "Châm Biếm Thâm Thúy"
                        : "Review Siêu Tốc 60s"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{reviewStatus}</p>
                </div>
              </div>
              <span className="text-base font-mono font-black text-purple-600">{reviewProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${reviewProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 2 CỘT CHÍNH + THANH CÔNG CỤ DỌC PHẢI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI: DANH SÁCH LỜI THOẠI TOÀN BỘ VIDEO */}
          <div className={`lg:col-span-5 flex flex-col gap-4 ${activeMobileTab === "video" ? "hidden lg:flex" : "flex"}`}>
            <div className="bg-white rounded-3xl border border-slate-200/90 p-4 md:p-5 shadow-xs text-slate-800">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-orange-50 text-orange-600">
                    <Type size={16} />
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Lời Thoại Video ({subtitleCues.length} Câu)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {subtitleCues.length > 0 && (
                    <>
                      {/* 🌐 NÚT DỊCH TỨC THÌ SANG 12 THỨ TIẾNG */}
                      <button
                        type="button"
                        onClick={() => setShowTranslateModal(true)}
                        disabled={isTranslatingCues || isTranslatingInModal}
                        className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                        title="Mở bảng Dịch Thuật & Lồng Tiếng 12 Ngôn Ngữ Chuẩn Xác"
                      >
                        {isTranslatingCues || isTranslatingInModal ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" /> Đang dịch...
                          </>
                        ) : (
                          <>
                            <Languages size={12} /> Dịch & Lồng Tiếng
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={resetAllMediaCacheAndState}
                        className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Xóa sạch toàn bộ phụ đề và giải phóng cache âm thanh cũ"
                      >
                        <Trash2 size={12} /> Xóa Sub
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadSRT}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Tải phụ đề tiếng Việt chuẩn định dạng .SRT về máy (1 giây)"
                      >
                        <FileDown size={13} /> .SRT
                      </button>
                      {videoUrl && (
                        <a
                          href={videoUrl}
                          download={`${videoName.replace(/\.[^/.]+$/, "") || "video"}_original.mp4`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Tải ngay video gốc chất lượng cao về máy (1 giây)"
                        >
                          <Download size={13} /> Video Gốc
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* TÙY CHỌN & CHỌN GIỌNG MC TRỰC TIẾP */}
              <div className="mb-3.5 p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col gap-2.5 text-xs text-slate-700 shadow-2xs">
                {/* DÒNG 1: HIỆN PHỤ ĐỀ & CỠ CHỮ */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subtitleConfig.enabled}
                      onChange={(e) => setSubtitleConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    Hiện phụ đề trên video
                  </label>
                  <div className="flex items-center gap-2 font-medium text-slate-600">
                    <span>Cỡ chữ:</span>
                    <select
                      value={subtitleConfig.fontSize}
                      onChange={(e) => setSubtitleConfig((p) => ({ ...p, fontSize: Number(e.target.value) }))}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shadow-2xs"
                    >
                      <option value={18}>Nhỏ (18px)</option>
                      <option value={20}>Vừa (20px)</option>
                      <option value={24}>To (24px)</option>
                      <option value={28}>Rất to (28px)</option>
                    </select>
                  </div>
                </div>

                {/* DÒNG 2: BẬT / TẮT LỒNG TIẾNG MC VÀ THỬ LOA */}
                <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 font-bold cursor-pointer text-slate-800 bg-white hover:bg-orange-50/50 px-3 py-1.5 rounded-xl border border-slate-200 transition-all select-none shadow-2xs">
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
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <span>🎙️ Lồng Tiếng MC AI {voiceoverConfig.enabled ? "(Đang Bật)" : "(Tắt)"}</span>
                  </label>

                  {/* 🌟 ĐIỀU CHỈNH TIẾNG GỐC 10% CHE MỜ GIỌNG NGOẠI NGỮ GỐC */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs">
                    <span className="text-slate-600 font-bold text-[11px] whitespace-nowrap">
                      Tiếng gốc: <strong className="text-orange-600">{voiceoverConfig.originalVolume}%</strong>
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
                      className="w-16 accent-orange-500 cursor-pointer h-1.5"
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
                          ? "bg-orange-500 text-white font-bold shadow-2xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      title="Bấm để khóa chính xác 10% che mờ tiếng gốc"
                    >
                      10%
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
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
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Bấm để kiểm tra loa và giọng đọc AI"
                    >
                      <Volume2 size={13} /> Thử Giọng
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowVoiceoverModal(true)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold rounded-lg cursor-pointer shadow-2xs"
                    >
                      Âm Lượng
                    </button>
                  </div>
                </div>

                {/* 🎯 TÙY CHỌN: CHỈ LỒNG TIẾNG HỘI THOẠI CHÍNH (BỎ QUA TIẾNG ĐỆM / PHỤ) */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={voiceoverConfig.focusMainDialogue}
                      onChange={(e) => {
                        setVoiceoverConfig((p) => ({ ...p, focusMainDialogue: e.target.checked }));
                      }}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <Wand2 size={12} className="text-orange-500" />
                        Chỉ lồng tiếng hội thoại chính (Chống xung đột giọng)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Tự động bỏ qua tiếng kêu, thán từ đệm, tạp âm và các câu phụ vô nghĩa
                      </span>
                    </div>
                  </label>

                  {subtitleCues.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCleanAndFilterCues}
                      className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                      title="Lọc sạch danh sách câu: Chỉ giữ lại lời thoại đắt giá, loại bỏ tiếng đệm"
                    >
                      <Sliders size={11} /> 🧹 Tinh Gọn Lời Thoại
                    </button>
                  )}
                </div>

                {/* DÒNG 3: BỘ CHỌN GIỌNG MC TRỰC TIẾP & LOAD LẠI KHÔNG CẦN DỊCH TỪ ĐẦU */}
                <div className="p-3 bg-white border border-slate-200/90 rounded-2xl flex flex-col gap-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5">
                      <Radio size={13} className="text-orange-500" /> Chọn Giọng MC (Đổi Là Ăn Ngay):
                    </span>
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      ✓ Không cần dịch lại
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
                              ? "bg-orange-500 text-white border-orange-500 shadow-xs scale-[1.02]"
                              : "bg-white hover:bg-orange-50/50 text-slate-700 border-slate-200 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{v.avatar}</span>
                            <span className="text-[11px] font-black truncate">{v.shortName}</span>
                          </div>
                          <div className={`text-[9px] mt-0.5 ${isSelected ? "text-orange-100" : "text-slate-400"}`}>
                            Tốc độ: {v.rate}x
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* ĐIỀU CHỈNH TỐC ĐỘ ĐỌC (KHỚP NHỊP DOUYIN NHANH) */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
                    <span className="font-bold text-slate-600">Khớp nhịp nhân vật:</span>
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
                              ? "bg-orange-500 text-white shadow-2xs font-bold"
                              : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
                          }`}
                        >
                          {spd.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* THÔNG BÁO KHI ĐỔI GIỌNG */}
                  {voiceChangeNotice && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-bold animate-in fade-in flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
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
                          ? "bg-orange-50 border-orange-400 text-orange-950 shadow-xs"
                          : "bg-white hover:bg-slate-50/80 border-slate-200/90 text-slate-800 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => seekToTimestamp(cue.startSec)}
                          className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg shrink-0 cursor-pointer transition-all hover:scale-105 ${
                            isActive
                              ? "bg-orange-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-700 border border-slate-200"
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
                              className="w-full text-xs font-bold px-2.5 py-1 rounded-xl outline-none border bg-white text-slate-900 border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all shadow-2xs"
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
                              className="p-1.5 rounded-lg bg-slate-300 text-slate-700 hover:bg-slate-400 cursor-pointer shrink-0"
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
                                ? "text-orange-900 font-black tracking-wide"
                                : "text-slate-700 font-medium hover:text-orange-600"
                            }`}
                            title="Bấm để tua video"
                          >
                            {cue.text}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && !isEditing && (
                          <span className="text-[10px] font-black uppercase text-orange-700 shrink-0 bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200">
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
                              ? "bg-orange-200/60 text-orange-900 hover:bg-orange-200"
                              : "text-slate-400 hover:text-orange-600 hover:bg-orange-50 border border-transparent"
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
                                ? "bg-orange-200/60 text-orange-900 hover:bg-orange-200"
                                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent"
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
                      Bấm nút <span className="font-bold text-orange-600">"🔥 Cào Douyin Trends"</span> hoặc <span className="font-bold text-orange-600">"🎤 Bật sub tự động bằng AI"</span> để nạp video và kịch bản!
                    </p>
                  </div>
                )}
              </div>

              {transcribeSuccessMsg && (
                <div className="mt-3.5 p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-2 animate-in fade-in">
                  <Check size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-purple-900 leading-relaxed">{transcribeSuccessMsg}</p>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: VIDEO PLAYER VỚI PHỤ ĐỀ DỌC 9:16 */}
          <div className={`lg:col-span-7 ${activeMobileTab !== "video" ? "hidden lg:block" : "block"}`}>
            <div className="bg-white rounded-3xl border border-slate-200/90 p-4 md:p-5 shadow-xs flex-1 text-slate-800">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Play size={13} />
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate" title={videoName}>
                    {videoName || "Studio Video Preview"}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Chuyển đổi nhanh tỷ lệ xem trước 16:9 / 9:16 chuẩn CapCut */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoAspect("9:16");
                        setExportOptions((p) => ({ ...p, aspectRatio: "9:16" }));
                      }}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        videoAspect === "9:16"
                          ? "bg-orange-500 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      title="Xem trước tỷ lệ dọc 9:16 (TikTok, Reels, Shorts)"
                    >
                      📱 9:16
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoAspect("16:9");
                        setExportOptions((p) => ({ ...p, aspectRatio: "16:9" }));
                      }}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        videoAspect === "16:9"
                          ? "bg-orange-500 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      title="Xem trước tỷ lệ ngang 16:9 (YouTube, Facebook, PC)"
                    >
                      🖥️ 16:9
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowEffectsModal(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Palette size={13} className="text-orange-500" />
                    {visualEffects.filterType !== "none" ? "Hiệu ứng" : "Bộ lọc"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    disabled={!videoUrl || isExporting}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Scissors size={13} />
                    {isExporting ? `Xuất ${exportProgress}%` : "Cắt & Xuất"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompareOriginal(!compareOriginal)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      compareOriginal
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    }`}
                  >
                    <Eye size={13} />
                    {compareOriginal ? "Xem GỐC" : "Bản gốc"}
                  </button>
                </div>
              </div>

              {/* KHUNG VIDEO: TỰ ĐỘNG CÂN CHỈNH TỶ LỆ 16:9 VÀ 9:16 CHUẨN CAPCUT */}
              <div
                className={`w-full bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-200 shadow-md flex items-center justify-center mx-auto transition-all duration-300 ${
                  videoAspect === "16:9"
                    ? "aspect-video max-h-[500px]"
                    : "aspect-[9/16] max-h-[560px]"
                }`}
              >
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
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setCurrentTime(videoRef.current.currentTime);
                          // Tự động phát hiện nếu khung hình bị đen hoàn toàn khi đang phát
                          if (!isDetectedHevc && videoRef.current.currentTime > 1.2 && !videoRef.current.paused) {
                            try {
                              const testCanvas = document.createElement("canvas");
                              testCanvas.width = 32;
                              testCanvas.height = 32;
                              const testCtx = testCanvas.getContext("2d");
                              if (testCtx && videoRef.current.videoWidth > 0) {
                                testCtx.drawImage(videoRef.current, 0, 0, 32, 32);
                                const pix = testCtx.getImageData(0, 0, 32, 32).data;
                                let isBlack = true;
                                for (let p = 0; p < pix.length; p += 4) {
                                  if (pix[p] > 15 || pix[p + 1] > 15 || pix[p + 2] > 15) {
                                    isBlack = false;
                                    break;
                                  }
                                }
                                if (isBlack) {
                                  setIsDetectedHevc(true);
                                }
                              }
                            } catch {}
                          }
                        }
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
                        if (videoRef.current) {
                          const dur = videoRef.current.duration;
                          if (dur) {
                            setVideoDuration(dur);
                            setExportOptions((p) => ({
                              ...p,
                              customEndSec: p.customEndSec === 300 || p.customEndSec > dur ? Math.min(dur, 180) : p.customEndSec,
                            }));
                          }
                          const vw = videoRef.current.videoWidth;
                          const vh = videoRef.current.videoHeight;
                          if (vw && vh) {
                            const isLandscape = vw > vh * 1.15;
                            const detectedAspect = isLandscape ? "16:9" : "9:16";
                            setVideoAspect(detectedAspect);
                            setExportOptions((p) => ({
                              ...p,
                              aspectRatio: isLandscape ? "16:9" : "9:16",
                            }));
                          }
                        }
                        setVideoLoadError(null);
                        setHasNoVideoTrack(false);
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
                        if (videoUrl.startsWith("http") && !selectedFile) {
                          setVideoLoadError("Máy chủ nguồn chặn quyền phát trực tiếp (lỗi CORS) hoặc link trang web không chứa luồng video MP4 trực tiếp. Bạn chỉ cần bấm nút bên dưới để chọn file từ máy và biên tập trọn vẹn 8 phút.");
                        }
                      }}
                      className="w-full h-full object-contain pointer-events-auto"
                    />

                    {/* THÔNG BÁO VÀ NÚT TẢI FILE TỪ MÁY KHI LINK HTTP BỊ CHẶN CORS */}
                    {videoLoadError && !selectedFile && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center text-slate-800 animate-in fade-in">
                        <span className="p-3 bg-orange-100 text-orange-600 rounded-2xl mb-3 border border-orange-200">
                          <AlertTriangle size={36} />
                        </span>
                        <h4 className="font-black text-sm text-slate-800 mb-1.5 uppercase tracking-wide">
                          Máy Chủ Nguồn Chặn Phát Trực Tiếp
                        </h4>
                        <p className="text-xs text-slate-600 max-w-sm mb-4 leading-relaxed">
                          Link này bị máy chủ bên ngoài chặn quyền nhúng CORS vào trình duyệt. Để biên tập trọn vẹn video mà không bị ngắt, bạn bấm nút dưới đây để chọn file từ máy:
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer"
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
                          <div className="px-3 py-1 bg-orange-500/90 text-white font-black text-xs rounded-xl shadow-md border border-white/20 backdrop-blur-xs flex items-center gap-1.5 tracking-wider uppercase">
                            <Wand2 size={11} className="text-white" />
                            {logoConfig.name}
                          </div>
                        )}
                      </div>
                    )}

                    {/* BANNER */}
                    {isBannerVisible && (
                      <div className="absolute left-4 right-4 bottom-4 pointer-events-none z-30 transition-all">
                        <div className="p-3 rounded-2xl shadow-xl border border-white/25 text-center text-white bg-gradient-to-r from-red-600/95 via-rose-600/95 to-amber-600/95 backdrop-blur-md">
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

                    {/* 🌟 PHỤ ĐỀ CHUẨN CAPCUT: TỰ ĐỘNG CĂN CHỈNH TỶ LỆ 16:9 VÀ 9:16, TỰ NGẮT DÒNG KHÔNG BỊ TRÀN CHỮ */}
                    {subtitleConfig.enabled && !compareOriginal && currentSubtitleCue && (
                      <div
                        className={`absolute left-0 right-0 z-40 pointer-events-none flex justify-center px-4 transition-all duration-200 ${
                          videoAspect === "16:9" ? "bottom-[14%]" : "bottom-[24%]"
                        }`}
                      >
                        <div className="bg-black/85 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-2xl max-w-[82%] text-center animate-in fade-in zoom-in-95 duration-100">
                          <p
                            className="font-black leading-snug tracking-wide text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] break-words whitespace-normal [text-wrap:balance]"
                            style={{
                              fontSize:
                                videoAspect === "16:9"
                                  ? `${Math.min(20, Math.max(14, (subtitleConfig.fontSize || 20) * 0.9))}px`
                                  : `${Math.min(22, Math.max(15, subtitleConfig.fontSize || 20))}px`,
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
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play();
                      }
                    }}
                    className="w-10 h-10 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <div className="flex-1 flex items-center gap-2 text-xs font-mono text-slate-500">
                    <span className="font-bold text-slate-800">
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
                      className="flex-1 accent-orange-500 h-2 bg-slate-100 rounded-lg cursor-pointer"
                    />
                    <span className="font-bold text-slate-500">
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
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {subtitleCues.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      Đã có ({subtitleCues.length} câu phụ đề)
                    </span>
                  )}
                  {voiceoverConfig.enabled && (
                    <button
                      type="button"
                      onClick={() => setShowVoiceoverModal(true)}
                      className="text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-xl border border-orange-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Radio size={13} className="text-orange-500 animate-pulse" />
                      Đang lồng tiếng: {VOICE_CHARACTERS.find((c) => c.id === voiceoverConfig.selectedVoiceId)?.name}
                    </button>
                  )}
                  {maskConfig.enabled && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      🎭 Đã che sub tiếng Trung
                    </span>
                  )}
                  {visualEffects.filterType !== "none" && (
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
                      ✨ Bộ lọc: {visualEffects.filterType.toUpperCase()} ({visualEffects.speed}x)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 MODAL 1: AI LỒNG TIẾNG ĐA CHẤT GIỌNG (TỪ TRẺ EM ĐẾN NGƯỜI LỚN) - CAM TRẮNG */}
      {showVoiceoverModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <Radio size={18} />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    AI Lồng Tiếng Cho Video (Từ Trẻ Em Đến Người Lớn)
                  </h3>
                  <p className="text-xs text-slate-500">Tự động nói theo phụ đề timeline, hỗ trợ Audio Ducking hạ âm lượng video gốc</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceoverModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* BẬT / TẮT & AUDIO DUCKING */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceoverConfig.enabled}
                    onChange={(e) => setVoiceoverConfig((p) => ({ ...p, enabled: e.target.checked }))}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  Bật AI tự động lồng tiếng khi phát video
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceoverConfig.autoDuckOriginal}
                    onChange={(e) => setVoiceoverConfig((p) => ({ ...p, autoDuckOriginal: e.target.checked }))}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  Tự động giảm âm lượng video gốc khi AI nói (Audio Ducking)
                </label>
              </div>

              {/* 🌟 ĐIỀU CHỈNH ÂM LƯỢNG TIẾNG GỐC VIDEO */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    🔇 Âm lượng tiếng video gốc (Che mờ ngoại ngữ):
                  </span>
                  <span className="font-black text-orange-600 text-sm">
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
                    className="flex-1 accent-orange-500 cursor-pointer h-2"
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
                        ? "bg-rose-50 border-rose-300 text-rose-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
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
                        ? "bg-orange-500 border-orange-600 text-white shadow-xs"
                        : "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                    }`}
                  >
                    Che mờ giọng gốc (10% - Khuyên Dùng)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceoverConfig((p) => ({ ...p, originalVolume: 25, muteOriginal: false }));
                      if (videoRef.current) videoRef.current.volume = 0.25;
                    }}
                    className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition-all ${
                      voiceoverConfig.originalVolume === 25
                        ? "bg-orange-500 border-orange-600 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
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
                          ? "border-orange-500 bg-orange-50/70 shadow-sm"
                          : "border-slate-200 hover:border-orange-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-2xl">{char.avatar}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            char.group === "kids"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : char.group === "adults"
                              ? "bg-orange-100 text-orange-800 border border-orange-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}>
                            {char.badge} • {char.ageRange}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800">{char.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {char.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSentence(char.sampleText, char.id, char.rate);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Volume2 size={12} /> Nghe thử mẫu
                        </button>
                        {isSelected && (
                          <span className="text-[10px] font-black text-orange-600 uppercase flex items-center gap-1">
                            <Check size={12} /> Đang chọn
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-600">
                Nhân vật đang chọn:{" "}
                <strong className="text-orange-600">
                  {VOICE_CHARACTERS.find((c) => c.id === voiceoverConfig.selectedVoiceId)?.name}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setShowVoiceoverModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                Lưu & Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎬 MODAL: TÙY CHỌN AI REVIEW VIDEO & TÓM TẮT PHIM HÀI HƯỚC */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 my-8 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl">
                  <Film size={22} />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    🎬 AI Review & Lồng Tiếng Video
                    <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                      TRIỆU VIEW
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    AI tự động phân tích khung hình & cốt truyện, viết kịch bản review dí dỏm, lôi cuốn và lồng tiếng chuẩn TikTok / Shorts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* PHONG CÁCH REVIEW */}
              <div>
                <label className="block text-xs font-black uppercase text-orange-600 tracking-wider mb-2">
                  1. Chọn phong cách Review & Tóm tắt:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: "humorous_viral",
                      icon: "🎭",
                      title: "Hài Hước - Cà Khịa - Bắt Trend",
                      desc: "Lầy lội, dùng meme & từ ngữ thịnh hành: 'chàng trai số nhọ', 'quay xe cực khét', 'bật ngửa'...",
                      badge: "Phổ biến nhất",
                    },
                    {
                      id: "dramatic_cinema",
                      icon: "🎬",
                      title: "Tóm Tắt Phim Kịch Tính",
                      desc: "Hồi hộp, giật gân, cao trào điện ảnh, giữ chân người xem từng giây.",
                      badge: "Điện ảnh",
                    },
                    {
                      id: "philosophical_satire",
                      icon: "💡",
                      title: "Châm Biếm Thâm Thúy",
                      desc: "Vừa hài vừa sâu sắc, mỉa mai hành động nhân vật, cười ra nước mắt.",
                      badge: "Sâu cay",
                    },
                    {
                      id: "speed_recap",
                      icon: "⚡",
                      title: "Review Siêu Tốc 60s",
                      desc: "Dồn dập, gãy gọn, tốc độ cao, điểm mặt liên tục các tình tiết sốc.",
                      badge: "TikTok/Shorts",
                    },
                  ].map((style) => {
                    const isSelected = reviewConfig.style === style.id;
                    return (
                      <div
                        key={style.id}
                        onClick={() => setReviewConfig((p) => ({ ...p, style: style.id as any }))}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-orange-500 bg-orange-50/70 shadow-sm"
                            : "border-slate-200 hover:border-orange-300 bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                            <span>{style.icon}</span> {style.title}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isSelected ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-600"
                          }`}>
                            {style.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{style.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MẬT ĐỘ LỜI BÌNH & ÂM LƯỢNG */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mật độ */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-black uppercase text-orange-600 tracking-wider mb-1.5">
                    2. Mật độ lời bình Review:
                  </label>
                  <div className="flex gap-1.5">
                    {[
                      { id: "high", label: "🔊 Dày đặc" },
                      { id: "medium", label: "🎵 Vừa phải" },
                      { id: "compact", label: "⚡ Tinh gọn" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setReviewConfig((p) => ({ ...p, density: d.id as any }))}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                          reviewConfig.density === d.id
                            ? "bg-orange-500 text-white border-orange-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="text-xs">{d.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Giảm âm lượng video gốc */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black uppercase text-orange-600 tracking-wider">
                      3. Âm lượng video gốc (Nhạc nền):
                    </label>
                    <span className="font-mono font-bold text-orange-600 text-xs">
                      {reviewConfig.originalVolume}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={reviewConfig.originalVolume}
                    onChange={(e) => setReviewConfig((p) => ({ ...p, originalVolume: Number(e.target.value) }))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Khuyên dùng 10-20% để giữ nhạc nền nhẹ cho giọng Review nổi bật rõ nét.
                  </p>
                </div>
              </div>

              {/* CHỌN GIỌNG REVIEWER */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-black uppercase text-orange-600 tracking-wider mb-2">
                  4. Chọn giọng đọc Reviewer:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "adult_male_reviewer", name: "Đức Anh", role: "Reviewer Bắt Trend", avatar: "👱‍♂️" },
                    { id: "cartoon", name: "Pikachu Chibi", role: "Hài Hước Biến Hóa", avatar: "⚡" },
                    { id: "adult_male_mc", name: "Minh Quân", role: "Nam MC Trầm Ấm", avatar: "🎙️" },
                    { id: "adult_female_sweet", name: "Mai Anh", role: "Nữ Review Ngọt Ngào", avatar: "👩" },
                    { id: "speed_mc", name: "MC Siêu Tốc", role: "Dồn Dập Douyin", avatar: "🚀" },
                    { id: "senior", name: "Bác Năm", role: "Đôn Hậu Thâm Thúy", avatar: "👴" },
                  ].map((v) => {
                    const isSelected = reviewConfig.selectedVoiceId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setReviewConfig((p) => ({ ...p, selectedVoiceId: v.id }))}
                        className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-orange-500 text-white border-orange-600 shadow-xs"
                            : "bg-white border-slate-200 hover:border-orange-300 text-slate-700"
                        }`}
                      >
                        <span className="text-xl shrink-0">{v.avatar}</span>
                        <div className="min-w-0">
                          <p className={`font-bold text-xs truncate ${isSelected ? "text-white" : "text-slate-800"}`}>{v.name}</p>
                          <p className={`text-[10px] truncate ${isSelected ? "text-orange-100" : "text-slate-500"}`}>{v.role}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GHI CHÚ BỔ SUNG */}
              <div>
                <label className="block text-xs font-black uppercase text-orange-600 tracking-wider mb-1.5">
                  5. Gợi ý thêm cho AI (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={reviewConfig.customPrompt}
                  onChange={(e) => setReviewConfig((p) => ({ ...p, customPrompt: e.target.value }))}
                  placeholder="Ví dụ: Đặt tên nhân vật là A Cường, nhấn mạnh cú ngã bất ngờ của anh ta..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={handleStartAiVideoReview}
                disabled={isReviewing}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-2 hover:scale-[1.02]"
              >
                <Film size={15} /> 🚀 Bắt Đầu Tạo AI Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌐 MODAL: DỊCH THUẬT & LỒNG TIẾNG ĐA NGÔN NGỮ (12 NGÔN NGỮ ƯU TIÊN) */}
      {showTranslateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 my-8 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl border border-orange-200">
                  <Languages size={22} />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    🌐 Dịch Thuật & Lồng Tiếng AI Đa Ngôn Ngữ
                    <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      12 NGÔN NGỮ
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chuyển ngữ 100% video và phụ đề, che mờ âm thanh gốc và lồng tiếng MC chuẩn xác
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTranslateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* KHỐI 1: THÔNG TIN NGÔN NGỮ & ÂM THANH GỐC CỦA VIDEO */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 text-xs">
                    <Radio size={14} className="text-orange-500" /> Ngôn Ngữ & Âm Thanh Gốc Của Video:
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    detectedSourceLangInfo.isChinese
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {detectedSourceLangInfo.flag} {detectedSourceLangInfo.name}
                  </span>
                </div>

                {/* Trạng thái lời thoại & số câu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Số câu phụ đề đã nhận diện:</span>
                      <strong className="text-sm font-black text-slate-800">
                        {subtitleCues.length > 0 ? `${subtitleCues.length} câu thoại` : "Chưa bóc băng"}
                      </strong>
                    </div>
                    {subtitleCues.length === 0 ? (
                      <button
                        type="button"
                        onClick={handleTranscribeRealAudio}
                        className="px-2.5 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Bóc băng ngay
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                        ✓ Sẵn sàng dịch
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Âm lượng tiếng video gốc:</span>
                      <strong className="text-sm font-black text-orange-600">
                        {voiceoverConfig.originalVolume}% {voiceoverConfig.originalVolume === 10 ? "(Đã che mờ)" : voiceoverConfig.originalVolume === 0 ? "(Tắt hẳn)" : ""}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceoverConfig((p) => ({ ...p, originalVolume: 10, muteOriginal: false }));
                          if (videoRef.current) videoRef.current.volume = 0.1;
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          voiceoverConfig.originalVolume === 10
                            ? "bg-orange-500 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                        title="Khóa 10% che mờ giọng ngoại ngữ gốc"
                      >
                        10%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceoverConfig((p) => ({ ...p, originalVolume: 0, muteOriginal: true }));
                          if (videoRef.current) videoRef.current.volume = 0;
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          voiceoverConfig.originalVolume === 0
                            ? "bg-rose-500 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                        title="Tắt sạch tiếng video gốc (0%)"
                      >
                        Tắt 0%
                      </button>
                    </div>
                  </div>
                </div>

                {/* Thanh kéo điều chỉnh âm lượng gốc chi tiết */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-bold">Kéo chỉnh âm lượng tiếng video gốc (Khuyên dùng: 10% để che mờ giọng gốc):</span>
                    <span className="font-mono font-bold text-orange-600">{voiceoverConfig.originalVolume}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <VolumeX size={15} className="text-slate-400" />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={voiceoverConfig.originalVolume}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setVoiceoverConfig((p) => ({ ...p, originalVolume: val, muteOriginal: val === 0 }));
                        if (videoRef.current) videoRef.current.volume = val / 100;
                      }}
                      className="flex-1 accent-orange-500 cursor-pointer h-2 bg-slate-100 rounded-lg"
                    />
                    <Volume2 size={15} className="text-orange-600" />
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">💡</span>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    <strong>Cơ chế triệt tiêu tiếng gốc:</strong> Khi MC cất lời, hệ thống tự động kích hoạt Audio Ducking hạ tiếng gốc xuống 5% để lời thuyết minh nổi bật 100%, triệt tiêu hoàn toàn tiếng nói ngoại ngữ gốc của video.
                  </p>
                </div>
              </div>

              {/* KHỐI 2: CHỌN NGÔN NGỮ ĐÍCH ĐỂ DỊCH & LỒNG TIẾNG (12 NGÔN NGỮ ƯU TIÊN) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 text-xs">
                    <Languages size={15} className="text-orange-500" /> Chọn Ngôn Ngữ Muốn Dịch & Lồng Tiếng:
                  </label>
                  <span className="text-[11px] text-slate-400">12 ngôn ngữ ưu tiên hàng đầu</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {SUPPORTED_TRANSLATION_LANGUAGES.map((lang, idx) => {
                    const isSelected = selectedTargetLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setSelectedTargetLang(lang.code)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative ${
                          isSelected
                            ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-500 shadow-md ring-2 ring-orange-200 scale-[1.02]"
                            : "bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:border-orange-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{lang.flag}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isSelected ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
                          }`}>
                            #{idx + 1}
                          </span>
                        </div>
                        <div>
                          <h4 className={`text-xs font-black leading-tight ${isSelected ? "text-orange-950" : "text-slate-800"}`}>
                            {lang.name}
                          </h4>
                          <p className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-orange-700" : "text-slate-400"}`}>
                            {lang.nativeName}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-2xs">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowTranslateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Hủy / Đóng
              </button>

              <button
                type="button"
                onClick={() => handleExecuteTranslation(selectedTargetLang)}
                disabled={isTranslatingInModal || isTranslatingCues}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-2 hover:scale-[1.02] disabled:opacity-50"
              >
                {isTranslatingInModal || isTranslatingCues ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" /> Đang Dịch & Lồng Tiếng...
                  </>
                ) : (
                  <>
                    <Languages size={15} /> 🚀 Bắt Đầu Dịch & Lồng Tiếng Ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔑 MODAL: CẤU HÌNH API KEYS (GEMINI & GROQ MIỄN PHÍ) */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl">
                  <Key size={22} />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    🔑 Cấu Hình API Key AI (Gemini & Groq)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cấu hình khóa API để bóc băng Whisper, dịch thuật và review video
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 💎 THÔNG BÁO BẢN QUYỀN THƯƠNG MẠI KPOST */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl flex items-start gap-3">
                <span className="p-2 bg-orange-500 text-white rounded-xl shrink-0 shadow-xs">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <h4 className="font-black text-xs text-orange-950 uppercase tracking-wide flex items-center gap-2">
                    Bản Quyền Thương Mại Kpost - API Đã Cấu Hình Sẵn
                    <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                      ĐÃ KÍCH HOẠT SẴN
                    </span>
                  </h4>
                  <p className="text-[11px] text-orange-900/90 mt-1 leading-relaxed">
                    Hệ thống đã tích hợp sẵn API máy chủ bản quyền tốc độ cao của Kpost cho toàn bộ tính năng: bóc băng AI Whisper, dịch thuật 12 ngôn ngữ và phát giọng MC. Bạn có thể sử dụng trực tiếp mà không cần cấu hình thêm API Key.
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    (Mục nhập API Key dưới đây chỉ là tùy chọn nâng cao nếu bạn muốn kết nối thêm tài khoản API riêng).
                  </p>
                </div>
              </div>

              {/* GROQ API KEY - KHUYÊN DÙNG */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>GROQ API KEY</span>
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      TÙY CHỌN RIÊNG
                    </span>
                  </label>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 underline hover:text-emerald-900 font-bold"
                  >
                    Lấy key miễn phí ↗
                  </a>
                </div>
                <p className="text-[11px] text-emerald-700/90 mb-2">
                  Groq Whisper Large v3 bóc băng âm thanh siêu tốc 1-2 giây & LLaMA 3.3 70B viết review. Hoàn toàn miễn phí không giới hạn.
                </p>
                <input
                  type="password"
                  value={customGroqKey}
                  onChange={(e) => setCustomGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-mono shadow-2xs"
                />
              </div>

              {/* GOOGLE GEMINI API KEY */}
              <div className="p-4 bg-orange-50/40 border border-orange-200 rounded-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span>GOOGLE GEMINI API KEY</span>
                  </label>
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 underline hover:text-orange-700 font-bold"
                  >
                    Lấy key tại aistudio ↗
                  </a>
                </div>
                <input
                  type="password"
                  value={customGeminiKey}
                  onChange={(e) => setCustomGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 font-mono shadow-2xs"
                />

                {/* Hướng dẫn lỗi 402 */}
                <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[11px] text-amber-900 leading-relaxed font-bold">
                    💡 <strong>Lưu ý nếu Google báo lỗi 402 (prepayment credits are depleted):</strong>
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed mt-1">
                    Lỗi này xảy ra khi Project trên Google AI Studio bật chế độ Trả trước nhưng số dư là 0$. Bạn chỉ cần:
                    <br />• Cách 1: Thêm <strong>GROQ_API_KEY</strong> ở trên (hoàn toàn miễn phí, chạy siêu tốc).
                    <br />• Cách 2: Tạo API Key mới trong một <strong>Project Free Tier</strong> tại Google AI Studio.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveApiKeys}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-2 hover:scale-[1.02]"
              >
                💾 Lưu Cấu Hình API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MODAL 2: CÀO DỮ LIỆU DOUYIN.COM & ĐỀ XUẤT VIDEO HOT MỚI NHẤT - CAM TRẮNG */}
      {showDouyinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <Flame size={20} />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    Douyin Hot Trends & Cào Video Bán Hàng Triệu View
                    <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      DOUYIN.COM
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Đề xuất video hot mới nhất, tự động trích xuất kịch bản tiếng Việt và gán giọng lồng tiếng tối ưu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDouyinModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* TAB CHUYỂN ĐỔI */}
            <div className="flex items-center gap-2 mb-4 p-1 bg-slate-100 border border-slate-200 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveDouyinTab("trends")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeDouyinTab === "trends"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Flame size={14} /> 🏆 Đề Xuất Video Hot Douyin Mới Nhất
              </button>
              <button
                type="button"
                onClick={() => setActiveDouyinTab("scraper")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeDouyinTab === "scraper"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Link2 size={14} /> 🔗 Cào Video Từ Link Douyin Bất Kỳ
              </button>
            </div>

            {/* TAB 1: BẢNG XẾP HẠNG VIDEO HOT DOUYIN */}
            {activeDouyinTab === "trends" && (
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* THANH CẬP NHẬT THỜI GIAN THỰC & SỐ LƯỢNG TOP 10 MỖI DANH MỤC */}
                <div className="p-3 bg-orange-50/70 border border-orange-200/90 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-orange-500 text-white rounded-xl shadow-2xs">
                      <Flame size={16} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">
                          Douyin Trends Thời Gian Thực: Top 10 Video Triệu View Mỗi Danh Mục
                        </span>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          50 Video HOT Mới Nhất
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Đồng bộ trực tiếp: <span className="font-mono font-bold text-orange-700">{douyinLastRefreshed}</span> • Bấm chọn video để nạp và lồng tiếng tức thì
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshDouyinTrends}
                    disabled={isRefreshingDouyin}
                    className="px-3.5 py-1.5 bg-white hover:bg-orange-50 border border-orange-300 text-orange-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:scale-[1.02] shrink-0"
                  >
                    <RefreshCw size={12} className={isRefreshingDouyin ? "animate-spin" : ""} />
                    {isRefreshingDouyin ? "Đang đồng bộ..." : "🔄 Làm Mới Douyin"}
                  </button>
                </div>

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
                          ? "bg-orange-500 text-white border-orange-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
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
                      className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-orange-400 transition-all hover:shadow-md shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                            {trend.categoryLabel}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">❤️ {trend.likes} • ↗️ {trend.shares}</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800 leading-snug">{trend.title}</h4>
                        <p className="text-[10px] text-slate-400 font-mono italic mt-0.5">🇨🇳 {trend.originalTitle}</p>

                        <div className="mt-2.5 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl">
                          <p className="text-[10px] text-amber-900 font-bold leading-relaxed">
                            💡 <strong>AI Viral:</strong> {trend.viralInsight}
                          </p>
                        </div>

                        <div className="mt-2 text-[11px] font-bold text-orange-800 bg-orange-50/70 p-2 rounded-xl border border-orange-200 flex items-center gap-1.5">
                          <Radio size={12} className="text-orange-500 shrink-0" />
                          <span>Gợi ý giọng: {trend.voiceRecommendationName}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportDouyinVideo(trend)}
                        className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
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
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-800 block mb-1">
                    Dán đường link Video (Hỗ trợ MP4, WebM, Google Drive, Dropbox, TikTok/Douyin...):
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    Hỗ trợ video thời lượng bất kỳ (8 phút, 15 phút, 30 phút). Hệ thống sẽ giữ nguyên 100% video của bạn, không cắt ngắn.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={douyinUrlInput}
                      onChange={(e) => setDouyinUrlInput(e.target.value)}
                      placeholder="VD: https://... hoặc link Google Drive, CDN..."
                      className="flex-1 text-xs font-bold px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none font-mono shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleScrapeDouyinLink}
                      disabled={isScrapingDouyin}
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
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
                <div className="p-4 bg-orange-50/50 border border-orange-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Upload size={14} className="text-orange-600" /> Hoặc Chọn File Video Trực Tiếp Từ Máy Tính
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Khuyên dùng: Tải file từ máy tính phát siêu mượt, trọn vẹn 100% thời lượng (8 phút, 15 phút) và không lo bị lỗi mạng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDouyinModal(false);
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <FolderOpen size={14} /> 📁 Chọn File Từ Máy
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowDouyinModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
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
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <Palette size={18} />
                </span>
                <h3 className="text-base font-black text-slate-800">Hiệu Ứng Hình Ảnh & Âm Thanh</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEffectsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* PHẦN 1: HIỆU ỨNG HÌNH ẢNH */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-3">
                  <Palette size={14} className="text-orange-500" /> 1. Bộ Lọc Màu & Hiệu Ứng Hình Ảnh (Visual)
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Tông màu điện ảnh:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "none", label: "Mặc định" },
                        { id: "bright", label: "Sáng nét" },
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
                              ? "bg-orange-500 text-white border-orange-500 shadow-xs font-bold"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-orange-50/50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Độ sáng: {visualEffects.brightness}%
                      </label>
                      <input
                        type="range"
                        min={80}
                        max={140}
                        value={visualEffects.brightness}
                        onChange={(e) => setVisualEffects((p) => ({ ...p, brightness: Number(e.target.value) }))}
                        className="w-full accent-orange-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Độ bão hòa màu: {visualEffects.saturation}%
                      </label>
                      <input
                        type="range"
                        min={60}
                        max={180}
                        value={visualEffects.saturation}
                        onChange={(e) => setVisualEffects((p) => ({ ...p, saturation: Number(e.target.value) }))}
                        className="w-full accent-orange-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
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
                              ? "bg-orange-500 text-white border-orange-500 shadow-2xs font-bold"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
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
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-3">
                  <Music size={14} className="text-orange-500" /> 2. Hiệu Ứng Âm Thanh & Khuếch Đại (Audio)
                </span>

                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-orange-300 transition-all shadow-2xs">
                    <div>
                      <p className="text-xs font-bold text-slate-800">🎙️ Khuếch đại giọng nói (Voice Boost +40%)</p>
                      <p className="text-[11px] text-slate-500">Giúp giọng nói rõ ràng, nổi bật hơn so với âm thanh tạp âm</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.boostVoiceVolume}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, boostVoiceVolume: e.target.checked }))}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-orange-300 transition-all shadow-2xs">
                    <div>
                      <p className="text-xs font-bold text-slate-800">🔔 Hiệu ứng Ding khi hiện Banner</p>
                      <p className="text-[11px] text-slate-500">Phát âm thanh thông báo thu hút mắt nhìn khi banner giảm giá xuất hiện</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.dingEffectEnabled}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, dingEffectEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-orange-300 transition-all shadow-2xs">
                    <div>
                      <p className="text-xs font-bold text-slate-800">💨 Hiệu ứng Whoosh lướt cảnh mở đầu</p>
                      <p className="text-[11px] text-slate-500">Âm thanh lướt gió chuyên nghiệp trong 2 giây đầu video</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.whooshEffectEnabled}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, whooshEffectEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowEffectsModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
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
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <ImageIcon size={18} />
                </span>
                <h3 className="text-base font-black text-slate-800">Thiết Lập Logo & Banner Video</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* PHẦN 1: LOGO */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-orange-500" /> 1. Logo Thương Hiệu
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logoConfig.enabled}
                      onChange={(e) => setLogoConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    Bật Logo
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                      Ảnh Logo (PNG trong suốt / JPG):
                    </label>
                    <div className="flex items-center gap-3">
                      {logoConfig.imageSrc ? (
                        <div className="relative group w-14 h-14 bg-white border border-slate-200 rounded-xl p-1 flex items-center justify-center shrink-0 shadow-2xs">
                          <img
                            src={logoConfig.imageSrc}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain rounded"
                          />
                          <button
                            type="button"
                            onClick={() => setLogoConfig((p) => ({ ...p, imageSrc: "" }))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 cursor-pointer"
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
                          className="w-full py-2.5 px-3 bg-white hover:bg-orange-50/50 border border-dashed border-slate-300 hover:border-orange-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
                        >
                          <UploadCloud size={16} className="text-orange-500" />
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
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Hoặc nhập Chữ Logo đại diện:
                      </label>
                      <input
                        type="text"
                        value={logoConfig.name}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, name: e.target.value }))}
                        placeholder="VD: KPOST AI"
                        className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-orange-500 focus:outline-none shadow-2xs"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Vị trí góc:</label>
                      <select
                        value={logoConfig.position}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, position: e.target.value as any }))}
                        className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none shadow-2xs"
                      >
                        <option value="top-right">Góc trên - Phải</option>
                        <option value="top-left">Góc trên - Trái</option>
                        <option value="bottom-right">Góc dưới - Phải</option>
                        <option value="bottom-left">Góc dưới - Trái</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Kích thước: {logoConfig.size || 40}px
                      </label>
                      <input
                        type="range"
                        min={24}
                        max={70}
                        value={logoConfig.size || 40}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, size: Number(e.target.value) }))}
                        className="w-full accent-orange-500 h-2 bg-slate-200 rounded-lg cursor-pointer mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: BANNER QUẢNG CÁO */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    🏷️ 2. Banner Quảng Cáo / Giảm Giá
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerConfig.enabled}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    Bật Banner
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Tiêu đề chính:</label>
                    <input
                      type="text"
                      value={bannerConfig.title}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, title: e.target.value }))}
                      placeholder="VD: FLASH SALE 50% - DUY NHẤT HÔM NAY"
                      className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-orange-500 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Mô tả phụ (subtitle):</label>
                    <input
                      type="text"
                      value={bannerConfig.subtitle || ""}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, subtitle: e.target.value }))}
                      placeholder="VD: Miễn phí giao hàng toàn quốc • Bảo hành chính hãng"
                      className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-orange-500 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Bắt đầu (giây):</label>
                      <input
                        type="number"
                        min={0}
                        max={videoDuration || 120}
                        value={bannerConfig.startSec}
                        onChange={(e) => setBannerConfig((p) => ({ ...p, startSec: Number(e.target.value) }))}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Kết thúc (giây):</label>
                      <input
                        type="number"
                        min={0}
                        max={videoDuration || 120}
                        value={bannerConfig.endSec}
                        onChange={(e) => setBannerConfig((p) => ({ ...p, endSec: Number(e.target.value) }))}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none shadow-2xs"
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
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                Lưu & Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✂️ MODAL: AI CẮT VÀ GHÉP VIDEO PRO (SMART SPLIT & 3-STAGE MERGER) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-5 md:p-6 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 my-6 max-h-[92vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl">
                  <Scissors size={22} />
                </span>
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
                    AI Cắt & Ghép Video Pro
                    <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      KPOST AI
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Phân đoạn video dài thông minh có sửa tiêu đề từng tập, hoặc ghép 3 phần Intro - Thân bài - Outro với chuyển cảnh mượt mà
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* 🌟 2 TAB CHÍNH: CẮT VIDEO VS GHÉP VIDEO */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setCutMergeTab("cut")}
                className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  cutMergeTab === "cut"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Scissors size={15} /> ✂️ AI Cắt Video (Nhiều Tập & Sửa Tiêu Đề)
              </button>
              <button
                type="button"
                onClick={() => setCutMergeTab("merge")}
                className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  cutMergeTab === "merge"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Layers size={15} /> 🎞️ Ghép Video 3 Phần (Intro - Main - Outro)
              </button>
            </div>

            {/* Body (scrollable) */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">

              {/* ============================================================== */}
              {/* TAB 1: AI CẮT VIDEO THÔNG MINH                                 */}
              {/* ============================================================== */}
              {cutMergeTab === "cut" && (
                <div className="space-y-4">
                  {/* AI Phân Tích & Đề Xuất Thời Lượng Cắt */}
                  <div className="p-4 bg-orange-50/50 border border-orange-200 rounded-2xl shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-orange-100 text-orange-700 rounded-xl">
                          <Clock size={16} />
                        </span>
                        <div>
                          <p className="font-black text-slate-800 text-xs">
                            Thời lượng video gốc:{" "}
                            <span className="text-orange-600 font-mono text-sm font-black">
                              {formatSecToTime(videoDuration || 0)}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            AI tự động đọc độ dài và đề xuất kích thước phân đoạn tối ưu cho nền tảng của bạn
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAiSuggestSplit}
                        disabled={isAiSuggestingSplit || !videoDuration}
                        className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs transition-all shrink-0 disabled:opacity-50"
                      >
                        <Wand2 size={13} className={isAiSuggestingSplit ? "animate-spin" : ""} />
                        <span>AI Đề Xuất Phân Đoạn</span>
                      </button>
                    </div>

                    {aiSplitNotice && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl mb-3 text-[11px] text-amber-800 font-medium leading-relaxed">
                        {aiSplitNotice}
                      </div>
                    )}

                    {/* Lựa chọn độ dài mỗi tập */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Đề xuất cắt video thành các đoạn bao nhiêu phút:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {[
                          { mins: 1.5, label: "1.5 phút", sub: "Cliffhanger" },
                          { mins: 3, label: "3 phút", sub: "TikTok/Reels" },
                          { mins: 5, label: "5 phút", sub: "Facebook" },
                          { mins: 8, label: "8 phút", sub: "YouTube" },
                          { mins: 10, label: "10 phút", sub: "Phim Dài" },
                        ].map((item) => (
                          <button
                            key={item.mins}
                            type="button"
                            onClick={() => {
                              setExportOptions((p) => ({
                                ...p,
                                partDurationMinutes: item.mins,
                                splitMode: "auto_parts",
                              }));
                            }}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                              exportOptions.partDurationMinutes === item.mins && exportOptions.splitMode === "auto_parts"
                                ? "bg-orange-500 text-white border-orange-600 font-black shadow-2xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span className="font-black text-xs">{item.label}</span>
                            <span className="text-[9px] opacity-75">{item.sub}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] text-slate-600">Hoặc tự chỉnh:</span>
                        <input
                          type="number"
                          min={0.5}
                          max={60}
                          step={0.5}
                          value={exportOptions.partDurationMinutes}
                          onChange={(e) =>
                            setExportOptions((p) => ({
                              ...p,
                              partDurationMinutes: Math.max(0.5, Number(e.target.value) || 1),
                              splitMode: "auto_parts",
                            }))
                          }
                          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-orange-600 text-center focus:outline-none focus:border-orange-500 shadow-2xs"
                        />
                        <span className="text-[11px] text-slate-500">phút/tập (Dự kiến tạo thành <strong className="text-slate-800">{autoParts.length} tập</strong>)</span>
                      </div>
                    </div>
                  </div>

                  {/* BATCH EXPORT ACTION BAR */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-orange-50/80 border border-orange-200 rounded-2xl shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-xl shrink-0">
                        <Download size={18} />
                      </span>
                      <div>
                        <p className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                          Tải nhanh toàn bộ {autoParts.length} tập
                          <span className="px-1.5 py-0.2 rounded-md bg-orange-500 text-white text-[10px] font-black uppercase">
                            Tự động
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Tự động render lần lượt và tải về máy từng tập theo đúng tiêu đề bạn đã sửa bên dưới.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportAllParts}
                      disabled={!videoUrl || isExporting || isBatchExporting}
                      className="px-4 py-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] shrink-0 disabled:opacity-50"
                    >
                      <Download size={14} /> TẢI TẤT CẢ {autoParts.length} TẬP
                    </button>
                  </div>

                  {/* DANH SÁCH CÁC TẬP & SỬA TIÊU ĐỀ TỪNG TẬP */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Layers size={14} className="text-orange-600" /> Danh sách {autoParts.length} tập phim (Bạn có thể sửa tiêu đề riêng cho từng tập):
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Bấm vào ô tiêu đề để đổi tên tập trước khi bấm tải về máy
                        </p>
                      </div>
                      <span className="text-[11px] text-orange-600 font-bold uppercase">
                        {exportOptions.format.toUpperCase()} • {exportOptions.resolution.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {autoParts.map((part) => (
                        <div
                          key={part.id}
                          className="p-3 bg-white hover:bg-slate-50/80 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 flex items-center justify-center text-xs font-black shrink-0">
                              #{part.partNumber}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <label className="text-[10px] uppercase font-black text-slate-500">Tiêu đề tập {part.partNumber}:</label>
                                <span className="text-[10px] font-mono text-orange-600">⏱️ {part.timeLabel} • 💬 {part.cuesCount} câu</span>
                              </div>
                              <input
                                type="text"
                                value={episodeTitles[part.id] !== undefined ? episodeTitles[part.id] : part.label}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEpisodeTitles((prev) => ({ ...prev, [part.id]: val }));
                                }}
                                placeholder={`Nhập tiêu đề cho Tập ${part.partNumber}...`}
                                className="w-full text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-orange-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 justify-end shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (videoRef.current) {
                                  videoRef.current.currentTime = part.startSec;
                                  videoRef.current.play().catch(() => {});
                                  setIsPlaying(true);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Xem trước tập này trong trình phát"
                            >
                              <Play size={11} /> Xem
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenPartInNewTab(part)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Mở tập này trong Tab mới"
                            >
                              <ExternalLink size={11} /> Tab mới
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleExportFullVideo({
                                  startTimeSec: part.startSec,
                                  endTimeSec: part.endSec,
                                  partTitle: episodeTitles[part.id] || `${part.label} (${part.timeLabel})`,
                                  format: exportOptions.format,
                                  aspectRatio: exportOptions.aspectRatio,
                                  resolution: exportOptions.resolution,
                                });
                              }}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
                            >
                              <Download size={11} /> Xuất Tập {part.partNumber}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 2: GHÉP VIDEO 3 PHẦN (INTRO - THÂN BÀI - OUTRO)            */}
              {/* ============================================================== */}
              {cutMergeTab === "merge" && (
                <div className="space-y-4">
                  {/* PHẦN 1: MỞ ĐẦU (INTRO / QUẢNG CÁO) */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Film size={14} className="text-orange-600" /> 1. Phần Mở Đầu Video (Giới thiệu kênh, Hook, Quảng cáo...)
                      </span>
                      {introClip && (
                        <span className="text-[11px] font-mono text-orange-600 font-bold">
                          ⏱️ {formatSecToTime(introClip.duration)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Tải lên clip mở đầu có sẵn của bạn để ghép vào phần đầu của video hoàn chỉnh.
                    </p>

                    {introClip ? (
                      <div className="p-3 bg-white border border-orange-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                            <Film size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 text-xs truncate">{introClip.name}</p>
                            <p className="text-[11px] text-orange-600 font-mono">Thời lượng: {formatSecToTime(introClip.duration)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => introInputRef.current?.click()}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Đổi clip khác
                          </button>
                          <button
                            type="button"
                            onClick={() => setIntroClip(null)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                            title="Xóa Intro"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => introInputRef.current?.click()}
                        className="w-full py-4 px-3 bg-white hover:bg-orange-50/40 border-2 border-dashed border-slate-300 hover:border-orange-400 rounded-xl text-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shadow-2xs"
                      >
                        <UploadCloud size={20} className="text-orange-500" />
                        <span>Bấm để chọn video mở đầu có sẵn (.mp4, .webm, .mov)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Video giới thiệu kênh hoặc teaser ngắn</span>
                      </button>
                    )}
                    <input
                      ref={introInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleUploadIntroVideo}
                      className="hidden"
                    />
                  </div>

                  {/* PHẦN 2: PHẦN GIỮA (VIDEO CHÍNH & CÁC VIDEO CẦN GHÉP BẤM DẤU +) */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Layers size={14} className="text-orange-600" /> 2. Phần Giữa (Video Chính & Các Video Cần Ghép)
                      </span>
                      <button
                        type="button"
                        onClick={() => middleInputRef.current?.click()}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        <Plus size={14} /> ➕ Thêm Video Ghép
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Video chính đang làm việc được tự động đưa vào danh sách. Bấm dấu <strong>+</strong> để tải thêm nhiều clip nối tiếp và sắp xếp thứ tự.
                    </p>

                    <div className="space-y-2">
                      {middleClips.map((clip, idx) => (
                        <div
                          key={clip.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 flex items-center justify-center text-xs font-black shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-black text-slate-800 text-xs truncate">{clip.name}</p>
                              <p className="text-[11px] text-orange-600 font-mono">Thời lượng: {formatSecToTime(clip.duration)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveMiddleClip(idx, "up")}
                              disabled={idx === 0}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer disabled:opacity-30"
                              title="Di chuyển lên trên"
                            >
                              ⬆️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveMiddleClip(idx, "down")}
                              disabled={idx === middleClips.length - 1}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer disabled:opacity-30"
                              title="Di chuyển xuống dưới"
                            >
                              ⬇️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMiddleClip(clip.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                              title="Xóa clip này"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {middleClips.length === 0 && (
                        <div className="p-3 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
                          Chưa có clip nào trong phần giữa. Vui lòng bấm "➕ Thêm Video Ghép" bên trên.
                        </div>
                      )}
                    </div>
                    <input
                      ref={middleInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleUploadMiddleVideo}
                      className="hidden"
                    />
                  </div>

                  {/* PHẦN 3: KẾT THÚC (OUTRO / KÊU GỌI HÀNH ĐỘNG) */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Flame size={14} className="text-orange-600" /> 3. Phần Kết Thúc (Outro / Kêu gọi hành động CTA, Subscribe...)
                      </span>
                      {outroClip && (
                        <span className="text-[11px] font-mono text-orange-600 font-bold">
                          ⏱️ {formatSecToTime(outroClip.duration)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Tải lên clip kết thúc video để kêu gọi người xem follow kênh, like, chia sẻ hoặc đặt mua hàng.
                    </p>

                    {outroClip ? (
                      <div className="p-3 bg-white border border-orange-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                            <Flame size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 text-xs truncate">{outroClip.name}</p>
                            <p className="text-[11px] text-orange-600 font-mono">Thời lượng: {formatSecToTime(outroClip.duration)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => outroInputRef.current?.click()}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Đổi clip khác
                          </button>
                          <button
                            type="button"
                            onClick={() => setOutroClip(null)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                            title="Xóa Outro"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => outroInputRef.current?.click()}
                        className="w-full py-4 px-3 bg-white hover:bg-orange-50/40 border-2 border-dashed border-slate-300 hover:border-orange-400 rounded-xl text-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shadow-2xs"
                      >
                        <UploadCloud size={20} className="text-orange-500" />
                        <span>Bấm để chọn video kết thúc (Outro / Kêu gọi hành động CTA)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Video kêu gọi like, đăng ký kênh, mua hàng</span>
                      </button>
                    )}
                    <input
                      ref={outroInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleUploadOutroVideo}
                      className="hidden"
                    />
                  </div>

                  {/* CHUYỂN CẢNH MƯỢT MÀ */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-2.5">
                      <Sliders size={14} className="text-orange-600" /> 4. Chuyển Cảnh Mượt Mà Giữa Các Phần:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: "fade_black", label: "⬛ Mờ dần đen", desc: "Fade to Black chuẩn điện ảnh" },
                        { id: "crossfade", label: "🔀 Hòa tan mờ chồng", desc: "Crossfade mượt mà" },
                        { id: "cut", label: "⚡ Cắt liền mạch", desc: "Hard cut không độ trễ" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setMergeTransition(t.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            mergeTransition === t.id
                              ? "bg-orange-500 text-white border-orange-600 shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <p className="font-black text-xs">{t.label}</p>
                          <p className={`text-[10px] ${mergeTransition === t.id ? "text-orange-100" : "text-slate-500"}`}>{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* PHẦN CHUNG: LOGO, BANNER, ĐỊNH DẠNG & ĐỘ PHÂN GIẢI              */}
              {/* ============================================================== */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Film size={14} className="text-orange-600" /> Tùy Chọn Xuất Bản Video (Logo, Banner & Khung Hình)
                </span>

                {/* Tùy chọn chèn Logo & Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={mergeBurnLogo}
                      onChange={(e) => setMergeBurnLogo(e.target.checked)}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <span>🏷️ Chèn Logo thương hiệu vào video</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={mergeBurnBanner}
                      onChange={(e) => setMergeBurnBanner(e.target.checked)}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <span>🏷️ Chèn Banner quảng cáo trên/dưới</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {/* Tỷ lệ khung hình */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Tỷ lệ khung hình:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "9:16", label: "📱 9:16", sub: "TikTok/Reels" },
                        { id: "16:9", label: "🖥️ 16:9", sub: "YouTube/PC" },
                        { id: "1:1", label: "🟦 1:1", sub: "Vuông Feed" },
                        { id: "original", label: "🎞️ Gốc", sub: "Tỷ lệ chuẩn" },
                      ].map((ratio) => (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => setExportOptions((p) => ({ ...p, aspectRatio: ratio.id as any }))}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                            exportOptions.aspectRatio === ratio.id
                              ? "bg-orange-500 text-white border-orange-600 shadow-2xs font-black"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <span className="font-black text-[11px]">{ratio.label}</span>
                          <span className={`text-[9px] ${exportOptions.aspectRatio === ratio.id ? "text-orange-100" : "text-slate-400"}`}>{ratio.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Độ phân giải */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700">Độ nét đầu ra:</label>
                      <span className="text-[10px] text-orange-600 font-extrabold uppercase">
                        {exportOptions.resolution.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { id: "1080p", label: "1080p", sub: "Full HD" },
                        { id: "2k", label: "2K", sub: "1440p Siêu Nét" },
                        { id: "4k", label: "4K", sub: "Ultra HD" },
                        { id: "720p", label: "720p", sub: "HD File nhẹ" },
                      ].map((res) => (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => setExportOptions((p) => ({ ...p, resolution: res.id as any }))}
                          className={`py-1 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                            exportOptions.resolution === res.id
                              ? "bg-orange-500 text-white border-orange-600 font-black shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <span className="font-black text-[11px]">{res.label}</span>
                          <span className={`text-[9px] ${exportOptions.resolution === res.id ? "text-orange-100" : "text-slate-400"}`}>{res.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Định dạng file */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Định dạng file:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExportOptions((p) => ({ ...p, format: "mp4" }))}
                        className={`py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          exportOptions.format === "mp4"
                            ? "bg-orange-500 text-white border-orange-600 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>MP4 (.mp4)</span>
                        <span className={`text-[9px] font-normal ${exportOptions.format === "mp4" ? "text-orange-100" : "text-slate-400"}`}>Phổ biến nhất</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportOptions((p) => ({ ...p, format: "webm" }))}
                        className={`py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          exportOptions.format === "webm"
                            ? "bg-orange-500 text-white border-orange-600 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>WebM (.webm)</span>
                        <span className={`text-[9px] font-normal ${exportOptions.format === "webm" ? "text-orange-100" : "text-slate-400"}`}>Chất lượng cao</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PROGRESS BAR KHI ĐANG GHÉP HOẶC XUẤT */}
              {(isMerging || isExporting) && (
                <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{isMerging ? mergeStatus : "Đang xuất video..."}</span>
                    <span className="text-orange-600 font-mono text-sm font-black">{isMerging ? mergeProgress : exportProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${isMerging ? mergeProgress : exportProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                {cutMergeTab === "cut" && (
                  <>
                    {autoParts.length > 1 && (
                      <button
                        type="button"
                        onClick={handleExportAllParts}
                        disabled={!videoUrl || isExporting || isBatchExporting}
                        className="px-4 py-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-1.5 hover:scale-[1.02] disabled:opacity-50"
                      >
                        <Download size={14} /> TẢI TẤT CẢ {autoParts.length} TẬP
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const firstPart = autoParts[0];
                        if (firstPart) {
                          handleExportFullVideo({
                            startTimeSec: firstPart.startSec,
                            endTimeSec: firstPart.endSec,
                            partTitle: episodeTitles[firstPart.id] || `${firstPart.label} (${firstPart.timeLabel})`,
                            format: exportOptions.format,
                            aspectRatio: exportOptions.aspectRatio,
                            resolution: exportOptions.resolution,
                          });
                        }
                      }}
                      disabled={!videoUrl || isExporting || isBatchExporting}
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-2 hover:scale-[1.02] disabled:opacity-50"
                    >
                      <Download size={15} />
                      {`Xuất Tập 1 (${exportOptions.format.toUpperCase()} • ${exportOptions.resolution.toUpperCase()})`}
                    </button>
                  </>
                )}

                {cutMergeTab === "merge" && (
                  <button
                    type="button"
                    onClick={handleExportMergedVideo}
                    disabled={isMerging}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-2 hover:scale-[1.02] disabled:opacity-50"
                  >
                    <Layers size={15} />
                    {isMerging ? `Đang Ghép Video (${mergeProgress}%)...` : "🚀 Ghép & Xuất Video 3 Phần Ngay"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
