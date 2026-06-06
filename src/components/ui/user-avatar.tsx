"use client";

import { useState } from "react";
import Image from "next/image";

import { displayName, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

type UserAvatarProps = {
  className?: string;
  profile?: Profile | null;
};

export function UserAvatar({ className, profile }: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const name = displayName(profile);
  const avatarUrl = profile?.avatar_url?.trim();

  if (avatarUrl && !imageFailed) {
    return (
      <Image
        alt={`${name} profile`}
        className={cn("shrink-0 rounded-full object-cover", className)}
        height={64}
        onError={() => setImageFailed(true)}
        referrerPolicy="no-referrer"
        src={avatarUrl}
        width={64}
      />
    );
  }

  return (
    <span
      aria-label={`${name} profile`}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700",
        className,
      )}
      role="img"
    >
      {initials(name)}
    </span>
  );
}
