import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Metadata } from 'next';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  if (typeof window !== 'undefined') return path;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${path}`;
  return `http://localhost:3000${path}`;
}

export function constructMetadata({
  title = "YouLearnNow – Instantly Summarize YouTube Videos with AI",
  description = "YouLearnNow transforms YouTube videos into clear, actionable summaries using AI. Learn faster, skip the fluff, and take action with ease. No subscription required.",
  image = "/thumbnail.png",
  icons = "/favicon.ico",
  noIndex = false
}: {
  title?: string
  description?: string
  image?: string
  icons?: string
  noIndex?: boolean
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@YasKTechTips"
    },
    icons,
    metadataBase: new URL('https://youlearnnow.com'),
    themeColor: '#000', 
    ...(noIndex && {
      robots: {
        index: false,
        follow: false
      }
    })
  }
}
