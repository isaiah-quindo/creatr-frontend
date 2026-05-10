import Link from "next/link";
import {
  ArrowRight,
  Globe01,
  Palette,
  Rocket02,
  Stars01,
  Tag01,
  TrendUp01,
  VideoRecorder,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { PublicProfileBody } from "@/components/public-profile/profile-body";
import { getPublicCreator, type PublicCreator } from "@/lib/api";
import { themeStyle, type ThemeName } from "@/lib/themes";

const SHOWCASE_USERNAME = "michael_24";

// Render on every request so the showcase profile reflects michael_24's
// latest edits — otherwise Vercel prerenders the page at deploy time and
// freezes the showcase to whatever the API returned during `next build`.
export const dynamic = "force-dynamic";

export default async function Home() {
  const showcase = await getPublicCreator(SHOWCASE_USERNAME).catch(() => null);
  return (
    <>
      <SiteHeader />
      <Hero showcase={showcase} />
      <Features />
      <HowItWorks />
      <FinalCTA />
      <SiteFooter />
    </>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-secondary bg-primary/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-primary"
        >
          Creatr
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button color="tertiary" size="sm" href="/login">
            Sign in
          </Button>
          <Button size="sm" href="/register">
            Get started
          </Button>
        </nav>
      </div>
    </header>
  );
}

function Hero({ showcase }: { showcase: PublicCreator | null }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[420px] max-w-5xl bg-[radial-gradient(closest-side,rgba(127,119,221,0.18),transparent)]"
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-secondary/40 px-3 py-1 text-xs font-medium text-secondary">
          <Stars01 className="size-3.5" />
          Built for Filipino UGC creators
        </span>
        <h1 className="mt-6 max-w-3xl text-display-md font-semibold tracking-tight text-primary sm:text-display-lg">
          Your portfolio, socials, rates in one shareable link.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-tertiary">
          Creatr is a link-in-bio para sa mga creators. Sample work, rates, and
          a public profile that brands can actually find.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button size="xl" href="/register" iconTrailing={<ArrowRight />}>
            Create your profile
          </Button>
        </div>
        <p className="mt-5 text-sm text-quaternary">
          Free to start. No credit card. Your @handle is yours to keep.
        </p>

        {showcase ? <IPhoneShowcase creator={showcase} /> : <ProfilePreview />}
      </div>
    </section>
  );
}

