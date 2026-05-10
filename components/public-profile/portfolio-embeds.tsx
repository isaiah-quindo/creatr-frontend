"use client";

import { memo, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import type { PublicPortfolioItem } from "@/lib/api";
import { cx } from "@/utils/cx";

type Orientation = "portrait" | "landscape" | "square";

// Hoisted so the iframe `style` prop has a stable reference across renders —
// TikTok's player can re-init when its container's size mutates, and a fresh
// object literal in JSX is one less thing to worry about.
const TIKTOK_IFRAME_STYLE: React.CSSProperties = {
  top: "-4px",
  height: "calc(100% + 200px)",
};

/**
 * Renders the portfolio as a horizontal swipe carousel.
 *
 * - YouTube: oEmbed returns an `<iframe>`, drop in via dangerouslySetInnerHTML.
 *   `/shorts/...` URLs are portrait, regular videos are landscape (16:9).
 * - TikTok: when the URL has a numeric video id (`/video/<id>`), embed it
 *   directly via TikTok's `embed/v2` iframe. For shortlinks (`vm.tiktok.com`)
 *   without an id, fall back to the oEmbed `<blockquote>` + embed.js script.
 * - Instagram: embedded via the token-free `/{p|reel|tv}/{shortcode}/embed/`
 *   iframe. The iframe always includes IG's chrome (header + caption), so we
 *   give it a fixed tall height instead of an aspect ratio.
 * - Uploaded images / videos: rendered directly.
 */
export function PortfolioEmbeds({ items }: { items: PublicPortfolioItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!items.length) return null;

  function scrollBySlide(dir: 1 | -1) {
    const el = containerRef.current;
    if (!el) return;
    const slide = el.firstElementChild as HTMLElement | null;
    if (!slide) return;
    const slideWidth = slide.getBoundingClientRect().width;
    const gap = 16; // gap-4
    el.scrollBy({ left: dir * (slideWidth + gap), behavior: "smooth" });
  }

  const showArrows = items.length > 1;

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="-mx-5 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto overflow-y-hidden scroll-px-5 px-5 pb-2 @sm:-mx-8 @sm:scroll-px-8 @sm:px-8 no-scrollbar"
      >
        {items.map((item) => (
          <PortfolioSlide key={item.id} item={item} />
        ))}
      </div>

      {showArrows && (
        <>
          <CarouselButton dir="prev" onClick={() => scrollBySlide(-1)} />
          <CarouselButton dir="next" onClick={() => scrollBySlide(1)} />
        </>
      )}
    </div>
  );
}

