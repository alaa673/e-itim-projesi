/** Exam archive: uploaded PDFs, their processing jobs, the review queue and approved questions. DEVELOPMENT-ONLY. */
import type { ArchiveFile, ArchiveQuestion, Difficulty, ExamType, ReviewQuestion } from '@/types';
import { compareText, createCollection } from '../collection';
import { createRandom, pick, relativeDate } from '../utils';
import { makeQuestions, letterOf } from './questions';

const SUBJECTS_BY_EXAM: Record<ExamType, string[]> = {
  LGS: ['Matematik', 'Fen Bilimleri', 'Türkçe', 'T.C. İnkılap Tarihi ve Atatürkçülük', 'İngilizce'],
  TYT: ['Matematik', 'Türkçe', 'Fizik', 'Kimya', 'Biyoloji'],
  AYT: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türk Dili ve Edebiyatı'],
};
export const examSubjects = SUBJECTS_BY_EXAM;

function seedFiles(): ArchiveFile[] {
  const rows: Omit<ArchiveFile, 'id'>[] = [
    { fileName: 'LGS_Matematik.pdf', examType: 'LGS', year: 2025, kind: 'questions', sizeBytes: 4_812_000, pages: 18, uploadedAt: relativeDate(0, 9, 12), uploadedBy: 'Hakan Öztürk', status: 'review', progress: 100, questionCount: 24, error: null },
    { fileName: 'TYT_2025_Temel_Yeterlilik.pdf', examType: 'TYT', year: 2025, kind: 'questions', sizeBytes: 9_204_000, pages: 36, uploadedAt: relativeDate(0, 8, 40), uploadedBy: 'Hakan Öztürk', status: 'running', progress: 62, questionCount: null, error: null },
    { fileName: 'AYT_2025_Sayisal.pdf', examType: 'AYT', year: 2025, kind: 'questions', sizeBytes: 7_640_000, pages: 28, uploadedAt: relativeDate(0, 8, 31), uploadedBy: 'Hakan Öztürk', status: 'running', progress: 18, questionCount: null, error: null },
    { fileName: 'LGS_2025_Cevap_Anahtari.pdf', examType: 'LGS', year: 2025, kind: 'answerKey', sizeBytes: 380_000, pages: 2, uploadedAt: relativeDate(0, 8, 20), uploadedBy: 'Hakan Öztürk', status: 'waiting', progress: 0, questionCount: null, error: null },
    { fileName: 'LGS_2024_Sozel.pdf', examType: 'LGS', year: 2024, kind: 'questions', sizeBytes: 5_100_000, pages: 22, uploadedAt: relativeDate(-1, 15, 5), uploadedBy: 'Hakan Öztürk', status: 'done', progress: 100, questionCount: 50, error: null },
    { fileName: 'LGS_2024_Sayisal.pdf', examType: 'LGS', year: 2024, kind: 'questions', sizeBytes: 5_440_000, pages: 20, uploadedAt: relativeDate(-1, 14, 40), uploadedBy: 'Hakan Öztürk', status: 'done', progress: 100, questionCount: 40, error: null },
    { fileName: 'TYT_2024_taranmis.pdf', examType: 'TYT', year: 2024, kind: 'questions', sizeBytes: 21_800_000, pages: 40, uploadedAt: relativeDate(-2, 11, 0), uploadedBy: 'Hakan Öztürk', status: 'failed', progress: 34, questionCount: null, error: 'Sayfa 14–16 okunamadı: tarama çözünürlüğü çok düşük.' },
    { fileName: 'AYT_2024_Esit_Agirlik.pdf', examType: 'AYT', year: 2024, kind: 'questions', sizeBytes: 6_900_000, pages: 26, uploadedAt: relativeDate(-4, 10, 30), uploadedBy: 'Hakan Öztürk', status: 'done', progress: 100, questionCount: 80, error: null },
    { fileName: 'TYT_2024_Cevap_Anahtari.pdf', examType: 'TYT', year: 2024, kind: 'answerKey', sizeBytes: 290_000, pages: 2, uploadedAt: relativeDate(-4, 10, 10), uploadedBy: 'Hakan Öztürk', status: 'done', progress: 100, questionCount: 120, error: null },
    { fileName: 'LGS_2023_Sayisal.pdf', examType: 'LGS', year: 2023, kind: 'questions', sizeBytes: 5_020_000, pages: 20, uploadedAt: relativeDate(-9, 16, 0), uploadedBy: 'Hakan Öztürk', status: 'done', progress: 100, questionCount: 40, error: null },
  ];
  return rows.map((r, i) => ({ id: `file-${i + 1}`, ...r }));
}

