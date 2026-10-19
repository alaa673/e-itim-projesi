/**
 * Learner world for the two demo students: Deniz Kaya (8-A, ortaokul, LGS) and Elif Yıldız (11-B, lise, TYT/AYT).
 * Every collection is created per profile so switching demo users shows the right data.
 * DEVELOPMENT-ONLY demo data.
 */
import type {
  AvailableMock,
  InterestProfile,
  Material,
  MistakeEntry,
  MockAttempt,
  ResultEntry,
  RoadmapStep,
  SavedChoice,
  StudentActivity,
  StudentExam,
  StudentGoal,
  StudentHomework,
  StudentSubject,
  StudentTopic,
  SupportExerciseItem,
} from '@/features/student/types';
import { createCollection } from '../collection';
import { currentDemoUser, isHighSchoolDemo } from '../session';
import { createRandom, relativeDate } from '../utils';
import { makeQuestions } from './questions';
import { sentSupport } from './teaching';

export type Profile = 'middle' | 'high';
export const profileNow = (): Profile => (isHighSchoolDemo() ? 'high' : 'middle');
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

/** Lazily creates one store per demo profile. */
function perProfile<T>(make: (p: Profile) => T): () => T {
  const cache = new Map<Profile, T>();
  return () => {
    const p = profileNow();
    if (!cache.has(p)) cache.set(p, make(p));
    return cache.get(p)!;
  };
}

function topics(names: string[], done: number, inProgress: number, seed: number): StudentTopic[] {
  const random = createRandom(seed);
  return names.map((name, i) => ({
    id: `tp-${seed}-${i}`,
    name,
    status: i < done ? 'done' : i < done + inProgress ? 'inProgress' : 'todo',
    score: i < done ? 55 + Math.floor(random() * 40) : i < done + inProgress ? 35 + Math.floor(random() * 25) : null,
  }));
}

