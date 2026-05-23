import type { NextConfig } from 'next'
import path from 'path'

// Parent folder has another package-lock.json; pin Next to this app only
const projectRoot = path.join(__dirname)

const nextConfig: NextConfig = {
  reactStrictMode: false,
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
}

export default nextConfig
