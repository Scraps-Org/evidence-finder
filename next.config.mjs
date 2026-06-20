// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker self-host(개발·배포) = standalone 출력. Vercel 빌드(VERCEL env 자동 설정) = 기본 타깃.
  // 한 템플릿이 양쪽 다 지원 — Docker 유지 + Vercel publish 호환(둘 중 택일 불필요).
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
