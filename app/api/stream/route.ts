import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return NextResponse.json({ success: false, error: 'رابط الفيديو مطلوب' }, { status: 400 });
  }

  try {
    const upstreamHeaders: Record<string, string> = {
      'Referer': 'https://akwam.ss/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*'
    };

    // Forward Range header if present for seamless seeking and buffer chunks
    const range = request.headers.get('range');
    if (range) {
      upstreamHeaders['Range'] = range;
    }

    const response = await fetch(videoUrl, {
      headers: upstreamHeaders,
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!response.ok && response.status !== 206) {
      console.warn(`Upstream streaming server returned ${response.status} for ${videoUrl}.`);
      return new Response(
        JSON.stringify({ 
          error: `خادم البث أعاد الحالة: ${response.status} (${response.statusText}). قد يكون الرابط المؤقت منتهي الصلاحية، يرجى إعادة تحديث الصفحة لتوليد رابط جديد.`,
          expired: response.status === 500 || response.status === 404 || response.status === 403,
          upstreamStatus: response.status 
        }), 
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const responseHeaders = new Headers();
    
    // Determine proper video MIME type for in-browser playback
    let contentType = 'video/mp4';
    const lowerUrl = videoUrl.toLowerCase();
    if (lowerUrl.includes('.webm')) {
      contentType = 'video/webm';
    } else if (lowerUrl.includes('.m3u8')) {
      contentType = 'application/x-mpegURL';
    } else if (lowerUrl.includes('.mkv')) {
      contentType = 'video/mp4';
    } else {
      const upstreamType = response.headers.get('content-type');
      if (upstreamType && upstreamType.startsWith('video/')) {
        contentType = upstreamType;
      }
    }

    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Content-Disposition', 'inline');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Accept-Ranges', 'bytes');
    
    // CRITICAL: Prevent Vercel / Next.js / CDNs from compressing video stream (gzip/brotli buffering)
    responseHeaders.set('Cache-Control', 'no-cache, no-transform');

    if (response.headers.has('content-length')) {
      responseHeaders.set('Content-Length', response.headers.get('content-length') as string);
    }
    if (response.headers.has('content-range')) {
      responseHeaders.set('Content-Range', response.headers.get('content-range') as string);
    }

    // Do NOT forward Content-Encoding (e.g. gzip) to ensure raw video stream passthrough
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error('Streaming error for URL', videoUrl, error);
    return new Response('فشل في تشغيل الفيديو', { status: 500 });
  }
}
