"use client";
import { useEffect } from "react";

const SEQUENCE: { src: string; type?: string }[] = [
  { src: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" },
  { src: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" },
  { src: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/Flip.min.js" },
  { src: "https://unpkg.com/splitting/dist/splitting.min.js" },
  { src: "/js/main.js" },
  { src: "/js/grid.mjs", type: "module" },
  { src: "/js/glow.js" },
];

function load({ src, type }: { src: string; type?: string }) {
  return new Promise<void>((resolve) => {
    const s = document.createElement("script");
    s.src = src;
    if (type) s.type = type;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
}

export default function SiteScripts() {
  useEffect(() => {
    const w = window as unknown as { __siteBooted?: boolean };
    if (w.__siteBooted) return;
    w.__siteBooted = true;
    (async () => {
      for (const item of SEQUENCE) await load(item);
    })();
  }, []);
  return null;
}
