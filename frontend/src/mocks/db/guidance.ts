/**
 * Guidance reference data. ALL NAMES AND FIGURES ARE FICTIONAL DEMO DATA — they are not real
 * admission results and must never be presented as such. Real data is imported by the administrator.
 */
import type { InterestProfile, MajorSuggestion } from '@/features/student/types';
import type { Career, DataSource, HighSchool, ScoreType, UniversityProgram } from '@/types';
import { compareText, createCollection } from '../collection';
import { createRandom, pick, relativeDate } from '../utils';

const CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Hatay', 'Adana', 'Konya', 'Kayseri', 'Trabzon', 'Eskişehir', 'Samsun'];
const SCHOOL_TYPES = ['Fen Lisesi', 'Anadolu Lisesi', 'Sosyal Bilimler Lisesi', 'Mesleki ve Teknik Anadolu Lisesi', 'Anadolu İmam Hatip Lisesi', 'Güzel Sanatlar Lisesi'];
const SCHOOL_NAMES = ['Cumhuriyet', 'Atatürk', 'Gazi', 'Mimar Sinan', 'Barbaros', 'Piri Reis', 'Yunus Emre', 'Mevlana', 'Hacı Bektaş', 'Kâtip Çelebi', 'Uluğ Bey', 'Ali Kuşçu', 'Cahit Arf', 'Aziz Sancar', 'Fatih', 'Kuvayi Milliye'];

function seedSchools(): HighSchool[] {
  const random = createRandom(5501);
  const list: HighSchool[] = [];
  let n = 1;
  for (const name of SCHOOL_NAMES) {
    for (const type of SCHOOL_TYPES.slice(0, 2 + Math.floor(random() * 3))) {
      const base = type === 'Fen Lisesi' ? 470 : type === 'Sosyal Bilimler Lisesi' ? 440 : type.startsWith('Anadolu') ? 380 : 300;
      const score = base + random() * 30;
      list.push({
        id: `hs-${n}`,
        name: `${name} ${type}`,
        city: pick(random, CITIES),
        district: pick(random, ['Merkez', 'Kuzey', 'Güney', 'Yenişehir', 'Çamlık', 'Sahil']),
        type,
        language: random() < 0.25 ? 'İngilizce hazırlıklı' : 'Türkçe',
        quota: 60 + Math.floor(random() * 6) * 30,
        scores: [2023, 2024, 2025].map((year, i) => {
          const s = Math.min(499, score + (i - 1) * (random() * 6 - 2));
          return { year, baseScore: Math.round(s * 100) / 100, percentile: Math.max(0.05, Math.round((500 - s) * 0.22 * 100) / 100) };
        }),
      });
      n += 1;
    }
  }
  return list;
}

export const schools = createCollection<HighSchool>(seedSchools, {
  searchText: (s) => `${s.name} ${s.city} ${s.district} ${s.type}`,
  sorters: {
    name: (a, b) => compareText(a.name, b.name),
    score: (a, b) => (a.scores.at(-1)?.baseScore ?? 0) - (b.scores.at(-1)?.baseScore ?? 0),
    quota: (a, b) => a.quota - b.quota,
  },
  defaultSort: 'score',
});

const UNIVERSITIES: { name: string; kind: 'Devlet' | 'Vakıf'; city: string; strength: number }[] = [
  { name: 'Kuzey Ege Üniversitesi', kind: 'Devlet', city: 'İzmir', strength: 0.82 },
  { name: 'Yeni Başkent Üniversitesi', kind: 'Devlet', city: 'Ankara', strength: 0.9 },
  { name: 'Boğaziçi Kıyısı Teknik Üniversitesi', kind: 'Devlet', city: 'İstanbul', strength: 0.95 },
  { name: 'Toros Bilim Üniversitesi', kind: 'Devlet', city: 'Adana', strength: 0.7 },
  { name: 'Uludağ Eteği Üniversitesi', kind: 'Devlet', city: 'Bursa', strength: 0.74 },
  { name: 'Lale Vakıf Üniversitesi', kind: 'Vakıf', city: 'İstanbul', strength: 0.78 },
  { name: 'Akdeniz Işık Üniversitesi', kind: 'Vakıf', city: 'Antalya', strength: 0.62 },
  { name: 'Karadeniz Yıldız Üniversitesi', kind: 'Devlet', city: 'Trabzon', strength: 0.72 },
  { name: 'Asi Vadisi Üniversitesi', kind: 'Devlet', city: 'Hatay', strength: 0.66 },
];

