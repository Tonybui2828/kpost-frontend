import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let inputBuffer: Buffer | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const url = formData.get('url') as string | null;

      if (file && typeof file.arrayBuffer === 'function') {
        const arr = await file.arrayBuffer();
        inputBuffer = Buffer.from(arr);
      } else if (url) {
        const fetchRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
            ...(url.includes('douyin.com') ? { Referer: 'https://www.douyin.com/' } : {}),
          },
        });
        if (fetchRes.ok) inputBuffer = Buffer.from(await fetchRes.arrayBuffer());
      }
    } else {
      const body = await req.json().catch(() => ({}));
      if (body?.url) {
        const fetchRes = await fetch(body.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
            ...(body.url.includes('douyin.com') ? { Referer: 'https://www.douyin.com/' } : {}),
          },
        });
        if (fetchRes.ok) inputBuffer = Buffer.from(await fetchRes.arrayBuffer());
      }
    }

    if (!inputBuffer || inputBuffer.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy dữ liệu video' }, { status: 400 });
    }

    const tmpInput = path.join(os.tmpdir(), `in_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`);
    const tmpOutput = path.join(os.tmpdir(), `out_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`);

    await fs.promises.writeFile(tmpInput, inputBuffer);

    // Chuyển mã H.264 (yuv420p) + AAC siêu tốc
    await new Promise<void>((resolve, reject) => {
      const ff = spawn('ffmpeg', [
        '-y', '-i', tmpInput,
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart',
        tmpOutput
      ]);
      let errLog = '';
      ff.stderr.on('data', (d) => { errLog += d.toString(); });
      ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(errLog.slice(-300)))));
      ff.on('error', reject);
    });

    const outputBuffer = await fs.promises.readFile(tmpOutput);
    fs.unlink(tmpInput, () => {});
    fs.unlink(tmpOutput, () => {});

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': outputBuffer.length.toString(),
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': 'inline; filename="converted_h264.mp4"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi chuyển đổi video' }, { status: 500 });
  }
}