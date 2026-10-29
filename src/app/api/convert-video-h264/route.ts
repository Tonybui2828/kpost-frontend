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
    let filename = 'video.mp4';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const url = formData.get('url') as string | null;

      if (file && typeof file.arrayBuffer === 'function') {
        const arr = await file.arrayBuffer();
        inputBuffer = Buffer.from(arr);
        filename = file.name || 'video.mp4';
      } else if (url && typeof url === 'string') {
        const headers: Record<string, string> = {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };
        if (url.includes('douyin.com')) headers['Referer'] = 'https://www.douyin.com/';
        const fetchRes = await fetch(url, { headers });
        if (fetchRes.ok) {
          const arr = await fetchRes.arrayBuffer();
          inputBuffer = Buffer.from(arr);
        }
      }
    } else {
      // JSON with url
      const body = await req.json().catch(() => ({}));
      const url = body?.url;
      if (url) {
        const headers: Record<string, string> = {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };
        if (url.includes('douyin.com')) headers['Referer'] = 'https://www.douyin.com/';
        const fetchRes = await fetch(url, { headers });
        if (fetchRes.ok) {
          const arr = await fetchRes.arrayBuffer();
          inputBuffer = Buffer.from(arr);
        }
      }
    }

    if (!inputBuffer || inputBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy dữ liệu video để chuyển đổi sang H.264' },
        { status: 400 }
      );
    }

    const tmpInputPath = path.join(
      os.tmpdir(),
      `input_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`
    );
    const tmpOutputPath = path.join(
      os.tmpdir(),
      `output_h264_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`
    );

    await fs.promises.writeFile(tmpInputPath, inputBuffer);

    // Chạy ffmpeg chuyển mã sang H.264 (libx264, yuv420p) + AAC tương thích 100% mọi trình duyệt
    const args = [
      '-y',
      '-i',
      tmpInputPath,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-preset',
      'ultrafast',
      '-crf',
      '23',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      tmpOutputPath,
    ];

    let ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
      if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
        ffmpegPath = ffmpegInstaller.path;
      }
    } catch {}

    await new Promise<void>((resolve, reject) => {
      const ff = spawn(ffmpegPath, args);
      let errLog = '';
      ff.stderr.on('data', (d) => {
        errLog += d.toString();
      });
      ff.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg error code ${code}: ${errLog.slice(-300)}`));
      });
      ff.on('error', (err) => reject(err));
    });

    const outputBuffer = await fs.promises.readFile(tmpOutputPath);

    fs.unlink(tmpInputPath, () => {});
    fs.unlink(tmpOutputPath, () => {});

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
    console.error('[Convert Video H264 Next.js Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi chuyển đổi video sang chuẩn H.264' },
      { status: 500 }
    );
  }
}
