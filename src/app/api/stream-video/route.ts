import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');
    if (!targetUrl) return new NextResponse('Missing url parameter', { status: 400 });

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    };
    const range = req.headers.get('range');
    if (range) headers['range'] = range;
    if (targetUrl.includes('douyin.com')) headers['Referer'] = 'https://www.douyin.com/';

    const upstream = await fetch(targetUrl, { headers });
    if (!upstream.ok && upstream.status !== 206) {
      return new NextResponse(`Upstream error: ${upstream.statusText}`, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'video/mp4';
    if (contentType.includes('text/html')) {
      return new NextResponse(JSON.stringify({ error: 'Link là trang HTML, không phải file video' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resHeaders = new Headers();
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Accept-Ranges', 'bytes');
    resHeaders.set('Content-Type', contentType);
    const cl = upstream.headers.get('content-length');
    if (cl) resHeaders.set('Content-Length', cl);

    return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders });
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}