function CarouselButton({
  dir,
  onClick,
}: {
  dir: "prev" | "next";
  onClick: () => void;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous" : "Next"}
      className={cx(
        // Hidden on phone-width containers (real phones + dashboard preview);
        // shown once the carousel is wide enough that swiping is awkward.
        "hidden @md:flex",
        "absolute top-1/2 z-10 size-10 -translate-y-1/2 items-center justify-center",
        "rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg)]/90 text-[var(--theme-text)] shadow-md backdrop-blur-sm",
        "transition hover:opacity-90 active:scale-95",
        dir === "prev" ? "left-2" : "right-2",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

function PortfolioSlide({ item }: { item: PublicPortfolioItem }) {
  const orientation = detectOrientation(item);

  // Each slide takes the full container width; the inner card is sized by
  // orientation so portrait clips don't get stretched into a 16:9 box.
  const innerMaxWidth =
    orientation === "portrait"
      ? "max-w-[340px]"
      : orientation === "square"
        ? "max-w-[480px]"
        : "max-w-full";

  return (
    <div className="flex shrink-0 basis-full snap-start justify-center">
      <div className={cx("flex w-full flex-col", innerMaxWidth)}>
        <PortfolioCard item={item} orientation={orientation} />
      </div>
    </div>
  );
}

const PortfolioCard = memo(function PortfolioCard({
  item,
  orientation,
}: {
  item: PublicPortfolioItem;
  orientation: Orientation;
}) {
  const aspectClass =
    orientation === "portrait"
      ? "aspect-[9/16]"
      : orientation === "square"
        ? "aspect-square"
        : "aspect-video";

  const cardClass =
    "overflow-hidden rounded-2xl border-4 bg-[var(--theme-surface)] " +
    "border-[var(--theme-border)]";

  if (item.media_type === "image" && item.media_url) {
    return (
      <figure className={cardClass}>
        <img
          src={item.media_url}
          alt={item.title}
          className={cx("w-full object-cover", aspectClass)}
        />
        <figcaption className="px-4 py-3 text-sm text-[var(--theme-text)]">
          {item.title}
        </figcaption>
      </figure>
    );
  }

  if (item.media_type === "video_upload" && item.media_url) {
    return (
      <figure className={cardClass}>
        <video
          src={item.media_url}
          controls
          className={cx("w-full bg-black object-cover", aspectClass)}
        />
        <figcaption className="px-4 py-3 text-sm text-[var(--theme-text)]">
          {item.title}
        </figcaption>
      </figure>
    );
  }

  if (item.platform_source === "youtube" && item.embed_html) {
    // Mobile browsers block youtube.com's third-party cookie, which makes the
    // player report "Video unavailable" even when the video is fine. The
    // privacy-enhanced domain serves the same player without that cookie.
    const html = item.embed_html.replace(
      /https?:\/\/(?:www\.)?youtube\.com\/embed\//g,
      "https://www.youtube-nocookie.com/embed/",
    );
    return (
      <div className={cardClass}>
        <div
          className={cx(
            "w-full [&>iframe]:h-full [&>iframe]:w-full",
            aspectClass,
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="px-4 py-3 text-sm text-[var(--theme-text)]">
          {item.title || item.video_title}
        </div>
      </div>
    );
  }

  if (item.platform_source === "tiktok") {
    // Prefer TikTok's official iframe embed: it loads the player directly and
    // avoids the embed.js script-vs-blockquote race that often leaves users
    // staring at a styled card with no playable video.
    const videoId = extractTikTokVideoId(item.original_url);
    if (videoId) {
      // TikTok's `embed/v2` player includes a brand header and a caption /
      // follow strip we don't want. Clip them by giving the iframe extra
      // vertical room and shifting it up inside an overflow-hidden window.
      // The magic numbers were tuned to match the player at ~340px wide
      // (the carousel's portrait slot); they may drift if TikTok updates
      // their embed layout.
      return (
        <div className={cardClass}>
          <div
            className={cx(
              "relative flex items-start w-full overflow-hidden",
              aspectClass,
            )}
          >
            <iframe
              src={`https://www.tiktok.com/embed/v2/${videoId}`}
              title={item.title || item.video_title || "TikTok video"}
              allow="autoplay; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              className="absolute left-0 w-full border-0"
              style={TIKTOK_IFRAME_STYLE}
            />
          </div>
          <div className="px-4 py-3 text-sm text-[var(--theme-text)]">
            {item.title || item.video_title}
          </div>
        </div>
      );
    }
    // vm.tiktok.com short links don't include the numeric ID, so fall back to
    // the oEmbed blockquote + embed.js path for those.
    if (item.embed_html) {
      return (
        <div className={cardClass}>
          <TikTokEmbed html={item.embed_html} aspectClass={aspectClass} />
          <div className="px-4 py-3 text-sm text-[var(--theme-text)]">
            {item.title || item.video_title}
          </div>
        </div>
      );
    }
  }

  if (item.platform_source === "instagram") {
    const path = extractInstagramEmbedPath(item.original_url);
    if (path) {
      // IG's embed iframe always includes header + caption + footer chrome,
      // so a fixed height fits better than an aspect ratio. Reels need more
      // vertical room than feed posts because the media itself is portrait.
      const heightClass =
        orientation === "portrait" ? "h-[680px]" : "h-[620px]";
      return (
        <div className={cardClass}>
          <iframe
            src={`https://www.instagram.com/${path}/embed/`}
            title={item.title || item.video_title || "Instagram post"}
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            scrolling="no"
            className={cx("w-full border-0", heightClass)}
          />
          <div className="px-4 py-3 text-sm text-[var(--theme-text)]">
            {item.title || item.video_title}
          </div>
        </div>
      );
    }
  }

  // Any embed that failed to resolve: thumbnail (or placeholder) + link out.
  const href = item.original_url || item.media_url;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${cardClass} block`}
    >
      {item.thumbnail_url ? (
        <img
          src={item.thumbnail_url}
          alt={item.title}
          className={cx("w-full object-cover", aspectClass)}
        />
      ) : (
        <div
          className={cx(
            "flex w-full items-center justify-center text-sm text-[var(--theme-text-secondary)]",
            aspectClass,
          )}
        >
          {item.platform_source ? item.platform_source : "View"}
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-3 text-sm text-[var(--theme-text)]">
        <span>{item.title || item.video_title}</span>
        <span className="text-xs uppercase tracking-wide text-[var(--theme-text-secondary)]">
          {item.platform_source || "Link"}
        </span>
      </div>
    </a>
  );
});

/**
 * TikTok's oEmbed `<blockquote>` html sometimes hydrates with subtly different
 * markup than the server emitted (attribute escaping, encoded characters), so
 * we render a placeholder during SSR and inject the embed only after mount.
 * That way React never has to reconcile the dangerouslySetInnerHTML payload.
 */
function TikTokEmbed({
  html,
  aspectClass,
}: {
  html: string;
  aspectClass: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // After the blockquote is in the DOM, (re-)load embed.js so it scans and
  // converts the blockquote into an iframe. The script's bytes are cached
  // after the first request, so re-injecting on each mount is cheap and is the
  // most reliable way to trigger a re-scan — `window.tiktokEmbedLoad` only
  // exists on older versions of the embed library.
  useEffect(() => {
    if (!mounted) return;
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [mounted, html]);

  if (!mounted) {
    return (
      <div
        className={cx(
          "flex w-full items-center justify-center bg-black/[0.03] text-xs text-[var(--theme-text-secondary)]",
          aspectClass,
        )}
      >
        Loading…
      </div>
    );
  }

  return (
    <div
      className="flex justify-center px-3 py-3 [&>blockquote]:!my-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Pull the numeric video id out of `tiktok.com/@user/video/123456`. */
function extractTikTokVideoId(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}

/**
 * Build the path component for IG's embed iframe (e.g. `reel/DYHeBgsIRl1`).
 * Normalizes `/reels/` → `/reel/` since IG's embed endpoint uses the singular.
 */
function extractInstagramEmbedPath(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/instagram\.com\/(p|reel|reels|tv)\/([\w-]+)/i);
  if (!m) return null;
  const kind = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
  return `${kind}/${m[2]}`;
}

function detectOrientation(item: PublicPortfolioItem): Orientation {
  // TikTok is portrait by definition.
  if (item.platform_source === "tiktok") return "portrait";
  // YouTube Shorts are portrait; regular videos are 16:9.
  if (item.platform_source === "youtube") {
    return /\/shorts\//i.test(item.original_url) ? "portrait" : "landscape";
  }
  // Instagram reels are portrait (`/reel/` or `/reels/`); posts default to square.
  if (item.platform_source === "instagram") {
    return /\/reels?\//i.test(item.original_url) ? "portrait" : "square";
  }
  // Uploaded images default to square; uploaded videos to landscape.
  if (item.media_type === "image") return "square";
  return "landscape";
}
