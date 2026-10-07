import { NextResponse } from 'next/server';

// =========================================================================
// 1. DỊCH BÙ TỰ ĐỘNG BẰNG GOOGLE TRANSLATE CLIENTS5 ENGINE (CHỐNG SÓT TIẾNG TRUNG 100%)
// =========================================================================
async function translateBatchWithGoogle(batch: string[]): Promise<string[]> {
  if (!batch || batch.length === 0) return [];

  // Gắn số thứ tự index `i:: ` vào từng dòng để chống lệch dòng hoặc nhập nhằng số lượng câu
  const prefixed = batch.map((text, idx) => `${idx}:: ${text.replace(/\r?\n/g, ' ')}`).join('\n');

  // Thử qua Google clients5 API (siêu tốc, không giới hạn, không cần API Key)
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=vi&q=${encodeURIComponent(prefixed)}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (r.ok) {
      const json = await r.json();
      const rawText = Array.isArray(json) && Array.isArray(json[0]) ? json[0][0] : (typeof json[0] === 'string' ? json[0] : '');
      if (rawText) {
        const lines = rawText.split('\n');
        const map = new Map<number, string>();
        for (const line of lines) {
          const match = line.match(/^(\d+)::\s*(.+)$/);
          if (match) {
            map.set(parseInt(match[1], 10), match[2].trim());
          }
        }
        if (map.size > 0) {
          return batch.map((orig, idx) => map.get(idx) || orig);
        }
        if (lines.length === batch.length) {
          return lines.map((l: string) => l.replace(/^\d+::\s*/, '').trim());
        }
      }
    }
  } catch (e) {
    console.warn('[Google clients5 translation failed, trying fallback]:', e);
  }

  // Dự phòng qua translate.google.com
  try {
    const url2 = `https://translate.google.com/translate_a/single?client=at&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(prefixed)}`;
    const r2 = await fetch(url2, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (r2.ok) {
      const data = await r2.json();
      if (Array.isArray(data[0])) {
        const fullTranslated = data[0].map((item: any) => item[0]).join('');
        const lines = fullTranslated.split('\n');
        const map = new Map<number, string>();
        for (const line of lines) {
          const match = line.match(/^(\d+)::\s*(.+)$/);
          if (match) {
            map.set(parseInt(match[1], 10), match[2].trim());
          }
        }
        if (map.size > 0) {
          return batch.map((orig, idx) => map.get(idx) || orig);
        }
      }
    }
  } catch (e2) {
    console.warn('[Google at translation failed]:', e2);
  }

  return batch;
}

