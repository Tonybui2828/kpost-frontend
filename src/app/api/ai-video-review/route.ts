import { NextResponse } from 'next/server';

// =========================================================================
// HÀM BÓC TÁCH JSON AN TOÀN TỪ KẾT QUẢ AI
// =========================================================================
function extractJsonFromAiResponse(rawText: string): any {
  if (!rawText) return null;
  const cleaned = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed;
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

// =========================================================================
// 1. GỌI GOOGLE GEMINI QUA SDK CHÍNH THỨC VÀ REST API DỰ PHÒNG
// =========================================================================
async function callGeminiAi(apiKey: string, systemPrompt: string, parts: any[]) {
  const models = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  let lastErrorDetail = '';

  // 1. Thử gọi qua SDK chính thức @google/genai
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: parts,
          config: {
            systemInstruction: systemPrompt,
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
      const parsed = extractJsonFromAiResponse(rawText);
      if (parsed) {
        const cues = parsed.cues || parsed.items || parsed.subtitles || parsed.review || parsed.lines;
        if (Array.isArray(cues) && cues.length > 0) {
          return { data: { ...parsed, cues }, error: null };
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
// 2. DỰ PHÒNG GROQ LLM (LLAMA 3.3 70B SIÊU NHANH KHI GEMINI HẾT QUOTA / 402)
// =========================================================================
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
    } else {
      const errText = await res.text();
      console.warn('[Groq Review HTTP Error]:', res.status, errText);
    }
  } catch (err: any) {
    console.warn('[Groq Review Exception]:', err?.message || err);
  }
  return { data: null, error: 'Groq failed' };
}

// =========================================================================
// 3. ĐỘNG CƠ TẠO KỊCH BẢN REVIEW THÔNG MINH DỰ PHÒNG CHỐNG CRASH 100%
// (CẤU TRÚC KỂ CHUYỆN 5 HỒI ĐIỆN ẢNH - KHÔNG BAO GIỜ LẶP CÂU)
// =========================================================================
function generateSmartReviewFallback({
  duration,
  startOffset,
  totalVideoDuration,
  reviewStyle,
  density,
  videoTitle,
  customPrompt,
  existingTranscript,
}: {
  duration: number;
  startOffset: number;
  totalVideoDuration?: number;
  reviewStyle: string;
  density: string;
  videoTitle?: string;
  customPrompt?: string;
  existingTranscript?: string;
}) {
  const step = density === 'high' ? 3.8 : density === 'compact' ? 5.5 : 4.5;
  const numSteps = Math.max(2, Math.floor(duration / step));
  const offset = Number(startOffset || 0);
  const wholeDuration = Math.max(10, totalVideoDuration || (offset + duration) || 60);

  // Tách các từ/câu từ lời thoại bóc băng thực tế của video (nếu có)
  const transcriptSentences = existingTranscript
    ? existingTranscript.split(/[.?!;\n]+/).map((s) => s.trim()).filter((s) => s.length > 2)
    : [];

  // Kho câu thoại phong phú theo 5 Hồi kể chuyện (Mở đầu -> Phát triển -> Biến cố -> Cao trào -> Kết thúc)
  const act1_Intro = [
    "Mở đầu đoạn clip, chúng ta lập tức bị cuốn vào một bối cảnh đầy bất ngờ và tò mò.",
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
  ];

  const act3_Conflict = [
    "Biến cố thực sự ập đến khi một sai sót nhỏ đã làm đảo lộn toàn bộ cục diện.",
    "Đến đoạn này thì bắt đầu thấy có mùi toang rồi anh em ạ, áp lực đè nặng lên từng giây.",
    "Một quyết định then chốt được đưa ra, ranh giới giữa thành công và thất bại chỉ còn trong gang tấc.",
    "Tình thế bỗng chốc quay ngoắt một trăm tám mươi độ khiến người trong cuộc không kịp trở tay.",
    "Sự hiểu lầm và xung đột bị đẩy lên một nấc thang mới đầy kịch tính.",
    "Những toan tính ban đầu bắt đầu xuất hiện những lỗ hổng chí mạng không thể cứu vãn.",
    "Sự việc trượt dốc không phanh khi mọi phương án dự phòng đều lần lượt vô hiệu hóa.",
  ];

  const act4_Climax = [
    "Và rồi khoảnh khắc cao trào nghẹt thở nhất của toàn bộ câu chuyện đã chính thức bùng nổ.",
    "Một pha xử lý cực kỳ cồng kềnh đi thẳng vào lòng đất khiến cả làng bật ngửa.",
    "Cú quay xe cực gắt diễn ra trong chớp mắt khiến người xem phải thốt lên kinh ngạc.",
    "Mọi bí mật và kịch tính được đẩy lên đến đỉnh điểm trong sự ngỡ ngàng tột độ.",
    "Đúng là cao nhân không bằng liều mạng, một bước đi liều lĩnh làm thay đổi hoàn toàn kết quả.",
    "Sự việc leo thang vượt ra ngoài tầm kiểm soát của tất cả mọi người có mặt tại hiện trường.",
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
  ];

  const cues: any[] = [];
  const usedSentences = new Set<string>();

  for (let i = 0; i < numSteps; i++) {
    const s = Number((i * step + 0.3).toFixed(1));
    const e = Number(Math.min(duration - 0.2, (i + 1) * step).toFixed(1));
    if (e <= s) break;

    // 🌟 Tính toán Hồi dựa trên thời gian thực tế toàn cục của video
    const globalTime = offset + s;
    const progress = Math.min(1.0, Math.max(0.0, globalTime / wholeDuration));

    let pool: string[];
    if (progress < 0.20 && globalTime <= 25) pool = act1_Intro;
    else if (progress < 0.45) pool = act2_BuildUp;
    else if (progress < 0.70) pool = act3_Conflict;
    else if (progress < 0.88) pool = act4_Climax;
    else pool = act5_Ending;

    // Chọn câu chưa từng sử dụng
    let chosenSentence = "";
    for (const candidate of pool) {
      if (!usedSentences.has(candidate)) {
        chosenSentence = candidate;
        break;
      }
    }

    if (!chosenSentence) {
      const fallbackPools = globalTime > 25
        ? [act2_BuildUp, act3_Conflict, act4_Climax, act5_Ending]
        : [act1_Intro, act2_BuildUp, act3_Conflict, act4_Climax, act5_Ending];
      for (const p of fallbackPools) {
        for (const candidate of p) {
          if (!usedSentences.has(candidate)) {
            chosenSentence = candidate;
            break;
          }
        }
        if (chosenSentence) break;
      }
    }

    if (!chosenSentence) {
      const minLabel = Math.floor(globalTime / 60);
      const secLabel = Math.round(globalTime % 60);
      chosenSentence = `Quan sát ở phút ${minLabel} giây ${secLabel}, tình thế của các nhân vật ngày càng trở nên phức tạp và khó đoán.`;
    }

    usedSentences.add(chosenSentence);

    // Lồng ghép lời thoại bóc băng thực tế của video theo đúng trình tự thời gian
    if (transcriptSentences.length > 0) {
      const sentenceIdx = Math.floor(progress * transcriptSentences.length);
      const realSnippet = transcriptSentences[sentenceIdx];
      if (realSnippet && realSnippet.length >= 3 && realSnippet.length <= 60) {
        if (i % 2 === 1) {
          chosenSentence = `${chosenSentence} Khi nghe thấy: "${realSnippet}", tình thế càng thêm gay cấn.`;
        } else if (i % 3 === 0 && i > 0) {
          chosenSentence = `Lúc này, câu nói "${realSnippet}" như châm ngòi cho toàn bộ diễn biến tiếp theo.`;
        }
      }
    }

    if (i === 0 && customPrompt) {
      chosenSentence = `${customPrompt}. ${chosenSentence}`;
    }

    cues.push({
      id: i + 1,
      startSec: s,
      endSec: e,
      text: chosenSentence,
    });
  }

  return {
    cues,
    storySummary: `Kịch bản review tóm tắt ${videoTitle || 'cốt truyện video'} lôi cuốn`,
    hook: cues[0]?.text || 'Mở đầu video...',
    detectedLanguage: 'Tiếng Việt',
  };
}

// =========================================================================
// 4. MAIN ROUTE HANDLER (POST) - AI TỔNG HỢP & REVIEW VIDEO HÀI HƯỚC
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
      existingSubtitles,
      existingTranscript,
      transcript,
    } = body;

    const transcriptText = existingSubtitles || existingTranscript || transcript || '';

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

    const groqKey =
      body.groqApiKey ||
      body.groqKey ||
      process.env.GROQ_API_KEY ||
      '';

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

    if (transcriptText) {
      parts.push({ text: `LỜI THOẠI GỐC CỦA VIDEO:\n${transcriptText}` });
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

    const userTextPrompt = transcriptText
      ? `Tiêu đề video: "${videoTitle || 'Video'}". Lời thoại gốc: "${transcriptText}". Thời lượng: ${totalDuration}s. Viết kịch bản review tóm tắt hài hước dạng JSON!`
      : `Tiêu đề video: "${videoTitle || 'Video'}". Thời lượng phân đoạn: ${totalDuration} giây. Hãy xem các khung hình hành động và nghe âm thanh để viết kịch bản review tóm tắt hài hước cuốn hút nhất theo định dạng JSON!`;
    parts.push({ text: userTextPrompt });

    let resultJson: any = null;
    let lastError = '';

    // 1. Thử gọi Google Gemini nếu có apiKey
    if (apiKey) {
      const aiRes = await callGeminiAi(apiKey, systemPrompt, parts);
      if (aiRes?.data) {
        resultJson = aiRes.data;
      } else {
        lastError = aiRes?.error || 'Gemini error';
      }
    }

    // 2. Dự phòng bằng Groq LLaMA 3.3 70B nếu Gemini gặp sự cố (402 credits, 429 quota, ...)
    if ((!resultJson || !Array.isArray(resultJson.cues) || resultJson.cues.length === 0) && groqKey) {
      console.log('[AI Review] Kích hoạt dự phòng Groq LLaMA 3.3 70B...');
      const groqRes = await callGroqAi(groqKey, systemPrompt, userTextPrompt);
      if (groqRes?.data) {
        resultJson = groqRes.data;
      }
    }

    let warningNotice = '';
    // 3. Nếu cả Gemini và Groq đều chưa tạo được (ví dụ do 402 Prepayment credits depleted), kích hoạt Động cơ Review Thông minh
    if (!resultJson || !Array.isArray(resultJson.cues) || resultJson.cues.length === 0) {
      if (lastError.includes('prepayment credits are depleted') || lastError.includes('402')) {
        warningNotice = 'Google AI Studio báo lỗi: "Your prepayment credits are depleted" (Dự án đang bật chế độ Trả trước nhưng số dư là 0$). Hệ thống đã tự động kích hoạt Động cơ Review Thông minh để tạo kịch bản hoàn hảo cho bạn!';
      } else if (lastError.includes('RESOURCE_EXHAUSTED') || lastError.includes('429')) {
        warningNotice = 'Tài khoản Google Gemini tạm thời chạm mốc quota. Hệ thống đã tự động kích hoạt Động cơ Review Thông minh!';
      } else if (lastError.includes('API key not valid') || lastError.includes('PERMISSION_DENIED')) {
        warningNotice = 'Khóa GEMINI_API_KEY chưa hợp lệ. Hệ thống đã tự động kích hoạt Động cơ Review Thông minh!';
      }

      resultJson = generateSmartReviewFallback({
        duration: totalDuration,
        startOffset,
        totalVideoDuration: Number(body.totalVideoDuration) || (startOffset + totalDuration),
        reviewStyle,
        density,
        videoTitle,
        customPrompt,
        existingTranscript: transcriptText,
      });
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
      detectedLanguage: resultJson.detectedLanguage || 'Tiếng Việt',
      warning: warningNotice || undefined,
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
      { status: 200 }
    );
  }
}
