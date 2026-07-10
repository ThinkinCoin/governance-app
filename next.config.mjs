import { withSentryConfig } from '@sentry/nextjs';
import packageInfo from './package.json' with { type: 'json' };

let BundleAnalyzer;
try {
    const pkg = (await import('@next/bundle-analyzer').catch(() => null)) || (await import('next/bundle-analyzer').catch(() => null));
    BundleAnalyzer = pkg?.default ?? pkg;
} catch (e) {
    BundleAnalyzer = undefined;
}

const withBundleAnalyzer = typeof BundleAnalyzer === 'function'
    ? BundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })
    : ((config) => config);

const webFunctionalities = [
    'accelerometer=()',
    'attribution-reporting=()',
    'autoplay=()',
    'bluetooth=()',
    'browsing-topics=()',
    'camera=()',
    'compute-pressure=()',
    'cross-origin-isolated=()',
    'display-capture=()',
    'encrypted-media=()',
    'fullscreen=()',
    'gamepad=()',
    'geolocation=()',
    'gyroscope=()',
    'hid=()',
    'idle-detection=()',
    'local-fonts=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'otp-credentials=()',
    'payment=()',
    'picture-in-picture=()',
    'publickey-credentials-create=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'serial=()',
    'storage-access=()',
    'usb=()',
    'web-share=()',
    'window-management=()',
    'xr-spatial-tracking=()',
];

const isPreview = process.env.NEXT_PUBLIC_ENV === 'preview';
const isDevelopment = process.env.NEXT_PUBLIC_ENV === 'development';
const disableSourcemaps = isPreview || isDevelopment;

const sentryConfig = {
    // Aragon organisation on Sentry
    org: process.env.SENTRY_ORG ?? process.env.NEXT_PUBLIC_SENTRY_ORG,
    // Sentry project
    project: process.env.SENTRY_PROJECT ?? process.env.NEXT_PUBLIC_SENTRY_PROJECT,
    // Auth token needed for uploading source maps
    authToken: process.env.SENTRY_AUTH_TOKEN ?? process.env.NEXT_SECRET_SENTRY_AUTH_TOKEN,
    // Make sure to upload all files and source maps
    widenClientFileUpload: true,
    // Use tunneling to forward events to Sentry and circumvent ad blockers
    tunnelRoute: '/api/monitoring',
    // Disable Sentry debug logger to save bundle size
    disableLogger: true,
    // Release version for Sentry
    release: { name: packageInfo.version },
    // Delete sourcemaps from NextJs build after upload
    // Disable source map upload for preview environments
    sourcemaps: disableSourcemaps ? { disable: true } : { deleteSourcemapsAfterUpload: true },
    // Disable sending data to Sentry
    telemetry: false,
    // Options to optimise the bundle size
    bundleSizeOptimizations: {
        // Exclude replay worker from bundle as self-hosted for current CSP policies
        excludeReplayWorker: true,
    },
};

/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/dao/:network/:addressOrEns',
                destination: '/dao/:network/:addressOrEns/dashboard',
                permanent: true,
            },
        ];
    },
    async headers() {
        const isProduction = process.env.NODE_ENV === 'production';

        const headers = [
            // Security headers for all paths
            {
                source: '/:path*',
                headers: [
                    // Do not allow usage of application inside iframes
                    { key: 'X-Frame-Options', value: 'DENY' },
                    // Enforce HTTPS access (production only).
                    // Setting HSTS in development can cause browsers to force HTTPS on localhost,
                    // which breaks Next dev server requests (e.g., RSC payload fetches).
                    ...(isProduction
                        ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
                        : []),
                    // Explicitly disable all web functionalities
                    { key: 'Permissions-Policy', value: webFunctionalities.join(', ') },
                    // Prevents the browser from guessing the content type when related header is not set
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    // Allow browsers to proactively perform domain name resolution on extenal resources (links, CSS, ..)
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                ],
            },
            // CORS headers for api routes
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_API_ALLOWED_DOMAIN },
                    { key: 'Access-Control-Allow-Methods', value: 'POST' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
                ],
            },
        ];

        // In development, relax CSP to allow Webpack's eval and inline scripts used by dev overlay
        if (process.env.NODE_ENV !== 'production') {
            const devCsp = [
                "default-src 'self'",
                // Allow eval/inline for Next.js + Webpack dev and overlay
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: https://vercel.live",
                // Styles from self and inline (Tailwind injects styles in dev)
                "style-src 'self' 'unsafe-inline' https:",
                // Allow images and data URIs in dev
                "img-src * data: blob:",
                // Allow all connections for HMR, WalletConnect, APIs during dev
                "connect-src *",
                // Fonts and frames commonly used by libs
                "font-src 'self' https: data:",
                "frame-src *",
            ].join('; ');

            headers.unshift({
                source: '/:path*',
                headers: [{ key: 'Content-Security-Policy', value: devCsp }],
            });
        }

        return headers;
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
                port: '',
            },
        ],
    },
    experimental: {
        // Enable Sentry page-load tracing metadata for App Router
        clientTraceMetadata: ['sentry-trace', 'baggage'],
        // Explicitly unset instrumentationHook to silence Next.js warnings
        instrumentationHook: undefined,
        // Use new key for external server packages (replaces serverComponentsExternalPackages)
        serverExternalPackages: [],
    },
    env: {
        version: packageInfo.version,
    },
    // **WARN**: Avoid adding to webpack config, as long term plan for Next.js is to move away from Webpack to Turbopack.
    webpack: (config) => {
        // Configs needed by wallet-connect (see https://docs.walletconnect.com/appkit/next/core/installation#extra-configuration)
        // Needed only in production builds, Turbopack (used in `pnpm dev`) does not require this.
        config.externals.push('pino-pretty', 'lokijs', 'encoding');

        // Fix for MetaMask SDK React Native dependencies in browser
        config.resolve.fallback = {
            ...config.resolve.fallback,
            '@react-native-async-storage/async-storage': false,
            'react-native': false,
        };

        return config;
    },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), sentryConfig);
