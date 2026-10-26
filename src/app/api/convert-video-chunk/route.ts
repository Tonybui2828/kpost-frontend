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
    // ĐÃ NHẬN ĐỦ 100% -> BẮT ĐẦU CHUYỂN MÃ TRONG NỀN (CHỐNG LỖI 524 CLOUDFLARE)
    // ==========================================
    console.log(`[Chunked Upload] Đã nhận đủ ${totalChunks} chunks cho file ${sanitizedId}. Khởi động FFmpeg H.264 trong nền...`);

    const publicVideosDir = path.join(process.cwd(), 'public', 'videos');
    if (!fs.existsSync(publicVideosDir)) {
      await fs.promises.mkdir(publicVideosDir, { recursive: true });
    }

    const outputFileName = `converted_${sanitizedId}.mp4`;
    const outputPath = path.join(publicVideosDir, outputFileName);
    const jobFilePath = path.join(os.tmpdir(), `job_${sanitizedId}.json`);

    // Ghi nhận trạng thái bắt đầu xử lý vào job file
    await fs.promises.writeFile(
      jobFilePath,
      JSON.stringify({ status: 'processing', startTime: Date.now(), fileId: sanitizedId }),
      'utf-8'
    );

    let ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
      if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
        ffmpegPath = ffmpegInstaller.path;
      }
    } catch {}

    // Tham số FFmpeg tối ưu: ultrafast, fastdecode, giữ nguyên audio không re-encode (-c:a copy) giúp chạy nhanh gấp 5 lần
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
      '-tune',
      'fastdecode',
      '-crf',
      '26',
      '-threads',
      '0',
      '-c:a',
      'copy',
      '-movflags',
      '+faststart',
      outputPath,
    ];

    // Chạy FFmpeg hoàn toàn trong nền, KHÔNG chặn kết nối HTTP (loại bỏ hoàn toàn lỗi 524 của Cloudflare)
    const ff = spawn(ffmpegPath, args);
    let errLog = '';
    ff.stderr?.on('data', (d) => {
      errLog += d.toString();
    });

    ff.on('close', async (code) => {
      if (code === 0) {
        console.log(`[FFmpeg Async Done] File ${outputFileName} đã chuyển mã thành công!`);
        await fs.promises.writeFile(
          jobFilePath,
          JSON.stringify({
            status: 'completed',
            videoUrl: `/videos/${outputFileName}`,
            message: 'Chuyển đổi thành công sang chuẩn MP4 H.264!',
          }),
          'utf-8'
        );
        fs.unlink(tmpInputPath, () => {});
      } else {
        console.warn(`[FFmpeg Async Warning Code ${code}]. Thử fallback re-encode audio...`);
        // Nếu copy audio lỗi (do codec lạ), chạy fallback transcode audio bằng AAC
        const fallbackArgs = [
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
        const ffFallback = spawn(ffmpegPath, fallbackArgs);
        let fbLog = '';
        ffFallback.stderr?.on('data', (d) => {
          fbLog += d.toString();
        });
        ffFallback.on('close', async (fbCode) => {
          if (fbCode === 0) {
            await fs.promises.writeFile(
              jobFilePath,
              JSON.stringify({
                status: 'completed',
                videoUrl: `/videos/${outputFileName}`,
                message: 'Chuyển đổi thành công sang chuẩn MP4 H.264!',
              }),
              'utf-8'
            );
          } else {
            console.error('[FFmpeg Fallback Failed]', fbLog);
            await fs.promises.writeFile(
              jobFilePath,
              JSON.stringify({
                status: 'error',
                error: `Lỗi chuyển mã FFmpeg (mã ${fbCode}): ${fbLog.slice(-200)}`,
              }),
              'utf-8'
            );
          }
          fs.unlink(tmpInputPath, () => {});
        });
      }
    });

    ff.on('error', async (err: any) => {
      console.error('[FFmpeg Process Error]', err);
      await fs.promises.writeFile(
        jobFilePath,
        JSON.stringify({
          status: 'error',
          error:
            err.code === 'ENOENT'
              ? 'Máy chủ chưa được cài đặt FFmpeg. Vui lòng cài FFmpeg trên VPS!'
              : err.message,
        }),
        'utf-8'
      );
      fs.unlink(tmpInputPath, () => {});
    });

    // Trả về ngay lập tức với jobId để trình duyệt bắt đầu kiểm tra tiến trình (Polling)
    return NextResponse.json({
      success: true,
      jobId: sanitizedId,
      isDone: true,
      status: 'processing',
      message: 'Đã nhận đủ file, đang chuyển mã MP4 H.264...',
    });
  } catch (err: any) {
    console.error('[Convert Video Chunk Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi xử lý và chuyển mã video' },
      { status: 500 }
    );
  }
}
