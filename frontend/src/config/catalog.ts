/** Fixed reference lists shared by the admin data pages and the student guidance pages. */
import type { Difficulty, ScoreType } from '@/types';

/** The 81 provinces of Türkiye (alphabetical, Turkish collation). */
export const CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir',
  'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli',
  'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay',
  'Iğdır', 'Isparta', 'İstanbul', 'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale',
  'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir',
  'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat',
  'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
];
export const SCHOOL_TYPES = [
  'Fen Lisesi',
  'Anadolu Lisesi',
  'Sosyal Bilimler Lisesi',
  'Mesleki ve Teknik Anadolu Lisesi',
  'Çok Programlı Anadolu Lisesi',
  'Anadolu İmam Hatip Lisesi',
  'Güzel Sanatlar Lisesi',
  'Spor Lisesi',
];
export const SCORE_TYPES: ScoreType[] = ['SAY', 'EA', 'SÖZ', 'DİL'];
export const CAREER_FIELDS = ['Bilişim', 'Sağlık', 'Mühendislik', 'Tasarım', 'Sosyal Bilimler', 'Hukuk', 'Eğitim', 'Dil', 'İşletme', 'Sanat', 'Spor'];
export const DIFF_TONE: Record<Difficulty, 'success' | 'warning' | 'danger'> = { easy: 'success', medium: 'warning', hard: 'danger' };
export const PRIORITY_TONE = { low: 'neutral', normal: 'info', urgent: 'danger' } as const;
export const REQUEST_STATUS_TONE = { open: 'warning', inProgress: 'info', resolved: 'success' } as const;
export const BRANCHES = [
  'Matematik', 'Fen Bilimleri', 'Türkçe', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü ve Ahlak Bilgisi', 'Sınıf Öğretmenliği',
  'Fizik', 'Kimya', 'Biyoloji', 'Türk Dili ve Edebiyatı', 'Tarih', 'Coğrafya', 'Beden Eğitimi', 'Görsel Sanatlar', 'Müzik', 'Bilişim Teknolojileri', 'Rehberlik',
];
