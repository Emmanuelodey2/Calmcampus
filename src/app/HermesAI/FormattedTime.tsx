"use client";
import { useEffect, useState } from "react";

export default function FormattedTime({ iso }: { iso: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const date = new Date(iso);
    const formatted = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setTime(formatted);
  }, [iso]);

  return <span suppressHydrationWarning>{time}</span>;
}
