"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CollapsibleSection } from "@/components/base/collapsible-section/collapsible-section";
import { LinksEditor } from "@/components/dashboard/links-editor";
import { PortfolioEditor } from "@/components/dashboard/portfolio-editor";
import { PortfolioPreview } from "@/components/dashboard/portfolio-preview";
import { PreviewHeader } from "@/components/dashboard/preview-header";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { RateCardEditor } from "@/components/dashboard/rate-card-editor";
import { SocialsEditor } from "@/components/dashboard/socials-editor";
import { ThemePicker } from "@/components/dashboard/theme-picker";
import { TopNav } from "@/components/dashboard/top-nav";
import { useToast } from "@/components/base/toast/toast";
import {
  ApiError,
  auth,
  profile,
  type CreatorProfile,
  type CustomLink,
  type PortfolioItem,
  type SocialAccount,
  type User,
} from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [socials, setSocials] = useState<SocialAccount[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [linkItems, setLinkItems] = useState<CustomLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [me, prof] = await Promise.all([auth.me(), profile.get()]);
        if (!cancelled) {
          setUser(me);
          setCreator(prof);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          router.replace("/login");
          return;
        }
        if (!cancelled) {
          toast({
            title: "Couldn't load dashboard",
            description:
              err instanceof Error ? err.message : "Please try again.",
            variant: "error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router, toast]);

  async function onLogout() {
    try {
      await auth.logout();
    } finally {
      router.push("/login");
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center text-tertiary">
        Loading…
      </main>
    );
  }

  if (!user || !creator) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopNav user={user} onLogout={onLogout} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 md:px-12">
        <header>
          <h1 className="text-display-sm font-semibold mb-2">
            {user.username ? `@${user.username}` : "Welcome"}
          </h1>
          <p className="text-sm text-quaternary">
            Edit your profile and preview how it'll look on the public page.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <aside className="flex flex-col gap-4 rounded-2xl border border-secondary bg-gradient-to-br from-secondary to-tertiary p-6 lg:sticky lg:top-20 lg:self-start">
            <PreviewHeader
              user={user}
              creator={creator}
              onCreatorChange={setCreator}
            />
            <div className="hidden lg:block">
              <PortfolioPreview
                user={user}
                creator={creator}
                socials={socials}
                portfolio={portfolioItems}
                links={linkItems}
              />
            </div>
          </aside>

          <div className="flex flex-col gap-3">
            <CollapsibleSection
              title="Profile"
              description="Your handle, name, picture, bio, and niches."
            >
              <ProfileEditor
                user={user}
                creator={creator}
                onUserChange={setUser}
                onCreatorChange={setCreator}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Theme"
              description="How your public page looks to brands."
            >
              <ThemePicker
                current={creator.theme}
                onChange={(theme) => setCreator({ ...creator, theme })}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Social accounts"
              description="Where brands can find you. Stats are self-reported."
              count={socials.length}
            >
              <SocialsEditor onItemsChange={setSocials} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Custom links"
              description="Website or other social media."
              count={linkItems.length}
            >
              <LinksEditor onItemsChange={setLinkItems} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Sample work"
              description="Paste TikTok, YouTube, or Instagram URLs and we'll fetch a preview."
              count={portfolioItems.length}
            >
              <PortfolioEditor onItemsChange={setPortfolioItems} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Rate card"
              description="What you charge per deliverable."
              count={
                (creator.rate_card as { deliverables?: unknown[] })
                  ?.deliverables?.length ?? 0
              }
            >
              <RateCardEditor creator={creator} onCreatorChange={setCreator} />
            </CollapsibleSection>
          </div>
        </div>
      </main>
    </div>
  );
}
