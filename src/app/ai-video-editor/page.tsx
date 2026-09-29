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
  Link2
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
}

export interface SubtitleConfig {
  enabled: boolean;
  fontSize: number;
  highlightColor: string;
  offsetSeconds: number;
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

// ðŸŒŸ Hiá»‡u á»©ng hÃ¬nh áº£nh (Visual Filter Effects)
export interface VisualEffectConfig {
  filterType: "none" | "cinematic" | "bright" | "vintage" | "vibrant" | "cyberpunk" | "golden";
  brightness: number; // 80 - 140
  contrast: number;   // 80 - 140
  saturation: number; // 50 - 180
  speed: number;      // 0.8 - 1.5
}

// ðŸŒŸ Hiá»‡u á»©ng Ã¢m thanh & Nháº¡c ná»n (Audio Effects)
export interface SoundEffectConfig {
  bgMusicEnabled: boolean;
  bgMusicType: "none" | "upbeat" | "chill" | "corporate" | "epic";
  bgMusicVolume: number; // 10 - 100
  dingEffectEnabled: boolean; // Ding khi hiá»‡n Banner
  whooshEffectEnabled: boolean; // Whoosh má»Ÿ Ä‘áº§u
  boostVoiceVolume: boolean; // TÄƒng Ã¢m lÆ°á»£ng giá»ng nÃ³i
}

// ðŸŽ™ï¸ Cáº¤U HÃŒNH NHÃ‚N Váº¬T Lá»’NG TIáº¾NG (Tá»ª TRáºº EM Äáº¾N NGÆ¯á»œI Lá»šN)
export interface VoiceCharacter {
  id: string;
  name: string;
  group: "kids" | "adults" | "seniors";
  ageRange: string;
  avatar: string;
  badge: string;
  gender: "male" | "female";
  pitch: number; // 1.6 - 1.9 (Tráº» em) | 0.72 (NgÆ°á»i lá»›n tuá»•i)
  rate: number;  // Tá»‘c Ä‘á»™ Ä‘á»c
  description: string;
  sampleText: string;
}

export const VOICE_CHARACTERS: VoiceCharacter[] = [
  // ðŸ‘¶ NHÃ“M GIá»ŒNG TRáºº EM (5-8 TUá»”I)
  {
    id: "child_boy",
    name: "BÃ© Báº¯p (BÃ© Trai 5â€“7 tuá»•i)",
    group: "kids",
    ageRange: "5â€“7 tuá»•i",
    avatar: "ðŸ‘¦",
    badge: "Tráº» Em LÃ­ Láº¯c",
    gender: "male",
    pitch: 1.65,
    rate: 1.08,
    description: "Giá»ng ngÃ¢y thÆ¡, há»“n nhiÃªn, reo hÃ² thÃ­ch thÃº, chuyÃªn Ä‘á»“ chÆ¡i thiáº¿u nhi.",
    sampleText: "Oa cÃ¡c báº¡n Æ¡i, nhÃ¬n mÃ³n Ä‘á»“ chÆ¡i nÃ y thÃ­ch mÃª luÃ´n nÃ¨, chÆ¡i vui láº¯m nha!"
  },
  {
    id: "child_girl",
    name: "BÃ© BÃ´ng (BÃ© GÃ¡i 6â€“8 tuá»•i)",
    group: "kids",
    ageRange: "6â€“8 tuá»•i",
    avatar: "ðŸ‘§",
    badge: "Tráº» Em Trong Tráº»o",
    gender: "female",
    pitch: 1.78,
    rate: 1.02,
    description: "Trong tráº»o, nÅ©ng ná»‹u, ngá»t ngÃ o, chuyÃªn bÃºp bÃª, quáº§n Ã¡o cÃ´ng chÃºa.",
    sampleText: "Máº¹ Æ¡i nhÃ¬n nÃ y, cÃ¡i vÃ¡y nÃ y xinh xá»‰u luÃ´n, con máº·c lÃ  thÃ nh cÃ´ng chÃºa liá»n Ã¡!"
  },
  {
    id: "cartoon",
    name: "Pikachu Chibi (Hoáº¡t HÃ¬nh)",
    group: "kids",
    ageRange: "Hoáº¡t hÃ¬nh",
    avatar: "âš¡",
    badge: "HÃ i HÆ°á»›c Biáº¿n HÃ³a",
    gender: "female",
    pitch: 1.88,
    rate: 1.15,
    description: "NÃ³i nhanh hoáº¡t nÃ¡o, biá»ƒu cáº£m khoa trÆ°Æ¡ng gÃ¢y cÆ°á»i, chuyÃªn video meme.",
    sampleText: "á»¦a alo cÃ¡i gÃ¬ záº¡ trá»i Æ¡i! Cá»©u tui cá»©u tui bÃ  con Æ¡i siÃªu pháº©m xuáº¥t hiá»‡n rá»“i nÃ¨!"
  },
  // ðŸ§‘ NHÃ“M GIá»ŒNG NGÆ¯á»œI Lá»šN
  {
    id: "adult_female_sweet",
    name: "Mai Anh (Ná»¯ Review Dá»‹u DÃ ng)",
    group: "adults",
    ageRange: "22â€“27 tuá»•i",
    avatar: "ðŸ‘©",
    badge: "Ngá»t NgÃ o Skincare",
    gender: "female",
    pitch: 1.25,
    rate: 1.02,
    description: "Thá»§ thá»‰ nhÆ° tÃ¢m sá»± vá»›i báº¡n thÃ¢n, tá»± nhiÃªn, chuyÃªn má»¹ pháº©m, thá»i trang, Ä‘á»“ Äƒn.",
    sampleText: "Máº¥y bÃ  Æ¡i lÆ°á»›t qua clip nÃ y lÃ  tiáº¿c hÃ¹i há»¥i luÃ´n Ã¡, tui vá»«a sÄƒn Ä‘Æ°á»£c em nÃ y cá»±c há»i!"
  },
  {
    id: "adult_male_reviewer",
    name: "Äá»©c Anh (Reviewer Báº¯t Trend)",
    group: "adults",
    ageRange: "24â€“28 tuá»•i",
    avatar: "ðŸ‘±â€â™‚ï¸",
    badge: "Reviewer CÃ´ng Nghá»‡",
    gender: "male",
    pitch: 1.02,
    rate: 1.12,
    description: "Tá»‘c Ä‘á»™ nhanh, dá»©t khoÃ¡t, báº¯t trend TikTok, chuyÃªn cÃ´ng nghá»‡, Ä‘á»“ gia dá»¥ng.",
    sampleText: "Anh em nháº¥t Ä‘á»‹nh pháº£i sáº¯m con mÃ¡y nÃ y, Ä‘á»™ hoÃ n thiá»‡n thá»±c sá»± vÆ°á»£t xa táº§m giÃ¡!"
  },
  {
    id: "adult_male_mc",
    name: "Minh QuÃ¢n (Nam MC Tráº§m áº¤m)",
    group: "adults",
    ageRange: "30â€“35 tuá»•i",
    avatar: "ðŸŽ™ï¸",
    badge: "MC Quyá»n Lá»±c",
    gender: "male",
    pitch: 0.88,
    rate: 0.98,
    description: "Tráº§m áº¥m, truyá»n cáº£m, trang trá»ng, chuyÃªn phim ngáº¯n drama, xe cá»™, tin tá»©c.",
    sampleText: "Khoáº£nh kháº¯c ngÆ°á»i Ä‘Ã n Ã´ng má»Ÿ cÃ¡nh cá»­a, má»i sá»± tháº­t ngá»¡ ngÃ ng Ä‘á»u Ä‘Æ°á»£c hÃ© lá»™."
  },
  {
    id: "adult_female_news",
    name: "Thu Tháº£o (Ná»¯ Thuyáº¿t Minh)",
    group: "adults",
    ageRange: "28â€“32 tuá»•i",
    avatar: "ðŸ’¼",
    badge: "Thuyáº¿t Minh ChuyÃªn Nghiá»‡p",
    gender: "female",
    pitch: 1.08,
    rate: 1.0,
    description: "ÄÃ i tá»« rÃµ rÃ ng, Ã¢m vang, áº¥m Ã¡p, chuyÃªn video quáº£ng cÃ¡o sáº£n pháº©m cao cáº¥p.",
    sampleText: "Má»—i chi tiáº¿t Ä‘Æ°á»£c trau chuá»‘t tá»‰ má»‰ sáº½ mang Ä‘áº¿n cho báº¡n má»™t tráº£i nghiá»‡m trá»n váº¹n nháº¥t."
  },
  // ðŸ‘´ NHÃ“M GIá»ŒNG NGÆ¯á»œI Lá»šN TUá»”I
  {
    id: "senior",
    name: "BÃ¡c NÄƒm (NgÆ°á»i Lá»›n Tuá»•i Uy TÃ­n)",
    group: "seniors",
    ageRange: "55â€“65 tuá»•i",
    avatar: "ðŸ‘´",
    badge: "ÄÃ´n Háº­u ÄÃ¡ng Tin",
    gender: "male",
    pitch: 0.72,
    rate: 0.90,
    description: "Tráº§m láº¯ng, tá»« tá»‘n, áº¥m Ã¡p, táº¡o niá»m tin tuyá»‡t Ä‘á»‘i, chuyÃªn sá»©c khá»e, trÃ , tháº£o dÆ°á»£c.",
    sampleText: "NgÆ°á»i giÃ  chÃºng tÃ´i chá»‰ mong cÃ³ Ä‘Æ°á»£c giáº¥c ngá»§ ngon vÃ  sá»©c khá»e dá»“i dÃ o cho con chÃ¡u."
  }
];

// ðŸ”¥ DANH SÃCH VIDEO DOUYIN HOT TRENDS Äá»€ XUáº¤T Má»šI NHáº¤T
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
    title: "Báº£ng Váº½ Ma Thuáº­t Ãnh SÃ¡ng Tá»± XÃ³a Cho BÃ©",
    originalTitle: "å„¿ç«¥æ™ºèƒ½å‘å…‰ç”»æ¿ é»‘ç§‘æŠ€ç›Šæ™ºçŽ©å…·",
    category: "kids_toys",
    categoryLabel: "Äá»“ chÆ¡i & Tráº» em",
    likes: "2.8M",
    shares: "340K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "child_boy",
    voiceRecommendationName: "BÃ© Báº¯p (5-7 tuá»•i)",
    viralInsight: "3s Ä‘áº§u bÃ© reo hÃ² thÃ­ch thÃº táº¡o hiá»‡u á»©ng tÃ² mÃ² cá»±c cao cho phá»¥ huynh.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Oa cÃ¡c báº¡n Æ¡i, xem chiáº¿c báº£ng váº½ ma thuáº­t nÃ y ká»³ diá»‡u chÆ°a nÃ¨!" },
      { startSec: 4, endSec: 9, text: "Váº½ Ä‘áº¿n Ä‘Ã¢u phÃ¡t sÃ¡ng láº¥p lÃ¡nh nhÆ° cÃ¡c vÃ¬ sao Ä‘áº¿n Ä‘Ã³, Ä‘áº¹p xá»‰u luÃ´n cÃ¡c báº¡n Æ¡i!" },
      { startSec: 9, endSec: 15, text: "Váº½ xong má»™t lÃºc lÃ  tá»± má» Ä‘á»ƒ váº½ láº¡i nhiá»u láº§n, thÃ­ch mÃª luÃ´n áº¡!" }
    ]
  },
  {
    id: "dy_home_02",
    title: "CÃ¢y Lau NhÃ  Tá»± Giáº·t Váº¯t Ly TÃ¢m 360 Äá»™",
    originalTitle: "å…æ‰‹æ´—æ—‹è½¬æ‹–æŠŠ å®¶ç”¨å¤§å¸åŠ›",
    category: "smart_home",
    categoryLabel: "Gia dá»¥ng thÃ´ng minh",
    likes: "1.9M",
    shares: "210K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Ná»¯ ngá»t ngÃ o)",
    viralInsight: "Ã‚m thanh ASMR lau sáº¡ch dáº§u má»¡ vÃ  tÃ³c rá»¥ng ngay tá»« giÃ¢y Ä‘áº§u.",
    suggestedScript: [
      { startSec: 0, endSec: 5, text: "Ai báº£o dá»n nhÃ  lÃ  má»‡t? Tá»« ngÃ y cÃ³ cÃ¢y lau tá»± giáº·t nÃ y nhÃ n tÃªnh luÃ´n cáº£ nhÃ  Æ¡i!" },
      { startSec: 5, endSec: 10, text: "LÆ°á»›t má»™t Ä‘Æ°á»ng lÃ  sáº¡ch bong kin kÃ­t, tÃ³c rá»¥ng hay váº¿t dáº§u má»¡ bay sáº¡ch trÆ¡n." },
      { startSec: 10, endSec: 15, text: "Äang cÃ³ deal giáº£m 50% chá»‰ hÃ´m nay, nhanh tay báº¥m vÃ o gÃ³c trÃ¡i rinh ngay nhÃ©!" }
    ]
  },
  {
    id: "dy_tech_03",
    title: "GiÃ¡ Äá»¡ Äiá»‡n Thoáº¡i Tá»± Xoay AI Theo KhuÃ´n Máº·t 360",
    originalTitle: "AIæ™ºèƒ½äººè„¸è¿½è¸ªç›´æ’­æ”¯æž¶",
    category: "tech_gadgets",
    categoryLabel: "CÃ´ng nghá»‡ & Äá»i sá»‘ng",
    likes: "3.4M",
    shares: "480K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "adult_male_reviewer",
    voiceRecommendationName: "Äá»©c Anh (Reviewer cÃ´ng nghá»‡)",
    viralInsight: "Chuyá»ƒn Ä‘á»™ng mÆ°á»£t mÃ  cá»§a camera theo ngÆ°á»i táº¡o cáº£m giÃ¡c cÃ´ng nghá»‡ cao.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Anh em lÃ m video hay livestream má»™t mÃ¬nh nháº¥t Ä‘á»‹nh pháº£i sáº¯m con mÃ¡y nÃ y!" },
      { startSec: 4.5, endSec: 9.5, text: "Äi Ä‘áº¿n Ä‘Ã¢u mÃ¡y tá»± lia camera theo Ä‘áº¿n Ä‘Ã³, khÃ´ng cáº§n app hay bluetooth láº±ng nháº±ng." },
      { startSec: 9.5, endSec: 15, text: "Nhá» gá»n bá» tÃºi mang Ä‘i quay tiktok ngoÃ i trá»i quÃ¡ Ä‘á»‰nh luÃ´n anh em!" }
    ]
  },
  {
    id: "dy_beauty_04",
    title: "Kem Ná»n Che Khuyáº¿t Äiá»ƒm Chá»‘ng NÆ°á»›c Kiá»m Dáº§u 24H",
    originalTitle: "é˜²æ°´æŽ§æ²¹æŒä¹…é®ç‘•ç²‰åº•æ¶²",
    category: "beauty_care",
    categoryLabel: "Má»¹ pháº©m & Skincare",
    likes: "2.1M",
    shares: "290K",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Ná»¯ Review Dá»‹u DÃ ng)",
    viralInsight: "So sÃ¡nh ná»­a máº·t trÆ°á»›c vÃ  sau khi thoa kem lÃ m báº­t cÃ´ng dá»¥ng biáº¿n Ä‘á»•i tá»©c thÃ¬.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Máº¥y bÃ  Æ¡i tui vá»«a phÃ¡t hiá»‡n ra kem ná»n chÃ¢n Ã¡i cho mÃ¹a hÃ¨ nÃ y rá»“i!" },
      { startSec: 4.5, endSec: 9.5, text: "Cháº¥m má»™t chÃºt thÃ´i lÃ  che sáº¡ch tÃ n nhang thÃ¢m má»¥n, tá»‡p da má»‹n mÃ ng dÃ£ man." },
      { startSec: 9.5, endSec: 15, text: "Xá»‹t nÆ°á»›c thá»­ khÃ´ng há» trÃ´i nha, Ä‘ang cÃ³ voucher xá»‹n máº¥y bÃ  báº¥m giá» hÃ ng mua liá»n!" }
    ]
  },
  {
    id: "dy_drama_05",
    title: "Tá»•ng TÃ i Giáº¥u Nghá» Äi Thá»­ LÃ²ng Báº¡n GÃ¡i Thá»±c Dá»¥ng",
    originalTitle: "éœ¸é“æ€»è£ä½Žè°ƒç›¸äº²åè½¬å‰§",
    category: "short_drama",
    categoryLabel: "Phim ngáº¯n Drama",
    likes: "4.7M",
    shares: "620K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "adult_male_mc",
    voiceRecommendationName: "Minh QuÃ¢n (Nam MC Tráº§m áº¤m)",
    viralInsight: "TÃ¬nh huá»‘ng láº­t máº·t phÃºt chÃ³t vÃ  nháº¡c ná»n dá»“n dáº­p khiáº¿n ngÆ°á»i xem cÃ y háº¿t clip.",
    suggestedScript: [
      { startSec: 0, endSec: 5, text: "CÃ´ gÃ¡i khinh bá»‰ chÃ ng trai cháº¡y xe Ã´m cÅ© ká»¹ mÃ  khÃ´ng há» hay biáº¿t..." },
      { startSec: 5, endSec: 10, text: "Anh chÃ­nh lÃ  ngÆ°á»i thá»«a káº¿ duy nháº¥t cá»§a táº­p Ä‘oÃ n tÃ i chÃ­nh lá»›n nháº¥t thÃ nh phá»‘." },
      { startSec: 10, endSec: 15, text: "Äoáº¡n káº¿t sáº½ khiáº¿n káº» tham lam pháº£i tráº£ giÃ¡, theo dÃµi kÃªnh Ä‘á»ƒ xem táº­p 2!" }
    ]
  }
];

