import { NextResponse } from 'next/server';

// =========================================================================
// 1. GỌI GOOGLE GEMINI QUA SDK HOẶC REST API DỰ PHÒNG
// =========================================================================
async function callGeminiAi(apiKey: string, systemPrompt: string, parts: any[]) {
  const models = [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  let lastErrorDetail = '';

  // 1. Thử gọi qua SDK chính thức @google/genai
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const contents = [...parts, { text: systemPrompt }];

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8192,
            temperature: 0.7, // 0.7 để câu từ hóm hỉnh, sáng tạo, cuốn hút
          },
        });
        const rawText = response.text || '';
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        if (cleaned) {
          const parsed = JSON.parse(cleaned);
          if (parsed && Array.isArray(parsed.cues) && parsed.cues.length > 0) {
            return { data: parsed, error: null };
          }
        }
      } catch (err: any) {
        lastErrorDetail = err?.message || String(err);
        console.warn(`[@google/genai review ${model} error]:`, lastErrorDetail);
      }
    }
  } catch (sdkErr: any) {
    lastErrorDetail = sdkErr?.message || String(sdkErr);
    console.warn('[@google/genai import error]:', sdkErr);
  }

  // 2. Dự phòng qua REST API trực tiếp
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: parts,
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 8192,
          temperature: 0.7,
        },
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        lastErrorDetail = `[HTTP ${resp.status} ${model}]: ${errText}`;
        console.warn(`[Gemini REST review ${model} HTTP ${resp.status}]:`, errText);
        continue;
      }

      const data = await resp.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      if (cleaned) {
        const parsed = JSON.parse(cleaned);
        if (parsed && Array.isArray(parsed.cues) && parsed.cues.length > 0) {
          return { data: parsed, error: null };
        }
      }
    } catch (e: any) {
      lastErrorDetail = e?.message || String(e);
      console.warn(`[Gemini REST review ${model} exception]:`, e);
    }
  }
  return { data: null, error: lastErrorDetail };
}

