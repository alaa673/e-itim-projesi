import type { CatalogUnit, SchoolLevel, Subject } from '@/types';

/** Topic lists follow the national curriculum headings (simplified for the demo). */
const u = (id: string, name: string, topics: string[]): CatalogUnit => ({
  id,
  name,
  topics: topics.map((t, i) => ({ id: `${id}-t${i + 1}`, name: t })),
});

export const SUBJECT_SEEDS: Subject[] = [
  {
    id: 'sub-mat', name: 'Matematik', levels: ['primary', 'middle', 'high'], grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], weeklyHours: 5, status: 'active',
    units: [
      u('mat-u1', 'Sayılar ve İşlemler', ['Kesirler', 'Üslü İfadeler', 'Kareköklü İfadeler', 'Çarpanlar ve Katlar']),
      u('mat-u2', 'Cebir', ['Denklemler', 'Cebirsel İfadeler', 'Eşitsizlikler', 'Oran ve Orantı']),
      u('mat-u3', 'Geometri ve Ölçme', ['Geometri', 'Üçgenler', 'Dönüşüm Geometrisi', 'Geometrik Cisimler']),
      u('mat-u4', 'Veri İşleme', ['Veri Analizi', 'Olasılık']),
    ],
  },
  {
    id: 'sub-fen', name: 'Fen Bilimleri', levels: ['primary', 'middle'], grades: [3, 4, 5, 6, 7, 8], weeklyHours: 4, status: 'active',
    units: [
      u('fen-u1', 'Canlılar ve Yaşam', ['DNA ve Genetik Kod', 'Hücre ve Bölünmeler', 'Canlılar ve Enerji İlişkileri']),
      u('fen-u2', 'Fiziksel Olaylar', ['Basınç', 'Basit Makineler', 'Elektrik Yükleri']),
      u('fen-u3', 'Madde ve Doğası', ['Madde ve Endüstri', 'Mevsimler ve İklim']),
    ],
  },
  {
    id: 'sub-tr', name: 'Türkçe', levels: ['primary', 'middle'], grades: [1, 2, 3, 4, 5, 6, 7, 8], weeklyHours: 6, status: 'active',
    units: [u('tr-u1', 'Okuma', ['Paragrafta Anlam', 'Söz Sanatları', 'Metin Türleri']), u('tr-u2', 'Dil Bilgisi', ['Fiilimsiler', 'Cümlenin Ögeleri', 'Yazım Kuralları'])],
  },
  {
    id: 'sub-ink', name: 'T.C. İnkılap Tarihi ve Atatürkçülük', levels: ['middle'], grades: [8], weeklyHours: 2, status: 'active',
    units: [u('ink-u1', 'Milli Mücadele', ['Bir Kahraman Doğuyor', 'Milli Uyanış', 'Ya İstiklal Ya Ölüm'])],
  },
  {
    id: 'sub-ing', name: 'İngilizce', levels: ['primary', 'middle', 'high'], grades: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], weeklyHours: 4, status: 'active',
    units: [u('ing-u1', 'Communication', ['Friendship', 'Teen Life', 'In the Kitchen', 'On the Phone'])],
  },
  {
    id: 'sub-sos', name: 'Sosyal Bilgiler', levels: ['primary', 'middle'], grades: [4, 5, 6, 7], weeklyHours: 3, status: 'active',
    units: [u('sos-u1', 'Birey ve Toplum', ['Haklarımız', 'Kültür ve Miras', 'Üretim ve Tüketim'])],
  },
  {
    id: 'sub-din', name: 'Din Kültürü ve Ahlak Bilgisi', levels: ['primary', 'middle', 'high'], grades: [4, 5, 6, 7, 8, 9, 10, 11, 12], weeklyHours: 2, status: 'active',
    units: [u('din-u1', 'Ahlak ve Değerler', ['Kader İnancı', 'Zekât ve Sadaka', 'Din ve Hayat'])],
  },
  {
    id: 'sub-fiz', name: 'Fizik', levels: ['high'], grades: [9, 10, 11, 12], weeklyHours: 3, status: 'active',
    units: [u('fiz-u1', 'Mekanik', ['Kuvvet ve Hareket', 'Newton’un Hareket Yasaları', 'Enerji', 'Elektrik ve Manyetizma'])],
  },
  {
    id: 'sub-kim', name: 'Kimya', levels: ['high'], grades: [9, 10, 11, 12], weeklyHours: 3, status: 'active',
    units: [u('kim-u1', 'Kimyanın Temelleri', ['Atom ve Periyodik Sistem', 'Kimyasal Türler', 'Gazlar', 'Çözeltiler'])],
  },
  {
    id: 'sub-biy', name: 'Biyoloji', levels: ['high'], grades: [9, 10, 11, 12], weeklyHours: 3, status: 'active',
    units: [u('biy-u1', 'Yaşam Bilimi', ['Hücre', 'Kalıtım', 'Ekosistem Ekolojisi', 'İnsan Fizyolojisi'])],
  },
  {
    id: 'sub-edb', name: 'Türk Dili ve Edebiyatı', levels: ['high'], grades: [9, 10, 11, 12], weeklyHours: 5, status: 'active',
    units: [u('edb-u1', 'Edebiyat', ['Şiir Bilgisi', 'Divan Edebiyatı', 'Roman', 'Tiyatro'])],
  },
  {
    id: 'sub-tar', name: 'Tarih', levels: ['high'], grades: [9, 10, 11, 12], weeklyHours: 2, status: 'active',
    units: [u('tar-u1', 'Türk ve Dünya Tarihi', ['İlk Türk Devletleri', 'Osmanlı Kuruluş Dönemi', 'Yakın Çağ Avrupası'])],
  },
  {
    id: 'sub-cog', name: 'Coğrafya', levels: ['high'], grades: [9, 10, 11, 12], weeklyHours: 2, status: 'active',
    units: [u('cog-u1', 'Doğal Sistemler', ['Harita Bilgisi', 'İklim', 'Nüfus ve Yerleşme'])],
  },
];

export function subjectsFor(level: SchoolLevel, grade: number): Subject[] {
  return SUBJECT_SEEDS.filter((s) => s.levels.includes(level) && s.grades.includes(grade));
}

export function topicsOf(subjectName: string): string[] {
  return SUBJECT_SEEDS.find((s) => s.name === subjectName)?.units.flatMap((un) => un.topics.map((t) => t.name)) ?? [];
}
