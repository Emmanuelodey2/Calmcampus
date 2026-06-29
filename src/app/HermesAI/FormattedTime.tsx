"use client";

export default function FormattedTime({ iso }: { iso: string }) {
  const date = new Date(iso);
  const time = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return <span suppressHydrationWarning>{time}</span>;
}
