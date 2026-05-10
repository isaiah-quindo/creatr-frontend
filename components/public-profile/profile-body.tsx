"use client";

import { ArrowUpRight, Link01 } from "@untitledui/icons";
import { PortfolioEmbeds } from "@/components/public-profile/portfolio-embeds";
import { displayName } from "@/components/public-profile/profile-utils";
import { SocialIcon } from "@/components/public-profile/social-icons";
import type { PublicCreator, PublicSocialAccount } from "@/lib/api";

/**
 * The inner body of a public profile — the same layout used by `/@username`
 * and the dashboard's phone preview. Caller supplies the themed background
 * wrapper around this. Each theme has its own layout: "clean" is an
 * editorial left-aligned arrangement, "bold" and "warm" share the asymmetric
 * hero with a gradient display name (warm is the light-palette twin),
 * "midnight" is a sleek monospace dark layout, and "cover" promotes the
 * avatar to a full-bleed cover photo that fades into the page background.
 */
export function PublicProfileBody({ creator }: { creator: PublicCreator }) {
  if (creator.theme === "clean") return <CleanBody creator={creator} />;
  if (creator.theme === "bold" || creator.theme === "warm")
    return <BoldBody creator={creator} />;
  if (creator.theme === "cover") return <CoverBody creator={creator} />;
  if (creator.theme === "indigo" || creator.theme === "honey")
    return <CoverBoldBody creator={creator} />;
  if (creator.theme === "azure") return <CoverMidnightBody creator={creator} />;
  return <MidnightBody creator={creator} />;
}

// ---------------------------------------------------------------------------
// Clean (editorial / left-aligned) layout
// ---------------------------------------------------------------------------

function CleanBody({ creator }: { creator: PublicCreator }) {
  return (
    <>
      <CleanHeader creator={creator} />
      {creator.socials.length > 0 && (
        <CleanSection title="Socials">
          <CleanSocials socials={creator.socials} />
        </CleanSection>
      )}
      {creator.custom_links.length > 0 && (
        <CleanSection title="Links">
          <CleanLinks links={creator.custom_links} />
        </CleanSection>
      )}
      {creator.portfolio.length > 0 && (
        <CleanSection title="Sample work">
          <PortfolioEmbeds items={creator.portfolio} />
        </CleanSection>
      )}
      {creator.rate_card?.deliverables?.length ? (
        <CleanSection title="Rates">
          <CleanRates rates={creator.rate_card.deliverables} />
        </CleanSection>
      ) : null}
    </>
  );
}

