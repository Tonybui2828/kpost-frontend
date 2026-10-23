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

    // Nếu chưa phải phần cuối cùng, báo client gửi tiếp
    if (chunkIndex < totalChunks - 1) {
      return NextResponse.json({ success: true, chunkIndex, totalChunks, isDone: false });
    }

    // ========================================================
    // ĐÃ NHẬN ĐỦ TOÀN BỘ CÁC PHẦN -> CHUYỂN MÃ SANG MP4 H.264
    // ========================================================
    const tmpOutputPath = path.join(os.tmpdir(), `chunked_out_${sanitizedId}.mp4`);

    const args = [
      '-y',
      '-i', tmpInputPath,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'ultrafast',
      '-crf', '24',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      tmpOutputPath,
    ];

    await new Promise<void>((resolve, reject) => {
      const ff = spawn('ffmpeg', args);
      let errLog = '';
      ff.stderr.on('data', (d) => { errLog += d.toString(); });
      ff.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg error code ${code}: ${errLog.slice(-300)}`));
      });
      ff.on('error', (err) => reject(err));
    });

    const outputBuffer = await fs.promises.readFile(tmpOutputPath);

    // Dọn dẹp file tạm
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
    console.error('[Convert Video Chunk Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi xử lý và chuyển mã video' },
      { status: 500 }
    );
  }
}