function subjectSeeds(p: Profile): StudentSubject[] {
  if (p === 'middle') {
    return [
      { id: 'ss-mat', name: 'Matematik', teacher: 'Ayşe Yılmaz', tone: 'violet', illustration: 'math', headline: 'Kesirlerde bir adım ileri', blurb: 'Kesirlerle işlemler konusunu pekiştir ve yeni sorularla kendini dene.', topicsDone: 6, topicsTotal: 10, units: [
        { id: 'u1', name: 'Sayılar ve İşlemler', topics: topics(['Çarpanlar ve Katlar', 'Üslü İfadeler', 'Kareköklü İfadeler', 'Kesirler'], 3, 1, 11) },
        { id: 'u2', name: 'Cebir', topics: topics(['Cebirsel İfadeler', 'Denklemler', 'Eşitsizlikler'], 3, 0, 12) },
        { id: 'u3', name: 'Geometri ve Veri', topics: topics(['Üçgenler', 'Veri Analizi', 'Olasılık'], 0, 0, 13) },
      ] },
      { id: 'ss-fen', name: 'Fen Bilimleri', teacher: 'Selin Aksoy', tone: 'peach', illustration: 'science', headline: 'DNA’nın dünyasını keşfet', blurb: 'Canlıların yapısındaki mucizeyi birlikte inceleyelim. DNA ve kalıtım konusuna devam et.', topicsDone: 3, topicsTotal: 8, units: [
        { id: 'u1', name: 'Canlılar ve Yaşam', topics: topics(['Mevsimler ve İklim', 'DNA ve Genetik Kod', 'Canlılar ve Enerji İlişkileri'], 1, 1, 21) },
        { id: 'u2', name: 'Fiziksel Olaylar', topics: topics(['Basınç', 'Basit Makineler', 'Elektrik Yükleri'], 2, 0, 22) },
        { id: 'u3', name: 'Madde ve Doğası', topics: topics(['Madde ve Endüstri', 'Enerji Dönüşümleri'], 0, 0, 23) },
      ] },
      { id: 'ss-tr', name: 'Türkçe', teacher: 'Burak Tekin', tone: 'mint', illustration: null, headline: 'Paragrafta ustalaş', blurb: 'Paragrafta anlam ve fiilimsiler konularında yeni etkinlikler var.', topicsDone: 4, topicsTotal: 7, units: [
        { id: 'u1', name: 'Okuma', topics: topics(['Paragrafta Anlam', 'Söz Sanatları', 'Metin Türleri'], 2, 1, 31) },
        { id: 'u2', name: 'Dil Bilgisi', topics: topics(['Fiilimsiler', 'Cümlenin Ögeleri', 'Yazım Kuralları', 'Noktalama'], 2, 0, 32) },
      ] },
      { id: 'ss-ink', name: 'T.C. İnkılap Tarihi ve Atatürkçülük', teacher: 'Can Özkan', tone: 'sky', illustration: null, headline: 'Milli Mücadele yolunda', blurb: 'Milli uyanış dönemini zaman çizelgesiyle tekrar et.', topicsDone: 2, topicsTotal: 6, units: [
        { id: 'u1', name: 'Milli Mücadele', topics: topics(['Bir Kahraman Doğuyor', 'Milli Uyanış', 'Ya İstiklal Ya Ölüm', 'Çağdaş Türkiye Yolunda', 'Demokratikleşme Çabaları', 'Atatürk’ün Ölümü'], 2, 1, 41) },
      ] },
      { id: 'ss-ing', name: 'İngilizce', teacher: 'Melis Güneş', tone: 'violet', illustration: null, headline: 'Teen Life', blurb: 'Kelime kartlarıyla ünite tekrarını tamamla.', topicsDone: 3, topicsTotal: 6, units: [
        { id: 'u1', name: 'Units', topics: topics(['Friendship', 'Teen Life', 'In the Kitchen', 'On the Phone', 'The Internet', 'Adventures'], 3, 1, 51) },
      ] },
    ];
  }
  return [
    { id: 'ss-mat', name: 'Matematik', teacher: 'Kaan Yıldırım', tone: 'violet', illustration: 'math', headline: 'Trigonometride bir adım ileri', blurb: 'Trigonometrik oranları yeni sorularla pekiştir.', topicsDone: 5, topicsTotal: 9, units: [
      { id: 'u1', name: 'Trigonometri', topics: topics(['Yönlü Açılar', 'Trigonometrik Fonksiyonlar', 'Toplam-Fark Formülleri'], 1, 1, 61) },
      { id: 'u2', name: 'Analitik Geometri', topics: topics(['Doğrunun Analitiği', 'Çember ve Daire'], 2, 0, 62) },
      { id: 'u3', name: 'Olasılık ve Fonksiyonlar', topics: topics(['Koşullu Olasılık', 'Fonksiyonlarda Uygulamalar', 'Denklem Sistemleri', 'İkinci Dereceden Eşitsizlikler'], 2, 0, 63) },
    ] },
    { id: 'ss-fiz', name: 'Fizik', teacher: 'Tuana Aslan', tone: 'peach', illustration: 'science', headline: 'Hareketi keşfet', blurb: 'Atışlar konusunda deneyler ve simülasyonlarla devam et.', topicsDone: 4, topicsTotal: 7, units: [
      { id: 'u1', name: 'Kuvvet ve Hareket', topics: topics(['Vektörler', 'Newton’un Hareket Yasaları', 'Atışlar', 'İş ve Enerji', 'İtme ve Momentum', 'Tork', 'Denge'], 4, 1, 71) },
    ] },
    { id: 'ss-kim', name: 'Kimya', teacher: 'Hira Kurt', tone: 'mint', illustration: null, headline: 'Gazlardan çözeltilere', blurb: 'Kimyasal denge özetini okumayı unutma.', topicsDone: 3, topicsTotal: 6, units: [
      { id: 'u1', name: 'Kimya', topics: topics(['Modern Atom Teorisi', 'Gazlar', 'Sıvı Çözeltiler', 'Tepkime Hızları', 'Kimyasal Denge', 'Asit-Baz Dengesi'], 3, 1, 81) },
    ] },
    { id: 'ss-biy', name: 'Biyoloji', teacher: 'Ozan Koç', tone: 'sky', illustration: null, headline: 'İnsan fizyolojisi', blurb: 'Sinir sistemi ünitesine geçmeden önce tekrar testini çöz.', topicsDone: 2, topicsTotal: 5, units: [
      { id: 'u1', name: 'İnsan Fizyolojisi', topics: topics(['Sinir Sistemi', 'Endokrin Sistem', 'Duyu Organları', 'Destek ve Hareket', 'Sindirim Sistemi'], 2, 1, 91) },
    ] },
    { id: 'ss-edb', name: 'Türk Dili ve Edebiyatı', teacher: 'Beren Çetin', tone: 'violet', illustration: null, headline: 'Divan şiirinin dünyası', blurb: 'Divan edebiyatı okuma notlarını tamamla.', topicsDone: 3, topicsTotal: 6, units: [
      { id: 'u1', name: 'Edebiyat', topics: topics(['Şiir Bilgisi', 'Divan Edebiyatı', 'Halk Edebiyatı', 'Roman', 'Tiyatro', 'Deneme'], 3, 1, 101) },
    ] },
  ];
}

export const studentSubjects = perProfile((p) => createCollection<StudentSubject>(() => subjectSeeds(p), { searchText: (s) => s.name }));

