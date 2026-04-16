// portal/next.config.ts
// REQUIRED for Render deployment — enables Next.js standalone output mode.
// Place this file at: portal/next.config.ts

import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
};

export default config;
