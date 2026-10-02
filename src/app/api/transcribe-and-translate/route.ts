import { NextResponse } from 'next/server';

// Gọi trực tiếp Google Gemini REST API đa phương thức (Audio + Vision OCR)
async function callGeminiRest(apiKey: string, systemPrompt: string, parts: any[]) {
  const models = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite'
  ];

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
          temperature: 0.2, // Nhiệt độ thấp để dịch chính xác nguyên văn, không bịa đặt
        },
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
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

    // Lấy API Key từ biến môi trường máy chủ
    const apiKey = 
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
          error: "MISSING_SERVER_API_KEY",
          message: "Máy chủ kpost-frontend chưa được cấu hình GEMINI_API_KEY trong Environment Variables trên Coolify.",
          cues: [],
        },
        { status: 500 }
      );
    }

    // 🌟 SYSTEM PROMPT ĐA NĂNG 100% CHO MỌI THỂ LOẠI VIDEO THƯƠNG MẠI
    const systemPrompt = `BẠN LÀ MỘT HỆ THỐNG AI ĐA PHƯƠNG THỨC CHUYÊN NGHIỆP VỀ BÓC BĂNG & DỊCH THUẬT PHỤ ĐỀ / LỒNG TIẾNG CHO MỌI LOẠI VIDEO.

NHIỆM VỤ:
Xử lý phân đoạn video dài ${totalDuration} giây: Lắng nghe âm thanh giọng nói thật VÀ đọc phụ đề chữ gốc trên các khung hình video để bóc băng và dịch 100% lời thoại sang tiếng Việt chuẩn xác nhất.

NGUYÊN TẮC XỬ LÝ (ÁP DỤNG ĐỘC LẬP CHO VIDEO NÀY):
1. NHẬN DIỆN VÀ PHÂN TÍCH TỪ NỘI DUNG THỰC TẾ CỦA VIDEO:
   - Tự động nhận diện ngôn ngữ gốc đang nói trong âm thanh hoặc hiển thị trên phụ đề (Tiếng Trung, Tiếng Anh, Tiếng Hàn, Tiếng Nhật...).
   - Nếu trong các ảnh đính kèm có phụ đề chữ gốc, BẮT BUỘC nhận diện và đọc chuẩn xác từng chữ của phụ đề đó.
   - Kết hợp âm thanh nói thật và chữ phụ đề trên hình để đảm bảo không bỏ sót bất kỳ câu đối thoại nào.

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

    // 1. Khung hình chụp từ video để AI nhận diện phụ đề chữ gốc nếu có
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

    // 2. Dải âm thanh thật của video để AI nghe giọng nói
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

    const resultJson = await callGeminiRest(apiKey, systemPrompt, parts);

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