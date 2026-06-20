import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Welcome } from '~/components/Welcome';

describe('Welcome', () => {
  it('템플릿 이름을 헤딩으로 렌더한다', () => {
    render(<Welcome />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('nextjs-service-template');
  });

  it('feature 카드 8개를 렌더한다', () => {
    render(<Welcome />);
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
  });
});
