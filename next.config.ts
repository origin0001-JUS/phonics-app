import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  allowedDevOrigins: [
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "http://0.0.0.0:4000",
    "http://172.16.0.1:4000",
  ],
};

export default nextConfig;
