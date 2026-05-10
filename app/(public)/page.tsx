"use client";

import Image from "next/image";
import Link from "next/link";
import LiquidEther from "@/components/LiquidEther";
import TextPressure from "@/components/TextPressure";
import { Button } from "@/components/ui/button";

export default function SynapseLanding() {
  return (
    <div className="relative h-svh w-full overflow-hidden bg-[#080810] text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080810]/10 via-[#080810]/20 to-[#080810]/35" />
      </div>

      <nav className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-white/90">
          <Image src="/synapse-white.png" alt="Synapse" width={28} height={28} className="h-7 w-7" />
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">Synapse</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="outline"
            className="border-white/30 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <Button
            asChild
            className="bg-[#5b3bff] text-white shadow-[0_0_20px_rgba(91,59,255,0.35)] hover:bg-[#6d52ff]"
          >
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </nav>

      <main className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <LiquidEther
            className="absolute inset-0 opacity-100"
            colors={["#5227FF", "#FF9FFC", "#B497CF"]}
            mouseForce={35}
            cursorSize={80}
            isViscous
            viscous={28}
            iterationsViscous={28}
            iterationsPoisson={28}
            resolution={0.45}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={1.8}
            takeoverDuration={0.15}
            autoResumeDelay={7000}
            autoRampDuration={0.6}
          />
        </div>

        <div className="relative w-full max-w-5xl">
          <div className="mx-auto h-[220px] w-full sm:h-[260px] lg:h-[320px]">
            <TextPressure
              text="SYNAPSE"
              flex
              alpha={false}
              stroke={false}
              width
              weight
              italic
              textColor="#F7F4FF"
              strokeColor="#5227FF"
              minFontSize={52}
              className="px-2"
            />
          </div>
        </div>

        <p className="mt-6 max-w-xl text-sm text-white/70 sm:text-base">
          Your Favorite Note Taking App GRRRAAAHHHHH
        </p>
      </main>
    </div>
  );
}
