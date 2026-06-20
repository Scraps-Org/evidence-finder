const features = [
  { name: 'Next.js 15', desc: 'App Router + Server Components + typedRoutes' },
  { name: 'TypeScript strict', desc: 'noUncheckedIndexedAccess + isolatedModules' },
  { name: 'Tailwind 4', desc: '@tailwindcss/postcss — zero config' },
  { name: 'Vitest + RTL', desc: 'jsdom + @testing-library/react' },
  { name: 'Vercel', desc: 'native — output: standalone (Docker 도 동시 지원)' },
  { name: 'Docker + devcontainer', desc: 'Node 22 multi-stage non-root + VS Code Dev Container' },
  { name: 'Pre-commit + CI', desc: 'gitleaks · eslint · prettier · tsc · conventional-pre-commit' },
  { name: 'CLAUDE.md 3-tier', desc: 'thinking · collaboration · project (글로벌 import)' },
];

export function Welcome() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
        nextjs-service-template
      </h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
        범용 Next.js 15 + TypeScript strict + Tailwind 4 템플릿. 5분 안에 부팅하도록 설계.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <li
            key={f.name}
            className="rounded-2xl border border-gray-200 bg-white/50 p-5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/40"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{f.name}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-gray-500">
        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">
          make help
        </code>{' '}
        로 사용 가능한 명령어 확인.
      </p>
    </section>
  );
}
