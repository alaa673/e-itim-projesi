/**
 * The demo teacher's (Ayşe Yılmaz, Matematik) teaching world: content, question bank, exams,
 * homework, activities, rubrics, submissions, appeals, support exercises and study groups.
 * DEVELOPMENT-ONLY demo data.
 */
import type { Difficulty } from '@/types';
import { compareText, createCollection } from '../collection';
import { fullName, rosterOf } from '../mockStudents';
import { createRandom, pick, relativeDate } from '../utils';
import { DEMO_TEACHER_CLASSES } from './core';
import { letterOf, makeQuestions } from './questions';
import type { Lesson, BankQuestion, Slide, Presentation, ClassExam, MockExam, Homework, Activity, RubricLevel, RubricCriterion, Rubric, Submission, Appeal, SentSupport, StudyGroup } from '@/features/teacher/types';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

/* ── Lessons & summaries ───────────────────────────────────────────── */

export const lessons = createCollection<Lesson>(
  () => [
    { id: 'ls-1', title: 'Kesirlerle işlemler – konu özeti', subject: 'Matematik', topic: 'Kesirler', classNames: ['8-A', '8-B'], fileName: 'kesirler_ders_notu.pdf', summary: 'Paydaları eşitleme: Toplama ve çıkarmada önce paydalar ortak bir katta eşitlenir.\nGenişletme ve sadeleştirme: Pay ve payda aynı sayıyla çarpılır veya bölünür; kesrin değeri değişmez.\nÇarpma: Paylar ve paydalar kendi arasında çarpılır.\nBölme: Birinci kesir, ikincinin ters çevrilmişiyle çarpılır.', status: 'shared', updatedAt: minutesAgo(60 * 20), views: 41 },
    { id: 'ls-2', title: 'Üslü ifadeler – kurallar tablosu', subject: 'Matematik', topic: 'Üslü İfadeler', classNames: ['8-B'], fileName: 'uslu_ifadeler.pdf', summary: 'Aynı tabanlı üslü ifadeler çarpılırken üsler toplanır, bölünürken çıkarılır.\nBir üslü ifadenin kuvveti alınırken üsler çarpılır.\nSıfırdan farklı her sayının sıfırıncı kuvveti 1’dir.', status: 'shared', updatedAt: minutesAgo(60 * 50), views: 26 },
    { id: 'ls-3', title: 'Oran ve orantı – günlük hayat örnekleri', subject: 'Matematik', topic: 'Oran ve Orantı', classNames: ['7-A', '7-C'], fileName: null, summary: 'Doğru orantıda çokluklardan biri artarken diğeri de aynı oranda artar.\nTers orantıda biri artarken diğeri aynı oranda azalır.', status: 'draft', updatedAt: minutesAgo(60 * 3), views: 0 },
    { id: 'ls-4', title: 'Veri analizi – grafik türleri', subject: 'Matematik', topic: 'Veri Analizi', classNames: ['5-A'], fileName: 'veri_analizi.pdf', summary: 'Sütun grafiği kategorileri karşılaştırır; çizgi grafiği zaman içindeki değişimi gösterir.', status: 'shared', updatedAt: relativeDate(-6, 14, 0), views: 33 },
    { id: 'ls-5', title: 'Denklemler – adım adım çözüm', subject: 'Matematik', topic: 'Denklemler', classNames: ['8-A'], fileName: 'denklemler.pdf', summary: 'Bilinmeyeni yalnız bırakmak için eşitliğin iki tarafına aynı işlem uygulanır.', status: 'shared', updatedAt: relativeDate(-9, 10, 0), views: 38 },
  ],
  {
    searchText: (l) => `${l.title} ${l.topic} ${l.classNames.join(' ')}`,
    sorters: { updatedAt: (a, b) => a.updatedAt.localeCompare(b.updatedAt), title: (a, b) => compareText(a.title, b.title) },
    defaultSort: 'updatedAt',
  },
);

/* ── Question bank ─────────────────────────────────────────────────── */

function seedBank(): BankQuestion[] {
  const random = createRandom(3131);
  return makeQuestions('Matematik', null, 64, 3131).map((q, i) => ({
    id: `bq-${i + 1}`,
    stem: q.stem,
    options: q.options,
    answer: letterOf(q.answer),
    subject: 'Matematik',
    topic: q.topic,
    difficulty: q.difficulty,
    source: pick(random, ['manual', 'manual', 'archive', 'generated']),
    status: random() < 0.12 ? 'draft' : 'approved',
    createdAt: new Date(Date.now() - (i * 9 + 3) * 3_600_000).toISOString(),
    usedIn: Math.floor(random() * 6),
  }));
}

