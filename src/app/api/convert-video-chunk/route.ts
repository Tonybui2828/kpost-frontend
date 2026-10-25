import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 phút

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileId = formData.get('fileId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string, 10);
    const totalChunks = parseInt(formData.get('totalChunks') as string, 10);
    const chunk = formData.get('chunk') as File | null;

    if (!fileId || isNaN(chunkIndex) || isNaN(totalChunks) || !chunk) {
      return NextResponse.json({ error: 'Thiếu thông tin chunk upload' }, { status: 400 });
    }

    const sanitizedId = fileId.replace(/[^a-zA-Z0-9_-]/g, '');
    const tmpInputPath = path.join(os.tmpdir(), `chunked_in_${sanitizedId}.tmp`);

    const chunkArrayBuffer = await chunk.arrayBuffer();
    const chunkBuffer = Buffer.from(chunkArrayBuffer);

    if (chunkIndex === 0) {
      await fs.promises.writeFile(tmpInputPath, chunkBuffer);
    } else {
      await fs.promises.appendFile(tmpInputPath, chunkBuffer);
    }

    if (chunkIndex < totalChunks - 1) {
      return NextResponse.json({ success: true, chunkIndex, totalChunks, isDone: false });
    }

    // ĐÃ NHẬN ĐỦ 100% -> CHUYỂN MÃ SANG MP4 H.264
    console.log(`[Chunked Upload] Đã nhận đủ ${totalChunks} chunks. Bắt đầu chuyển mã FFmpeg H.264...`);

    const publicVideosDir = path.join(process.cwd(), 'public', 'videos');
    if (!fs.existsSync(publicVideosDir)) {
      await fs.promises.mkdir(publicVideosDir, { recursive: true });
    }

    const outputFileName = `converted_${sanitizedId}.mp4`;
    const outputPath = path.join(publicVideosDir, outputFileName);

    let ffmpegPath = 'ffmpeg';
    try {
      // @ts-ignore
      const installer = require('@ffmpeg-installer/ffmpeg');
      if (installer && installer.path) {
        ffmpegPath = installer.path;
      }
    } catch {}

    const args = [
      '-y',
      '-i', tmpInputPath,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'ultrafast',
      '-crf', '26',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputPath,
    ];

    await new Promise<void>((resolve, reject) => {
      const ff = spawn(ffmpegPath, args);
      let errLog = '';
      ff.stderr.on('data', (d) => { errLog += d.toString(); });
      ff.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Lỗi FFmpeg mã ${code}: ${errLog.slice(-250)}`));
      });
      ff.on('error', (err: any) => {
        if (err.code === 'ENOENT') {
          reject(new Error('Máy chủ chưa có FFmpeg. Chạy lệnh: npm install @ffmpeg-installer/ffmpeg'));
        } else {
          reject(err);
        }
      });
    });

    fs.unlink(tmpInputPath, () => {});

    // Trả về link video tĩnh để phát mượt mà, không bao giờ bị nghẽn RAM lỗi 500
    return NextResponse.json({
      success: true,
      videoUrl: `/videos/${outputFileName}`,
      message: 'Chuyển đổi thành công!',
    });
  } catch (err: any) {
    console.error('[Convert Video Chunk Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi xử lý và chuyển mã video' },
      { status: 500 }
    );
  }
}