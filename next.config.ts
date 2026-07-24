import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 blocks cross-origin /_next/* in development. Without this, opening
  // the app from a phone via LAN IP serves HTML but client JS/HMR stays broken
  // (buttons, sheets, selects look dead; native text fields still accept focus).
  // Update when your LAN IP changes — the blocked host is printed in the terminal.
  allowedDevOrigins: ["192.168.3.86"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cards.scryfall.io",
      },
      {
        protocol: "https",
        hostname: "api.scryfall.com",
      },
    ],
  },
};

export default nextConfig;
