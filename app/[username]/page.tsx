import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfileBody } from "@/components/public-profile/profile-body";
import { displayName } from "@/components/public-profile/profile-utils";
import { getPublicCreator } from "@/lib/api";
import { themeStyle, type ThemeName } from "@/lib/themes";

type PageParams = { username: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { username } = await params;
  const creator = await getPublicCreator(username);
  if (!creator) return { title: "Not found" };
  const name = displayName(creator);
  return {
    title: `${name} — Creatr`,
    description: creator.bio || `${name} on Creatr.`,
    openGraph: {
      title: name,
      description: creator.bio,
      images: creator.avatar_url ? [creator.avatar_url] : undefined,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { username } = await params;
  const creator = await getPublicCreator(username);
  if (!creator) notFound();

  const theme = (creator.theme as ThemeName) ?? "clean";
  // Themes with a cover-photo hero (cover, indigo, honey, azure) bleed to the
  // very top edge — drop the wrapper's top padding so nothing shows above it.
  const isCover =
    theme === "cover" ||
    theme === "indigo" ||
    theme === "honey" ||
    theme === "azure";

  return (
    <main
      style={themeStyle(theme)}
      className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)]"
    >
      <div className="@container mx-auto max-w-2xl">
        <div
          className={`flex flex-col gap-8 px-5 pb-12 @sm:px-8 ${isCover ? "" : "pt-12"}`}
        >
          <PublicProfileBody creator={creator} />
          <a
            href="/"
            className="mt-4 self-center rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-medium text-[var(--theme-text-secondary)] backdrop-blur-sm transition hover:opacity-80"
          >
            Made with <span className="text-[var(--theme-text)]">Creatr</span>
          </a>
        </div>
      </div>
    </main>
  );
}
