import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import '@/i18n';
import { type QuizGrade, type QuizQuestion, QuizPlayer } from './QuizPlayer';

/** Exam questions as the server sends them: no answer key. */
const QUESTIONS: QuizQuestion[] = [
  { id: 'q1', stem: '2 + 2 = ?', options: ['3', '4', '5', '6'] },
  { id: 'q2', stem: '3 × 3 = ?', options: ['6', '8', '9', '12'] },
];

function renderPlayer(submit: (answers: (number | null)[], seconds: number) => Promise<QuizGrade>) {
  return render(<QuizPlayer open title="Quiz" questions={QUESTIONS} mode="exam" onClose={() => undefined} submit={submit} />);
}

describe('QuizPlayer with server grading', () => {
  it('sends the answers and shows the result from the returned answer key', async () => {
    const user = userEvent.setup();
    const submit = vi.fn(async () => ({ answerKey: [1, 2], explanations: ['2 + 2 = 4', null] }));
    renderPlayer(submit);
    await user.click(screen.getByRole('radio', { name: '4' }));
    await user.click(screen.getByRole('button', { name: /İleri|Next/ }));
    await user.click(screen.getByRole('radio', { name: '8' }));
    await user.click(screen.getByRole('button', { name: /^(Bitir|Finish)$/ }));
    expect(submit).toHaveBeenCalledWith([1, 1], expect.any(Number));
    expect(await screen.findByText('%50')).toBeInTheDocument();
    expect(screen.getByText('2 + 2 = 4')).toBeInTheDocument(); // explanation from the server
    expect(screen.getByText(/C\) 9/)).toBeInTheDocument(); // correct answer of the wrong item
  });

  it('keeps the answers and offers a retry when sending fails', async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ answerKey: [1, 2] });
    renderPlayer(submit);
    await user.click(screen.getByRole('radio', { name: '4' }));
    await user.click(screen.getByRole('button', { name: /İleri|Next/ }));
    await user.click(screen.getByRole('radio', { name: '9' }));
    await user.click(screen.getByRole('button', { name: /^(Bitir|Finish)$/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/gönderilemedi|could not be sent/);
    await user.click(screen.getByRole('button', { name: /Tekrar dene|Try again|Retry/ }));
    expect(await screen.findByText('%100')).toBeInTheDocument();
    expect(submit).toHaveBeenCalledTimes(2);
    expect(submit.mock.calls[1][0]).toEqual([1, 2]);
  });
});