function CleanHeader({ creator }: { creator: PublicCreator }) {
  const name = displayName(creator);
  const meta = [creator.username && `@${creator.username}`, creator.location]
    .filter(Boolean)
    .join(" · ");
  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <Avatar src={creator.avatar_url} alt={name} size="md" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {name}
          </h1>
          {meta && (
            <p className="truncate text-sm text-[var(--theme-text-secondary)]">
              {meta}
            </p>
          )}
        </div>
      </div>
      {creator.bio && (
        <p className="max-w-md text-[15px] leading-5">{creator.bio}</p>
      )}
      {creator.niches.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {creator.niches.map((n) => (
            <li
              key={n}
              className="rounded-full bg-[var(--theme-pill-bg)] px-3 py-1 text-xs font-medium text-[var(--theme-pill-text)]"
            >
              {n}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

function CleanSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t pt-6 border-[var(--theme-border)]">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--theme-text-secondary)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function CleanSocials({ socials }: { socials: PublicSocialAccount[] }) {
  return (
    <ul className="flex flex-col divide-y divide-[var(--theme-border)]">
      {socials.map((s) => (
        <li key={s.id}>
          <a
            href={s.profile_url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 py-3 text-sm transition hover:opacity-80"
          >
            <SocialIcon
              platform={s.platform}
              className="size-5 shrink-0 text-[var(--theme-text-secondary)]"
            />
            <span className="flex-1 truncate font-medium">@{s.handle}</span>
            {(s.followers > 0 || s.avg_views > 0) && (
              <span className="shrink-0 text-xs tabular-nums text-[var(--theme-text-secondary)]">
                {[
                  s.followers > 0 && formatCount(s.followers),
                  s.avg_views > 0 && `${formatCount(s.avg_views)} avg`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 text-[var(--theme-text-secondary)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}

function CleanLinks({ links }: { links: PublicCreator["custom_links"] }) {
  return (
    <ul className="flex flex-col divide-y divide-[var(--theme-border)]">
      {links.map((l) => (
        <li key={l.id}>
          <a
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 py-3 text-sm font-medium transition hover:opacity-80"
          >
            <Link01
              aria-hidden="true"
              className="size-5 shrink-0 text-[var(--theme-text-secondary)]"
            />
            <span className="flex-1 truncate">{l.title}</span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 text-[var(--theme-text-secondary)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}

function CleanRates({
  rates,
}: {
  rates: NonNullable<PublicCreator["rate_card"]["deliverables"]>;
}) {
  return (
    <ul className="flex flex-col divide-y divide-[var(--theme-border)]">
      {rates.map((r, i) => (
        <li key={i} className="flex items-baseline justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{r.type}</p>
            {r.notes && (
              <p className="truncate text-xs text-[var(--theme-text-secondary)]">
                {r.notes}
              </p>
            )}
          </div>
          <p className="shrink-0 font-semibold tabular-nums">
            {formatRate(r.rate)}
          </p>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Cover (full-bleed avatar hero) layout
// ---------------------------------------------------------------------------

function CoverBody({ creator }: { creator: PublicCreator }) {
  return (
    <>
      <CoverHeader creator={creator} />
      {creator.socials.length > 0 && (
        <CleanSection title="Socials">
          <CleanSocials socials={creator.socials} />
        </CleanSection>
      )}
      {creator.custom_links.length > 0 && (
        <CleanSection title="Links">
          <CleanLinks links={creator.custom_links} />
        </CleanSection>
      )}
      {creator.portfolio.length > 0 && (
        <CleanSection title="Sample work">
          <PortfolioEmbeds items={creator.portfolio} />
        </CleanSection>
      )}
      {creator.rate_card?.deliverables?.length ? (
        <CleanSection title="Rates">
          <CleanRates rates={creator.rate_card.deliverables} />
        </CleanSection>
      ) : null}
    </>
  );
}

function CoverHeader({ creator }: { creator: PublicCreator }) {
  const name = displayName(creator);
  const meta = [creator.username && `@${creator.username}`, creator.location]
    .filter(Boolean)
    .join(" · ");
  return (
    <header className="flex flex-col gap-5">
      <CoverHeroPhoto creator={creator} alt={name} />
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight @sm:text-4xl">
          {name}
        </h1>
        {meta && (
          <p className="truncate text-sm text-[var(--theme-text-secondary)]">
            {meta}
          </p>
        )}
      </div>
      {creator.bio && (
        <p className="max-w-md text-[15px] leading-5">{creator.bio}</p>
      )}
      {creator.niches.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {creator.niches.map((n) => (
            <li
              key={n}
              className="rounded-full bg-[var(--theme-pill-bg)] px-3 py-1 text-xs font-medium text-[var(--theme-pill-text)]"
            >
              {n}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

/** Full-bleed cover photo (the avatar) with a bottom-half gradient that
 *  fades into the page background. Shared by the Cover and Indigo themes. */
function CoverHeroPhoto({
  creator,
  alt,
}: {
  creator: PublicCreator;
  alt: string;
}) {
  return (
    <div className="relative -mx-5 @sm:-mx-8">
      {creator.avatar_url ? (
        <img
          src={creator.avatar_url}
          alt={alt}
          className="block h-[320px] w-full object-cover @sm:h-[420px]"
        />
      ) : (
        <div
          className="block h-[320px] w-full @sm:h-[420px]"
          style={{ background: "var(--theme-surface)" }}
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-b from-transparent to-[var(--theme-bg)]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CoverBold (cover hero + bold gradient typography)
// Used by both the Indigo (deep indigo / violet gradient) and Honey
// (butter-cream / gold-amber gradient) themes — the layout is identical;
// only the CSS-variable palette differs.
// ---------------------------------------------------------------------------

function CoverBoldBody({ creator }: { creator: PublicCreator }) {
  return (
    <>
      <CoverBoldHeader creator={creator} />
      {creator.socials.length > 0 && (
        <BoldSection title="Socials">
          <BoldSocials socials={creator.socials} />
        </BoldSection>
      )}
      {creator.custom_links.length > 0 && (
        <BoldSection title="Links">
          <BoldLinks links={creator.custom_links} />
        </BoldSection>
      )}
      {creator.portfolio.length > 0 && (
        <BoldSection title="Sample work">
          <PortfolioEmbeds items={creator.portfolio} />
        </BoldSection>
      )}
      {creator.rate_card?.deliverables?.length ? (
        <BoldSection title="Rates">
          <BoldRates rates={creator.rate_card.deliverables} />
        </BoldSection>
      ) : null}
    </>
  );
}

function CoverBoldHeader({ creator }: { creator: PublicCreator }) {
  const name = displayName(creator);
  const firstSpace = name.indexOf(" ");
  const firstWord = firstSpace > 0 ? name.slice(0, firstSpace) : "";
  const restWord = firstSpace > 0 ? name.slice(firstSpace + 1) : name;
  const meta = [creator.username && `@${creator.username}`, creator.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="flex flex-col gap-5">
      <CoverHeroPhoto creator={creator} alt={name} />
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-[1.05] tracking-tight @sm:text-5xl">
          {firstWord && <span className="block truncate">{firstWord}</span>}
          <span
            className="block truncate bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--theme-accent)" }}
          >
            {restWord}
          </span>
        </h1>
        {meta && (
          <p className="truncate text-sm text-[var(--theme-text-secondary)]">
            {meta}
          </p>
        )}
      </div>
      {creator.bio && <p className="text-[15px] leading-5">{creator.bio}</p>}
      {creator.niches.length > 0 && (
        <div className="-mx-5 overflow-x-auto px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max gap-2">
            {creator.niches.map((n) => (
              <li
                key={n}
                className="shrink-0 rounded-full border border-[var(--theme-border)] bg-[var(--theme-pill-bg)] px-3 py-1.5 text-xs font-medium text-[var(--theme-pill-text)]"
              >
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

// ---------------------------------------------------------------------------
// CoverMidnight (cover hero + midnight mono metadata)
// Used by the Azure theme — cover photo on top, then Midnight's bold-name +
// monospace uppercase metadata + slash-separated niches, with the same
// /count section labels and grid socials as Midnight below.
// ---------------------------------------------------------------------------

function CoverMidnightBody({ creator }: { creator: PublicCreator }) {
  return (
    <>
      <CoverMidnightHeader creator={creator} />
      {creator.socials.length > 0 && (
        <MidnightSection title="Socials" count={creator.socials.length}>
          <MidnightSocials socials={creator.socials} />
        </MidnightSection>
      )}
      {creator.custom_links.length > 0 && (
        <MidnightSection title="Links" count={creator.custom_links.length}>
          <MidnightLinks links={creator.custom_links} />
        </MidnightSection>
      )}
      {creator.portfolio.length > 0 && (
        <MidnightSection title="Sample work" count={creator.portfolio.length}>
          <PortfolioEmbeds items={creator.portfolio} />
        </MidnightSection>
      )}
      {creator.rate_card?.deliverables?.length ? (
        <MidnightSection
          title="Rates"
          count={creator.rate_card.deliverables.length}
        >
          <MidnightRates rates={creator.rate_card.deliverables} />
        </MidnightSection>
      ) : null}
    </>
  );
}

function CoverMidnightHeader({ creator }: { creator: PublicCreator }) {
  const name = displayName(creator);
  const meta = [
    creator.username && `@${creator.username}`,
    creator.location?.toUpperCase(),
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <header className="flex flex-col gap-7">
      <CoverHeroPhoto creator={creator} alt={name} />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold leading-[1.05] tracking-tight @sm:text-4xl">
          {name}
        </h1>
        {meta && (
          <p className="truncate font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--theme-text-secondary)]">
            {meta}
          </p>
        )}
      </div>
      {creator.bio && (
        <p className="max-w-md text-[15px] leading-5 text-[var(--theme-text)]">
          {creator.bio}
        </p>
      )}
      {creator.niches.length > 0 && (
        <p className="font-mono text-[10px] uppercase leading-5 tracking-[0.22em] text-[var(--theme-pill-text)]">
          {creator.niches.join("  /  ")}
        </p>
      )}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Bold (hero marquee) layout
// ---------------------------------------------------------------------------

function BoldBody({ creator }: { creator: PublicCreator }) {
  return (
    <>
      <BoldHeader creator={creator} />
      {creator.socials.length > 0 && (
        <BoldSection title="Socials">
          <BoldSocials socials={creator.socials} />
        </BoldSection>
      )}
      {creator.custom_links.length > 0 && (
        <BoldSection title="Links">
          <BoldLinks links={creator.custom_links} />
        </BoldSection>
      )}
      {creator.portfolio.length > 0 && (
        <BoldSection title="Sample work">
          <PortfolioEmbeds items={creator.portfolio} />
        </BoldSection>
      )}
      {creator.rate_card?.deliverables?.length ? (
        <BoldSection title="Rates">
          <BoldRates rates={creator.rate_card.deliverables} />
        </BoldSection>
      ) : null}
    </>
  );
}

function BoldRates({
  rates,
}: {
  rates: NonNullable<PublicCreator["rate_card"]["deliverables"]>;
}) {
  return (
    <ul className="divide-y rounded-2xl border backdrop-blur-sm divide-[var(--theme-border)] border-[var(--theme-border)] bg-[var(--theme-surface)]">
      {rates.map((r, i) => (
        <li
          key={i}
          className="flex items-baseline justify-between gap-4 px-5 py-4"
        >
          <div>
            <p className="font-semibold">{r.type}</p>
            {r.notes && (
              <p className="text-xs text-[var(--theme-text-secondary)]">
                {r.notes}
              </p>
            )}
          </div>
          <p className="font-semibold tabular-nums">{formatRate(r.rate)}</p>
        </li>
      ))}
    </ul>
  );
}

function BoldHeader({ creator }: { creator: PublicCreator }) {
  const name = displayName(creator);
  const firstSpace = name.indexOf(" ");
  const firstWord = firstSpace > 0 ? name.slice(0, firstSpace) : "";
  const restWord = firstSpace > 0 ? name.slice(firstSpace + 1) : name;
  const meta = [creator.username && `@${creator.username}`, creator.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <Avatar src={creator.avatar_url} alt={name} size="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-3xl font-bold leading-[1.05] tracking-tight @sm:text-5xl">
            {firstWord && <span className="block truncate">{firstWord}</span>}
            <span
              className="block truncate bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--theme-accent)" }}
            >
              {restWord}
            </span>
          </h1>
          {meta && (
            <p className="truncate text-sm text-[var(--theme-text-secondary)]">
              {meta}
            </p>
          )}
        </div>
      </div>
      {creator.bio && <p className="text-[15px] leading-5">{creator.bio}</p>}
      {creator.niches.length > 0 && (
        <div className="-mx-5 overflow-x-auto px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max gap-2">
            {creator.niches.map((n) => (
              <li
                key={n}
                className="shrink-0 rounded-full border border-[var(--theme-border)] bg-[var(--theme-pill-bg)] px-3 py-1.5 text-xs font-medium text-[var(--theme-pill-text)]"
              >
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

function BoldSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t pt-6 border-[var(--theme-border)]">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-text-secondary)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function BoldSocials({ socials }: { socials: PublicSocialAccount[] }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex w-max gap-3">
        {socials.map((s) => (
          <li key={s.id} className="w-36 shrink-0">
            <a
              href={s.profile_url}
              target="_blank"
              rel="noreferrer"
              className="flex h-full flex-col gap-2 rounded-2xl border p-3 backdrop-blur-sm transition hover:opacity-90 border-[var(--theme-border)] bg-[var(--theme-surface)]"
            >
              <SocialIcon
                platform={s.platform}
                className="size-5 text-[var(--theme-text-secondary)]"
              />
              <span className="mt-1 truncate text-sm font-semibold">
                @{s.handle}
              </span>
              {(s.followers > 0 || s.avg_views > 0) && (
                <div className="flex flex-col gap-0.5">
                  {s.followers > 0 && (
                    <span className="text-xs text-[var(--theme-text-secondary)]">
                      {formatCount(s.followers)} followers
                    </span>
                  )}
                  {s.avg_views > 0 && (
                    <span className="text-xs text-[var(--theme-text-secondary)]">
                      {formatCount(s.avg_views)} avg views
                    </span>
                  )}
                </div>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BoldLinks({ links }: { links: PublicCreator["custom_links"] }) {
  return (
    <ul className="flex flex-col gap-3">
      {links.map((l) => (
        <li key={l.id}>
          <a
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 rounded-2xl border px-5 py-4 text-sm font-medium backdrop-blur-sm transition hover:opacity-90 border-[var(--theme-border)] bg-[var(--theme-surface)]"
          >
            <Link01
              aria-hidden="true"
              className="size-5 shrink-0 text-[var(--theme-text-secondary)]"
            />
            <span className="flex-1 truncate">{l.title}</span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 text-[var(--theme-text-secondary)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Midnight (sleek dark / monospace metadata) layout
// ---------------------------------------------------------------------------

function MidnightBody({ creator }: { creator: PublicCreator }) {
  return (
    <>
      <MidnightHeader creator={creator} />
      {creator.socials.length > 0 && (
        <MidnightSection title="Socials" count={creator.socials.length}>
          <MidnightSocials socials={creator.socials} />
        </MidnightSection>
      )}
      {creator.custom_links.length > 0 && (
        <MidnightSection title="Links" count={creator.custom_links.length}>
          <MidnightLinks links={creator.custom_links} />
        </MidnightSection>
      )}
      {creator.portfolio.length > 0 && (
        <MidnightSection title="Sample work" count={creator.portfolio.length}>
          <PortfolioEmbeds items={creator.portfolio} />
        </MidnightSection>
      )}
      {creator.rate_card?.deliverables?.length ? (
        <MidnightSection
          title="Rates"
          count={creator.rate_card.deliverables.length}
        >
          <MidnightRates rates={creator.rate_card.deliverables} />
        </MidnightSection>
      ) : null}
    </>
  );
}

function MidnightHeader({ creator }: { creator: PublicCreator }) {
  const name = displayName(creator);
  const meta = [
    creator.username && `@${creator.username}`,
    creator.location?.toUpperCase(),
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <header className="flex flex-col gap-7">
      <div className="flex items-start gap-5">
        <Avatar src={creator.avatar_url} alt={name} size="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
          <h1 className="text-3xl font-bold leading-[1.05] tracking-tight @sm:text-4xl">
            {name}
          </h1>
          {meta && (
            <p className="truncate font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--theme-text-secondary)]">
              {meta}
            </p>
          )}
        </div>
      </div>
      {creator.bio && (
        <p className="max-w-md text-[15px] leading-5 text-[var(--theme-text)]">
          {creator.bio}
        </p>
      )}
      {creator.niches.length > 0 && (
        <p className="font-mono text-[10px] uppercase leading-5 tracking-[0.22em] text-[var(--theme-pill-text)]">
          {creator.niches.join("  /  ")}
        </p>
      )}
    </header>
  );
}

function MidnightSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 border-t pt-7 border-[var(--theme-border)]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--theme-text)]">
          {title}
        </h2>
        <span className="font-mono text-[10px] tabular-nums tracking-widest text-[var(--theme-text-secondary)]">
          / {count.toString().padStart(2, "0")}
        </span>
      </div>
      {children}
    </section>
  );
}

function MidnightSocials({ socials }: { socials: PublicSocialAccount[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {socials.map((s) => (
        <li key={s.id}>
          <a
            href={s.profile_url}
            target="_blank"
            rel="noreferrer"
            className="group relative flex h-full flex-col gap-3 rounded-lg border p-4 backdrop-blur-sm transition border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-pill-bg)]"
          >
            <div className="flex items-center justify-between">
              <SocialIcon
                platform={s.platform}
                className="size-4 text-[var(--theme-text-secondary)] transition group-hover:text-[var(--theme-pill-text)]"
              />
              <ArrowUpRight
                aria-hidden="true"
                className="size-3 -translate-x-0.5 translate-y-0.5 text-[var(--theme-text-secondary)] opacity-0 transition group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-[var(--theme-pill-text)] group-hover:opacity-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="truncate text-sm font-medium">@{s.handle}</span>
              {s.followers > 0 && (
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--theme-text-secondary)]">
                  {formatCount(s.followers)} followers
                </span>
              )}
              {s.avg_views > 0 && (
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--theme-text-secondary)]">
                  {formatCount(s.avg_views)} avg views
                </span>
              )}
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}

function MidnightLinks({ links }: { links: PublicCreator["custom_links"] }) {
  return (
    <ul className="-mx-3 flex flex-col">
      {links.map((l) => (
        <li key={l.id}>
          <a
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 rounded-lg border border-transparent px-3 py-3 transition hover:border-[var(--theme-border)] hover:bg-[var(--theme-surface)]"
          >
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full bg-[var(--theme-pill-text)] opacity-60 transition group-hover:opacity-100"
            />
            <span className="flex-1 truncate text-sm">{l.title}</span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 text-[var(--theme-text-secondary)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--theme-pill-text)]"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}

function MidnightRates({
  rates,
}: {
  rates: NonNullable<PublicCreator["rate_card"]["deliverables"]>;
}) {
  return (
    <ul className="flex flex-col divide-y divide-[var(--theme-border)]">
      {rates.map((r, i) => (
        <li
          key={i}
          className="flex items-baseline justify-between gap-4 py-3.5"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-medium">{r.type}</span>
            {r.notes && (
              <span className="truncate font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--theme-text-secondary)]">
                {r.notes}
              </span>
            )}
          </div>
          <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-[var(--theme-text)]">
            {formatRate(r.rate)}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function Avatar({
  src,
  alt,
  size,
}: {
  src: string;
  alt: string;
  size: "md" | "lg";
}) {
  const cls = size === "lg" ? "size-24" : "size-16";
  if (!src) {
    return (
      <div
        className={`${cls} shrink-0 rounded-full border bg-[var(--theme-surface)] border-[var(--theme-border)]`}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`${cls} shrink-0 rounded-full border object-cover border-[var(--theme-border)]`}
    />
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatRate(rate: string | number): string {
  if (typeof rate === "number") return `₱${rate.toLocaleString("en-PH")}`;
  const s = String(rate).trim();
  if (!s) return "";
  if (s.startsWith("₱")) return s;
  return `₱${s}`;
}
