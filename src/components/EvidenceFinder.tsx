'use client';

import { useState } from 'react';

export function EvidenceFinder() {
  const [inputValue, setInputValue] = useState('');
  const [cases, setCases] = useState<{ id: string; terms: string }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ terms: trimmedInput }),
      });

      if (response.ok) {
        const newCase = await response.json();
        setCases((prev) => [...prev, newCase]);
        setInputValue('');
      }
    } catch (error) {
      console.error('Failed to create case:', error);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
        evidence-finder — 유포된 증거를 찾습니다
      </h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
        이 서비스는 공개 웹에서 후보/증거 URL과 페이지 메타데이터를 표시합니다. 분산된 미디어는
        기본적으로 숨겨지고 항목별로 선택적으로 노출됩니다. 공개적으로 인덱싱된 웹에 한정되어
        있으며, 완전한 스캔은 하지 않습니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-10">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter identifying terms"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Save case
          </button>
        </div>
      </form>

      <div className="mt-8">
        {cases.map((caseItem) => (
          <div key={caseItem.id} className="mb-2 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
            {caseItem.terms}
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white/50 p-5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/40">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">URL/Metadata 중심</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            공개 웹에서 발견된 URL과 페이지 메타데이터를 표시합니다.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white/50 p-5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/40">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">분산 미디어 관리</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            기본적으로 숨겨지고 항목별로 선택적으로 노출됩니다.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white/50 p-5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/40">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">공개 웹 한정</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            공개적으로 인덱싱된 웹에 한정되어 있으며, 완전한 스캔은 하지 않습니다.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white/50 p-5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/40">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">효율적 탐색</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            유포된 증거를 빠르고 정확하게 찾을 수 있도록 설계되었습니다.
          </p>
        </div>
      </div>

      <p className="mt-10 text-sm text-gray-500">
        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">
          evidence-finder
        </code>{' '}
        서비스를 이용해 보세요.
      </p>
    </section>
  );
}

export default EvidenceFinder;
