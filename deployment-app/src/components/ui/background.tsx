"use client";
import { usePathname } from "next/navigation";
import React from "react";

export function DotBackground() {
  const pathname = usePathname();
  return (
    pathname !== "/login" && (
      <div className="h-full absolute top-0 z-[-2] w-full dark:bg-zinc-950 bg-white  dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex items-center justify-center">
        {/* Radial gradient for the container to give a faded look */}
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-zinc-950 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      </div>
    )
  );
}
