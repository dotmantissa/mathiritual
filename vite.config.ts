// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// When running on Vercel (VERCEL=1 in CI) we want nitro to emit the Vercel Build
// Output API into .vercel/output so deployment works with zero project settings.
// Locally / on Cloudflare we keep the previous defaults by leaving `nitro` undefined.
const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV;
const nitroPreset = process.env.NITRO_PRESET ?? (isVercel ? "vercel" : undefined);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Explicitly enable nitro when targeting Vercel so the deploy plugin emits
  // .vercel/output/functions/__server.func (Vercel's Build Output API). Without
  // this, the Lovable wrapper skips nitro outside its sandbox and Vercel ends
  // up with only static assets. We also have to override the wrapper's default
  // `output.dir` (which points at dist/) so nitro writes to .vercel/output.
  ...(nitroPreset === "vercel"
    ? {
        nitro: {
          preset: "vercel",
          output: {
            dir: ".vercel/output",
            serverDir: ".vercel/output/functions/__server.func",
            publicDir: ".vercel/output/static",
          },
        },
      }
    : nitroPreset
      ? { nitro: { preset: nitroPreset } }
      : {}),
});