const PROGRAMS: { program: string; faculty: string; scoreType: ScoreType; weight: number; conditions?: string }[] = [
  { program: 'Bilgisayar Mühendisliği', faculty: 'Mühendislik Fakültesi', scoreType: 'SAY', weight: 0.92 },
  { program: 'Elektrik-Elektronik Mühendisliği', faculty: 'Mühendislik Fakültesi', scoreType: 'SAY', weight: 0.85 },
  { program: 'Tıp', faculty: 'Tıp Fakültesi', scoreType: 'SAY', weight: 0.99, conditions: 'Sağlık raporu istenir.' },
  { program: 'Diş Hekimliği', faculty: 'Diş Hekimliği Fakültesi', scoreType: 'SAY', weight: 0.95 },
  { program: 'Eczacılık', faculty: 'Eczacılık Fakültesi', scoreType: 'SAY', weight: 0.88 },
  { program: 'Hemşirelik', faculty: 'Sağlık Bilimleri Fakültesi', scoreType: 'SAY', weight: 0.6 },
  { program: 'Mimarlık', faculty: 'Mimarlık Fakültesi', scoreType: 'SAY', weight: 0.75 },
  { program: 'Psikoloji', faculty: 'İnsan ve Toplum Bilimleri Fakültesi', scoreType: 'EA', weight: 0.8 },
  { program: 'Hukuk', faculty: 'Hukuk Fakültesi', scoreType: 'EA', weight: 0.86 },
  { program: 'İşletme', faculty: 'İktisadi ve İdari Bilimler Fakültesi', scoreType: 'EA', weight: 0.6 },
  { program: 'Matematik Öğretmenliği', faculty: 'Eğitim Fakültesi', scoreType: 'SAY', weight: 0.7 },
  { program: 'Türk Dili ve Edebiyatı', faculty: 'Edebiyat Fakültesi', scoreType: 'SÖZ', weight: 0.55 },
  { program: 'Tarih', faculty: 'Edebiyat Fakültesi', scoreType: 'SÖZ', weight: 0.5 },
  { program: 'Mütercim ve Tercümanlık (İngilizce)', faculty: 'Yabancı Diller Fakültesi', scoreType: 'DİL', weight: 0.72 },
  { program: 'Veri Bilimi ve Analitiği', faculty: 'Mühendislik Fakültesi', scoreType: 'SAY', weight: 0.82 },
];

function seedPrograms(): UniversityProgram[] {
  const random = createRandom(7701);
  const list: UniversityProgram[] = [];
  let n = 1;
  for (const uni of UNIVERSITIES) {
    for (const p of PROGRAMS) {
      if (random() < 0.35) continue;
      const strength = Math.min(0.995, uni.strength * 0.55 + p.weight * 0.45 + (random() - 0.5) * 0.06);
      const rank = Math.max(150, Math.round((1 - strength) ** 2.2 * 2_400_000));
      list.push({
        id: `prg-${n}`,
        university: uni.name,
        program: p.program,
        faculty: p.faculty,
        city: uni.city,
        kind: uni.kind,
        scoreType: p.scoreType,
        baseRank: rank,
        baseScore: Math.round((560 - Math.log10(rank) * 48) * 100) / 100,
        quota: (2 + Math.floor(random() * 10)) * 10,
        conditions: p.conditions ?? (uni.kind === 'Vakıf' ? 'Burs oranı programa göre değişir.' : null),
      });
      n += 1;
    }
  }
  return list;
}

export const programs = createCollection<UniversityProgram>(seedPrograms, {
  searchText: (p) => `${p.university} ${p.program} ${p.city} ${p.faculty}`,
  sorters: {
    baseRank: (a, b) => a.baseRank - b.baseRank,
    university: (a, b) => compareText(a.university, b.university),
    program: (a, b) => compareText(a.program, b.program),
    quota: (a, b) => a.quota - b.quota,
  },
  defaultSort: 'baseRank',
});