function materialSeeds(p: Profile): Material[] {
  const middle = p === 'middle';
  const list: Omit<Material, 'id'>[] = middle
    ? [
        { title: 'Kesirlerle işlemler – konu özeti', kind: 'summary', subject: 'Matematik', topic: 'Kesirler', teacher: 'Ayşe Yılmaz', sharedAt: minutesAgo(60 * 20), sizeBytes: null, body: 'Paydaları eşitleme: Toplama ve çıkarmada önce paydalar ortak bir katta eşitlenir.\nGenişletme ve sadeleştirme: Pay ve payda aynı sayıyla çarpılır veya bölünür; kesrin değeri değişmez.\nÇarpma: Paylar ve paydalar kendi arasında çarpılır.\nBölme: Birinci kesir, ikincinin ters çevrilmişiyle çarpılır.', read: true },
        { title: 'Kesirlerle Toplama ve Çıkarma (sunum)', kind: 'presentation', subject: 'Matematik', topic: 'Kesirler', teacher: 'Ayşe Yılmaz', sharedAt: minutesAgo(60 * 30), sizeBytes: 1_840_000, body: '1. Kesir nedir?\n2. Paydaları eşitleme\n3. Örnek soru: 2/3 + 1/4 = 11/12\n4. Özet: Eşitle → topla/çıkar → sadeleştir', read: false },
        { title: 'Denklemler – adım adım çözüm', kind: 'pdf', subject: 'Matematik', topic: 'Denklemler', teacher: 'Ayşe Yılmaz', sharedAt: relativeDate(-9, 10, 0), sizeBytes: 920_000, body: 'Bilinmeyeni yalnız bırakmak için eşitliğin iki tarafına aynı işlem uygulanır.', read: true },
        { title: 'DNA ve genetik kod – özet', kind: 'summary', subject: 'Fen Bilimleri', topic: 'DNA ve Genetik Kod', teacher: 'Selin Aksoy', sharedAt: minutesAgo(60 * 44), sizeBytes: null, body: 'DNA, kalıtsal bilgiyi taşıyan çift zincirli bir moleküldür.\nNükleotit: fosfat + deoksiriboz şekeri + organik baz.\nBaz eşleşmesi: Adenin–Timin, Guanin–Sitozin.\nGen, belirli bir özelliği belirleyen DNA parçasıdır.', read: false },
        { title: 'Basınç deney föyü', kind: 'pdf', subject: 'Fen Bilimleri', topic: 'Basınç', teacher: 'Selin Aksoy', sharedAt: relativeDate(-12, 13, 0), sizeBytes: 640_000, body: 'Katı basıncı = Kuvvet ÷ Yüzey alanı.', read: true },
        { title: 'Fiilimsiler – kavram haritası', kind: 'summary', subject: 'Türkçe', topic: 'Fiilimsiler', teacher: 'Burak Tekin', sharedAt: relativeDate(-5, 9, 0), sizeBytes: null, body: 'İsim-fiil: -ma, -ış, -mak\nSıfat-fiil: -an, -ası, -mez, -ar, -dik, -ecek, -miş\nZarf-fiil: -ıp, -arak, -madan, -ınca, -dıkça…', read: false },
      ]
    : [
        { title: 'Trigonometrik oranlar – özet', kind: 'summary', subject: 'Matematik', topic: 'Trigonometrik Fonksiyonlar', teacher: 'Kaan Yıldırım', sharedAt: minutesAgo(60 * 12), sizeBytes: null, body: 'sin, cos, tan, cot oranları dik üçgende tanımlanır.\nsin²x + cos²x = 1', read: false },
        { title: 'Atışlar – deney simülasyonu notları', kind: 'pdf', subject: 'Fizik', topic: 'Atışlar', teacher: 'Tuana Aslan', sharedAt: relativeDate(-3, 14, 0), sizeBytes: 1_200_000, body: 'Yatay atışta yatay hız sabittir; düşey hareket serbest düşmedir.', read: true },
        { title: 'Kimyasal denge – özet', kind: 'summary', subject: 'Kimya', topic: 'Kimyasal Denge', teacher: 'Hira Kurt', sharedAt: relativeDate(-1, 10, 0), sizeBytes: null, body: 'Denge sabiti Kc, ürünlerin derişimleri çarpımının tepkimeye girenlerinkine oranıdır.', read: false },
        { title: 'Divan edebiyatı (sunum)', kind: 'presentation', subject: 'Türk Dili ve Edebiyatı', topic: 'Divan Edebiyatı', teacher: 'Beren Çetin', sharedAt: relativeDate(-7, 11, 0), sizeBytes: 2_300_000, body: '1. Nazım birimi: beyit\n2. Aruz ölçüsü\n3. Gazel ve kaside', read: true },
      ];
  return list.map((m, i) => ({ id: `mat-${i + 1}`, ...m }));
}

