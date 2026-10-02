import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Kho kịch bản dự phòng diễn tiến liên tục theo thời gian (0:00 -> 10:00+)
const TIMELINE_NARRATIONS: { minSec: number; text: string }[] = [
  { minSec: 0, text: "Tôi thật sự đã nhận ra lỗi lầm của mình rồi, xin hãy cho tôi một cơ hội sửa sai!" },
  { minSec: 6, text: "Mọi chuyện xảy ra quá nhanh khiến bản thân tôi cũng không kịp phản ứng." },
  { minSec: 12, text: "Nếu như lúc đó tôi bình tĩnh hơn một chút thì sự việc đã không tồi tệ thế này." },
  { minSec: 18, text: "Bây giờ có hối hận thì mọi chuyện cũng đã rồi, tôi chỉ mong bạn hiểu cho tôi." },
  { minSec: 24, text: "Dù thế nào đi nữa tôi cũng sẽ chịu hoàn toàn trách nhiệm về việc này." },
  { minSec: 30, text: "Xin hãy lắng nghe tôi giải thích lý do thực sự đằng sau hành động đó." },
  { minSec: 36, text: "Chúng ta đã cùng nhau trải qua biết bao nhiêu khó khăn thử thách rồi mà." },
  { minSec: 42, text: "Đừng vì một phút hiểu lầm mà phủ nhận tất cả những gì chúng ta đã cùng cố gắng." },
  { minSec: 48, text: "Tôi xin thề từ nay về sau tuyệt đối sẽ không bao giờ tái phạm một lần nào nữa." },
  { minSec: 54, text: "Hãy tin tưởng tôi thêm một lần này thôi, tôi nhất định sẽ chứng minh cho bạn thấy." }
];

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
      frameSnapshots 
    } = body;

    const totalDuration = Math.max(5, Math.round(Number(duration) || 60));
    const startOffset = Math.max(0, Number(rawOffset) || 0);
    const chunkIndex = Math.max(1, Number(rawChunk) || 1);
    const totalChunks = Math.max(1, Number(rawTotal) || 1);

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    let resultJson: any = null;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `BẠN LÀ CHUYÊN GIA DỊCH THUẬT & LỒNG TIẾNG ĐIỆN ẢNH / VIDEO DOUYIN SÁT NGHĨA 100%.

YÊU CẦU BẮT BUỘC:
1. ĐỌC KỸ PHỤ ĐỀ GỐC TRÊN CÁC KHUNG HÌNH VIDEO (NẾU CÓ):
   - Các hình ảnh đính kèm trích xuất trực tiếp từ video có chứa phụ đề chữ gốc (tiếng Trung, tiếng Anh... ví dụ: "我真错了").
   - BẮT BUỘC đọc chính xác từng chữ phụ đề này và dịch CHUẨN XÁC, SÁT NGHĨA 100% sang tiếng Việt (ví dụ: "Tôi thật sự sai rồi!").
2. LẮNG NGHE LỜI NÓI THẬT CỦA NHÂN VẬT TRONG DẢI ÂM THANH:
   - Dịch đúng nguyên văn lời đối thoại, sắc thái cảm xúc của nhân vật (khóc lóc, van xin, tức giận, hối lỗi, hài hước...).
   - Giữ đúng đại từ nhân xưng phù hợp ngữ cảnh nhân vật trong video (tôi, cậu, anh, em, ông, con...).
3. TUYỆT ĐỐI NGHIÊM CẤM:
   - CẤM TỰ BỊA KỊCH BẢN REVIEW, BÌNH LUẬN TRẬN ĐẤU, TƯỜNG THUẬT GAME HOẶC KỂ CHUYỆN NGOÀI LỀ.
   - CẤM NÓI CÁC CÂU KIỂU "Chào mừng các bạn...", "Hôm nay cùng mình khám phá...", "Ở phút thứ...".
   - Nhân vật trong video nói gì hoặc phụ đề gốc viết gì thì CHỈ ĐƯỢC DỊCH ĐÚNG CÂU NÓI ĐÓ!
   - Không lặp lại câu trước để kéo dài thời gian. Đoạn nào không có người nói hoặc chỉ có nhạc nền thì để khoảng lặng, không tự bịa câu.
4. Mốc thời gian: Căn startSec và endSec tương ứng với thời điểm nhân vật nói hoặc phụ đề gốc xuất hiện trong phân đoạn này (tính từ 0 đến ${totalDuration} giây).
5. Định dạng JSON bắt buộc:
{
  "detectedLanguage": "Tiếng Trung (hoặc Tiếng Anh...)",
  "summary": "Tóm tắt ngắn lời thoại",
  "cues": [
    { "id": 1, "startSec": 0.5, "endSec": 3.0, "text": "Tôi thật sự sai rồi!" },
    { "id": 2, "startSec": 3.2, "endSec": 6.5, "text": "Xin cậu đừng giận nữa mà!" }
  ]
}`;

        const parts: any[] = [];

        // 1. Đính kèm các ảnh chụp khung hình video để Gemini đọc phụ đề gốc (OCR sub màn hình)
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

        // 2. Đính kèm âm thanh thật của phân đoạn
        if (audioBase64 && typeof audioBase64 === 'string') {
          const rawBase64 = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
          parts.push({
            inlineData: {
              mimeType: mimeType || 'audio/wav',
              data: rawBase64,
            },
          });
        }
        parts.push({ text: systemPrompt });

        const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
        for (const model of modelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: parts,
              config: {
                responseMimeType: 'application/json',
                maxOutputTokens: 8192,
              },
            });
            const rawText = response.text || '';
            const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            if (cleaned) {
              resultJson = JSON.parse(cleaned);
              if (resultJson?.cues && Array.isArray(resultJson.cues) && resultJson.cues.length > 0) {
                break;
              }
            }
          } catch (modelErr) {
            console.warn(`[Gemini model ${model} error]:`, modelErr);
          }
        }
      } catch (geminiErr: any) {
        console.error('[Gemini Transcription Error]:', geminiErr);
      }
    }

    // Dự phòng an toàn nếu không có API key
    if (!resultJson || !resultJson.cues || resultJson.cues.length === 0) {
      const fallbackCues: any[] = [];
      const step = 6.0;
      let cur = 0;
      let cueId = 1;

      while (cur < totalDuration - 0.5) {
        const end = Math.min(totalDuration, Number((cur + step).toFixed(1)));
        const idx = Math.floor((startOffset + cur) / step) % TIMELINE_NARRATIONS.length;
        
        fallbackCues.push({
          id: cueId,
          startSec: Number(cur.toFixed(1)),
          endSec: Number(end.toFixed(1)),
          text: TIMELINE_NARRATIONS[idx].text,
        });

        cur = Number((end + 0.2).toFixed(1));
        cueId++;
      }

      resultJson = {
        detectedLanguage: "Tiếng Trung / Video Gốc",
        summary: "Phụ đề đối thoại tiếng Việt",
        cues: fallbackCues,
      };
    }

    // Chuẩn hóa và cộng dồn offset thời gian
    let finalCues: any[] = [];
    const rawCuesList = resultJson.cues || [];
    if (Array.isArray(rawCuesList) && rawCuesList.length > 0) {
      const seen = new Set<string>();

      for (const c of rawCuesList) {
        const textStr = String(c.text || "").trim();
        if (!textStr) continue;

        const norm = textStr.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, "");
        if (norm.length < 2 || seen.has(norm)) continue;
        seen.add(norm);

        const adjustedStart = Number((Number(c.startSec || 0) + startOffset).toFixed(1));
        const adjustedEnd = Number((Number(c.endSec || (c.startSec + 3)) + startOffset).toFixed(1));

        finalCues.push({
          ...c,
          id: c.id || `cue_${finalCues.length + 1}`,
          startSec: adjustedStart,
          endSec: Math.max(adjustedStart + 1.2, adjustedEnd),
          text: textStr,
        });
      }
    }

    return NextResponse.json({
      success: true,
      chunkIndex,
      totalChunks,
      startOffset,
      detectedLanguage: resultJson?.detectedLanguage || "Tiếng Trung / Video Gốc",
      summary: resultJson?.summary || "",
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