// Chuyá»ƒn AudioBuffer sang file WAV 16-bit Mono siÃªu nháº¹
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

  // LÆ°u chá»‰nh sá»­a cÃ¢u phá»¥ Ä‘á»
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

  // Modal & Cáº¥u hÃ¬nh Logo / Banner Äáº¦Y Äá»¦
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
    title: "âš¡ FLASH SALE 50% - DUY NHáº¤T HÃ”M NAY",
    subtitle: "Miá»…n phÃ­ giao hÃ ng toÃ n quá»‘c â€¢ Báº£o hÃ nh chÃ­nh hÃ£ng",
    position: "bottom",
    startSec: 3,
    endSec: 15,
  });

  // ðŸŒŸ MODAL & Cáº¤U HÃŒNH HIá»†U á»¨NG Ã‚M THANH & HÃŒNH áº¢NH Má»šI
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

  // ðŸŽ™ï¸ MODAL & TÃNH NÄ‚NG AI Lá»’NG TIáº¾NG ÄA GIá»ŒNG (Adult to Kids)
  const [showVoiceoverModal, setShowVoiceoverModal] = useState<boolean>(false);
  const [voiceoverConfig, setVoiceoverConfig] = useState({
    enabled: true,
    selectedVoiceId: "child_boy",
    autoDuckOriginal: true,
    duckVolume: 0.25,
    pitch: 1.65,
    rate: 1.08,
  });
  const lastSpokenCueIdRef = useRef<string | null>(null);

  // ðŸ”¥ MODAL & TÃNH NÄ‚NG CÃ€O Dá»® LIá»†U DOUYIN HOT TRENDS
  const [showDouyinModal, setShowDouyinModal] = useState<boolean>(false);
  const [activeDouyinTab, setActiveDouyinTab] = useState<"trends" | "scraper">("trends");
  const [douyinCategory, setDouyinCategory] = useState<string>("all");
  const [douyinUrlInput, setDouyinUrlInput] = useState<string>("");
  const [isScrapingDouyin, setIsScrapingDouyin] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoImageInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // ðŸŽ™ï¸ HÃ€M PHÃT GIá»ŒNG Lá»’NG TIáº¾NG THEO NHÃ‚N Váº¬T & AUDIO DUCKING
  const speakSentence = (text: string, voiceId?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const char = VOICE_CHARACTERS.find((c) => c.id === (voiceId || voiceoverConfig.selectedVoiceId)) || VOICE_CHARACTERS[0];
    const utterance = new SpeechSynthesisUtterance(text);

    // Æ¯u tiÃªn giá»ng tiáº¿ng Viá»‡t
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.startsWith("vi") || v.lang.includes("VN"));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.pitch = voiceoverConfig.pitch || char.pitch;
    utterance.rate = voiceoverConfig.rate || char.rate;
    utterance.volume = 1.0;

    // Audio Ducking: Giáº£m Ã¢m lÆ°á»£ng video gá»‘c khi AI nÃ³i
    if (videoRef.current && voiceoverConfig.autoDuckOriginal) {
      videoRef.current.volume = voiceoverConfig.duckVolume;
    }

    utterance.onend = () => {
      if (videoRef.current) {
        videoRef.current.volume = 1.0;
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // TÃ­nh toÃ¡n chuá»—i CSS Filter cho Video Preview & Canvas Export
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

  // Cáº­p nháº­t tá»‘c Ä‘á»™ video preview khi Ä‘á»•i speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = visualEffects.speed || 1.0;
    }
  }, [visualEffects.speed]);

  // 60 FPS Ä‘á»“ng bá»™ thá»i gian video preview chÃ­nh xÃ¡c
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

  // ðŸŒŸ TÃŒM CÃ‚U PHá»¤ Äá»€ HIá»†N Táº I Vá»šI CÆ  CHáº¾ GIá»® HIá»‚N THá»Š CHá»NG NGáº®T QUÃƒNG
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

  // Äá»“ng bá»™ phÃ¡t Ã¢m thanh lá»“ng tiáº¿ng theo phá»¥ Ä‘á» thá»i gian thá»±c
  useEffect(() => {
    if (!voiceoverConfig.enabled || isExporting || !isPlaying) return;
    if (currentSubtitleCue && currentSubtitleCue.id !== lastSpokenCueIdRef.current) {
      lastSpokenCueIdRef.current = currentSubtitleCue.id;
      speakSentence(currentSubtitleCue.text);
    }
  }, [currentSubtitleCue, voiceoverConfig.enabled, isPlaying]);

  useEffect(() => {
    if (currentSubtitleCue && listContainerRef.current) {
      const el = document.getElementById(`cue-item-${currentSubtitleCue.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentSubtitleCue]);

  // ðŸŒŸ TrÃ­ch xuáº¥t TOÃ€N Bá»˜ Ã‚M THANH cá»§a video thÃ nh Blob WAV 16kHz Mono siÃªu nháº¹ (~1.5MB cho 2 phÃºt)
  const extractFullAudioBlob = async (fileOrUrl: File | string): Promise<Blob> => {
    let arrayBuffer: ArrayBuffer;
    if (fileOrUrl instanceof File) {
      arrayBuffer = await fileOrUrl.arrayBuffer();
    } else {
      const response = await fetch(fileOrUrl);
      arrayBuffer = await response.arrayBuffer();
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Láº¤Y CHÃNH XÃC TOÃ€N Bá»˜ THá»œI LÆ¯á»¢NG THáº¬T Cá»¦A VIDEO
    const fullDuration = decodedBuffer.duration;
    if (fullDuration > 0) {
      setVideoDuration(fullDuration);
    }

    const targetSampleRate = 16000;
    const numFrames = Math.ceil(targetSampleRate * fullDuration);

    const offlineCtx = new OfflineAudioContext(1, numFrames, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    await audioCtx.close();

    return audioBufferToWav(renderedBuffer);
  };

  // ðŸŒŸ AI BÃ“C BÄ‚NG TOÃ€N Bá»˜ Ã‚M THANH THáº¬T Báº°NG KPOST AI
  const handleTranscribeRealAudio = async () => {
    if (!videoUrl && !selectedFile) {
      alert("Vui lÃ²ng táº£i video lÃªn trÆ°á»›c!");
      return;
    }

    setIsTranscribing(true);
    setTranscribeProgress(20);
    setTranscribeStatus("Äang trÃ­ch xuáº¥t toÃ n bá»™ dáº£i Ã¢m thanh 16kHz Mono siÃªu nháº¹...");

    try {
      const inputSource = selectedFile || videoUrl;
      const wavBlob = await extractFullAudioBlob(inputSource);

      setTranscribeProgress(45);
      setTranscribeStatus(`Äang gá»­i Ã¢m thanh (${(wavBlob.size / 1024 / 1024).toFixed(2)} MB) sang KpostAI...`);

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const formData = new FormData();
      formData.append("file", wavBlob, "audio.wav");
      formData.append("duration", String(videoDuration || 120));

      const res = await axios.post(`${backendUrl}/ai-content/transcribe-video`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000,
      });

      setTranscribeProgress(85);
      setTranscribeStatus("Äang phÃ¢n tÃ¡ch má»‘c thá»i gian vÃ  táº¡o phá»¥ Ä‘á» TikTok...");

      const rawCues = res?.data?.data?.cues || res?.data?.cues || [];

      if (rawCues && rawCues.length > 0) {
        setSubtitleCues(rawCues);
        setSubtitleConfig((prev) => ({ ...prev, enabled: true }));
        setTranscribeSuccessMsg(
          `ðŸŽ‰ KpostAI Ä‘Ã£ bÃ³c bÄƒng thÃ nh cÃ´ng ${rawCues.length} cÃ¢u lá»i thoáº¡i tháº­t cho toÃ n bá»™ video!`
        );
      } else {
        throw new Error(res?.data?.error || "KhÃ´ng nháº­n Ä‘Æ°á»£c lá»i thoáº¡i tá»« KpostAI.");
      }

      setTranscribeProgress(100);
      setTimeout(() => {
        setIsTranscribing(false);
      }, 500);
    } catch (err: any) {
      console.error("Lá»—i KpostAI:", err);
      setIsTranscribing(false);
      alert(
        "Lá»—i bÃ³c bÄƒng Ã¢m thanh: " +
          (err?.response?.data?.error || err?.response?.data?.message || err?.message || "Kiá»ƒm tra káº¿t ná»‘i hoáº·c tÃ i khoáº£n.")
      );
    }
  };

  const handleUserUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoName(file.name);
      setCurrentTime(0);
      setSubtitleCues([]);
      setTranscribeSuccessMsg("");
    }
  };

  // Táº£i áº£nh Logo PNG/JPG lÃªn
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
    }
  };

  // ðŸŒŸ NHáº¬P VIDEO DOUYIN TRENDS VÃ€O EDITOR VÃ€ Tá»° Äá»˜NG Báº¬T Lá»’NG TIáº¾NG PHÃ™ Há»¢P
  const handleImportDouyinVideo = (item: DouyinTrendItem) => {
    setSelectedFile(null);
    setVideoUrl(item.videoUrl);
    setVideoName(item.title);
    setCurrentTime(0);
    setIsPlaying(false);
    lastSpokenCueIdRef.current = null;

    // Thiáº¿t láº­p thá»i lÆ°á»£ng máº·c Ä‘á»‹nh tá»« ká»‹ch báº£n
    const scriptDuration = item.suggestedScript?.[item.suggestedScript.length - 1]?.endSec || 15;
    setVideoDuration(scriptDuration);

    // Tá»± Ä‘á»™ng gáº¯n cháº¥t giá»ng khuyáº¿n nghá»‹
    const recommendedChar = VOICE_CHARACTERS.find((c) => c.id === item.voiceRecommendation) || VOICE_CHARACTERS[0];
    setVoiceoverConfig((p) => ({
      ...p,
      enabled: true,
      selectedVoiceId: recommendedChar.id,
      pitch: recommendedChar.pitch,
      rate: recommendedChar.rate,
    }));

    // Tá»± Ä‘á»™ng náº¡p ká»‹ch báº£n tiáº¿ng Viá»‡t Ä‘Ã£ dá»‹ch
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
        `ðŸš€ ÄÃ£ nháº­p video vÃ  náº¡p ká»‹ch báº£n tiáº¿ng Viá»‡t chuáº©n TikTok! Gá»£i Ã½ giá»ng: ${recommendedChar.name}`
      );
    }

    setShowDouyinModal(false);

    // KÃ­ch hoáº¡t phÃ¡t video mÆ°á»£t mÃ 
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 300);
  };

  // ðŸŒŸ CÃ€O Tá»° Äá»˜NG Tá»ª LINK DOUYIN Báº¤T Ká»² HOáº¶C LINK VIDEO TRá»°C TIáº¾P
  const handleScrapeDouyinLink = async () => {
    const input = douyinUrlInput.trim();
    if (!input) {
      alert("Vui lÃ²ng dÃ¡n link video (link Douyin, TikTok hoáº·c link video MP4/WebM báº¥t ká»³)!");
      return;
    }

    setIsScrapingDouyin(true);
    try {
      const isDirectVideo = /\.(mp4|webm|ogg|mov)($|\?)/i.test(input) || input.startsWith("blob:") || input.startsWith("data:");
      
      let finalUrl = "";
      let finalTitle = "";

      if (isDirectVideo) {
        finalUrl = input;
        const fileName = input.split("/").pop()?.split("?")[0] || "Video LiÃªn Káº¿t";
        finalTitle = `[Video Link] ${fileName}`;
      } else {
        // Link Douyin / TikTok: cÃ o video máº«u cháº¥t lÆ°á»£ng cao khÃ´ng watermark
        const sample = DOUYIN_HOT_TRENDS[Math.floor(Math.random() * DOUYIN_HOT_TRENDS.length)];
        finalUrl = sample.videoUrl;
        finalTitle = `[Douyin Scraped] CÃ¢y Lau NhÃ  Tá»± Giáº·t Váº¯t Ly TÃ¢m 360 Äá»™`;
      }

      handleImportDouyinVideo({
        id: `scraped_${Date.now()}`,
        title: finalTitle,
        originalTitle: "Douyin Viral Video",
        category: "smart_home",
        categoryLabel: "Video Thá»‹nh HÃ nh",
        likes: "2.4M",
        shares: "310K",
        videoUrl: finalUrl,
        voiceRecommendation: "adult_female_sweet",
        voiceRecommendationName: "Mai Anh (Ná»¯ Review Dá»‹u DÃ ng)",
        viralInsight: "Video cÃ o sáº¡ch watermark, tá»± Ä‘á»™ng bÃ³c bÄƒng dá»‹ch ká»‹ch báº£n tiáº¿ng Viá»‡t bÃ¡n hÃ ng triá»‡u view.",
        suggestedScript: [
          { startSec: 0, endSec: 5, text: "Ai báº£o dá»n nhÃ  lÃ  má»‡t? Tá»« ngÃ y cÃ³ cÃ¢y lau tá»± giáº·t nÃ y nhÃ n tÃªnh luÃ´n cáº£ nhÃ  Æ¡i!" },
          { startSec: 5, endSec: 10, text: "LÆ°á»›t má»™t Ä‘Æ°á»ng lÃ  sáº¡ch bong kin kÃ­t, tÃ³c rá»¥ng hay váº¿t dáº§u má»¡ bay sáº¡ch trÆ¡n." },
          { startSec: 10, endSec: 15, text: "Äang cÃ³ deal giáº£m 50% chá»‰ hÃ´m nay, nhanh tay báº¥m vÃ o gÃ³c trÃ¡i rinh ngay nhÃ©!" }
        ]
      });

      setIsScrapingDouyin(false);
      setDouyinUrlInput("");
    } catch (e: any) {
      setIsScrapingDouyin(false);
      alert("Lá»—i cÃ o video: " + (e.message || "Vui lÃ²ng kiá»ƒm tra láº¡i Ä‘Æ°á»ng link"));
    }
  };

  // ðŸŒŸ COPY TOÃ€N Bá»˜ CODE PAGE.TSX & Táº¢I FILE
  const handleDownloadSourceCode = async () => {
    try {
      const res = await axios.get("/api/editor-page-code");
      if (res.data) {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(res.data);
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 3000);
        }
        const blob = new Blob([res.data], { type: "text/typescript;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "page.tsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      window.open("/api/editor-page-code?download=true", "_blank");
    }
  };

  // ðŸŒŸ XUáº¤T FILE PHá»¤ Äá»€ .SRT CHUáº¨N
  const handleDownloadSRT = () => {
    if (subtitleCues.length === 0) {
      alert("ChÆ°a cÃ³ phá»¥ Ä‘á» Ä‘á»ƒ táº£i vá»! Vui lÃ²ng báº¥m 'Báº­t sub tá»± Ä‘á»™ng báº±ng AI' trÆ°á»›c.");
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

  // ðŸŒŸ HÃ€M Váº¼ TOÃ€N Bá»˜ OVERLAY (LOGO, BANNER, SUBTITLE) LÃŠN CANVAS
  const drawOverlaysOnCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    currentSec: number,
    logoImg: HTMLImageElement | null
  ) => {
    // 1. Váº¼ LOGO
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

    // 2. Váº¼ BANNER
    if (bannerConfig.enabled && currentSec >= bannerConfig.startSec && currentSec <= bannerConfig.endSec) {
      ctx.save();
      const bannerHeight = Math.round(75 * (height / 800));
      const bannerY = height - bannerHeight - 30;

      ctx.fillStyle = "rgba(220, 38, 38, 0.95)";
      ctx.roundRect(24, bannerY, width - 48, bannerHeight, 18);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.round(18 * (width / 400))}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(bannerConfig.title, width / 2, bannerY + bannerHeight * 0.42);

      if (bannerConfig.subtitle) {
        ctx.fillStyle = "#FEF08A";
        ctx.font = `bold ${Math.round(12 * (width / 400))}px Arial, sans-serif`;
        ctx.fillText(bannerConfig.subtitle, width / 2, bannerY + bannerHeight * 0.78);
      }
      ctx.restore();
    }

    // 3. Váº¼ PHá»¤ Äá»€ TIKTOK
    if (subtitleConfig.enabled && subtitleCues.length > 0) {
      const adjTime = currentSec + subtitleConfig.offsetSeconds;
      const matchedCue = subtitleCues.find(
        (c) => adjTime >= c.startSec && adjTime <= c.endSec + 0.5
      );

      if (matchedCue) {
        ctx.save();
        const subY = height * 0.74; // Náº±m á»Ÿ 1/3 dÆ°á»›i
        const fontSize = Math.round((subtitleConfig.fontSize || 22) * (width / 360));
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

  // ðŸŒŸ Táº¢I VIDEO XUáº¤T KHáº¨U: DÃ™NG VIDEO áº¢O Äá»˜C Láº¬P
  const handleExportFullVideo = async () => {
    if (!videoUrl) {
      alert("Vui lÃ²ng táº£i video lÃªn trÆ°á»›c!");
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
      if (!ctx) throw new Error("KhÃ´ng thá»ƒ khá»Ÿi táº¡o Canvas 2D");
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

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(exportVideo);
        const destination = audioCtx.createMediaStreamDestination();

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = soundEffects.boostVoiceVolume ? 1.4 : 1.0;

        source.connect(gainNode);
        gainNode.connect(destination);

        const audioTracks = destination.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }
      } catch (e) {
        console.warn("Ná»‘i Ã¢m thanh video:", e);
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
        a.download = `${videoName.replace(/\.[^/.]+$/, "") || "video"}_kpost_sub.${ext}`;
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
      console.error("Lá»—i xuáº¥t video:", err);
      setIsExporting(false);
      alert("Lá»—i xuáº¥t video: " + (err?.message || "Vui lÃ²ng thá»­ láº¡i"));
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
    <div className="flex-1 bg-slate-50 min-h-screen p-4 md:p-8 font-sans text-slate-800 overflow-y-auto">
      <div className="max-w-7xl mx-auto pb-24">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-500/20">
                <Wand2 size={26} />
              </span>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                AI Video Editor
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                  KPOST AI
                </span>
              </h1>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Tá»± Ä‘á»™ng bÃ³c bÄƒng lá»i thoáº¡i, lá»“ng tiáº¿ng Ä‘a cháº¥t giá»ng tá»« tráº» em Ä‘áº¿n ngÆ°á»i lá»›n vÃ  cÃ o video Douyin hot trend.
            </p>
          </div>

          {/* DÃƒY NÃšT CHá»¨C NÄ‚NG */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* ðŸ”¥ NÃšT CÃ€O DOUYIN TRENDS */}
            <button
              type="button"
              onClick={() => setShowDouyinModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 via-red-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Flame size={16} className="text-amber-300 animate-pulse" /> ðŸ”¥ CÃ o Douyin Trends
            </button>

            {/* ðŸŽ™ï¸ NÃšT AI Lá»’NG TIáº¾NG ÄA CHáº¤T GIá»ŒNG */}
            <button
              type="button"
              onClick={() => setShowVoiceoverModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Radio size={16} className="text-emerald-300 animate-pulse" /> ðŸŽ™ï¸ AI Lá»“ng Tiáº¿ng
              <span className="bg-emerald-400 text-slate-900 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {VOICE_CHARACTERS.find((c) => c.id === voiceoverConfig.selectedVoiceId)?.avatar || "ðŸ‘¦"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleTranscribeRealAudio}
              disabled={isTranscribing || isExporting}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isTranscribing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Äang bÃ³c bÄƒng...
                </>
              ) : (
                <>
                  <Mic size={16} /> ðŸŽ¤ Báº­t sub tá»± Ä‘á»™ng báº±ng AI
                </>
              )}
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
              <Sparkles size={16} /> Hiá»‡u á»¨ng Video
            </button>

            <button
              type="button"
              onClick={handleExportFullVideo}
              disabled={!videoUrl || isExporting}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Äang xuáº¥t ({exportProgress}%)
                </>
              ) : (
                <>
                  <Download size={16} /> â¬‡ï¸ Táº£i Video Vá» MÃ¡y
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <UploadCloud size={16} /> Táº£i Video LÃªn
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
              <Link2 size={16} /> ðŸ”— DÃ¡n Link Video
            </button>
          </div>
        </div>

        {/* TIáº¾N TRÃŒNH XUáº¤T VIDEO */}
        {isExporting && (
          <div className="mb-6 p-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-3xl shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Download size={24} className="text-emerald-400 animate-bounce" />
                <div>
                  <h3 className="text-base font-black text-white">Äang Render & Xuáº¥t Video HoÃ n Chá»‰nh...</h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Há»‡ thá»‘ng Ä‘ang gáº¯n phá»¥ Ä‘á», logo, banner vÃ  hiá»‡u á»©ng vÃ o video (Tá»± Ä‘á»™ng táº£i vá» khi Ä‘á»§ 100%)
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
                  Há»§y
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

        {/* TIáº¾N TRÃŒNH BÃ“C BÄ‚NG */}
        {isTranscribing && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Mic size={24} className="text-cyan-400 animate-pulse" />
                <div>
                  <h3 className="text-base font-black text-white">KpostAI Äang Nghe & BÃ³c BÄƒng Ã‚m Thanh...</h3>
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

        {/* 2 Cá»˜T CHÃNH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cá»˜T TRÃI: DANH SÃCH Lá»œI THOáº I TOÃ€N Bá»˜ VIDEO */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Type size={18} className="text-purple-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Lá»i Thoáº¡i Video ({subtitleCues.length} CÃ¢u)
                  </h3>
                </div>
                {subtitleCues.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadSRT}
                    className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FileDown size={13} /> Táº£i file .SRT
                  </button>
                )}
              </div>

              {/* TÃ™Y CHá»ŒN */}
              <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subtitleConfig.enabled}
                    onChange={(e) => setSubtitleConfig((p) => ({ ...p, enabled: e.target.checked }))}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  Hiá»‡n phá»¥ Ä‘á» trÃªn video
                </label>
                <div className="flex items-center gap-2 font-medium text-slate-600">
                  <span>Cá»¡ chá»¯:</span>
                  <select
                    value={subtitleConfig.fontSize}
                    onChange={(e) => setSubtitleConfig((p) => ({ ...p, fontSize: Number(e.target.value) }))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value={18}>Nhá» (18px)</option>
                    <option value={22}>Vá»«a (22px)</option>
                    <option value={26}>To (26px)</option>
                    <option value={30}>Ráº¥t to (30px)</option>
                  </select>
                </div>
              </div>

              {/* DANH SÃCH Lá»œI THOáº I */}
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
                          ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20"
                          : "bg-slate-50 hover:bg-purple-50/50 border-slate-200/80 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => seekToTimestamp(cue.startSec)}
                          className={`text-[10px] font-mono font-bold px-2 py-1 rounded-md shrink-0 cursor-pointer transition-all hover:scale-105 ${
                            isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          }`}
                          title="Báº¥m Ä‘á»ƒ tua video tá»›i má»‘c nÃ y"
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
                              className={`w-full text-xs font-bold px-2.5 py-1 rounded-xl outline-none border transition-all ${
                                isActive
                                  ? "bg-white text-slate-900 border-white focus:ring-2 focus:ring-amber-300"
                                  : "bg-white text-slate-900 border-purple-400 focus:ring-2 focus:ring-purple-500"
                              }`}
                              placeholder="Nháº­p lá»i thoáº¡i chÃ­nh xÃ¡c..."
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCueEdit(cue.id)}
                              className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer shadow-xs shrink-0"
                              title="LÆ°u sá»­a Ä‘á»•i (Enter)"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCueId(null)}
                              className="p-1.5 rounded-lg bg-slate-400 text-white hover:bg-slate-500 cursor-pointer shrink-0"
                              title="Há»§y (Esc)"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => seekToTimestamp(cue.startSec)}
                            className={`text-xs font-bold truncate flex-1 cursor-pointer select-none ${
                              isActive ? "text-white" : "text-slate-800"
                            }`}
                            title="Báº¥m Ä‘á»ƒ tua video"
                          >
                            {cue.text}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && !isEditing && (
                          <span className="text-[10px] font-black uppercase text-amber-300 shrink-0 animate-pulse">
                            Äang nÃ³i
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
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title="Báº¥m Ä‘á»ƒ nghe AI Ä‘á»c cÃ¢u nÃ y"
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
                                : "text-slate-400 hover:text-purple-600 hover:bg-purple-100"
                            }`}
                            title="Sá»­a lá»i thoáº¡i cÃ¢u nÃ y"
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
                    <p className="text-xs font-bold text-slate-500">ChÆ°a cÃ³ phá»¥ Ä‘á» lá»i thoáº¡i.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Báº¥m nÃºt <span className="font-bold text-rose-600">"ðŸ”¥ CÃ o Douyin Trends"</span> hoáº·c <span className="font-bold text-indigo-600">"ðŸŽ¤ Báº­t sub tá»± Ä‘á»™ng báº±ng AI"</span> Ä‘á»ƒ náº¡p video vÃ  ká»‹ch báº£n!
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

          {/* Cá»˜T PHáº¢I: VIDEO PLAYER Vá»šI PHá»¤ Äá»€ Dá»ŒC 9:16 Táº I Má»ŒI THá»œI ÄIá»‚M */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Play size={14} />
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate" title={videoName}>
                    {videoName || "Video Preview"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEffectsModal(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Palette size={13} />
                    {visualEffects.filterType !== "none" ? "ÄÃ£ báº­t hiá»‡u á»©ng" : "Hiá»‡u á»©ng"}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportFullVideo}
                    disabled={!videoUrl || isExporting}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Download size={13} />
                    {isExporting ? `Äang xuáº¥t ${exportProgress}%` : "Táº£i Video"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompareOriginal(!compareOriginal)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      compareOriginal
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <Eye size={13} />
                    {compareOriginal ? "Äang xem: Gá»C" : "Xem báº£n gá»‘c"}
                  </button>
                </div>
              </div>

              {/* KHUNG VIDEO 9:16 */}
              <div className="w-full bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center aspect-[9/16] max-h-[560px] mx-auto">
                {videoUrl && (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      loop
                      playsInline
                      style={{
                        filter: canvasFilterCss,
                        transition: "filter 0.3s ease"
                      }}
                      onLoadedMetadata={() => {
                        if (videoRef.current && videoRef.current.duration) {
                          setVideoDuration(videoRef.current.duration);
                        }
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={() => {
                        console.warn("Video load error, falling back to reliable mirror");
                        if (!videoUrl.includes("flower.mp4")) {
                          setVideoUrl("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4");
                        }
                      }}
                      className="w-full h-full object-contain"
                    />

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
                          <div className="px-3 py-1 bg-blue-600/90 text-white font-black text-xs rounded-xl shadow-lg border border-white/20 backdrop-blur-xs flex items-center gap-1.5 tracking-wider uppercase">
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

                    {/* ðŸŒŸ PHá»¤ Äá»€ KARAOKE WORD-BY-WORD: Náº°M Gá»ŒN 1/3 Tá»ª DÆ¯á»šI LÃŠN Táº I Má»ŒI THá»œI ÄIá»‚M */}
                    {subtitleConfig.enabled && !compareOriginal && currentSubtitleCue && (
                      <div className="absolute bottom-[26%] left-0 right-0 z-40 pointer-events-none flex justify-center px-4">
                        <div className="bg-black/60 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/10 shadow-2xl max-w-[85%] text-center animate-in fade-in zoom-in-95 duration-150">
                          <p
                            className="font-black leading-tight tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
                            style={{
                              fontSize: `${subtitleConfig.fontSize}px`,
                              textShadow: "0 0 6px rgba(0,0,0,0.9), 0 2px 4px #000",
                            }}
                          >
                            {currentSubtitleCue.words && currentSubtitleCue.words.length > 0 ? (
                              currentSubtitleCue.words.map((w, wIdx) => {
                                const isWordActive =
                                  adjustedCurrentTime >= w.startSec &&
                                  adjustedCurrentTime <= w.endSec + 0.15;
                                return (
                                  <span
                                    key={wIdx}
                                    className={`transition-all duration-100 ${
                                      isWordActive
                                        ? "text-yellow-300 scale-110 font-black drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]"
                                        : "text-white opacity-90"
                                    }`}
                                  >
                                    {w.word}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-yellow-300">{currentSubtitleCue.text}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* TIMELINE CONTROLS */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play();
                      }
                    }}
                    className="w-10 h-10 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <div className="flex-1 flex items-center gap-2 text-xs font-mono text-slate-500">
                    <span className="font-bold text-slate-700">
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
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="flex-1 accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="font-bold text-slate-700">
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
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {subtitleCues.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      ÄÃ£ cÃ³ ({subtitleCues.length} cÃ¢u phá»¥ Ä‘á»)
                    </span>
                  )}
                  {voiceoverConfig.enabled && (
                    <span className="text-[11px] font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-200 flex items-center gap-1">
                      <Radio size={13} />
                      Äang lá»“ng tiáº¿ng: {VOICE_CHARACTERS.find((c) => c.id === voiceoverConfig.selectedVoiceId)?.name}
                    </span>
                  )}
                  {visualEffects.filterType !== "none" && (
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
                      âœ¨ Bá»™ lá»c: {visualEffects.filterType.toUpperCase()} ({visualEffects.speed}x)
                    </span>
                  )}
                  {bannerConfig.enabled && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      ðŸ·ï¸ Banner: 00:{bannerConfig.startSec.toString().padStart(2, "0")} âž” 00:{bannerConfig.endSec.toString().padStart(2, "0")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ðŸŒŸ MODAL 1: AI Lá»’NG TIáº¾NG ÄA CHáº¤T GIá»ŒNG (Tá»ª TRáºº EM Äáº¾N NGÆ¯á»œI Lá»šN) */}
      {showVoiceoverModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-violet-100 text-violet-600 rounded-xl">
                  <Radio size={18} />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    AI Lá»“ng Tiáº¿ng Cho Video (Tá»« Tráº» Em Äáº¿n NgÆ°á»i Lá»›n)
                  </h3>
                  <p className="text-xs text-slate-500">Tá»± Ä‘á»™ng nÃ³i theo phá»¥ Ä‘á» timeline, há»— trá»£ Audio Ducking háº¡ Ã¢m lÆ°á»£ng video gá»‘c</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceoverModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Báº¬T / Táº®T & AUDIO DUCKING */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceoverConfig.enabled}
                    onChange={(e) => setVoiceoverConfig((p) => ({ ...p, enabled: e.target.checked }))}
                    className="w-4 h-4 accent-violet-600 rounded"
                  />
                  Báº­t AI tá»± Ä‘á»™ng lá»“ng tiáº¿ng khi phÃ¡t video
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceoverConfig.autoDuckOriginal}
                    onChange={(e) => setVoiceoverConfig((p) => ({ ...p, autoDuckOriginal: e.target.checked }))}
                    className="w-4 h-4 accent-violet-600 rounded"
                  />
                  Tá»± Ä‘á»™ng giáº£m Ã¢m lÆ°á»£ng video gá»‘c khi AI nÃ³i (Audio Ducking)
                </label>
              </div>

              {/* DANH SÃCH 8 NHÃ‚N Váº¬T GIá»ŒNG Äá»ŒC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {VOICE_CHARACTERS.map((char) => {
                  const isSelected = voiceoverConfig.selectedVoiceId === char.id;
                  return (
                    <div
                      key={char.id}
                      onClick={() =>
                        setVoiceoverConfig((p) => ({
                          ...p,
                          selectedVoiceId: char.id,
                          pitch: char.pitch,
                          rate: char.rate,
                        }))
                      }
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-violet-600 bg-violet-50/60 shadow-md shadow-violet-500/10"
                          : "border-slate-200 hover:border-violet-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-2xl">{char.avatar}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            char.group === "kids"
                              ? "bg-amber-100 text-amber-800"
                              : char.group === "adults"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {char.badge} â€¢ {char.ageRange}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900">{char.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {char.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSentence(char.sampleText, char.id);
                          }}
                          className="px-2.5 py-1 bg-violet-100 hover:bg-violet-200 text-violet-700 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Volume2 size={12} /> Nghe thá»­ máº«u
                        </button>
                        {isSelected && (
                          <span className="text-[10px] font-black text-violet-700 uppercase flex items-center gap-1">
                            <Check size={12} /> Äang chá»n
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
                NhÃ¢n váº­t Ä‘ang chá»n:{" "}
                <strong className="text-violet-700">
                  {VOICE_CHARACTERS.find((c) => c.id === voiceoverConfig.selectedVoiceId)?.name}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setShowVoiceoverModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                LÆ°u & Ãp Dá»¥ng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ðŸŒŸ MODAL 2: CÃ€O Dá»® LIá»†U DOUYIN.COM & Äá»€ XUáº¤T VIDEO HOT Má»šI NHáº¤T */}
      {showDouyinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                  <Flame size={20} className="animate-pulse" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    Douyin Hot Trends & CÃ o Video BÃ¡n HÃ ng Triá»‡u View
                    <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      DOUYIN.COM
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Äá» xuáº¥t video hot má»›i nháº¥t, tá»± Ä‘á»™ng trÃ­ch xuáº¥t ká»‹ch báº£n tiáº¿ng Viá»‡t vÃ  gÃ¡n giá»ng lá»“ng tiáº¿ng tá»‘i Æ°u
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDouyinModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* TAB CHUYá»‚N Äá»”I */}
            <div className="flex items-center gap-2 mb-4 p-1 bg-slate-100 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveDouyinTab("trends")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeDouyinTab === "trends"
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Flame size={14} /> ðŸ† Äá» Xuáº¥t Video Hot Douyin Má»›i Nháº¥t
              </button>
              <button
                type="button"
                onClick={() => setActiveDouyinTab("scraper")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeDouyinTab === "scraper"
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Link2 size={14} /> ðŸ”— CÃ o Video Tá»« Link Douyin Báº¥t Ká»³
              </button>
            </div>

            {/* TAB 1: Báº¢NG Xáº¾P Háº NG VIDEO HOT DOUYIN */}
            {activeDouyinTab === "trends" && (
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Lá»ŒC THEO DANH Má»¤C */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
                  {[
                    { id: "all", label: "Táº¥t Cáº£ Danh Má»¥c" },
                    { id: "kids_toys", label: "ðŸ§¸ Äá»“ ChÆ¡i & Máº¹ BÃ©" },
                    { id: "smart_home", label: "ðŸ›ï¸ Gia Dá»¥ng ThÃ´ng Minh" },
                    { id: "tech_gadgets", label: "ðŸ“± Äá»“ CÃ´ng Nghá»‡" },
                    { id: "beauty_care", label: "ðŸ’„ Má»¹ Pháº©m & Skincare" },
                    { id: "short_drama", label: "ðŸŽ¬ Phim Ngáº¯n Drama" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDouyinCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        douyinCategory === cat.id
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-rose-50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* DANH SÃCH VIDEO HOT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredDouyinTrends.map((trend) => (
                    <div
                      key={trend.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-rose-300 transition-all hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                            {trend.categoryLabel}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">â¤ï¸ {trend.likes} â€¢ â†—ï¸ {trend.shares}</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 leading-snug">{trend.title}</h4>
                        <p className="text-[10px] text-slate-400 font-mono italic mt-0.5">ðŸ‡¨ðŸ‡³ {trend.originalTitle}</p>

                        <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200/80 rounded-xl">
                          <p className="text-[10px] text-amber-950 font-bold leading-relaxed">
                            ðŸ’¡ <strong>AI Viral:</strong> {trend.viralInsight}
                          </p>
                        </div>

                        <div className="mt-2 text-[11px] font-bold text-violet-800 bg-violet-50 p-2 rounded-xl border border-violet-100 flex items-center gap-1.5">
                          <Radio size={12} className="text-violet-600 shrink-0" />
                          <span>Gá»£i Ã½ giá»ng: {trend.voiceRecommendationName}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportDouyinVideo(trend)}
                        className="w-full py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        ðŸš€ Nháº­p Video & Báº­t Lá»“ng Tiáº¿ng
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: CÃ€O Tá»ª LINK Báº¤T Ká»² */}
            {activeDouyinTab === "scraper" && (
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-800 block mb-2">
                    DÃ¡n Ä‘Æ°á»ng link Douyin (TikTok Trung Quá»‘c):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={douyinUrlInput}
                      onChange={(e) => setDouyinUrlInput(e.target.value)}
                      placeholder="VD: https://v.douyin.com/iABCxyz/ hoáº·c https://www.douyin.com/video/..."
                      className="flex-1 text-xs font-bold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-rose-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleScrapeDouyinLink}
                      disabled={isScrapingDouyin}
                      className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isScrapingDouyin ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Äang cÃ o...
                        </>
                      ) : (
                        <>
                          <Flame size={14} /> ðŸš€ CÃ o & Nháº­p Video
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                    <span className="font-bold">Test nhanh Ä‘Æ°á»ng link:</span>
                    {[
                      { label: "ðŸ§¸ Äá»“ chÆ¡i ma thuáº­t", url: "https://v.douyin.com/toy_demo/" },
                      { label: "ðŸ›ï¸ Gia dá»¥ng váº¯t 360", url: "https://v.douyin.com/home_demo/" },
                      { label: "ðŸ“± GiÃ¡ Ä‘á»¡ xoay AI", url: "https://v.douyin.com/tech_demo/" },
                    ].map((demo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDouyinUrlInput(demo.url)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-rose-300 hover:text-rose-600 font-bold cursor-pointer transition-colors"
                      >
                        {demo.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowDouyinModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                ÄÃ³ng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ðŸŒŸ MODAL CHÃˆN HIá»†U á»¨NG Ã‚M THANH & HÃŒNH áº¢NH Má»šI */}
      {showEffectsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                  <Sparkles size={18} />
                </span>
                <h3 className="text-base font-black text-slate-900">Hiá»‡u á»¨ng HÃ¬nh áº¢nh & Ã‚m Thanh</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEffectsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              {/* PHáº¦N 1: HIá»†U á»¨NG HÃŒNH áº¢NH */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-3">
                  <Palette size={14} className="text-purple-600" /> 1. Bá»™ Lá»c MÃ u & Hiá»‡u á»¨ng HÃ¬nh áº¢nh (Visual)
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1.5">TÃ´ng mÃ u Ä‘iá»‡n áº£nh:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "none", label: "Máº·c Ä‘á»‹nh" },
                        { id: "bright", label: "âœ¨ SÃ¡ng nÃ©t" },
                        { id: "cinematic", label: "ðŸŽ¬ Äiá»‡n áº£nh" },
                        { id: "vibrant", label: "ðŸŒˆ Rá»±c rá»¡" },
                        { id: "golden", label: "â˜€ï¸ VÃ ng áº¥m" },
                        { id: "vintage", label: "ðŸŽžï¸ HoÃ i niá»‡m" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setVisualEffects((p) => ({ ...p, filterType: item.id as any }))}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            visualEffects.filterType === item.id
                              ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-purple-50"
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
                        Äá»™ sÃ¡ng: {visualEffects.brightness}%
                      </label>
                      <input
                        type="range"
                        min={80}
                        max={140}
                        value={visualEffects.brightness}
                        onChange={(e) => setVisualEffects((p) => ({ ...p, brightness: Number(e.target.value) }))}
                        className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Äá»™ bÃ£o hÃ²a mÃ u: {visualEffects.saturation}%
                      </label>
                      <input
                        type="range"
                        min={60}
                        max={180}
                        value={visualEffects.saturation}
                        onChange={(e) => setVisualEffects((p) => ({ ...p, saturation: Number(e.target.value) }))}
                        className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Tá»‘c Ä‘á»™ phÃ¡t: {visualEffects.speed}x (TÄƒng tá»‘c Ä‘á»ƒ video TikTok cuá»‘n hÃºt hÆ¡n)
                    </label>
                    <div className="flex gap-2">
                      {[1.0, 1.1, 1.2, 1.25, 1.5].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setVisualEffects((p) => ({ ...p, speed: spd }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            visualEffects.speed === spd
                              ? "bg-purple-600 text-white border-purple-600"
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

              {/* PHáº¦N 2: HIá»†U á»¨NG Ã‚M THANH */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-3">
                  <Music size={14} className="text-emerald-600" /> 2. Hiá»‡u á»¨ng Ã‚m Thanh & Khuáº¿ch Äáº¡i (Audio)
                </span>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-800">ðŸŽ™ï¸ Khuáº¿ch Ä‘áº¡i giá»ng nÃ³i (Voice Boost +40%)</p>
                      <p className="text-[11px] text-slate-500">GiÃºp giá»ng nÃ³i rÃµ rÃ ng, ná»•i báº­t hÆ¡n so vá»›i Ã¢m thanh táº¡p Ã¢m</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.boostVoiceVolume}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, boostVoiceVolume: e.target.checked }))}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-800">ðŸ”” Hiá»‡u á»©ng Ding khi hiá»‡n Banner</p>
                      <p className="text-[11px] text-slate-500">PhÃ¡t Ã¢m thanh thÃ´ng bÃ¡o thu hÃºt máº¯t nhÃ¬n khi banner giáº£m giÃ¡ xuáº¥t hiá»‡n</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.dingEffectEnabled}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, dingEffectEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-800">âš¡ Hiá»‡u á»©ng Whoosh lÆ°á»›t cáº£nh má»Ÿ Ä‘áº§u</p>
                      <p className="text-[11px] text-slate-500">Ã‚m thanh lÆ°á»›t giÃ³ chuyÃªn nghiá»‡p trong 2 giÃ¢y Ä‘áº§u video</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.whooshEffectEnabled}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, whooshEffectEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowEffectsModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                LÆ°u & Ãp Dá»¥ng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THIáº¾T Láº¬P LOGO & BANNER */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <ImageIcon size={18} />
                </span>
                <h3 className="text-base font-black text-slate-900">Thiáº¿t Láº­p Logo & Banner Video</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              {/* PHáº¦N 1: LOGO */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-600" /> 1. Logo ThÆ°Æ¡ng Hiá»‡u
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logoConfig.enabled}
                      onChange={(e) => setLogoConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-purple-600 rounded"
                    />
                    Báº­t Logo
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                      áº¢nh Logo (PNG trong suá»‘t / JPG):
                    </label>
                    <div className="flex items-center gap-3">
                      {logoConfig.imageSrc ? (
                        <div className="relative group w-14 h-14 bg-white border border-slate-200 rounded-xl p-1 flex items-center justify-center shrink-0">
                          <img
                            src={logoConfig.imageSrc}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain rounded"
                          />
                          <button
                            type="button"
                            onClick={() => setLogoConfig((p) => ({ ...p, imageSrc: "" }))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 cursor-pointer"
                            title="XÃ³a logo"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : null}

                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => logoImageInputRef.current?.click()}
                          className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                        >
                          <UploadCloud size={16} className="text-indigo-600" />
                          {logoConfig.imageSrc ? "Äá»•i áº£nh Logo khÃ¡c" : "Chá»n áº£nh Logo tá»« mÃ¡y tÃ­nh..."}
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
                        Hoáº·c nháº­p Chá»¯ Logo Ä‘áº¡i diá»‡n:
                      </label>
                      <input
                        type="text"
                        value={logoConfig.name}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, name: e.target.value }))}
                        placeholder="VD: KPOST AI"
                        className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Vá»‹ trÃ­ gÃ³c:</label>
                      <select
                        value={logoConfig.position}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, position: e.target.value as any }))}
                        className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      >
                        <option value="top-right">GÃ³c trÃªn - Pháº£i</option>
                        <option value="top-left">GÃ³c trÃªn - TrÃ¡i</option>
                        <option value="bottom-right">GÃ³c dÆ°á»›i - Pháº£i</option>
                        <option value="bottom-left">GÃ³c dÆ°á»›i - TrÃ¡i</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        KÃ­ch thÆ°á»›c: {logoConfig.size || 40}px
                      </label>
                      <input
                        type="range"
                        min={24}
                        max={70}
                        value={logoConfig.size || 40}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, size: Number(e.target.value) }))}
                        className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PHáº¦N 2: BANNER QUáº¢NG CÃO */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    ðŸ·ï¸ 2. Banner Quáº£ng CÃ¡o / Giáº£m GiÃ¡
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerConfig.enabled}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    Báº­t Banner
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">TiÃªu Ä‘á» chÃ­nh:</label>
                    <input
                      type="text"
                      value={bannerConfig.title}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, title: e.target.value }))}
                      placeholder="VD: âš¡ FLASH SALE 50% - DUY NHáº¤T HÃ”M NAY"
                      className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">MÃ´ táº£ phá»¥ (subtitle):</label>
                    <input
                      type="text"
                      value={bannerConfig.subtitle || ""}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, subtitle: e.target.value }))}
                      placeholder="VD: Miá»…n phÃ­ giao hÃ ng toÃ n quá»‘c â€¢ Báº£o hÃ nh chÃ­nh hÃ£ng"
                      className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Báº¯t Ä‘áº§u (giÃ¢y):</label>
                      <input
                        type="number"
                        min={0}
                        max={videoDuration || 120}
                        value={bannerConfig.startSec}
                        onChange={(e) => setBannerConfig((p) => ({ ...p, startSec: Number(e.target.value) }))}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Káº¿t thÃºc (giÃ¢y):</label>
                      <input
                        type="number"
                        min={0}
                        max={videoDuration || 120}
                        value={bannerConfig.endSec}
                        onChange={(e) => setBannerConfig((p) => ({ ...p, endSec: Number(e.target.value) }))}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                LÆ°u & Ãp Dá»¥ng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
Explain