import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Thiếu jobId' }, { status: 400 });
    }

    const sanitizedId = jobId.replace(/[^a-zA-Z0-9_-]/g, '');
    const jobFilePath = path.join(os.tmpdir(), `job_${sanitizedId}.json`);
    const outputFileName = `converted_${sanitizedId}.mp4`;
    const outputPath = path.join(process.cwd(), 'public', 'videos', outputFileName);

    // Kiểm tra xem file video đầu ra đã hoàn tất chưa
    if (fs.existsSync(outputPath)) {
      try {
        const stats = fs.statSync(outputPath);
        if (stats.size > 1024) {
          return NextResponse.json({
            status: 'completed',
            videoUrl: `/videos/${outputFileName}`,
            message: 'Chuyển đổi thành công sang chuẩn MP4 H.264!',
          });
        }
      } catch {}
    }

    // Đọc trạng thái từ file job JSON
    if (fs.existsSync(jobFilePath)) {
      try {
        const content = await fs.promises.readFile(jobFilePath, 'utf-8');
        const jobData = JSON.parse(content);
        return NextResponse.json(jobData);
      } catch {}
    }

    return NextResponse.json({
      status: 'processing',
      message: 'Hệ thống đang chuyển mã video...',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