export const studentMaterials = perProfile((p) =>
  createCollection<Material>(() => materialSeeds(p), {
    searchText: (m) => `${m.title} ${m.topic} ${m.subject} ${m.teacher}`,
    sorters: { sharedAt: (a, b) => a.sharedAt.localeCompare(b.sharedAt) },
    defaultSort: 'sharedAt',
  }),
);

function examSeeds(p: Profile): StudentExam[] {
  if (p === 'middle') {
    return [
      { id: 'sx-1', title: 'Matematik quiz — Kesirlerle işlemler', subject: 'Matematik', kind: 'quiz', date: relativeDate(0, 11, 0), durationMinutes: 30, questionCount: 15, status: 'available', score: null, classAverage: null },
      { id: 'sx-2', title: 'LGS Deneme Sınavı 2', subject: 'LGS', kind: 'mock', date: relativeDate(3, 10, 0), durationMinutes: 135, questionCount: 90, status: 'upcoming', score: null, classAverage: null },
      { id: 'sx-3', title: 'Fen Bilimleri 1. yazılı', subject: 'Fen Bilimleri', kind: 'written', date: relativeDate(7, 9, 0), durationMinutes: 40, questionCount: 20, status: 'upcoming', score: null, classAverage: null },
      { id: 'sx-4', title: '2. Ünite Değerlendirme', subject: 'Matematik', kind: 'quiz', date: relativeDate(-3, 10, 30), durationMinutes: 40, questionCount: 36, status: 'completed', score: 61, classAverage: 62 },
      { id: 'sx-5', title: 'Türkçe paragraf quiz', subject: 'Türkçe', kind: 'quiz', date: relativeDate(-8, 9, 0), durationMinutes: 25, questionCount: 15, status: 'completed', score: 80, classAverage: 71 },
      { id: 'sx-6', title: 'İngilizce kelime testi', subject: 'İngilizce', kind: 'quiz', date: relativeDate(-12, 9, 0), durationMinutes: 20, questionCount: 20, status: 'missed', score: null, classAverage: 74 },
    ];
  }
  return [
    { id: 'sx-1', title: 'Trigonometri quiz', subject: 'Matematik', kind: 'quiz', date: relativeDate(0, 13, 0), durationMinutes: 30, questionCount: 12, status: 'available', score: null, classAverage: null },
    { id: 'sx-2', title: 'TYT Deneme 3', subject: 'TYT', kind: 'mock', date: relativeDate(5, 10, 0), durationMinutes: 165, questionCount: 120, status: 'upcoming', score: null, classAverage: null },
    { id: 'sx-3', title: 'Fizik 1. yazılı', subject: 'Fizik', kind: 'written', date: relativeDate(-9, 9, 0), durationMinutes: 40, questionCount: 20, status: 'completed', score: 78, classAverage: 69 },
    { id: 'sx-4', title: 'Gazlar quiz', subject: 'Kimya', kind: 'quiz', date: relativeDate(-4, 9, 0), durationMinutes: 25, questionCount: 15, status: 'completed', score: 85, classAverage: 72 },
  ];
}

export const studentExams = perProfile((p) =>
  createCollection<StudentExam>(() => examSeeds(p), { searchText: (e) => `${e.title} ${e.subject}`, sorters: { date: (a, b) => a.date.localeCompare(b.date) }, defaultSort: 'date' }),
);