export const bankQuestions = createCollection<BankQuestion>(seedBank, {
  searchText: (q) => `${q.stem} ${q.topic}`,
  sorters: { createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt), topic: (a, b) => compareText(a.topic, b.topic), usedIn: (a, b) => a.usedIn - b.usedIn },
  defaultSort: 'createdAt',
});

/* ── Presentations ─────────────────────────────────────────────────── */

export const presentations = createCollection<Presentation>(
  () => [
    { id: 'pr-1', title: 'Kesirlerle Toplama ve Çıkarma', topic: 'Kesirler', className: '8-A', status: 'ready', updatedAt: minutesAgo(60 * 30), slides: [
      { title: 'Kesir nedir?', bullets: ['Bir bütünün eş parçalarından biri veya birkaçı', 'Pay ve payda kavramları'] },
      { title: 'Paydaları eşitleme', bullets: ['Paydaların en küçük ortak katı bulunur', 'Kesirler genişletilir'] },
      { title: 'Örnek soru', bullets: ['2/3 + 1/4 = 8/12 + 3/12 = 11/12'] },
      { title: 'Özet', bullets: ['Eşitle → topla/çıkar → sadeleştir'] },
    ] },
    { id: 'pr-2', title: 'Üslü İfadelerde Kurallar', topic: 'Üslü İfadeler', className: '8-B', status: 'ready', updatedAt: relativeDate(-4, 11, 0), slides: [
      { title: 'Üslü ifade', bullets: ['Taban ve üs', 'Tekrarlı çarpım'] },
      { title: 'Çarpma ve bölme', bullets: ['aᵐ · aⁿ = aᵐ⁺ⁿ', 'aᵐ ÷ aⁿ = aᵐ⁻ⁿ'] },
    ] },
    { id: 'pr-3', title: 'Oran ve Orantı', topic: 'Oran ve Orantı', className: '7-A', status: 'draft', updatedAt: minutesAgo(90), slides: [{ title: 'Oran', bullets: ['İki çokluğun karşılaştırılması'] }] },
  ],
  { searchText: (p) => `${p.title} ${p.topic} ${p.className}`, sorters: { updatedAt: (a, b) => a.updatedAt.localeCompare(b.updatedAt) }, defaultSort: 'updatedAt' },
);

/* ── Class exams (quizzes) ─────────────────────────────────────────── */

export const classExams = createCollection<ClassExam>(
  () => [
    { id: 'exam-8a-u2', title: '2. Ünite Değerlendirme', classNames: ['8-A'], date: relativeDate(-3, 10, 30), durationMinutes: 40, questionIds: [], status: 'completed', completed: rosterOf('8-A').length - 3, assigned: rosterOf('8-A').length, average: 62 },
    { id: 'exam-8b-u2', title: '2. Ünite Değerlendirme', classNames: ['8-B'], date: relativeDate(-2, 10, 30), durationMinutes: 40, questionIds: [], status: 'completed', completed: rosterOf('8-B').length - 3, assigned: rosterOf('8-B').length, average: 63 },
    { id: 'exam-7a-q3', title: 'Sayılar Quiz 3', classNames: ['7-A'], date: relativeDate(-6, 9, 0), durationMinutes: 30, questionIds: [], status: 'completed', completed: rosterOf('7-A').length - 3, assigned: rosterOf('7-A').length, average: 64 },
    { id: 'ce-4', title: 'Kesirler Quiz', classNames: ['8-A'], date: relativeDate(-1, 11, 0), durationMinutes: 30, questionIds: ['bq-1', 'bq-13', 'bq-25'], status: 'completed', completed: 24, assigned: 28, average: 86 },
    { id: 'ce-5', title: 'Üslü Sayılar Quiz', classNames: ['8-B'], date: relativeDate(0, 11, 0), durationMinutes: 40, questionIds: ['bq-2', 'bq-14'], status: 'active', completed: 9, assigned: rosterOf('8-B').length, average: null },
    { id: 'ce-6', title: 'Cebir Quiz', classNames: ['7-C'], date: relativeDate(8, 9, 0), durationMinutes: 40, questionIds: ['bq-10', 'bq-11'], status: 'scheduled', completed: 0, assigned: rosterOf('7-C').length, average: null },
    { id: 'ce-7', title: 'Geometri tekrar', classNames: ['6-B'], date: relativeDate(10, 13, 0), durationMinutes: 30, questionIds: [], status: 'draft', completed: 0, assigned: 0, average: null },
  ],
  {
    searchText: (e) => `${e.title} ${e.classNames.join(' ')}`,
    sorters: { date: (a, b) => a.date.localeCompare(b.date), title: (a, b) => compareText(a.title, b.title) },
    defaultSort: 'date',
  },
);