// =========================================================================
// 2. BÓC BĂNG SIÊU TỐC BẰNG GROQ WHISPER LARGE V3 (100% MIỄN PHÍ)
// =========================================================================
async function transcribeAndTranslateWithGroq(
  groqKey: string,
  audioBase64: string,
  mimeType: string,
  startOffset: number,
  totalDuration: number,
  videoTitle?: string
) {
  try {
    const rawAudio = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
    const audioBuffer = Buffer.from(rawAudio, 'base64');

    const formData = new FormData();
    const fileBlob = new Blob([audioBuffer], { type: mimeType || 'audio/wav' });
    formData.append('file', fileBlob, 'audio.wav');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'verbose_json');
    formData.append('temperature', '0');

    console.log('[Groq] Đang gửi âm thanh bóc băng tới Whisper Large v3 (startOffset:', startOffset, 's)...');
    const groqResp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
      },
      body: formData,
    });

    if (!groqResp.ok) {
      const errText = await groqResp.text();
      console.warn('[Groq Whisper HTTP Error]:', groqResp.status, errText);
      return null;
    }

    const whisperData = await groqResp.json();
    const detectedLang = whisperData.language || 'auto';
    const segments = whisperData.segments || [];

    if (segments.length === 0 && !whisperData.text?.trim()) {
      return { detectedLanguage: detectedLang, cues: [] };
    }

    const rawItems = segments.length > 0
      ? segments.map((s: any, idx: number) => ({
          id: idx + 1,
          startSec: Number(Number(s.start || 0).toFixed(1)),
          endSec: Number(Number(s.end || (s.start + 2.5)).toFixed(1)),
          text: String(s.text || '').trim(),
        }))
      : [
          {
            id: 1,
            startSec: 0.0,
            endSec: Number(totalDuration.toFixed(1)),
            text: String(whisperData.text || '').trim(),
          },
        ];

    const validItems = rawItems.filter((it: any) => it.text.length > 0);
    if (validItems.length === 0) {
      return { detectedLanguage: detectedLang, cues: [] };
    }

    // Dịch các câu sang tiếng Việt bằng Google Translate Engine
    const rawTexts = validItems.map((it: any) => it.text);
    let translatedTexts: string[] = [];

    const isAlreadyVietnamese = detectedLang.toLowerCase() === 'vi' || detectedLang.toLowerCase() === 'vietnamese';
    if (isAlreadyVietnamese && !rawTexts.some((t: string) => /[\u4e00-\u9fa5]/.test(t))) {
      translatedTexts = rawTexts;
    } else {
      // Dịch theo từng batch 30 câu
      const BATCH_SIZE = 30;
      for (let i = 0; i < rawTexts.length; i += BATCH_SIZE) {
        const chunk = rawTexts.slice(i, i + BATCH_SIZE);
        const transChunk = await translateBatchWithGoogle(chunk);
        translatedTexts.push(...transChunk);
      }
    }

    const finalCues = validItems.map((it: any, idx: number) => {
      const vietnameseText = (translatedTexts[idx] || it.text).trim();
      return {
        id: `groq_cue_${startOffset}_${it.id}`,
        startSec: Number((it.startSec + startOffset).toFixed(1)),
        endSec: Number((Math.max(it.startSec + 0.8, it.endSec) + startOffset).toFixed(1)),
        text: vietnameseText,
      };
    });

    return {
      detectedLanguage: detectedLang,
      cues: finalCues,
    };
  } catch (err: any) {
    console.error('[Groq Process Exception]:', err);
    return null;
  }
}

// =========================================================================
// 3. GỌI TRỰC TIẾP GOOGLE GEMINI QUA SDK CHÍNH THỨC VÀ REST API DỰ PHÒNG
// =========================================================================
async function callGeminiAi(apiKey: string, systemPrompt: string, parts: any[]) {
  // Ưu tiên các model hoạt động tốt nhất
  const models = [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

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
            temperature: 0.2,
          },
        });
        const rawText = response.text || '';
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        if (cleaned) {
          const parsed = JSON.parse(cleaned);
          if (parsed && Array.isArray(parsed.cues)) {
            return parsed;
          }
        }
      } catch (err: any) {
        console.warn(`[@google/genai ${model} error]:`, err?.message || err);
      }
    }
  } catch (sdkErr) {
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
          temperature: 0.2,
        },
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.warn(`[Gemini REST ${model} HTTP ${resp.status}]:`, errText);
        continue;
      }

      const data = await resp.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      if (cleaned) {
        const parsed = JSON.parse(cleaned);
        if (parsed && Array.isArray(parsed.cues)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`[Gemini REST ${model} exception]:`, e);
    }
  }
  return null;
}