function homeworkSeeds(p: Profile): StudentHomework[] {
  const rubric = [
    { name: 'Matematiksel doğruluk', weight: 40 },
    { name: 'Çözüm adımları', weight: 30 },
    { name: 'Düzen', weight: 30 },
  ];
  if (p === 'middle') {
    return [
      { id: 'shw-1', title: 'Fen bilimleri ödevi — DNA ve kalıtım', subject: 'Fen Bilimleri', teacher: 'Selin Aksoy', due: relativeDate(1, 23, 59), description: 'DNA’nın yapısını gösteren bir model çizin; nükleotit, baz eşleşmesi ve gen kavramlarını kısaca açıklayın.', rubric: [{ name: 'Kavram doğruluğu', weight: 50 }, { name: 'Model', weight: 30 }, { name: 'Düzen', weight: 20 }], status: 'todo', submission: null, score: null, feedback: null },
      { id: 'shw-2', title: 'Kesirler problem seti', subject: 'Matematik', teacher: 'Ayşe Yılmaz', due: relativeDate(4, 23, 59), description: 'Kitabın 84. sayfasındaki problemleri çözün, en zorlandığınız soruyu işaretleyin.', rubric, status: 'todo', submission: null, score: null, feedback: null },
      { id: 'shw-3', title: 'Denklemler çalışma kâğıdı', subject: 'Matematik', teacher: 'Ayşe Yılmaz', due: relativeDate(-1, 23, 59), description: 'Çalışma kâğıdındaki 12 denklemi çözüm adımlarıyla birlikte yazın.', rubric, status: 'graded', submission: { text: 'Tüm denklemleri çözdüm.', fileName: 'denklemler_deniz.pdf', at: relativeDate(-2, 20, 10) }, score: 84, feedback: 'Adımların çok düzenli, 9. soruda işaret hatasına dikkat.' },
      { id: 'shw-4', title: 'İnkılap Tarihi sunumu', subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', teacher: 'Can Özkan', due: relativeDate(6, 23, 59), description: 'Amasya Genelgesi hakkında 5 slaytlık bir sunum hazırlayın.', rubric: [{ name: 'İçerik', weight: 60 }, { name: 'Sunum', weight: 40 }], status: 'todo', submission: null, score: null, feedback: null },
      { id: 'shw-5', title: 'Divan edebiyatı okuma notları', subject: 'Türkçe', teacher: 'Burak Tekin', due: relativeDate(-3, 18, 0), description: 'Okuma metnindeki söz sanatlarını bulun.', rubric: [{ name: 'Doğruluk', weight: 100 }], status: 'submitted', submission: { text: 'Kişileştirme ve benzetme örneklerini işaretledim.', fileName: null, at: relativeDate(-3, 17, 2) }, score: null, feedback: null },
    ];
  }
  return [
    { id: 'shw-1', title: 'Newton yasaları çalışma kâğıdı', subject: 'Fizik', teacher: 'Tuana Aslan', due: relativeDate(0, 23, 59), description: '10 problemi çözün ve serbest cisim diyagramlarını çizin.', rubric, status: 'todo', submission: null, score: null, feedback: null },
    { id: 'shw-2', title: 'Gazlar deney raporu (grup)', subject: 'Kimya', teacher: 'Hira Kurt', due: relativeDate(3, 17, 0), description: 'Boyle yasası deneyinin raporunu grup olarak hazırlayın.', rubric: [{ name: 'Yöntem', weight: 40 }, { name: 'Sonuç ve yorum', weight: 60 }], status: 'todo', submission: null, score: null, feedback: null },
    { id: 'shw-3', title: 'Divan edebiyatı okuma notları', subject: 'Türk Dili ve Edebiyatı', teacher: 'Beren Çetin', due: relativeDate(-1, 18, 0), description: 'Gazel örneklerinde beyit ve redif bulun.', rubric: [{ name: 'Doğruluk', weight: 100 }], status: 'graded', submission: { text: 'Notlarımı ekledim.', fileName: 'divan_notlari.pdf', at: relativeDate(-2, 21, 0) }, score: 90, feedback: 'Çok özenli çalışma.' },
  ];
}

export const studentHomework = perProfile((p) =>
  createCollection<StudentHomework>(() => homeworkSeeds(p), { searchText: (h) => `${h.title} ${h.subject}`, sorters: { due: (a, b) => a.due.localeCompare(b.due) }, defaultSort: 'due' }),
);

function activitySeeds(p: Profile): StudentActivity[] {
  return p === 'middle'
    ? [
        { id: 'sa-1', title: 'Türkçe okuma etkinliği', subject: 'Türkçe', kind: 'group', date: relativeDate(2, 13, 0), instructions: 'Grubunuzla bir hikâye seçin, ana fikrini ve karakterlerini bir posterde anlatın.', status: 'upcoming' },
        { id: 'sa-2', title: 'Kesir pizzası', subject: 'Matematik', kind: 'individual', date: relativeDate(-5, 11, 0), instructions: 'Kâğıttan pizza dilimleriyle üç kesir toplama örneği oluşturun.', status: 'completed' },
        { id: 'sa-3', title: 'Bilim fuarı hazırlığı', subject: 'Fen Bilimleri', kind: 'group', date: relativeDate(12, 10, 0), instructions: 'Basit makinelerle ilgili bir deney düzeneği tasarlayın.', status: 'joined' },
      ]
    : [
        { id: 'sa-1', title: 'Fizik proje haftası', subject: 'Fizik', kind: 'group', date: relativeDate(6, 10, 0), instructions: 'Atış hareketini ölçen bir düzenek hazırlayın.', status: 'joined' },
        { id: 'sa-2', title: 'Münazara: Teknoloji ve eğitim', subject: 'Türk Dili ve Edebiyatı', kind: 'group', date: relativeDate(9, 14, 0), instructions: 'Takımınızın görüşünü üç argümanla savunun.', status: 'upcoming' },
      ];
}

export const studentActivities = perProfile((p) =>
  createCollection<StudentActivity>(() => activitySeeds(p), { sorters: { date: (a, b) => a.date.localeCompare(b.date) }, defaultSort: 'date' }),
);

function resultSeeds(p: Profile): ResultEntry[] {
  return p === 'middle'
    ? [
        { id: 'r-1', title: '2. Ünite Değerlendirme', subject: 'Matematik', kind: 'exam', date: relativeDate(-3, 10, 30), score: 61, classAverage: 62, feedback: 'Kesirlerde tekrar yapmalısın; destek çalışması gönderdim.' },
        { id: 'r-2', title: 'Denklemler çalışma kâğıdı', subject: 'Matematik', kind: 'homework', date: relativeDate(-1, 18, 0), score: 84, classAverage: 76, feedback: 'Adımların çok düzenli.' },
        { id: 'r-3', title: 'Türkçe paragraf quiz', subject: 'Türkçe', kind: 'exam', date: relativeDate(-8, 9, 0), score: 80, classAverage: 71, feedback: null },
        { id: 'r-4', title: 'LGS Deneme Sınavı 1', subject: 'LGS', kind: 'mock', date: relativeDate(-18, 10, 0), score: 382, classAverage: 361, feedback: null },
        { id: 'r-5', title: 'Basınç quiz', subject: 'Fen Bilimleri', kind: 'exam', date: relativeDate(-14, 9, 0), score: 72, classAverage: 68, feedback: 'Sıvı basıncı sorularına dikkat.' },
        { id: 'r-6', title: 'İnkılap Tarihi 1. yazılı', subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', kind: 'exam', date: relativeDate(-21, 9, 0), score: 88, classAverage: 74, feedback: null },
      ]
    : [
        { id: 'r-1', title: 'Fizik 1. yazılı', subject: 'Fizik', kind: 'exam', date: relativeDate(-9, 9, 0), score: 78, classAverage: 69, feedback: null },
        { id: 'r-2', title: 'Gazlar quiz', subject: 'Kimya', kind: 'exam', date: relativeDate(-4, 9, 0), score: 85, classAverage: 72, feedback: null },
        { id: 'r-3', title: 'Trigonometri quiz 1', subject: 'Matematik', kind: 'exam', date: relativeDate(-11, 9, 0), score: 52, classAverage: 61, feedback: 'Toplam-fark formüllerini tekrar et.' },
        { id: 'r-4', title: 'Divan edebiyatı okuma notları', subject: 'Türk Dili ve Edebiyatı', kind: 'homework', date: relativeDate(-1, 18, 0), score: 90, classAverage: 79, feedback: 'Çok özenli çalışma.' },
      ];
}

export const studentResults = perProfile((p) =>
  createCollection<ResultEntry>(() => resultSeeds(p), { searchText: (r) => `${r.title} ${r.subject}`, sorters: { date: (a, b) => a.date.localeCompare(b.date) }, defaultSort: 'date' }),
);

function mistakeSeeds(p: Profile): MistakeEntry[] {
  const subjects = p === 'middle' ? ['Matematik', 'Fen Bilimleri', 'Türkçe'] : ['Fizik', 'Kimya', 'Biyoloji', 'Matematik'];
  const out: MistakeEntry[] = [];
  let n = 1;
  subjects.forEach((subject, si) => {
    const items = makeQuestions(subject, subject === 'Matematik' ? (p === 'middle' ? 'Kesirler' : 'Olasılık') : null, subject === 'Matematik' ? 6 : 3, 500 + si);
    for (const q of items) {
      out.push({
        id: `mk-${n}`,
        subject,
        topic: q.topic,
        stem: q.stem,
        options: q.options,
        answer: q.answer,
        yourAnswer: (q.answer + 1) % q.options.length,
        explanation: q.explanation,
        savedAt: new Date(Date.now() - n * 7 * 3_600_000).toISOString(),
        learned: n % 5 === 0,
      });
      n += 1;
    }
  });
  return out;
}

export const studentMistakes = perProfile((p) =>
  createCollection<MistakeEntry>(() => mistakeSeeds(p), { searchText: (m) => `${m.stem} ${m.topic} ${m.subject}`, sorters: { savedAt: (a, b) => a.savedAt.localeCompare(b.savedAt) }, defaultSort: 'savedAt' }),
);

function goalSeeds(p: Profile): StudentGoal[] {
  return p === 'middle'
    ? [
        { id: 'g1', label: 'Kesirler destek çalışmasını tamamla', done: true },
        { id: 'g2', label: '40 LGS matematik sorusu çöz', done: true },
        { id: 'g3', label: 'DNA özetini oku', done: true },
        { id: 'g4', label: 'Yanlışlarım defterinden 10 soruyu tekrar et', done: false },
        { id: 'g5', label: 'Paragraf testi: 20 soru', done: false },
      ]
    : [
        { id: 'g1', label: '60 trigonometri sorusu çöz', done: true },
        { id: 'g2', label: 'Yanlışlarım defterinden 15 soruyu tekrar et', done: true },
        { id: 'g3', label: 'Fizik ödevini zamanında teslim et', done: true },
        { id: 'g4', label: 'TYT paragraf: 40 soru', done: false },
        { id: 'g5', label: 'Kimyasal denge özetini oku', done: false },
      ];
}

export const studentGoals = perProfile((p) => createCollection<StudentGoal>(() => goalSeeds(p)));

function mockSeeds(p: Profile): AvailableMock[] {
  return p === 'middle'
    ? [
        { id: 'am-1', examType: 'LGS', title: 'LGS Matematik mini deneme', questionCount: 10, durationMinutes: 20, subjects: ['Matematik'], assignedBy: 'Ayşe Yılmaz', due: relativeDate(5, 23, 59) },
        { id: 'am-2', examType: 'LGS', title: 'LGS Fen Bilimleri mini deneme', questionCount: 6, durationMinutes: 12, subjects: ['Fen Bilimleri'], assignedBy: null, due: null },
        { id: 'am-3', examType: 'LGS', title: 'LGS Sözel mini deneme', questionCount: 4, durationMinutes: 10, subjects: ['Türkçe', 'T.C. İnkılap Tarihi ve Atatürkçülük'], assignedBy: null, due: null },
      ]
    : [
        { id: 'am-1', examType: 'TYT', title: 'TYT Temel Matematik mini deneme', questionCount: 10, durationMinutes: 20, subjects: ['Matematik'], assignedBy: 'Kaan Yıldırım', due: relativeDate(4, 23, 59) },
        { id: 'am-2', examType: 'AYT', title: 'AYT Fen mini deneme', questionCount: 4, durationMinutes: 10, subjects: ['Fizik', 'Kimya', 'Biyoloji'], assignedBy: null, due: null },
      ];
}

export const availableMocks = perProfile((p) => createCollection<AvailableMock>(() => mockSeeds(p)));

function historySeeds(p: Profile): MockAttempt[] {
  const random = createRandom(p === 'middle' ? 880 : 990);
  const type = p === 'middle' ? 'LGS' : 'TYT';
  const subjects = p === 'middle'
    ? [['Türkçe', 20], ['Matematik', 20], ['Fen Bilimleri', 20], ['İnkılap Tarihi', 10], ['İngilizce', 10]] as const
    : [['Türkçe', 40], ['Sosyal Bilimler', 20], ['Temel Matematik', 40], ['Fen Bilimleri', 20]] as const;
  return Array.from({ length: 6 }, (_, i) => {
    const bySubject = subjects.map(([subject, total]) => {
      const ratio = Math.min(0.97, 0.5 + i * 0.04 + random() * 0.12);
      return { subject, total, net: Math.round(total * ratio * 4) / 4 };
    });
    const correct = Math.round(bySubject.reduce((s, b) => s + b.net, 0) + random() * 4);
    const total = subjects.reduce((s, [, t]) => s + t, 0);
    const wrong = Math.round((total - correct) * 0.7);
    const net = bySubject.reduce((s, b) => s + b.net, 0);
    return {
      id: `att-${i + 1}`,
      examType: type,
      title: `${type} Deneme ${i + 1}`,
      date: relativeDate(-(6 - i) * 12, 10, 0),
      correct,
      wrong,
      blank: total - correct - wrong,
      net: Math.round(net * 100) / 100,
      score: p === 'middle' ? Math.round(300 + (net / total) * 200) : Math.round(220 + (net / total) * 260),
      bySubject,
    } as MockAttempt;
  });
}

export const mockHistory = perProfile((p) =>
  createCollection<MockAttempt>(() => historySeeds(p), { sorters: { date: (a, b) => a.date.localeCompare(b.date) }, defaultSort: 'date' }),
);

export const interestStore = perProfile<{ value: InterestProfile }>((p) => ({
  value: {
    interests: p === 'middle' ? ['technology', 'science', 'games'] : ['technology', 'health', 'science'],
    skills: [
      { key: 'analytical', level: 4 },
      { key: 'creative', level: 3 },
      { key: 'communication', level: 3 },
      { key: 'teamwork', level: 4 },
      { key: 'languages', level: 2 },
      { key: 'handsOn', level: 3 },
    ],
    updatedAt: relativeDate(-14, 18, 0),
  },
}));

function roadmapSeeds(): RoadmapStep[] {
  return [
    { id: 'rm-1', phase: 'now', title: 'Matematik ve fizik temelini güçlendir', description: 'Haftada 3 gün 45 dakikalık problem çözme planı.', done: true },
    { id: 'rm-2', phase: 'now', title: 'Bir programlama diline başla', description: 'Okul kodlama kulübüne katıl veya ücretsiz bir başlangıç kursu bitir.', done: false },
    { id: 'rm-3', phase: 'thisYear', title: 'TYT deneme ortalamanı yükselt', description: 'Her ay en az iki deneme çöz; yanlışlarını deftere kaydet.', done: false },
    { id: 'rm-4', phase: 'thisYear', title: 'Küçük bir proje geliştir', description: 'Okul için basit bir web sayfası veya uygulama tasarla.', done: false },
    { id: 'rm-5', phase: 'university', title: 'Hedef programları araştır', description: 'Tercih listende Bilgisayar Mühendisliği ve Veri Bilimi programlarını karşılaştır.', done: false },
    { id: 'rm-6', phase: 'career', title: 'Staj ve topluluk deneyimi', description: 'Üniversitede öğrenci topluluklarına ve yaz stajlarına katıl.', done: false },
  ];
}

export const roadmap = perProfile(() => createCollection<RoadmapStep>(roadmapSeeds));

export const savedChoices = perProfile((p) =>
  createCollection<SavedChoice>(
    () =>
      p === 'middle'
        ? [
            { id: 'sv-1', kind: 'school', refId: 'hs-1', name: 'Cumhuriyet Fen Lisesi', detail: 'Hatay · Fen Lisesi', score: 482.5, rank: null, order: 1, note: '' },
            { id: 'sv-2', kind: 'school', refId: 'hs-2', name: 'Cumhuriyet Anadolu Lisesi', detail: 'Hatay · Anadolu Lisesi', score: 431.2, rank: null, order: 2, note: 'Hazırlık sınıfı var' },
          ]
        : [{ id: 'sv-1', kind: 'program', refId: 'prg-1', name: 'Kuzey Ege Üniversitesi — Bilgisayar Mühendisliği', detail: 'İzmir · Devlet · SAY', score: null, rank: 42_000, order: 1, note: '' }],
    { sorters: { order: (a, b) => a.order - b.order }, defaultSort: 'order' },
  ),
);

/* ── Support work (Birlikte güçlendirelim) ─────────────────────────────
 * Ortaokul: Deniz's items are read live from the teacher's sentSupport store, so a support exercise
 * sent from the teacher panel shows up here in the same demo session.
 */
const extraSupport = perProfile((p) =>
  createCollection<SupportExerciseItem>(() =>
    p === 'middle'
      ? [
          { id: 'sup-x1', topic: 'Basınç', subject: 'Fen Bilimleri', teacher: 'Selin Aksoy', sentAt: relativeDate(-16, 10, 0), questionCount: 8, difficulty: 'easy', due: null, status: 'completed', before: 52, after: 72, includesSummary: true },
        ]
      : [
          { id: 'sup-1', topic: 'Toplam-Fark Formülleri', subject: 'Matematik', teacher: 'Kaan Yıldırım', sentAt: relativeDate(-1, 16, 0), questionCount: 10, difficulty: 'medium', due: relativeDate(2, 20, 0), status: 'pending', before: 38, after: null, includesSummary: true },
          { id: 'sup-2', topic: 'Atışlar', subject: 'Fizik', teacher: 'Tuana Aslan', sentAt: relativeDate(-9, 12, 0), questionCount: 8, difficulty: 'easy', due: null, status: 'completed', before: 33, after: 46, includesSummary: true },
          { id: 'sup-3', topic: 'Kimyasal Denge', subject: 'Kimya', teacher: 'Hira Kurt', sentAt: relativeDate(-4, 9, 0), questionCount: 12, difficulty: 'medium', due: relativeDate(5, 20, 0), status: 'pending', before: 39, after: null, includesSummary: false },
        ],
  ),
);

export function studentSupport(): SupportExerciseItem[] {
  const fromTeacher: SupportExerciseItem[] =
    profileNow() === 'middle'
      ? sentSupport
          .all()
          .filter((s) => s.studentName === `${currentDemoUser().firstName} ${currentDemoUser().lastName}`)
          .map((s) => ({
            id: s.id,
            topic: s.topic,
            subject: 'Matematik',
            teacher: 'Ayşe Yılmaz',
            sentAt: s.sentAt,
            questionCount: s.questionCount,
            difficulty: s.difficulty,
            due: s.due,
            status: s.status,
            before: s.before,
            after: s.after,
            includesSummary: s.includeSummary,
          }))
      : [];
  return [...fromTeacher, ...extraSupport().all()].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

/** Marks a support exercise as completed with the new topic score (writes back to the teacher store when it came from there). */
export function completeStudentSupport(id: string, after: number): SupportExerciseItem | undefined {
  if (sentSupport.find(id)) sentSupport.mutate(id, (s) => ({ ...s, status: 'completed', after }));
  else extraSupport().mutate(id, (s) => ({ ...s, status: 'completed', after }));
  return studentSupport().find((s) => s.id === id);
}
