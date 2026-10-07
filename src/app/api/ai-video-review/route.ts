import { NextResponse } from 'next/server';

function extractJsonFromAiResponse(rawText: string): any {
  if (!rawText) return null;
  const cleaned = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {}
    }
  }
  return null;
}

// 1. Gọi Google Gemini qua SDK & REST
async function callGeminiAi(apiKey: string, systemPrompt: string, parts: any[]) {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastErrorDetail = '';

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
            temperature: 0.7,
          },
        });
        const rawText = response.text || '';
        const parsed = extractJsonFromAiResponse(rawText);
        if (parsed) {
          const cues = parsed.cues || parsed.items || parsed.subtitles || parsed.review || parsed.lines;
          if (Array.isArray(cues) && cues.length > 0) {
            return { data: { ...parsed, cues }, error: null };
          }
        }
      } catch (err: any) {
        lastErrorDetail = err?.message || String(err);
        console.warn(`[@google/genai review ${model} error]:`, lastErrorDetail);
      }
    }
  } catch (sdkErr: any) {
    lastErrorDetail = sdkErr?.message || String(sdkErr);
  }

  // Dự phòng REST API
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts }],
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
        continue;
      }

      const data = await resp.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = extractJsonFromAiResponse(rawText);
      if (parsed) {
        const cues = parsed.cues || parsed.items || parsed.subtitles || parsed.review || parsed.lines;
        if (Array.isArray(cues) && cues.length > 0) {
          return { data: { ...parsed, cues }, error: null };
        }
      }
    } catch (e: any) {
      lastErrorDetail = e?.message || String(e);
    }
  }
  return { data: null, error: lastErrorDetail };
}

// 2. Dự phòng qua Groq LLaMA 3.3 70B
async function callGroqAi(apiKey: string, systemPrompt: string, userPrompt: string) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';
      const parsed = extractJsonFromAiResponse(content);
      if (parsed) {
        const cues = parsed.cues || parsed.items || parsed.subtitles || parsed.review || parsed.lines;
        if (Array.isArray(cues) && cues.length > 0) {
          return { data: { ...parsed, cues }, error: null };
        }
      }
    }
  } catch (err: any) {
    console.warn('[Groq Review Exception]:', err?.message || err);
  }
  return { data: null, error: 'Groq failed' };
}

