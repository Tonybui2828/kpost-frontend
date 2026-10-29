import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId') || searchParams.get('jobId') || searchParams.get('id');

    if (!fileId) {
      return new NextResponse('Missing fileId parameter', { status: 400 });
    }

    const sanitizedId = fileId.replace(/[^a-zA-Z0-9_-]/g, '');

    // Tìm kiếm file video đã chuyển mã ở các thư mục khả dĩ
    const candidatePaths = [
      path.join(os.tmpdir(), `converted_${sanitizedId}.mp4`),
      path.join(process.cwd(), 'public', 'videos', `converted_${sanitizedId}.mp4`),
      path.join(os.tmpdir(), `output_h264_${sanitizedId}.mp4`),
    ];

    let foundPath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const stats = fs.statSync(p);
          if (stats.size > 1024) {
            foundPath = p;
            break;
          }
        } catch {}
      }
    }

    if (!foundPath) {
      return new NextResponse(
        JSON.stringify({ error: 'Video đang được chuyển mã hoặc không tìm thấy file.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stat = fs.statSync(foundPath);
    const fileSize = stat.size;
    const range = req.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        return new NextResponse('Requested range not satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }

      const chunksize = end - start + 1;
      const stream = fs.createReadStream(foundPath, { start, end });
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': 'video/mp4',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    const fullStream = fs.createReadStream(foundPath);
    const webStream = new ReadableStream({
      start(controller) {
        fullStream.on('data', (chunk) => controller.enqueue(chunk));
        fullStream.on('end', () => controller.close());
        fullStream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('[converted-video streaming error]:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
