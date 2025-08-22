import type {NextConfig} from 'next';
import webpack from 'webpack';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        '__FIREBASE_WEBAPP_CONFIG__': JSON.stringify(process.env.FIREBASE_WEBAPP_CONFIG),
      })
    );
    return config;
  },
};

export default nextConfig;