// 3. Main POST Handler
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

    const groqKey = body.groqApiKey || process.env.GROQ_API_KEY || '';

    // Dự phòng chuyển tiếp sang backend nếu chưa có key
    if (!apiKey && !groqKey) {
      try {
        const backendEndpoints = [
          'https://api.kpost.vn/ai-content/ai-video-review',
          'https://api.kpost.vn/api/ai-video-review',
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
              if (bData && Array.isArray(bData.cues) && bData.cues.length > 0) {
                return NextResponse.json(bData);
              }
            }
          } catch {}
        }
      } catch {}

      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_API_KEY',
          message: 'Máy chủ chưa được cấu hình GEMINI_API_KEY trên Coolify. Bạn hãy vào Environment Variables của kpost-frontend để thêm key nhé!',
          cues: [],
        },
        { status: 500 }
      );
    }

    const styleDescriptions: Record<string, string> = {
      humorous_viral: `🎭 PHONG CÁCH: HÀI HƯỚC - CÀ KHỊA - LẦY LỘI - BẮT TREND TIKTOK / SHORTS:
- Văn phong: Hóm hỉnh, tếu táo, châm biếm duyên dáng, từ ngữ viral ("anh chàng số nhọ", "quay xe cực khét", "bật ngửa", "hết nước chấm", "đúng là hảo hán", "nhìn bản mặt là thấy uy tín", "cái kết đắng lòng").
- Kể chuyện: Tóm tắt hành động, chọc cười bằng cách bình luận các tình huống ngớ ngẩn, hiểu lầm hoặc phản ứng bất ngờ.`,
      dramatic_cinema: `🎬 PHONG CÁCH: TÓM TẮT PHIM ĐIỆN ẢNH - KỊCH TÍNH - CUỐN HÚT: Hồi hộp, giật gân, đẩy cao trào cảm xúc.`,
      philosophical_satire: `💡 PHONG CÁCH: CHÂM BIẾM THÂM THÚY - CƯỜI RA NƯỚC MẮT: Vừa hài vừa triết lý cuộc sống.`,
      speed_recap: `⚡ PHONG CÁCH: REVIEW SIÊU TỐC 60S - DỒN DẬP - GÃY GỌN.`,
    };

    const chosenStyle = styleDescriptions[reviewStyle] || styleDescriptions.humorous_viral;
    const densityInstruction =
      density === 'high'
        ? 'Mật độ lời bình: Dày đặc liên tục (3.0s - 4.5s/câu).'
        : density === 'compact'
        ? 'Mật độ lời bình: Tinh gọn vào các khoảnh khắc quan trọng.'
        : 'Mật độ lời bình: Vừa phải (4.0s - 5.5s/câu).';

    const systemPrompt = `BẠN LÀ MỘT REVIEWER PHIM VÀ VIDEO CHUYÊN NGHIỆP BẬC THẦY TRIỆU VIEW TIKTOK.
NHIỆM VỤ: Phân tích phân đoạn video ${totalDuration}s qua ảnh chụp khung hình và âm thanh:
VIẾT KỊCH BẢN REVIEW / TÓM TẮT CÂU CHUYỆN BẰNG TIẾNG VIỆT ĐỂ LỒNG TIẾNG.
${chosenStyle}
${densityInstruction}
${customPrompt ? `YÊU CẦU ĐẶC BIỆT: "${customPrompt}"` : ''}

NGUYÊN TẮC:
1. KHÔNG DỊCH THOẠI TỪNG TỪ CỦA NHÂN VẬT! Bạn là NGƯỜI DẪN CHUYỆN / REVIEWER.
2. Bám sát diễn biến hình ảnh nhân vật làm gì để lời bình khớp màn hình.
3. startSec và endSec tính từ 0.0s đến ${totalDuration}.0s.

ĐỊNH DẠNG JSON:
{
  "detectedLanguage": "Ngôn ngữ gốc",
  "storySummary": "Tóm tắt ngắn 1 câu",
  "hook": "Câu mở đầu giật gân",
  "cues": [
    { "id": 1, "startSec": 0.5, "endSec": 4.5, "text": "Mở đầu video, anh chàng số nhọ của chúng ta đang tỏ ra hết sức nguy hiểm..." }
  ]
}`;

    const parts: any[] = [];
    if (Array.isArray(frameSnapshots) && frameSnapshots.length > 0) {
      for (const img of frameSnapshots) {
        if (typeof img === 'string') {
          const cleanImg = img.includes(',') ? img.split(',')[1] : img;
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanImg } });
        }
      }
    }

    if (audioBase64 && typeof audioBase64 === 'string') {
      const rawBase64 = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
      parts.push({ inlineData: { mimeType: mimeType || 'audio/wav', data: rawBase64 } });
    }

    const userTextPrompt = `Tiêu đề: "${videoTitle || 'Video'}". Thời lượng: ${totalDuration}s. Hãy xem các khung hình và nghe âm thanh để viết kịch bản review tóm tắt hài hước cuốn hút dạng JSON!`;
    parts.push({ text: userTextPrompt });

    let resultJson: any = null;
    let lastError = '';

    if (apiKey) {
      const aiRes = await callGeminiAi(apiKey, systemPrompt, parts);
      if (aiRes?.data) resultJson = aiRes.data;
      else lastError = aiRes?.error || 'Gemini error';
    }

    // Dự phòng sang Groq nếu Gemini lỗi
    if ((!resultJson || !Array.isArray(resultJson.cues) || resultJson.cues.length === 0) && groqKey) {
      console.log('[AI Review] Chuyển tiếp sang Groq LLaMA 3.3...');
      const groqRes = await callGroqAi(groqKey, systemPrompt, userTextPrompt);
      if (groqRes?.data) resultJson = groqRes.data;
    }

    if (!resultJson || !Array.isArray(resultJson.cues) || resultJson.cues.length === 0) {
      let friendlyError = 'Mô hình AI chưa tạo được kịch bản review cho phân đoạn này.';
      if (lastError.includes('prepayment credits are depleted') || lastError.includes('402')) {
        friendlyError = 'Google AI Studio báo lỗi 402: Prepayment credits are depleted (Dự án đang bật Trả trước nhưng số dư 0$). Hãy nạp tiền hoặc tạo API Key ở project Free Tier.';
      } else if (lastError.includes('RESOURCE_EXHAUSTED') || lastError.includes('429')) {
        friendlyError = 'Tài khoản Google Gemini tạm thời chạm mốc quota. Hãy thử lại sau ít phút hoặc thêm GROQ_API_KEY dự phòng!';
      }

      return NextResponse.json(
        {
          success: false,
          error: 'AI_REVIEW_FAILED',
          message: friendlyError,
          detail: lastError,
          cues: [],
        },
        { status: 502 }
      );
    }

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
      { success: false, error: 'SERVER_ERROR', message: err.message || 'Lỗi xử lý tạo review' },
      { status: 500 }
    );
  }
}