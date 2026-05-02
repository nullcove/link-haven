import { Clock } from "lucide-react";

function estimateReadingTime(url: string, title: string): number {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be") || urlLower.includes("vimeo.com")) return 0;
  if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) return 1;
  if (urlLower.match(/\.(pdf|doc|docx)$/)) return 15;
  if (urlLower.includes("medium.com") || urlLower.includes("substack.com") || urlLower.includes("blog")) return 6;
  if (urlLower.includes("github.com") || urlLower.includes("docs.")) return 8;
  const words = title.split(" ").length;
  return Math.max(2, Math.min(12, Math.ceil(words * 0.3)));
}

interface ReadingTimeProps {
  url: string;
  title: string;
  readingTime?: number | null;
  className?: string;
}

export function ReadingTime({ url, title, readingTime, className = "" }: ReadingTimeProps) {
  const urlLower = url.toLowerCase();
  const isVideo = urlLower.includes("youtube.com") || urlLower.includes("youtu.be") || urlLower.includes("vimeo.com");

  if (isVideo) return null;

  const minutes = readingTime ?? estimateReadingTime(url, title);
  if (minutes <= 0) return null;

  return (
    <span className={`flex items-center gap-1 text-[10px] text-white/25 ${className}`}>
      <Clock className="size-2.5" />
      {minutes} min
    </span>
  );
}
