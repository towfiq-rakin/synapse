"use client";

import LiquidEther from "@/components/LiquidEther";

export default function AuthLiquidBackground() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#080810]/10 via-[#080810]/20 to-[#080810]/45" />
    </div>
  );
}
