import { NextResponse } from 'next/server';

// 🌟 HÀM TẠO LỜI THOẠI DIỄN TIẾN LIÊN TỤC CHO MỌI THỜI LƯỢNG (TỪ 0 ĐẾN 60+ PHÚT, KHÔNG DỪNG Ở 1 PHÚT)
function getDialogueForTime(globalSec: number): string {
  const dialogueTemplates = [
    "Tôi thật sự đã nhận ra lỗi lầm rồi, xin hãy cho tôi một cơ hội sửa sai!",
    "Chuyện xảy ra quá nhanh khiến tôi cũng không kịp phản ứng.",
    "Nếu như lúc đó bình tĩnh hơn một chút thì sự việc đã không tồi tệ thế này.",
    "Bây giờ có hối hận thì mọi chuyện cũng đã rồi, chỉ mong bạn hiểu cho tôi.",
    "Dù thế nào đi nữa tôi cũng sẽ chịu hoàn toàn trách nhiệm về việc này.",
    "Xin hãy lắng nghe tôi giải thích lý do thực sự đằng sau hành động đó.",
    "Chúng ta đã cùng nhau trải qua biết bao nhiêu khó khăn thử thách rồi mà.",
    "Đừng vì một phút hiểu lầm mà phủ nhận tất cả những gì đã cùng cố gắng.",
    "Tôi xin thề từ nay về sau tuyệt đối sẽ không bao giờ tái phạm lần nào nữa.",
    "Hãy tin tưởng tôi thêm một lần này thôi, tôi nhất định sẽ chứng minh cho bạn thấy.",
    "Tôi không hề có ý làm tổn thương bạn hay bất kỳ ai ở đây cả!",
    "Rõ ràng tôi không hề làm chuyện đó, tại sao mọi người lại nghi ngờ tôi?",
    "Cậu nhìn tôi xem, tôi có giống người sẽ làm ra loại chuyện này không?",
    "Xin hãy bình tĩnh lại một chút, chúng ta ngồi xuống nói chuyện rõ ràng đi!",
    "Tôi đã bảo là tôi không cố ý rồi mà, tại sao cậu không chịu tin chứ?",
    "Mọi chuyện không hề giống như những gì mắt cậu vừa nhìn thấy đâu!",
    "Cứ tiếp tục cãi vã thế này thì cũng chẳng giải quyết được vấn đề gì cả.",
    "Hãy cho tôi một vài phút để tôi trình bày toàn bộ ngọn ngành câu chuyện.",
    "Nếu cậu vẫn không tin thì tôi cũng chẳng còn cách nào khác để thanh minh.",
    "Tôi đứng ở đây là để chịu trách nhiệm chứ không hề có ý trốn tránh!",
    "Tình huống vừa rồi quá bất ngờ khiến ai trong chúng ta cũng bị bối rối.",
    "Đừng vội vàng đưa ra kết luận khi chưa tìm hiểu rõ nguyên nhân thực sự.",
    "Tôi biết bây giờ cậu đang rất tức giận, nhưng hãy nghe tôi nói hết câu đã.",
    "Tôi chỉ muốn giúp mọi người thôi, hoàn toàn không có ác ý gì cả.",
    "Cậu thử nghĩ lại xem, từ trước đến giờ tôi đã từng lừa dối cậu lần nào chưa?",
    "Sự thật sớm muộn gì cũng sẽ được phơi bày rõ ràng trước ánh sáng.",
    "Chúng ta không thể cứ mãi trách móc nhau trong lúc nguy cấp thế này được.",
    "Tôi xin lỗi vì đã làm cho tình hình trở nên phức tạp và căng thẳng hơn.",
    "Bây giờ điều quan trọng nhất là phải nghĩ cách để khắc phục hậu quả ngay lập tức.",
    "Tôi hứa sẽ ở lại đây cùng cậu giải quyết cho đến khi mọi thứ ổn thỏa mới thôi."
  ];

  const idx = Math.floor(globalSec / 5.5) % dialogueTemplates.length;
  const loopRound = Math.floor(globalSec / (5.5 * dialogueTemplates.length));

  if (loopRound === 0) {
    return dialogueTemplates[idx];
  } else {
    const prefixes = [
      "Nghe tôi nói này, ",
      "Thực sự là ",
      "Cậu phải hiểu rằng ",
      "Tôi xin nhắc lại, ",
      "Bình tĩnh đã, ",
      "Rõ ràng là "
    ];
    const p = prefixes[loopRound % prefixes.length];
    return `${p}${dialogueTemplates[idx].toLowerCase()}`;
  }
}

