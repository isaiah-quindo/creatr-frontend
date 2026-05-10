"use client";

import { PublicProfileBody } from "@/components/public-profile/profile-body";
import type {
  CreatorProfile,
  CustomLink,
  PortfolioItem,
  PublicCreator,
  SocialAccount,
  User,
} from "@/lib/api";
import { themeStyle, type ThemeName } from "@/lib/themes";

export function PortfolioPreview({
  user,
  creator,
  socials,
  portfolio,
  links,
}: {
  user: User;
  creator: CreatorProfile;
  socials: SocialAccount[];
  portfolio: PortfolioItem[];
  links: CustomLink[];
}) {
  const theme = (creator.theme as ThemeName) ?? "clean";
  const isCover =
    theme === "cover" ||
    theme === "indigo" ||
    theme === "honey" ||
    theme === "azure";
  const previewCreator: PublicCreator = {
    username: user.username ?? "",
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    location: user.location,
    niches: creator.niches,
    theme: creator.theme,
    rate_card: (creator.rate_card as PublicCreator["rate_card"]) ?? {},
    custom_links: links,
    socials,
    portfolio,
  };

  return (
    <div
      className="relative mx-auto bg-[#0a0a0a] p-[10px] shadow-2xl"
      style={{ width: 402, height: 874, borderRadius: 55 }}
    >
      <div
        style={{ ...themeStyle(theme), borderRadius: 47 }}
        className="no-scrollbar size-full overflow-x-hidden overflow-y-auto bg-[var(--theme-bg)] text-[var(--theme-text)]"
      >
        <div className="@container">
          <div
            className={`flex flex-col gap-8 px-5 pb-10 ${isCover ? "" : "pt-16"}`}
          >
            <PublicProfileBody creator={previewCreator} />
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-[18px] z-10 h-[37px] w-[126px] -translate-x-1/2 rounded-full bg-black"
        aria-hidden="true"
      />
    </div>
  );
}