function IPhoneShowcase({ creator }: { creator: PublicCreator }) {
  const theme = (creator.theme as ThemeName) ?? "clean";
  const isCover =
    theme === "cover" ||
    theme === "indigo" ||
    theme === "honey" ||
    theme === "azure";

  return (
    <div className="relative mt-16 self-start text-left mx-auto">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-12 -bottom-8 -z-10 h-24 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="w-[340px] sm:w-[420px]">
        <div className="rounded-[58px] bg-gradient-to-b from-zinc-700 via-zinc-900 to-black p-[3px] shadow-2xl ring-1 ring-black/30">
          <div className="rounded-[56px] bg-black p-[12px]">
            <div className="relative aspect-[9/19.5] overflow-hidden rounded-[46px] bg-black">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-3 z-20 h-8 w-32 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/5"
              />
              <div className="h-full overflow-hidden">
                <main
                  style={themeStyle(theme)}
                  className="min-h-full bg-[var(--theme-bg)] text-[var(--theme-text)]"
                >
                  <div className="@container mx-auto max-w-2xl">
                    <div
                      className={`flex flex-col gap-8 px-5 pb-12 ${isCover ? "pt-0" : "pt-12"}`}
                    >
                      <PublicProfileBody creator={creator} />
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePreview() {
  return (
    <div className="relative mt-14 w-full max-w-3xl">
      <div className="absolute inset-x-8 -bottom-6 -z-10 h-12 rounded-full bg-primary/10 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-secondary bg-secondary/40 shadow-xl">
        <div className="flex items-center gap-1.5 border-b border-secondary bg-primary px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-fg-quaternary/40" />
          <span className="size-2.5 rounded-full bg-fg-quaternary/40" />
          <span className="size-2.5 rounded-full bg-fg-quaternary/40" />
          <span className="ml-3 truncate text-xs text-quaternary">
            creatr.com/@maria
          </span>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-[200px_1fr] sm:p-8 sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#7F77DD] to-[#D4537E] text-2xl font-semibold text-white">
              M
            </div>
            <div className="text-center sm:text-left">
              <div className="font-semibold text-primary">Maria Santos</div>
              <div className="text-sm text-tertiary">@maria · Cebu City</div>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
              <Pill>Beauty</Pill>
              <Pill>Lifestyle</Pill>
              <Pill>Food</Pill>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-tertiary">
              UGC creator making honest, scroll-stopping reviews for skincare
              and local food brands. 80K on TikTok, 24K on IG.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="TikTok" value="80K" />
              <Stat label="Instagram" value="24K" />
              <Stat label="Avg views" value="42K" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <PreviewTile />
              <PreviewTile />
              <PreviewTile />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary/60 px-2.5 py-1 text-xs text-secondary">
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-secondary bg-primary px-3 py-2 text-center sm:text-left">
      <div className="text-xs text-quaternary">{label}</div>
      <div className="text-sm font-semibold text-primary">{value}</div>
    </div>
  );
}

function PreviewTile() {
  return (
    <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-secondary to-secondary/30" />
  );
}

function Features() {
  const items = [
    {
      icon: Globe01,
      title: "A page brands can find",
      body: "Server-rendered profile at creatr.com/@you. Fast, SEO friendly, and ready to share in your bio.",
    },
    {
      icon: VideoRecorder,
      title: "Real video embeds",
      body: "Paste a TikTok or YouTube link. We pull the thumbnail and embed it in your portfolio. No screenshots needed.",
    },
    {
      icon: Tag01,
      title: "Rate card kept clean",
      body: "Per deliverable, with usage and exclusivity notes. Brands see your pricing before they message you.",
    },
  ];

  return (
    <section className="border-t border-secondary bg-secondary/20">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-24">
        <SectionHeading
          eyebrow="Everything in one link"
          title="Built for the way creators actually pitch."
          body="Everything brands ask for, in one shareable link."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-secondary bg-secondary sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-3 bg-primary p-7">
      <div className="flex size-9 items-center justify-center rounded-lg bg-secondary/60 text-secondary">
        <Icon className="size-5" />
      </div>
      <h3 className="text-md font-semibold text-primary">{title}</h3>
      <p className="text-sm leading-relaxed text-tertiary">{body}</p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: Rocket02,
      title: "Sign up in seconds",
      body: "Email or Google. Pick your @handle when you build your profile. Walang bayad.",
    },
    {
      n: "02",
      icon: Palette,
      title: "Build, theme, embed",
      body: "Add your sample work, socials, and rates. Pick a theme that matches your vibe.",
    },
    {
      n: "03",
      icon: TrendUp01,
      title: "Share and grow",
      body: "Drop your link in every bio. Show up in the directory. Convert inquiries into deals.",
    },
  ];

  return (
    <section className="border-t border-secondary">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-24">
        <SectionHeading
          eyebrow="How it works"
          title="From zero to a brand-ready profile in minutes."
        />
        <ol className="mt-12 grid gap-5 lg:grid-cols-3">
          {steps.map(({ n, icon: Icon, title, body }) => (
            <li
              key={n}
              className="relative flex flex-col gap-4 rounded-2xl border border-secondary bg-primary p-7"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/60 text-secondary">
                  <Icon className="size-5" />
                </div>
                <span className="text-sm font-mono text-quaternary">{n}</span>
              </div>
              <h3 className="text-md font-semibold text-primary">{title}</h3>
              <p className="text-sm leading-relaxed text-tertiary">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="border-t border-secondary">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-secondary bg-[#0D0D1A] px-6 py-14 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(127,119,221,0.35),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(212,83,126,0.3),transparent_50%)]"
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
            <h2 className="text-display-sm font-semibold tracking-tight text-white sm:text-display-md">
              Get your @handle before someone else does.
            </h2>
            <p className="text-md text-white/70">
              Join the creators building portfolios brands actually open.
            </p>
            <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
              <Button size="xl" href="/register" iconTrailing={<ArrowRight />}>
                Claim your profile
              </Button>
              <Button size="xl" color="secondary" href="/login">
                I already have one
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <span className="text-sm font-semibold text-brand-secondary">
        {eyebrow}
      </span>
      <h2 className="text-display-sm font-semibold tracking-tight text-primary sm:text-display-md">
        {title}
      </h2>
      {body && <p className="text-md text-tertiary">{body}</p>}
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-secondary">
      <div className="mx-auto flex w-full max-w-6xl px-5 py-8">
        <div className="text-sm text-tertiary">
          &copy; {new Date().getFullYear()} Creatr. Made for Filipino creators.
        </div>
      </div>
    </footer>
  );
}