const CAREER_SEEDS: Omit<Career, 'id'>[] = [
  { name: 'Yazılım Mühendisi', field: 'Bilişim', description: 'Uygulama ve sistemleri tasarlar, geliştirir ve test eder.', skills: ['Problem çözme', 'Programlama', 'Matematiksel düşünme', 'Takım çalışması'], programs: ['Bilgisayar Mühendisliği', 'Veri Bilimi ve Analitiği'], outlook: 'high', scoreType: 'SAY' },
  { name: 'Veri Bilimci', field: 'Bilişim', description: 'Verileri analiz ederek karar vermeye yardımcı modeller kurar.', skills: ['İstatistik', 'Programlama', 'Merak', 'Görselleştirme'], programs: ['Veri Bilimi ve Analitiği', 'Bilgisayar Mühendisliği'], outlook: 'high', scoreType: 'SAY' },
  { name: 'Hekim', field: 'Sağlık', description: 'Hastalıkları teşhis eder, tedavi planlar ve hastaları izler.', skills: ['Biyoloji', 'Empati', 'Sorumluluk', 'Stres yönetimi'], programs: ['Tıp'], outlook: 'high', scoreType: 'SAY' },
  { name: 'Hemşire', field: 'Sağlık', description: 'Hasta bakımını planlar ve uygular, sağlık ekibiyle çalışır.', skills: ['Empati', 'Dikkat', 'İletişim', 'Dayanıklılık'], programs: ['Hemşirelik'], outlook: 'high', scoreType: 'SAY' },
  { name: 'Eczacı', field: 'Sağlık', description: 'İlaçların doğru kullanımını sağlar, danışmanlık verir.', skills: ['Kimya', 'Dikkat', 'İletişim'], programs: ['Eczacılık'], outlook: 'medium', scoreType: 'SAY' },
  { name: 'Mimar', field: 'Tasarım', description: 'Yapıları işlevsel ve estetik biçimde tasarlar.', skills: ['Uzamsal düşünme', 'Yaratıcılık', 'Çizim', 'Proje yönetimi'], programs: ['Mimarlık'], outlook: 'medium', scoreType: 'SAY' },
  { name: 'Elektrik-Elektronik Mühendisi', field: 'Mühendislik', description: 'Elektronik devre ve enerji sistemleri geliştirir.', skills: ['Fizik', 'Matematik', 'Analitik düşünme'], programs: ['Elektrik-Elektronik Mühendisliği'], outlook: 'high', scoreType: 'SAY' },
  { name: 'Psikolog', field: 'Sosyal Bilimler', description: 'İnsan davranışını inceler, danışmanlık ve destek sağlar.', skills: ['Empati', 'Dinleme', 'Araştırma', 'Etik'], programs: ['Psikoloji'], outlook: 'medium', scoreType: 'EA' },
  { name: 'Avukat', field: 'Hukuk', description: 'Kişi ve kurumları hukuki konularda temsil eder.', skills: ['Okuduğunu anlama', 'İkna', 'Araştırma', 'Yazılı anlatım'], programs: ['Hukuk'], outlook: 'medium', scoreType: 'EA' },
  { name: 'Öğretmen', field: 'Eğitim', description: 'Öğrencilerin öğrenmesini planlar, destekler ve değerlendirir.', skills: ['İletişim', 'Sabır', 'Planlama', 'Alan bilgisi'], programs: ['Matematik Öğretmenliği'], outlook: 'medium', scoreType: 'SAY' },
  { name: 'Tercüman', field: 'Dil', description: 'Yazılı ve sözlü metinleri diller arasında aktarır.', skills: ['Yabancı dil', 'Kültürel farkındalık', 'Dikkat'], programs: ['Mütercim ve Tercümanlık (İngilizce)'], outlook: 'medium', scoreType: 'DİL' },
  { name: 'Tarihçi / Araştırmacı', field: 'Sosyal Bilimler', description: 'Belgeleri inceler, geçmişi araştırır ve yorumlar.', skills: ['Araştırma', 'Okuma', 'Eleştirel düşünme'], programs: ['Tarih'], outlook: 'low', scoreType: 'SÖZ' },
];

export const careers = createCollection<Career>(() => CAREER_SEEDS.map((c, i) => ({ id: `car-${i + 1}`, ...c })), {
  searchText: (c) => `${c.name} ${c.field} ${c.skills.join(' ')} ${c.programs.join(' ')}`,
  sorters: { name: (a, b) => compareText(a.name, b.name), field: (a, b) => compareText(a.field, b.field) },
  defaultSort: 'name',
});

/**
 * Interest / skill tags per programme for the student "Bölüm önerileri" page.
 * A transparent, rule-based score (tag overlap + self-rated skill levels) — not an AI model.
 */