export const archiveFiles = createCollection<ArchiveFile>(seedFiles, {
  searchText: (f) => `${f.fileName} ${f.examType} ${f.year}`,
  sorters: { uploadedAt: (a, b) => a.uploadedAt.localeCompare(b.uploadedAt) },
  defaultSort: 'uploadedAt',
});

function seedReview(): ReviewQuestion[] {
  const random = createRandom(2401);
  const items = makeQuestions('Matematik', null, 24, 2401);
  return items.map((q, i) => ({
    id: `rq-${i + 1}`,
    fileId: 'file-1',
    fileName: 'LGS_Matematik.pdf',
    number: i + 1,
    examType: 'LGS',
    year: 2025,
    stem: q.stem,
    options: q.options.map((o, j) => `${letterOf(j)}) ${o}`),
    answer: letterOf(q.answer),
    subject: 'Matematik',
    topic: q.topic,
    confidence: Math.round(72 + random() * 27),
    hasFigure: random() < 0.2,
    status: 'pending',
  }));
}

export const reviewQueue = createCollection<ReviewQuestion>(seedReview, {
  searchText: (q) => `${q.stem} ${q.topic}`,
  sorters: { number: (a, b) => a.number - b.number },
  defaultSort: 'number',
});

function seedApproved(): ArchiveQuestion[] {
  const random = createRandom(7781);
  const list: ArchiveQuestion[] = [];
  const plan: { exam: ExamType; year: number }[] = [
    { exam: 'LGS', year: 2024 }, { exam: 'LGS', year: 2023 }, { exam: 'TYT', year: 2024 }, { exam: 'AYT', year: 2024 },
  ];
  let n = 1;
  for (const { exam, year } of plan) {
    for (const subject of SUBJECTS_BY_EXAM[exam]) {
      const items = makeQuestions(subject, null, subject === 'Matematik' ? 14 : 6, 1000 + n);
      items.forEach((q, i) => {
        const difficulty: Difficulty = pick(random, ['easy', 'medium', 'medium', 'hard']);
        list.push({
          id: `aq-${n}`,
          examType: exam,
          year,
          number: i + 1,
          subject,
          topic: q.topic,
          difficulty,
          stem: q.stem,
          options: q.options,
          answer: letterOf(q.answer),
          usedCount: Math.floor(random() * 30),
          duplicateOf: random() < 0.04 && n > 5 ? `aq-${n - 3}` : null,
          status: random() < 0.05 ? 'archived' : 'active',
        });
        n += 1;
      });
    }
  }
  return list;
}

export const approvedQuestions = createCollection<ArchiveQuestion>(seedApproved, {
  searchText: (q) => `${q.stem} ${q.topic} ${q.subject}`,
  filter: (q, key, value) => (key === 'year' ? String(q.year) === value : key === 'duplicates' ? value === 'yes' ? q.duplicateOf !== null : true : String((q as unknown as Record<string, unknown>)[key]) === value),
  sorters: {
    year: (a, b) => a.year - b.year || a.number - b.number,
    subject: (a, b) => compareText(a.subject, b.subject) || a.number - b.number,
    usedCount: (a, b) => a.usedCount - b.usedCount,
  },
  defaultSort: 'year',
});
