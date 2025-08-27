
import type {NextConfig} from 'next';

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
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static-content.pawapay.io',
        port: '',
        pathname: '/**',
      }
    ],
  },
  env: {
    FIREBASE_API_KEY: "AIzaSyCkjGbGDOH-7eBc9g3qNUTGp-xEj5nBawM",
    FIREBASE_AUTH_DOMAIN: "gopass-5bbec.firebaseapp.com",
    FIREBASE_PROJECT_ID: "gopass-5bbec",
    FIREBASE_STORAGE_BUCKET: "gopass-5bbec.appspot.com",
    FIREBASE_MESSAGING_SENDER_ID: "823743936276",
    FIREBASE_APP_ID: "1:823743936276:web:6a2363619e582f948d7401",
  },
};

export default nextConfig;