// =========================================================================
// 4. MAIN ROUTE HANDLER (POST)
// =========================================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      audioBase64,
      mimeType,
      duration,
      videoTitle,
      sourceLang,
      startOffset: rawOffset,
      chunkIndex: rawChunk,
      totalChunks: rawTotal,
      frameSnapshots,
    } = body;

    const totalDuration = Math.max(3, Math.round(Number(duration) || 30));
    const startOffset = Math.max(0, Number(rawOffset) || 0);
    const chunkIndex = Math.max(1, Number(rawChunk) || 1);
    const totalChunks = Math.max(1, Number(rawTotal) || 1);

    // 🌟 ƯU TIÊN 1: GROQ WHISPER LARGE V3 (100% MIỄN PHÍ, SIÊU TỐC, CHÍNH XÁC TUYỆT ĐỐI)
    const groqApiKey = 
      body.groqApiKey || 
      process.env.GROQ_API_KEY || 
      process.env.GROQ_KEY || 
      process.env.NEXT_PUBLIC_GROQ_API_KEY || 
      '';

    if (groqApiKey && audioBase64) {
      console.log(`[Transcribe] Đang bóc băng phân đoạn ${chunkIndex}/${totalChunks} bằng Groq Whisper Large v3...`);
      const groqResult = await transcribeAndTranslateWithGroq(
        groqApiKey,
        audioBase64,
        mimeType,
        startOffset,
        totalDuration,
        videoTitle
      );
      if (groqResult && Array.isArray(groqResult.cues)) {
        return NextResponse.json({
          success: true,
          chunkIndex,
          totalChunks,
          startOffset,
          detectedLanguage: groqResult.detectedLanguage || 'Tự động nhận diện',
          summary: '',
          cues: groqResult.cues,
          engine: 'groq-whisper-large-v3',
        });
      }
      console.warn('[Groq Whisper failed, fallback to Gemini...]');
    }

    // Lấy API Key Gemini từ client gửi lên hoặc biến môi trường hệ thống
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
      // Nếu server chưa cấu hình key, thử gọi tự động sang backend chính api.kpost.vn
      try {
        const backendEndpoints = [
          "https://api.kpost.vn/ai-content/transcribe-and-translate",
          "https://api.kpost.vn/api/transcribe-and-translate",
        ];
        for (const bUrl of backendEndpoints) {
          try {
            const bResp = await fetch(bUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            if (bResp.ok) {
              const bData = await bResp.json();
              if (bData && Array.isArray(bData.cues)) {
                return NextResponse.json(bData);
              }
            }
          } catch {}
        }
      } catch {}

      return NextResponse.json(
        {
          success: false,
          error: "MISSING_SERVER_API_KEY",
          message: "Máy chủ kpost-frontend chưa được cấu hình biến môi trường GEMINI_API_KEY trên Coolify. Vui lòng thêm GEMINI_API_KEY hoặc GROQ_API_KEY vào mục Environment Variables của kpost-frontend.",
          cues: [],
        },
        { status: 500 }
      );
    }

    // 🌟 SYSTEM PROMPT ĐA NĂNG 100% CHO MỌI THỂ LOẠI VIDEO
    const systemPrompt = `BẠN LÀ MỘT HỆ THỐNG AI ĐA PHƯƠNG THỨC CHUYÊN NGHIỆP VỀ BÓC BĂNG & DỊCH THUẬT PHỤ ĐỀ / LỒNG TIẾNG CHO MỌI LOẠI VIDEO.

NHIỆM VỤ CỦA BẠN:
Xử lý phân đoạn video dài ${totalDuration} giây: Lắng nghe âm thanh giọng nói thật VÀ đọc phụ đề chữ gốc trên các khung hình video để bóc băng và dịch 100% lời thoại sang tiếng Việt chuẩn xác nhất.

NGUYÊN TẮC XỬ LÝ (ÁP DỤNG ĐỘC LẬP CHO VIDEO NÀY):
1. NHẬN DIỆN VÀ PHÂN TÍCH TỪ NỘI DUNG THỰC TẾ CỦA VIDEO:
   - Tự động nhận diện ngôn ngữ gốc đang nói trong âm thanh hoặc hiển thị trên phụ đề (ví dụ: Tiếng Trung, Tiếng Anh, Tiếng Hàn, Tiếng Nhật...).
   - Nếu trong các ảnh đính kèm có phụ đề chữ gốc (chữ Trung, chữ Hàn, chữ Anh chạy dưới màn hình), BẮT BUỘC nhận diện và đọc chuẩn xác từng chữ của phụ đề đó.
   - Kết hợp âm thanh nói thật và chữ phụ đề trên hình để đảm bảo không bỏ sót bất kỳ câu đối thoại nào của các nhân vật.

2. NGUYÊN TẮC DỊCH THUẬT SANG TIẾNG VIỆT:
   - Dịch sát nghĩa, chuẩn ngữ cảnh, tự nhiên, diễn cảm theo đúng phong cách của video (hài hước, kịch tính, trang trọng, giải thích kiến thức...).
   - Tuyệt đối không tự ý bịa đặt nội dung không có thật trong âm thanh hay hình ảnh của video.
   - Nếu phân đoạn này chỉ toàn âm nhạc, hiệu ứng âm thanh hoặc im lặng (không có người nói và không có phụ đề chữ xuất hiện), trả về mảng cues rỗng: [].

3. MỐC THỜI GIAN:
   - startSec và endSec phải khớp chính xác với thời điểm phát ra tiếng nói hoặc xuất hiện phụ đề trong phân đoạn này (tính từ 0.0s đến ${totalDuration}.0s).

4. ĐỊNH DẠNG JSON ĐẦU RA BẮT BUỘC:
{
  "detectedLanguage": "Ngôn ngữ gốc phát hiện được",
  "summary": "Tóm tắt ngắn nội dung phân đoạn",
  "cues": [
    { "id": 1, "startSec": 0.5, "endSec": 3.0, "text": "Câu dịch tiếng Việt thứ nhất" },
    { "id": 2, "startSec": 3.2, "endSec": 6.0, "text": "Câu dịch tiếng Việt thứ hai" }
  ]
}`;

    const parts: any[] = [];

    // 1. Gửi các khung hình chụp từ video để AI nhận diện phụ đề chữ gốc nếu có
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

    // 2. Gửi dải âm thanh thật của video để AI nghe giọng nói
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
      text: `Tiêu đề video: "${videoTitle || 'Video'}". Hãy nghe giọng nói trong âm thanh và đọc phụ đề chữ trên các hình ảnh để bóc băng và dịch toàn bộ lời thoại sang tiếng Việt. Nếu không có tiếng nói và không có phụ đề chữ, trả về mảng cues: [].`,
    });

    const resultJson = await callGeminiAi(apiKey, systemPrompt, parts);

    if (!resultJson) {
      return NextResponse.json(
        {
          success: false,
          error: "AI_PROCESSING_FAILED",
          message: "Mô hình AI không thể phản hồi trong phân đoạn này.",
          cues: [],
        },
        { status: 502 }
      );
    }

    // Chuẩn hóa và cộng dồn mốc thời gian startSec / endSec theo startOffset
    const finalCues: any[] = [];
    const rawCuesList = resultJson.cues || [];

    if (Array.isArray(rawCuesList)) {
      for (const c of rawCuesList) {
        const textStr = String(c.text || '').trim();
        if (!textStr) continue;

        const adjustedStart = Number((Number(c.startSec || 0) + startOffset).toFixed(1));
        const adjustedEnd = Number((Number(c.endSec || (c.startSec + 2.5)) + startOffset).toFixed(1));

        finalCues.push({
          id: c.id ? `cue_${startOffset}_${c.id}` : `cue_${startOffset}_${finalCues.length + 1}`,
          startSec: adjustedStart,
          endSec: Math.max(adjustedStart + 0.8, adjustedEnd),
          text: textStr,
        });
      }
    }

    // 🛡️ CHỐNG SÓT TIẾNG TRUNG/NGOẠI NGỮ: Tự động dịch bù 100% sang Tiếng Việt
    const hasChineseOrForeign = finalCues.some((c) => /[\u4e00-\u9fa5]/.test(c.text));
    if (hasChineseOrForeign && finalCues.length > 0) {
      try {
        console.log(`[Safety Net] Phát hiện ${finalCues.length} câu còn dính chữ Hán, đang tự động chuyển ngữ sang Tiếng Việt...`);
        const textsToTrans = finalCues.map((c) => c.text);
        const translatedBatch = await translateBatchWithGoogle(textsToTrans);
        for (let i = 0; i < finalCues.length; i++) {
          finalCues[i].text = translatedBatch[i] || finalCues[i].text;
        }
      } catch (safeErr) {
        console.warn('[Safety Net translation error]:', safeErr);
      }
    }

    return NextResponse.json({
      success: true,
      chunkIndex,
      totalChunks,
      startOffset,
      detectedLanguage: resultJson?.detectedLanguage || 'Tự động nhận diện',
      summary: resultJson?.summary || '',
      cues: finalCues,
    });
  } catch (error: any) {
    console.error('Error in transcribe-and-translate API:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi xử lý bóc băng và dịch video' },
      { status: 500 }
    );
  }
}