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

    // Ghi nối tiếp từng phần 5MB vào file tạm
    if (chunkIndex === 0) {
      await fs.promises.writeFile(tmpInputPath, chunkBuffer);
    } else {
      await fs.promises.appendFile(tmpInputPath, chunkBuffer);
    }

    // Nếu chưa phải phần cuối cùng, báo thành công để client gửi phần tiếp theo
    if (chunkIndex < totalChunks - 1) {
      return NextResponse.json({ success: true, chunkIndex, totalChunks, isDone: false });
    }

    // ==========================================
    // ĐÃ NHẬN ĐỦ 100% -> CHUYỂN MÃ SANG MP4 H.264
    // ==========================================
    console.log(`[Chunked Upload] Đã nhận đủ ${totalChunks} chunks cho file ${sanitizedId}. Bắt đầu chuyển mã FFmpeg H.264...`);

    // Tạo thư mục static public/videos để lưu file video đã chuyển mã (tránh quá tải RAM)
    const publicVideosDir = path.join(process.cwd(), 'public', 'videos');
    if (!fs.existsSync(publicVideosDir)) {
      await fs.promises.mkdir(publicVideosDir, { recursive: true });
    }

    const outputFileName = `converted_${sanitizedId}.mp4`;
    const outputPath = path.join(publicVideosDir, outputFileName);

    // Đường dẫn FFmpeg (tìm theo biến môi trường, @ffmpeg-installer/ffmpeg hoặc system PATH)
    let ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
      if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
        ffmpegPath = ffmpegInstaller.path;
      }
    } catch {}

    // Chạy ffmpeg chuyển mã sang H.264 (libx264, yuv420p) + AAC siêu tốc
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
      '26',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputPath,
    ];

    await new Promise<void>((resolve, reject) => {
      const ff = spawn(ffmpegPath, args);
      let errLog = '';
      ff.stderr.on('data', (d) => {
        errLog += d.toString();
      });
      ff.on('close', (code) => {
        if (code === 0) resolve();
        else {
          console.error('[FFmpeg Error Code]', code, errLog);
          reject(new Error(`Lỗi FFmpeg (mã ${code}): ${errLog.slice(-250)}`));
        }
      });
      ff.on('error', (err: any) => {
        if (err.code === 'ENOENT') {
          reject(
            new Error(
              'Máy chủ chưa được cài đặt FFmpeg. Vui lòng chạy lệnh: npm install @ffmpeg-installer/ffmpeg trên server!'
            )
          );
        } else {
          reject(err);
        }
      });
    });

    // Dọn dẹp file tạm
    fs.unlink(tmpInputPath, () => {});

    // Trả về URL video tĩnh để trình duyệt phát mượt mà không bị nghẽn RAM
    return NextResponse.json({
      success: true,
      videoUrl: `/videos/${outputFileName}`,
      message: 'Chuyển đổi thành công sang chuẩn MP4 H.264!',
    });
  } catch (err: any) {
    console.error('[Convert Video Chunk Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi xử lý và chuyển mã video' },
      { status: 500 }
    );
  }
}
