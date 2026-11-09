import { NextRequest, NextResponse } from 'next/server';

const RAW_ENV_TOKEN = process.env.TMDB_ACCESS_TOKEN?.trim();
const FALLBACK_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNjBmMDc1Y2YzNmM2ZGZiMTM2YzNjMGFlNTY0ZDQ2MSIsIm5iZiI6MTc4NjkxNDAzNC4xMjgsInN1YiI6IjZhODIyNGYyMjYxNDgxNDlkZTc2OGM1MiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.h-UBf7qsxc6caT3NTjZ4qBpeOqMhzndlqISR1W_79V8';

const TMDB_ACCESS_TOKEN =
  RAW_ENV_TOKEN && RAW_ENV_TOKEN.split('.').length === 3
    ? RAW_ENV_TOKEN
    : FALLBACK_TOKEN;

const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = Array.isArray(path) ? path.join('/') : path || '';
    const searchParams = req.nextUrl.search || '';

    const targetUrl = `${TMDB_BASE}/${pathString}${searchParams}`;

    const res = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { error: `TMDB request failed with status ${res.status}`, details: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('TMDB API Proxy Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to proxy request to TMDB' },
      { status: 500 }
    );
  }
}
