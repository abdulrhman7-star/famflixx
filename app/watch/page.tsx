import type { Metadata } from 'next';
import WatchClientPlayer from '@/components/WatchClientPlayer';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const rawUrl = typeof params.url === 'string' ? params.url : '';
  const title = typeof params.title === 'string' ? params.title : 'مشاهدة وتحميل';
  const image = typeof params.image === 'string' ? params.image : '';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moviey.app';
  const embedUrl = `${siteUrl}/embed?url=${encodeURIComponent(rawUrl)}&title=${encodeURIComponent(title)}&autoplay=1`;
  const canonicalUrl = `${siteUrl}/watch?url=${encodeURIComponent(rawUrl)}`;
  const description = `شاهد وتحميل ${title} بأعلى جودة وبدون إعلانات عبر البث المباشر المباشر والسريع.`;

  return {
    title: `${title} | FamFlix`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'video.episode' as any,
      title: `${title} - مشاهدة أونلاين`,
      description,
      url: canonicalUrl,
      images: image
        ? [
            {
              url: image,
              width: 830,
              height: 506,
              alt: title,
            },
          ]
        : [],
      videos: [
        {
          url: embedUrl,
          width: 1280,
          height: 720,
          type: 'text/html',
        },
      ],
    },
    twitter: {
      card: 'player',
      title: `${title} - مشاهدة أونلاين`,
      description,
      images: image ? [image] : [],
      players: [
        {
          playerUrl: embedUrl,
          streamUrl: embedUrl,
          width: 1280,
          height: 720,
        },
      ],
    },
  };
}

export default async function WatchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawUrl = typeof params.url === 'string' ? params.url : '';
  const title = typeof params.title === 'string' ? params.title : 'مشاهدة الفيديو';
  const image = typeof params.image === 'string' ? params.image : '';

  return <WatchClientPlayer initialUrl={rawUrl} title={title} image={image} />;
}
