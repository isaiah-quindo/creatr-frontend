"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { InputTags } from "@/components/base/input/input-tags";
import { Label } from "@/components/base/input/label";
import { useToast } from "@/components/base/toast/toast";

function AtPrefix(props: HTMLAttributes<HTMLOrSVGElement>) {
  return <span {...(props as HTMLAttributes<HTMLSpanElement>)}>@</span>;
}
import {
  ApiError,
  auth,
  fetchCsrf,
  niches as nichesApi,
  parseFieldErrors,
  profile,
  type CreatorProfile,
  type User,
} from "@/lib/api";

const PROFILE_FIELDS = ["username", "first_name", "last_name", "bio", "location", "niches"] as const;

type Status = "idle" | "saving" | "saved";
type FieldErrors = Partial<Record<"username" | "first_name" | "last_name" | "bio" | "location" | "niches", string>>;

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const AVATAR_HINT = "JPEG, PNG, WebP, or GIF — up to 5 MB.";
const BIO_MAX = 180;
const NICHES_MAX = 3;

export function ProfileEditor({
  user,
  creator,
  onUserChange,
  onCreatorChange,
}: {
  user: User;
  creator: CreatorProfile;
  onUserChange: (user: User) => void;
  onCreatorChange: (creator: CreatorProfile) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [popularNiches, setPopularNiches] = useState<string[]>([]);
  const { toast } = useToast();
  // Drafts kept local until Save — preview/TopNav should only reflect persisted values.
  const [draftUsername, setDraftUsername] = useState(user.username ?? "");
  const [draftName, setDraftName] = useState(
    `${user.first_name} ${user.last_name}`.trim(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saving = status === "saving";
  const bioLen = [...(user.bio ?? "")].length;
  const bioOver = bioLen > BIO_MAX;
  const nichesOver = creator.niches.length > NICHES_MAX;
  const nichesAtMax = creator.niches.length >= NICHES_MAX;
  const selectedNicheKeys = new Set(
    creator.niches.map((n) => n.trim().toLowerCase()),
  );
  const niches = creator.niches;
  const suggestionChips = popularNiches.filter(
    (n) => !selectedNicheKeys.has(n.trim().toLowerCase()),
  );

  useEffect(() => {
    let cancelled = false;
    nichesApi
      .popular()
      .then((res) => {
        if (!cancelled) setPopularNiches(res.niches);
      })
      .catch(() => {
        // Suggestions are non-critical — the input still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setUserField<K extends keyof User>(key: K, value: User[K]) {
    onUserChange({ ...user, [key]: value });
  }

  function setNichesList(next: string[]) {
    onCreatorChange({ ...creator, niches: next });
  }

  function addSuggestion(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (nichesAtMax) return;
    if (selectedNicheKeys.has(trimmed.toLowerCase())) return;
    setNichesList([...creator.niches, trimmed]);
  }

  async function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      setAvatarError("Use a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError("Image must be under 5 MB.");
      return;
    }

    setAvatarError(null);
    setAvatarUploading(true);
    try {
      await fetchCsrf();
      const updated = await auth.uploadAvatar(file);
      onUserChange(updated);
    } catch (err) {
      // Server-side validation (e.g. virus scan, dimension limits) attaches to the file
      // field — show it under the upload button rather than as a toast.
      if (err instanceof ApiError && err.status === 400 && typeof err.data === "object" && err.data) {
        setAvatarError(extractError(err));
      } else {
        toast({ title: "Upload failed", description: extractError(err), variant: "error" });
      }
    } finally {
      setAvatarUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setFieldErrors({});
    try {
      await fetchCsrf();
      const handle = draftUsername.trim();
      const trimmedName = draftName.trim();
      const [updatedUser, updatedProfile] = await Promise.all([
        auth.updateMe({
          ...(handle ? { username: handle } : {}),
          first_name: trimmedName,
          last_name: "",
          bio: user.bio,
          location: user.location,
          avatar_url: user.avatar_url,
        }),
        profile.update({ niches: creator.niches }),
      ]);
      onUserChange(updatedUser);
      onCreatorChange(updatedProfile);
      // Resync drafts from the server in case it normalized values (e.g. lowered case).
      setDraftUsername(updatedUser.username ?? "");
      setDraftName(`${updatedUser.first_name} ${updatedUser.last_name}`.trim());
      setStatus("saved");
      setTimeout(() => {
        setStatus((s) => (s === "saved" ? "idle" : s));
      }, 1500);
    } catch (err) {
      setStatus("idle");
      const parsed = parseFieldErrors(err, PROFILE_FIELDS);
      if (parsed && Object.keys(parsed.fields).length > 0) {
        setFieldErrors(parsed.fields);
        if (parsed.stray) {
          toast({ title: "Couldn't save profile", description: parsed.stray, variant: "error" });
        }
      } else {
        toast({ title: "Couldn't save profile", description: extractError(err), variant: "error" });
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>Profile picture</Label>
        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="size-16 rounded-full border border-secondary object-cover"
            />
          ) : (
            <div className="size-16 rounded-full border border-secondary bg-secondary" />
          )}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                color="secondary"
                size="sm"
                isLoading={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {user.avatar_url ? "Change picture" : "Upload picture"}
              </Button>
              {user.avatar_url && (
                <Button
                  type="button"
                  color="tertiary"
                  size="sm"
                  isDisabled={avatarUploading}
                  onClick={() => setUserField("avatar_url", "")}
                >
                  Remove
                </Button>
              )}
            </div>
            <p
              className={
                avatarError
                  ? "text-xs text-error-primary"
                  : "text-xs text-tertiary"
              }
            >
              {avatarError ?? AVATAR_HINT}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ALLOWED_TYPES.join(",")}
            className="hidden"
            onChange={onAvatarFile}
          />
        </div>
      </div>

      <Input
        label="Handle"
        value={draftUsername}
        onChange={(v) => {
          setDraftUsername(v.toLowerCase().replace(/\s+/g, ""));
          if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: undefined }));
        }}
        isDisabled={saving}
        isInvalid={!!fieldErrors.username}
        placeholder="yourhandle"
        hint={fieldErrors.username ?? "Your public URL is creatr.com/@handle. Saved on submit."}
        icon={AtPrefix}
        iconClassName="size-auto text-md"
      />

      <Input
        label="Name"
        value={draftName}
        onChange={(v) => {
          setDraftName(v);
          if (fieldErrors.first_name) setFieldErrors((p) => ({ ...p, first_name: undefined }));
        }}
        isDisabled={saving}
        isInvalid={!!fieldErrors.first_name}
        placeholder="Your name or screen name"
        hint={fieldErrors.first_name ?? "Use your full name or a screen name. Saved on submit."}
      />

      <Input
        label="Location"
        value={user.location}
        onChange={(v) => {
          setUserField("location", v);
          if (fieldErrors.location) setFieldErrors((p) => ({ ...p, location: undefined }));
        }}
        isInvalid={!!fieldErrors.location}
        hint={fieldErrors.location}
        placeholder="Manila, PH"
      />

      <div className="flex flex-col gap-1.5">
        <Label>Bio</Label>
        <textarea
          value={user.bio}
          onChange={(e) => {
            setUserField("bio", e.target.value);
            if (fieldErrors.bio) setFieldErrors((p) => ({ ...p, bio: undefined }));
          }}
          rows={3}
          placeholder="A few sentences about you and the kind of work you do."
          className={
            bioOver || fieldErrors.bio
              ? "w-full rounded-lg bg-primary px-3 py-2 text-md text-primary shadow-xs outline-hidden ring-1 ring-error_subtle ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-error"
              : "w-full rounded-lg bg-primary px-3 py-2 text-md text-primary shadow-xs outline-hidden ring-1 ring-primary ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-brand"
          }
        />
        <div className="flex items-start justify-between gap-2">
          {fieldErrors.bio ? (
            <p className="text-xs text-error-primary">{fieldErrors.bio}</p>
          ) : (
            <span />
          )}
          <p
            className={
              bioOver
                ? "text-xs tabular-nums text-error-primary"
                : "text-xs tabular-nums text-tertiary"
            }
          >
            {bioLen} / {BIO_MAX}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <InputTags
          label="Niches"
          value={niches}
          onChange={(next) => {
            setNichesList(next);
            if (fieldErrors.niches) setFieldErrors((p) => ({ ...p, niches: undefined }));
          }}
          placeholder={
            nichesAtMax
              ? `You've picked ${NICHES_MAX} niches.`
              : "Type a niche and press Enter"
          }
          maxTags={NICHES_MAX}
          isInvalid={nichesOver || !!fieldErrors.niches}
          hint={
            fieldErrors.niches
              ? fieldErrors.niches
              : nichesOver
                ? `Pick up to ${NICHES_MAX} niches.`
                : `Press Enter to add. Up to ${NICHES_MAX}.`
          }
        />
        {suggestionChips.length > 0 && !nichesAtMax && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-tertiary">Suggestions</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestionChips.slice(0, 12).map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => addSuggestion(label)}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary ring-1 ring-secondary ring-inset transition hover:bg-secondary_hover hover:text-primary"
                >
                  + {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <p
          className={
            status === "saved"
              ? "text-sm text-success-primary"
              : "text-sm text-tertiary"
          }
        >
          {status === "saving" && "Saving…"}
          {status === "saved" && "Saved."}
          {status === "idle" && " "}
        </p>
        <Button
          type="submit"
          isLoading={status === "saving"}
          isDisabled={bioOver || nichesOver}
        >
          Save
        </Button>
      </div>
    </form>
  );
}

function extractError(err: unknown): string {
  if (err instanceof ApiError && typeof err.data === "object" && err.data) {
    const values = Object.values(err.data as Record<string, unknown>);
    const flat = values.flatMap((v) => (Array.isArray(v) ? v : [v]));
    const msg = flat.map((v) => String(v)).filter(Boolean).join(" ");
    if (msg) return msg;
  }
  return err instanceof Error ? err.message : "Couldn't save.";
}