/* ── Mock exams (LGS / TYT / AYT from the approved archive) ───────── */

export const mockExams = createCollection<MockExam>(
  () => [
    { id: 'me-1', examType: 'LGS', title: 'LGS Deneme Sınavı 2', distribution: [{ subject: 'Türkçe', count: 20 }, { subject: 'Matematik', count: 20 }, { subject: 'Fen Bilimleri', count: 20 }, { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', count: 10 }, { subject: 'İngilizce', count: 10 }], classNames: ['8-A', '8-B'], date: relativeDate(3, 10, 0), durationMinutes: 135, status: 'scheduled' },
    { id: 'me-2', examType: 'LGS', title: 'LGS Deneme Sınavı 1', distribution: [{ subject: 'Türkçe', count: 20 }, { subject: 'Matematik', count: 20 }, { subject: 'Fen Bilimleri', count: 20 }, { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', count: 10 }, { subject: 'İngilizce', count: 10 }], classNames: ['8-A', '8-B'], date: relativeDate(-18, 10, 0), durationMinutes: 135, status: 'completed' },
    { id: 'me-3', examType: 'LGS', title: 'Matematik branş denemesi', distribution: [{ subject: 'Matematik', count: 20 }], classNames: ['8-A'], date: relativeDate(-8, 13, 0), durationMinutes: 40, status: 'completed' },
  ],
  { searchText: (m) => `${m.title} ${m.examType}`, sorters: { date: (a, b) => a.date.localeCompare(b.date) }, defaultSort: 'date' },
);

/* ── Homework & activities ─────────────────────────────────────────── */

export const homework = createCollection<Homework>(
  () => [
    { id: 'hw-1', title: 'Oran-orantı proje ödevi', description: 'Günlük hayattan üç doğru orantı ve bir ters orantı örneği bulup tablo ve grafikle açıklayın.', classNames: ['7-A'], due: relativeDate(2, 23, 59), rubricId: 'rb-1', submitted: 18, total: rosterOf('7-A').length, status: 'open' },
    { id: 'hw-2', title: 'Denklemler çalışma kâğıdı', description: 'Çalışma kâğıdındaki 12 denklemi çözüm adımlarıyla birlikte yazın.', classNames: ['8-A'], due: relativeDate(-1, 23, 59), rubricId: null, submitted: 27, total: rosterOf('8-A').length, status: 'closed' },
    { id: 'hw-3', title: 'Kesirler problem seti', description: 'Kitabın 84. sayfasındaki problemleri çözün, en zorlandığınız soruyu işaretleyin.', classNames: ['8-A', '8-B'], due: relativeDate(4, 23, 59), rubricId: null, submitted: 9, total: rosterOf('8-A').length + rosterOf('8-B').length, status: 'open' },
    { id: 'hw-4', title: 'Veri analizi ödevi', description: 'Sınıf arkadaşlarınızın en sevdiği meyveleri sorup sütun grafiği çizin.', classNames: ['5-A'], due: relativeDate(-2, 23, 59), rubricId: 'rb-2', submitted: 25, total: rosterOf('5-A').length, status: 'closed' },
  ],
  { searchText: (h) => `${h.title} ${h.classNames.join(' ')}`, sorters: { due: (a, b) => a.due.localeCompare(b.due) }, defaultSort: 'due' },
);

export const activities = createCollection<Activity>(
  () => [
    { id: 'ac-1', title: 'Geometri atölyesi', kind: 'group', description: 'Dörder kişilik gruplarla geometrik cisimlerin açınımlarını kartondan hazırlayın.', classNames: ['6-B'], date: relativeDate(4, 13, 0), participants: 28, status: 'planned' },
    { id: 'ac-2', title: 'Matematik bulmaca yarışması', kind: 'group', description: 'Sınıflar arası bulmaca yarışması; kazanan takım okul panosunda.', classNames: ['7-A', '7-C'], date: relativeDate(9, 14, 0), participants: 56, status: 'planned' },
    { id: 'ac-3', title: 'Kesir pizzası', kind: 'individual', description: 'Kâğıttan pizza dilimleriyle kesir toplama örnekleri oluşturun.', classNames: ['5-A'], date: relativeDate(-5, 11, 0), participants: 29, status: 'done' },
  ],
  { searchText: (a) => `${a.title} ${a.classNames.join(' ')}`, sorters: { date: (a, b) => a.date.localeCompare(b.date) }, defaultSort: 'date' },
);

/* ── Rubrics ───────────────────────────────────────────────────────── */

const levels = (a: string, b: string, c: string, d: string): RubricLevel[] => [
  { label: 'Başlangıç', points: 1, description: a },
  { label: 'Gelişmekte', points: 2, description: b },
  { label: 'Yeterli', points: 3, description: c },
  { label: 'Örnek', points: 4, description: d },
];

export const rubrics = createCollection<Rubric>(
  () => [
    { id: 'rb-1', title: 'Proje ödevi değerlendirme', description: 'Araştırma ve sunum içeren proje ödevleri için.', usedIn: 2, updatedAt: relativeDate(-10, 10, 0), criteria: [
      { id: 'c1', name: 'Matematiksel doğruluk', weight: 40, levels: levels('Çok sayıda hata var', 'Bazı hatalar var', 'Küçük hatalar var', 'Hatasız') },
      { id: 'c2', name: 'Örneklerin uygunluğu', weight: 30, levels: levels('Örnek yok', 'Örnekler eksik', 'Örnekler uygun', 'Özgün ve uygun örnekler') },
      { id: 'c3', name: 'Sunum ve düzen', weight: 30, levels: levels('Düzensiz', 'Kısmen düzenli', 'Düzenli', 'Çok düzenli ve açık') },
    ] },
    { id: 'rb-2', title: 'Grafik çizimi', description: 'Veri toplama ve grafik çizme ödevleri için.', usedIn: 1, updatedAt: relativeDate(-20, 10, 0), criteria: [
      { id: 'c1', name: 'Veri toplama', weight: 30, levels: levels('Veri yok', 'Az veri', 'Yeterli veri', 'Zengin veri') },
      { id: 'c2', name: 'Grafik doğruluğu', weight: 50, levels: levels('Hatalı', 'Eksik', 'Doğru', 'Doğru ve özenli') },
      { id: 'c3', name: 'Yorum', weight: 20, levels: levels('Yorum yok', 'Yüzeysel', 'Uygun', 'Derinlikli') },
    ] },
  ],
  { searchText: (r) => r.title, sorters: { updatedAt: (a, b) => a.updatedAt.localeCompare(b.updatedAt) }, defaultSort: 'updatedAt' },
);

/* ── Submissions & grading ─────────────────────────────────────────── */

function seedSubmissions(): Submission[] {
  const random = createRandom(6161);
  const out: Submission[] = [];
  const plan: { hw: string; title: string; cls: string; n: number }[] = [
    { hw: 'hw-1', title: 'Oran-orantı proje ödevi', cls: '7-A', n: 8 },
    { hw: 'hw-3', title: 'Kesirler problem seti', cls: '8-A', n: 6 },
    { hw: 'hw-2', title: 'Denklemler çalışma kâğıdı', cls: '8-A', n: 6 },
  ];
  let n = 1;
  for (const p of plan) {
    for (const student of rosterOf(p.cls).slice(0, p.n)) {
      const graded = p.hw === 'hw-2' && random() < 0.6;
      const suggested = 55 + Math.floor(random() * 45);
      out.push({
        id: `sb-${n}`,
        homeworkId: p.hw,
        homeworkTitle: p.title,
        studentName: fullName(student),
        className: p.cls,
        submittedAt: new Date(Date.now() - (n * 47 + 30) * 60_000).toISOString(),
        text: pick(random, [
          'Çözümlerimi adım adım yazdım. 7. soruda emin olamadım, kontrol eder misiniz?',
          'Tablo ve grafiği ekte gönderiyorum. Doğru orantı örneklerim: kalem fiyatı, yürüme mesafesi ve süre.',
          'Bütün soruları çözdüm, son iki soruda paydaları eşitlerken zorlandım.',
        ]),
        attachment: random() < 0.6 ? `${p.title.split(' ')[0].toLowerCase()}_${student.firstName.toLowerCase()}.pdf` : null,
        suggestedScore: suggested,
        score: graded ? suggested : null,
        feedback: graded ? 'Güzel çalışma, adımları açık yazmışsın.' : '',
        status: graded ? 'graded' : 'pending',
      });
      n += 1;
    }
  }
  return out;
}

export const submissions = createCollection<Submission>(seedSubmissions, {
  searchText: (s) => `${s.studentName} ${s.homeworkTitle} ${s.className}`,
  sorters: { submittedAt: (a, b) => a.submittedAt.localeCompare(b.submittedAt), studentName: (a, b) => compareText(a.studentName, b.studentName) },
  defaultSort: 'submittedAt',
});

/* ── Appeals ───────────────────────────────────────────────────────── */

export const appeals = createCollection<Appeal>(
  () => [
    { id: 'ap-1', kind: 'question', studentName: 'Ece Demir', className: '8-B', exam: 'Üslü Sayılar Quiz', questionNo: 4, message: 'Dördüncü sorunun iki seçeneği de doğru görünüyor: 2⁶ ve 4³ aynı değere eşit.', createdAt: minutesAgo(80), status: 'open', response: '' },
    { id: 'ap-2', kind: 'score', studentName: 'Mert Arslan', className: '8-A', exam: '2. Ünite Değerlendirme', questionNo: 11, message: 'Denklem sorusunda işlemlerim doğru ama sonucu yanlış yazmışım; kısmi puan alabilir miyim?', createdAt: minutesAgo(60 * 9), status: 'open', response: '' },
    { id: 'ap-3', kind: 'question', studentName: 'Defne Koç', className: '7-A', exam: 'Sayılar Quiz 3', questionNo: 2, message: 'Soruda “en küçük” yerine “en büyük” yazıyor sanırım.', createdAt: relativeDate(-3, 15, 0), status: 'accepted', response: 'Haklısın, soru iptal edildi ve herkese puanı verildi.' },
  ],
  { searchText: (a) => `${a.studentName} ${a.exam} ${a.message}`, sorters: { createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt) }, defaultSort: 'createdAt' },
);

/* ── Support exercises sent by the teacher ─────────────────────────── */

function seedSupport(): SentSupport[] {
  const random = createRandom(7272);
  const names: [string, string, string][] = [
    ['Deniz Kaya', '8-A', 'Kesirler'], ['Mert Arslan', '8-A', 'Denklemler'], ['Ece Demir', '8-B', 'Üslü İfadeler'],
    ...rosterOf('8-A').slice(3, 7).map((s) => [fullName(s), '8-A', 'Kesirler'] as [string, string, string]),
    ...rosterOf('7-A').slice(0, 3).map((s) => [fullName(s), '7-A', 'Rasyonel Sayılar'] as [string, string, string]),
  ];
  return names.map(([name, cls, topic], i) => {
    const completed = i > 2 && random() < 0.55;
    const before = 25 + Math.floor(random() * 25);
    const summary = random() < 0.8;
    return {
      id: `ss-${i + 1}`,
      studentName: name,
      className: cls,
      topic,
      difficulty: pick(random, ['easy', 'medium']) as Difficulty,
      questionCount: 10,
      includeSummary: i === 0 || summary,
      sentAt: new Date(Date.now() - (i + 1) * 26 * 3_600_000).toISOString(),
      due: relativeDate(2 + (i % 4), 23, 59),
      status: completed ? 'completed' : 'pending',
      before,
      after: completed ? Math.min(100, before + 10 + Math.floor(random() * 30)) : null,
    };
  });
}

export const sentSupport = createCollection<SentSupport>(seedSupport, {
  searchText: (s) => `${s.studentName} ${s.topic} ${s.className}`,
  sorters: { sentAt: (a, b) => a.sentAt.localeCompare(b.sentAt) },
  defaultSort: 'sentAt',
});

/* ── Study groups ──────────────────────────────────────────────────── */

export const studyGroups = createCollection<StudyGroup>(
  () => [
    { id: 'sg-1', name: 'Kesirler destek grubu', className: '8-A', topic: 'Kesirler', members: ['Deniz Kaya', ...rosterOf('8-A').slice(3, 7).map(fullName)], createdAt: relativeDate(-4, 10, 0), note: 'Her Salı 7. ders sonrası 20 dk tekrar.' },
    { id: 'sg-2', name: 'Denklemler çalışma grubu', className: '8-A', topic: 'Denklemler', members: ['Mert Arslan', ...rosterOf('8-A').slice(8, 11).map(fullName)], createdAt: relativeDate(-7, 10, 0), note: 'Adım adım çözüm alıştırmaları.' },
    { id: 'sg-3', name: 'Rasyonel sayılar', className: '7-A', topic: 'Rasyonel Sayılar', members: rosterOf('7-A').slice(0, 5).map(fullName), createdAt: relativeDate(-12, 10, 0), note: '' },
  ],
  { searchText: (g) => `${g.name} ${g.topic} ${g.className} ${g.members.join(' ')}`, sorters: { createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt) }, defaultSort: 'createdAt' },
);

export const TEACHER_CLASS_NAMES = DEMO_TEACHER_CLASSES;

export type { Lesson, BankQuestion, Slide, Presentation, ClassExam, MockExam, Homework, Activity, RubricLevel, RubricCriterion, Rubric, Submission, Appeal, SentSupport, StudyGroup };
