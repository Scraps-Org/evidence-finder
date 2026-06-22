import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CaseCreationForm from '../../src/components/CaseCreationForm';

describe('케이스 생성 폼', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('사용자가 식별 검색어를 입력하고 제출하면 폼이 API로 전송한다', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'case-1', identifyingTerms: 'John Doe' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const user = userEvent.setup();
    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    await user.type(input, 'John Doe');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cases'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('John Doe'),
      })
    );
  });

  it('빈 입력을 제출하면 API를 호출하지 않고 폼 오류를 표시한다', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const user = userEvent.setup();
    render(<CaseCreationForm />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it('공백만으로 구성된 입력을 제출하면 API를 호출하지 않고 폼 오류를 표시한다', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const user = userEvent.setup();
    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    await user.type(input, '   ');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it('제출 후 폼이 초기화되거나 성공 메시지를 표시한다', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'case-1', identifyingTerms: 'Jane Smith' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const user = userEvent.setup();
    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    await user.type(input, 'Jane Smith');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(await screen.findByText(/success|created/i)).toBeInTheDocument();
  });
}
