import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          /**
           * Same-origin mic access is already the browser default, but say it
           * out loud: this app is nothing without getUserMedia, and a silent
           * platform default is a bad thing to depend on. `self` (not `*`)
           * means an embedding iframe still has to be granted it explicitly.
           */
          { key: "Permissions-Policy", value: "microphone=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
