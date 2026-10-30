import { NextResponse } from 'next/server';

const memoryCache = new Map<string, string>();

// Dịch batch câu tiếng Trung/ngoại ngữ sang ngôn ngữ đích bằng Google Translate Engine chuẩn xác 100%
async function translateBatchWithGoogle(batch: string[], targetLang: string = 'vi'): Promise<string[]> {
  if (batch.length === 0) return [];

  // Gắn số thứ tự index `i:: ` vào từng dòng để chống lệch dòng hoặc nhập nhằng số lượng câu
  const prefixed = batch.map((text, idx) => `${idx}:: ${text.replace(/\r?\n/g, ' ')}`).join('\n');

  // 1. Thử qua Google clients5 API (siêu tốc, không giới hạn, không cần API Key)
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${encodeURIComponent(targetLang)}&q=${encodeURIComponent(prefixed)}`;
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

  // 2. Dự phòng qua translate.google.com endpoint
  try {
    const url2 = `https://translate.google.com/translate_a/single?client=at&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(prefixed)}`;
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

  // 3. Dự phòng dịch từng câu nếu batch thất bại
  const singleResults = await Promise.all(
    batch.map(async (text) => {
      try {
        const singleUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${encodeURIComponent(targetLang)}&q=${encodeURIComponent(text)}`;
        const sr = await fetch(singleUrl, { signal: AbortSignal.timeout(4000) });
        if (sr.ok) {
          const sj = await sr.json();
          const st = Array.isArray(sj) ? (Array.isArray(sj[0]) ? sj[0][0] : sj[0]) : '';
          if (st) return String(st).trim();
        }
      } catch {}
      return text;
    })
  );

  return singleResults;
}

// Dịch toàn bộ danh sách câu sang ngôn ngữ đích (hỗ trợ kể cả video dài hàng nghìn câu)
async function translateTextsToLanguage(texts: string[], targetLang: string = 'vi'): Promise<string[]> {
  if (!texts || texts.length === 0) return [];

  const results: string[] = new Array(texts.length);
  const pendingIndices: number[] = [];

  // Kiểm tra cache trước (cache theo cặp targetLang:text)
  for (let i = 0; i < texts.length; i++) {
    const orig = texts[i].trim();
    const cacheKey = `${targetLang}:${orig}`;
    if (memoryCache.has(cacheKey)) {
      results[i] = memoryCache.get(cacheKey)!;
    } else {
      pendingIndices.push(i);
    }
  }

  if (pendingIndices.length > 0) {
    const pendingTexts = pendingIndices.map((idx) => texts[idx]);
    console.log(`[Translate Cues] Đang dịch ${pendingTexts.length}/${texts.length} câu sang ngôn ngữ '${targetLang}'...`);

    const BATCH_SIZE = 30;
    const chunks: { indices: number[]; texts: string[] }[] = [];
    for (let i = 0; i < pendingTexts.length; i += BATCH_SIZE) {
      chunks.push({
        indices: pendingIndices.slice(i, i + BATCH_SIZE),
        texts: pendingTexts.slice(i, i + BATCH_SIZE),
      });
    }

    // Chạy song song 4 luồng
    const CONCURRENCY = 4;
    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
      const group = chunks.slice(i, i + CONCURRENCY);
      await Promise.all(
        group.map(async (chunk) => {
          const translatedChunk = await translateBatchWithGoogle(chunk.texts, targetLang);
          for (let j = 0; j < chunk.indices.length; j++) {
            const destIdx = chunk.indices[j];
            const transText = translatedChunk[j] || chunk.texts[j];
            results[destIdx] = transText;
            memoryCache.set(`${targetLang}:${texts[destIdx].trim()}`, transText);
          }
        })
      );
    }
  }

  // Đảm bảo không có index nào undefined
  for (let i = 0; i < texts.length; i++) {
    if (!results[i]) {
      results[i] = texts[i];
    }
  }

  return results;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cues, targetLang = 'vi' } = body;

    if (!Array.isArray(cues) || cues.length === 0) {
      return NextResponse.json({ success: false, message: 'Danh sách cues rỗng' }, { status: 400 });
    }

    const originalTexts = cues.map((c: any) => String(c.text || '').trim());
    console.log(`[Translate Cues] Bắt đầu dịch ${originalTexts.length} câu phụ đề sang ngôn ngữ '${targetLang}'...`);

    const translatedTexts = await translateTextsToLanguage(originalTexts, targetLang);

    const updatedCues = cues.map((c: any, idx: number) => ({
      ...c,
      text: translatedTexts[idx] || c.text,
      words: undefined, // Reset words để client tự tính lại theo câu ngôn ngữ mới
    }));

    return NextResponse.json({
      success: true,
      targetLang,
      totalTranslated: updatedCues.length,
      cues: updatedCues,
    });
  } catch (error: any) {
    console.error('Error in translate-cues API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