const MAJOR_PROFILES: { program: string; field: string; interests: string[]; skills: string[] }[] = [
  { program: 'Bilgisayar Mühendisliği', field: 'Mühendislik', interests: ['technology', 'math', 'games', 'science'], skills: ['analytical', 'creative', 'teamwork'] },
  { program: 'Veri Bilimi ve Analitiği', field: 'Bilişim', interests: ['technology', 'math', 'science', 'business'], skills: ['analytical', 'creative'] },
  { program: 'Elektrik-Elektronik Mühendisliği', field: 'Mühendislik', interests: ['technology', 'science', 'math'], skills: ['analytical', 'handsOn'] },
  { program: 'Tıp', field: 'Sağlık', interests: ['health', 'science', 'social'], skills: ['analytical', 'communication', 'teamwork'] },
  { program: 'Diş Hekimliği', field: 'Sağlık', interests: ['health', 'science', 'art'], skills: ['handsOn', 'communication'] },
  { program: 'Eczacılık', field: 'Sağlık', interests: ['health', 'science'], skills: ['analytical', 'communication'] },
  { program: 'Hemşirelik', field: 'Sağlık', interests: ['health', 'social'], skills: ['communication', 'teamwork', 'handsOn'] },
  { program: 'Mimarlık', field: 'Tasarım', interests: ['design', 'art', 'math'], skills: ['creative', 'handsOn'] },
  { program: 'Psikoloji', field: 'Sosyal Bilimler', interests: ['social', 'health', 'education'], skills: ['communication', 'analytical'] },
  { program: 'Hukuk', field: 'Hukuk', interests: ['law', 'social', 'history'], skills: ['communication', 'analytical'] },
  { program: 'İşletme', field: 'İşletme', interests: ['business', 'social', 'math'], skills: ['communication', 'teamwork'] },
  { program: 'Matematik Öğretmenliği', field: 'Eğitim', interests: ['education', 'math'], skills: ['communication', 'analytical'] },
  { program: 'Türk Dili ve Edebiyatı', field: 'Dil', interests: ['languages', 'history', 'art'], skills: ['communication', 'creative'] },
  { program: 'Tarih', field: 'Sosyal Bilimler', interests: ['history', 'social'], skills: ['analytical', 'communication'] },
  { program: 'Mütercim ve Tercümanlık (İngilizce)', field: 'Dil', interests: ['languages', 'social'], skills: ['languages', 'communication'] },
];

/** 60 % interest overlap (up to three shared interests) + 40 % average self-rated level of the programme's key skills. */
export function majorSuggestions(profile: InterestProfile): MajorSuggestion[] {
  const level = new Map(profile.skills.map((s) => [s.key, s.level]));
  const catalogue = programs.all();
  return MAJOR_PROFILES.map((m, i) => {
    const matchedInterests = m.interests.filter((k) => profile.interests.includes(k));
    const interestScore = matchedInterests.length / Math.min(3, Math.max(1, profile.interests.length));
    const skillScore = m.skills.reduce((sum, k) => sum + (level.get(k) ?? 1), 0) / (m.skills.length * 5);
    const match = Math.round(Math.min(1, interestScore) * 60 + skillScore * 40);
    const strongSkills = m.skills.filter((k) => (level.get(k) ?? 0) >= 4);
    return {
      id: `mj-${i + 1}`,
      name: m.program,
      field: m.field,
      match,
      reasons: [...matchedInterests.map((key) => ({ kind: 'interest' as const, key })), ...strongSkills.map((key) => ({ kind: 'skill' as const, key }))],
      careers: CAREER_SEEDS.filter((c) => c.programs.includes(m.program)).map((c) => c.name),
      scoreType: PROGRAMS.find((p) => p.program === m.program)?.scoreType ?? 'SAY',
      programCount: catalogue.filter((p) => p.program === m.program).length,
    };
  })
    .filter((m) => m.match >= 35)
    .sort((a, b) => b.match - a.match || a.name.localeCompare(b.name, 'tr'));
}

export const dataSources = createCollection<DataSource>(
  () => [
    { id: 'ds-1', dataset: 'schools', source: 'Örnek veri seti (demo)', year: 2025, records: schools.all().length, updatedAt: relativeDate(-12, 11, 0), updatedBy: 'Hakan Öztürk', status: 'current' },
    { id: 'ds-2', dataset: 'universities', source: 'Örnek veri seti (demo)', year: 2025, records: programs.all().length, updatedAt: relativeDate(-20, 15, 30), updatedBy: 'Hakan Öztürk', status: 'current' },
    { id: 'ds-3', dataset: 'careers', source: 'Kurum içi derleme', year: 2025, records: CAREER_SEEDS.length, updatedAt: relativeDate(-40, 10, 0), updatedBy: 'Hakan Öztürk', status: 'current' },
    { id: 'ds-4', dataset: 'universities', source: 'Örnek veri seti (demo)', year: 2024, records: 118, updatedAt: relativeDate(-380, 10, 0), updatedBy: 'Hakan Öztürk', status: 'outdated' },
  ],
  { sorters: { updatedAt: (a, b) => a.updatedAt.localeCompare(b.updatedAt) }, defaultSort: 'updatedAt' },
);
