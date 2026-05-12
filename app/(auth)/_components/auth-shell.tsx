import type { ReactNode } from "react";
import SynapseLogo from "@/public/synapse.svg";
import MetallicPaint from "@/components/MetallicPaint";

type AuthShellProps = {
  children: ReactNode;
};

function SynapseMark() {
  return (
    <div className="text-left">
      <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/70">
        Synapse
      </p>
      <p className="text-lg leading-none [font-family:var(--font-brand-yatra)] text-white">
        Knowledge workspace
      </p>
    </div>
  );
}

function SynapseMetallicLogo() {
  const synapseLogoSrc =
    typeof SynapseLogo === "string" ? SynapseLogo : SynapseLogo.src;

  return (
    <div className="h-70 w-70 overflow-visible">
      <MetallicPaint
        imageSrc={synapseLogoSrc}
        // seed={42}
        // scale={4}
        // patternSharpness={1}
        // noiseScale={0.5}
        // speed={0.3}
        // liquid={0.71}
        // mouseAnimation={false}
        // brightness={2.8}
        // contrast={0.85}
        // refraction={0.01}
        // blur={0.015}
        // chromaticSpread={2}
        // fresnel={0.25}
        // angle={0}
        // waveAmplitude={1}
        // distortion={1}
        // contour={0.03}
        // lightColor="#ffffff"
        // darkColor="#000000"
        // tintColor="#feb3ff"
        seed={42}
        scale={4}
        patternSharpness={1}
        noiseScale={0.5}
        // Animation
        speed={0.3}
        liquid={0.71}
        mouseAnimation={false}
        // Visual
        brightness={2}
        contrast={0.5}
        refraction={0.015}
        blur={0.015}
        chromaticSpread={2}
        fresnel={1}
        angle={60}
        waveAmplitude={1}
        distortion={1}
        contour={0.4}
        // Colors
        lightColor="#ffffff"
        darkColor="#000000"
        tintColor="#feb3ff"
      />
    </div>
  );
}

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-border/70 bg-background/94 shadow-2xl shadow-black/10 backdrop-blur">
      <div className="grid lg:grid-cols-[0.75fr_1fr]">
        <div className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#102a43_0%,#0f172a_48%,#111827_100%)] lg:flex">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.22),transparent_28%),radial-gradient(circle_at_75%_80%,rgba(34,197,94,0.16),transparent_32%)]" />

          <div className="relative min-h-[420px] w-full p-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <SynapseMetallicLogo />
            </div>

            <div className="absolute bottom-8 left-8">
              <SynapseMark />
            </div>
          </div>
        </div>

        <div className="bg-card/90 p-6 sm:p-8 lg:p-10">
          <div className="mb-6 rounded-2xl bg-[linear-gradient(160deg,#102a43_0%,#0f172a_48%,#111827_100%)] p-4 lg:hidden">
            <SynapseMark />
          </div>
          <div className="mx-auto w-full max-w-md min-h-[34rem] sm:h-[34rem] [&>section]:h-full">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