// =========================================================================
// 2. MAIN ROUTE HANDLER (POST) - AI REVIEW VIDEO HÀI HƯỚC CUỐN HÚT
// =========================================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      audioBase64,
      mimeType,
      duration,
      videoTitle,
      reviewStyle = 'humorous_viral',
      density = 'high',
      customPrompt = '',
      startOffset: rawOffset,
      chunkIndex: rawChunk,
      totalChunks: rawTotal,
      frameSnapshots,
    } = body;

    const totalDuration = Math.max(5, Math.round(Number(duration) || 30));
    const startOffset = Math.max(0, Number(rawOffset) || 0);
    const chunkIndex = Math.max(1, Number(rawChunk) || 1);
    const totalChunks = Math.max(1, Number(rawTotal) || 1);

    const apiKey =
      body.geminiApiKey ||
      body.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_KEY ||
      process.env.API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_API_KEY',
          message: 'Chưa cấu hình GEMINI_API_KEY trên Coolify. Vui lòng thêm biến GEMINI_API_KEY vào Environment Variables!',
          cues: [],
        },
        { status: 500 }
      );
    }

    const styleDescriptions: Record<string, string> = {
      humorous_viral: `🎭 PHONG CÁCH: HÀI HƯỚC - CÀ KHỊA - LẦY LỘI - BẮT TREND TIKTOK / SHORTS:
- Văn phong: Hóm hỉnh, tếu táo, châm biếm duyên dáng, dùng từ ngữ hot trend giới trẻ Việt Nam ("anh chàng số nhọ", "quay xe cực khét", "bật ngửa", "hết nước chấm", "đúng là hảo hán", "nhìn cái bản mặt là thấy uy tín rồi", "ai ngờ đâu vừa quay lưng đi thì toang", "cái kết đắng lòng cho thanh niên manh động", "đúng là cao nhân không bằng liều mạng"...).
- Cách kể: Tóm tắt hành động của nhân vật, chọc cười bằng cách bình luận các tình huống ngớ ngẩn, hiểu lầm hoặc phản ứng bất ngờ.`,

      dramatic_cinema: `🎬 PHONG CÁCH: TÓM TẮT PHIM ĐIỆN ẢNH - KỊCH TÍNH - CUỐN HÚT:
- Văn phong: Hồi hộp, giật gân, cuốn hút như các kênh review phim chiếu rạp triệu view.
- Cách kể: Đặt ra các câu hỏi kích thích tò mò ("Liệu điều gì đang chờ đón phía sau cánh cửa bí ẩn này?"), đẩy cao trào cảm xúc và biến cố bất ngờ.`,

      philosophical_satire: `💡 PHONG CÁCH: CHÂM BIẾM THÂM THÚY - CƯỜI RA NƯỚC MẮT:
- Văn phong: Vừa hài hước vừa triết lý, mỉa mai sâu cay những nghịch lý trong cuộc sống dựa trên hành động của nhân vật, rút ra bài học hài hước thâm sâu.`,

      speed_recap: `⚡ PHONG CÁCH: REVIEW SIÊU TỐC 60S - DỒN DẬP - GÃY GỌN:
- Văn phong: Dồn dập, gãy gọn, tốc độ cao, điểm danh các tình tiết gay cấn liên tục, không để người xem có 1 giây ngơi nghỉ.`,
    };

    const chosenStyle = styleDescriptions[reviewStyle] || styleDescriptions.humorous_viral;

    const densityInstruction =
      density === 'high'
        ? 'Mật độ lời bình: Dày đặc, các câu nối tiếp liên tục (khoảng 3.0s - 4.5s/câu) để giữ chân người xem từ đầu đến cuối.'
        : density === 'compact'
        ? 'Mật độ lời bình: Tinh gọn, chỉ bình luận vào những khoảnh khắc quan trọng nhất, chừa không gian cho âm thanh gốc.'
        : 'Mật độ lời bình: Vừa phải, khoảng 4.0s - 5.5s/câu, chuyển tiếp mượt mà có khoảng thở tự nhiên.';

    const systemPrompt = `BẠN LÀ MỘT REVIEWER PHIM VÀ VIDEO CHUYÊN NGHIỆP BẬC THẦY, NỔI TIẾNG VỚI HÀNG TRIỆU VIEW TRÊN TIKTOK VÀ YOUTUBE SHORTS.

NHIỆM VỤ CỦA BẠN:
Phân tích phân đoạn video dài ${totalDuration} giây (từ ${startOffset}.0s đến ${startOffset + totalDuration}.0s) qua các hình ảnh chụp khung hình thực tế và âm thanh:
TỔNG HỢP, PHÂN TÍCH VÀ VIẾT KỊCH BẢN REVIEW / TÓM TẮT CÂU CHUYỆN BẰNG TIẾNG VIỆT ĐỂ LỒNG TIẾNG CHO VIDEO.

${chosenStyle}

${densityInstruction}

${customPrompt ? `YÊU CẦU ĐẶC BIỆT TỪ NGƯỜI DÙNG: "${customPrompt}"` : ''}

NGUYÊN TẮC BẮT BUỘC:
1. KHÔNG DỊCH THOẠI MÁY MÓC TỪNG TỪ CỦA NHÂN VẬT! Bạn là NGƯỜI DẪN CHUYỆN / REVIEWER kể lại toàn bộ câu chuyện với phong cách review cuốn hút nhất.
2. BÁM SÁT HÌNH ẢNH: Quan sát kỹ các khung hình để biết diễn biến thật sự: nhân vật làm gì, cảm xúc thế nào, tình huống gì đang xảy ra để lời bình khớp 100% với mắt người xem.
3. PHÂN BỔ THỜI GIAN CHUẨN XÁC:
   - startSec và endSec phải tính chính xác trong khoảng từ 0.0s đến ${totalDuration}.0s của phân đoạn này.
   - Các câu review được trải đều, câu nọ tiếp câu kia tự nhiên không chồng lấn.
   - Mỗi câu nói phải tự nhiên, tròn vành rõ chữ khi đọc thành tiếng Việt.

ĐỊNH DẠNG JSON ĐẦU RA BẮT BUỘC:
{
  "detectedLanguage": "Ngôn ngữ gốc phát hiện được",
  "storySummary": "Tóm tắt ngắn 1 câu nội dung phân đoạn",
  "hook": "Câu mở đầu giật gân cuốn hút",
  "cues": [
    { "id": 1, "startSec": 0.5, "endSec": 4.5, "text": "Mở đầu video, anh chàng số nhọ của chúng ta đang tỏ ra hết sức nguy hiểm..." },
    { "id": 2, "startSec": 4.8, "endSec": 9.2, "text": "Cứ tưởng phen này vớ được món bở, ai ngờ vừa quay lưng đi thì biến cố ập đến..." }
  ]
}`;

    const parts: any[] = [];

    // Gửi các khung hình chụp toàn cảnh video để AI quan sát bối cảnh, hành động, nhân vật
    if (Array.isArray(frameSnapshots) && frameSnapshots.length > 0) {
      for (const img of frameSnapshots) {
        if (typeof img === 'string') {
          const cleanImg = img.includes(',') ? img.split(',')[1] : img;
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanImg,
            },
          });
        }
      }
    }

    // Gửi âm thanh video để AI lắng nghe thêm hội thoại gốc hoặc hiệu ứng
    if (audioBase64 && typeof audioBase64 === 'string') {
      const rawBase64 = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
      parts.push({
        inlineData: {
          mimeType: mimeType || 'audio/wav',
          data: rawBase64,
        },
      });
    }

    parts.push({
      text: `Tiêu đề video: "${videoTitle || 'Video'}". Thời lượng phân đoạn: ${totalDuration} giây. Hãy xem các khung hình hành động và nghe âm thanh để viết kịch bản review tóm tắt hài hước cuốn hút nhất theo định dạng JSON!`,
    });

    const aiRes = await callGeminiAi(apiKey, systemPrompt, parts);
    const resultJson = aiRes?.data;

    if (!resultJson || !Array.isArray(resultJson.cues) || resultJson.cues.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI_REVIEW_FAILED',
          message: aiRes?.error || 'Mô hình AI chưa tạo được kịch bản review cho phân đoạn này.',
          cues: [],
        },
        { status: 502 }
      );
    }

    // Điều chỉnh và cộng offset mốc thời gian
    const finalCues: any[] = [];
    const rawCuesList = resultJson.cues || [];

    for (let idx = 0; idx < rawCuesList.length; idx++) {
      const c = rawCuesList[idx];
      const text = String(c.text || '').trim();
      if (!text) continue;

      const rawS = Number(c.startSec);
      const rawE = Number(c.endSec);

      const s = rawS >= startOffset ? rawS : Number((rawS + startOffset).toFixed(1));
      let e = rawE >= startOffset ? rawE : Number((rawE + startOffset).toFixed(1));
      if (e <= s) e = Number((s + 4.0).toFixed(1));

      finalCues.push({
        id: `review_cue_${chunkIndex}_${idx + 1}`,
        startSec: s,
        endSec: e,
        text,
      });
    }

    return NextResponse.json({
      success: true,
      chunkIndex,
      totalChunks,
      startOffset,
      storySummary: resultJson.storySummary || '',
      hook: resultJson.hook || '',
      detectedLanguage: resultJson.detectedLanguage || 'Tự động nhận diện',
      cues: finalCues,
    });
  } catch (err: any) {
    console.error('Error in /api/ai-video-review:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: err.message || 'Lỗi xử lý tạo review video',
      },
      { status: 500 }
    );
  }
}