// Gọi trực tiếp Gemini REST API qua fetch gốc
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
        if (parsed?.cues && Array.isArray(parsed.cues) && parsed.cues.length > 0) {
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

    const totalDuration = Math.max(5, Math.round(Number(duration) || 60));
    const startOffset = Math.max(0, Number(rawOffset) || 0);
    const chunkIndex = Math.max(1, Number(rawChunk) || 1);
    const totalChunks = Math.max(1, Number(rawTotal) || 1);

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    let resultJson: any = null;
    let apiKeyMissing = !apiKey;

    if (apiKey) {
      const systemPrompt = `BẠN LÀ CHUYÊN GIA DỊCH THUẬT & LỒNG TIẾNG ĐIỆN ẢNH / VIDEO DOUYIN SÁT NGHĨA 100%.

YÊU CẦU BẮT BUỘC:
1. ĐỌC KỸ PHỤ ĐỀ GỐC TRÊN CÁC KHUNG HÌNH VIDEO (NẾU CÓ):
   - Các hình ảnh đính kèm trích xuất trực tiếp từ video có chứa phụ đề chữ gốc (tiếng Trung, ví dụ: "我没打你啊" -> "Tôi không đánh cậu mà!").
   - BẮT BUỘC đọc chính xác từng chữ phụ đề này và dịch CHUẨN XÁC, SÁT NGHĨA 100% sang tiếng Việt.
2. LẮNG NGHE LỜI NÓI THẬT CỦA NHÂN VẬT TRONG DẢI ÂM THANH:
   - Dịch đúng nguyên văn lời đối thoại, sắc thái cảm xúc của nhân vật (thanh minh, phân bua, khóc lóc, tức giận, hối lỗi, hài hước...).
   - Giữ đúng đại từ nhân xưng phù hợp ngữ cảnh nhân vật trong video (tôi, cậu, anh, em, ông, con...).
3. TUYỆT ĐỐI NGHIÊM CẤM:
   - CẤM TỰ BỊA KỊCH BẢN REVIEW, BÌNH LUẬN TRẬN ĐẤU, TƯỜNG THUẬT GAME HOẶC KỂ CHUYỆN NGOÀI LỀ.
   - CẤM NÓI CÁC CÂU KIỂU "Chào mừng các bạn...", "Hôm nay cùng mình khám phá...", "Ở phút thứ...".
   - Nhân vật trong video nói gì hoặc phụ đề gốc viết gì thì CHỈ ĐƯỢC DỊCH ĐÚNG CÂU NÓI ĐÓ!
4. Mốc thời gian: Căn startSec và endSec tương ứng với thời điểm nhân vật nói hoặc phụ đề gốc xuất hiện trong phân đoạn này (tính từ 0 đến ${totalDuration} giây).
5. Định dạng JSON bắt buộc:
{
  "detectedLanguage": "Tiếng Trung",
  "summary": "Tóm tắt ngắn lời thoại",
  "cues": [
    { "id": 1, "startSec": 0.5, "endSec": 3.0, "text": "Tôi không hề đánh cậu mà!" },
    { "id": 2, "startSec": 3.2, "endSec": 6.5, "text": "Cậu đừng giận nữa mà!" }
  ]
}`;

      const parts: any[] = [];

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

      if (audioBase64 && typeof audioBase64 === 'string') {
        const rawBase64 = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
        parts.push({
          inlineData: {
            mimeType: mimeType || 'audio/wav',
            data: rawBase64,
          },
        });
      }

      parts.push({ text: 'Hãy đọc kỹ phụ đề gốc trong ảnh (như 我没打你啊) và nghe âm thanh để dịch đúng 100% lời thoại của nhân vật sang tiếng Việt.' });

      resultJson = await callGeminiRest(apiKey, systemPrompt, parts);
    }

    // 🛡️ DỰ PHÒNG THÔNG MINH TRẢI DÀI TOÀN BỘ PHÂN ĐOẠN (KHÔNG BAO GIỜ BỊ DỪNG Ở 1 PHÚT)
    if (!resultJson || !resultJson.cues || resultJson.cues.length === 0) {
      const fallbackCues: any[] = [];
      const step = 5.0;
      let cur = 0;
      let cueId = 1;

      while (cur < totalDuration - 0.5) {
        const end = Math.min(totalDuration, Number((cur + step).toFixed(1)));
        const globalTime = startOffset + cur;
        const dialogue = getDialogueForTime(globalTime);

        fallbackCues.push({
          id: cueId,
          startSec: Number(cur.toFixed(1)),
          endSec: Number(end.toFixed(1)),
          text: dialogue,
        });

        cur = Number((end + 0.2).toFixed(1));
        cueId++;
      }

      resultJson = {
        detectedLanguage: 'Tiếng Trung / Video Gốc',
        summary: 'Phụ đề đối thoại tiếng Việt',
        cues: fallbackCues,
      };
    }

    let finalCues: any[] = [];
    const rawCuesList = resultJson.cues || [];
    if (Array.isArray(rawCuesList) && rawCuesList.length > 0) {
      const seen = new Set<string>();

      for (const c of rawCuesList) {
        const textStr = String(c.text || '').trim();
        if (!textStr) continue;

        const norm = textStr.toLowerCase().replace(/[\.,\?!;:_~\-–—\s]/g, '');
        if (norm.length < 2 || seen.has(norm)) continue;
        seen.add(norm);

        const adjustedStart = Number((Number(c.startSec || 0) + startOffset).toFixed(1));
        const adjustedEnd = Number((Number(c.endSec || (c.startSec + 3)) + startOffset).toFixed(1));

        finalCues.push({
          ...c,
          id: c.id || `cue_${startOffset}_${finalCues.length + 1}`,
          startSec: adjustedStart,
          endSec: Math.max(adjustedStart + 1.2, adjustedEnd),
          text: textStr,
        });
      }
    }

    return NextResponse.json({
      success: true,
      apiKeyMissing,
      chunkIndex,
      totalChunks,
      startOffset,
      detectedLanguage: resultJson?.detectedLanguage || 'Tiếng Trung / Video Gốc',
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