/** Announcements, support requests, calendars, meetings and messages. DEVELOPMENT-ONLY demo data. */
import type { Announcement, CalendarEvent, Conversation, Meeting, SupportRequest, UserRole } from '@/types';
import { createCollection } from '../collection';
import { isHighSchoolDemo } from '../session';
import { relativeDate } from '../utils';

/** Students get one store per demo profile (Deniz: ortaokul, Elif: lise). */
type StoreKey = UserRole | 'studentHigh';
const storeKey = (role: UserRole): StoreKey => (role === 'student' && isHighSchoolDemo() ? 'studentHigh' : role);

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const announcements = createCollection<Announcement>(
  () => [
    { id: 'an-1', title: 'Veli toplantısı takvimi açıklandı', body: '8. sınıf veli toplantıları önümüzdeki hafta Salı ve Çarşamba günleri 17.00’de yapılacaktır. Ayrıntılar sınıf öğretmenleri tarafından paylaşılacaktır.', audience: 'all', audienceLabel: 'Tüm kurum', author: 'Hakan Öztürk', authorRole: 'admin', publishedAt: minutesAgo(180), status: 'published', pinned: true },
    { id: 'an-2', title: 'LGS deneme sınavı – 2', body: '8. sınıflar için ikinci LGS deneme sınavı Cumartesi 10.00’da konferans salonunda yapılacaktır. Öğrencilerin kurşun kalem ve silgi getirmesi gerekir.', audience: 'middle', audienceLabel: 'Ortaokul', author: 'Hakan Öztürk', authorRole: 'admin', publishedAt: minutesAgo(60 * 26), status: 'published', pinned: false },
    { id: 'an-3', title: 'Kütüphane çalışma saatleri uzatıldı', body: 'Sınav dönemi boyunca kütüphane hafta içi 19.00’a kadar açık olacaktır.', audience: 'students', audienceLabel: 'Öğrenciler', author: 'Hakan Öztürk', authorRole: 'admin', publishedAt: minutesAgo(60 * 50), status: 'published', pinned: false },
    { id: 'an-4', title: 'Zümre toplantısı', body: 'Matematik zümre toplantısı Perşembe 15.30’da öğretmenler odasında yapılacaktır.', audience: 'teachers', audienceLabel: 'Öğretmenler', author: 'Hakan Öztürk', authorRole: 'admin', publishedAt: minutesAgo(60 * 72), status: 'published', pinned: false },
    { id: 'an-5', title: 'Bahar dönemi kulüp seçimleri', body: 'Kulüp seçimleri dönem başında açılacaktır. Kulüp listesi ilan panosunda yayınlanacaktır.', audience: 'all', audienceLabel: 'Tüm kurum', author: 'Hakan Öztürk', authorRole: 'admin', publishedAt: relativeDate(6, 9, 0), status: 'scheduled', pinned: false },
    { id: 'an-6', title: 'Kesirler tekrar çalışması', body: 'Bu hafta kesirler konusunda tekrar çalışması yapacağız. Destek alıştırmalarını Cuma gününe kadar tamamlayın.', audience: '8-A', audienceLabel: '8-A', author: 'Ayşe Yılmaz', authorRole: 'teacher', publishedAt: minutesAgo(60 * 5), status: 'published', pinned: false },
    { id: 'an-7', title: 'Quiz tarihi değişti', body: 'Üslü sayılar quizi Çarşamba yerine Perşembe 11.00’de yapılacak.', audience: '8-B', audienceLabel: '8-B', author: 'Ayşe Yılmaz', authorRole: 'teacher', publishedAt: minutesAgo(60 * 30), status: 'published', pinned: false },
    { id: 'an-9', title: 'TYT Deneme Sınavı 3', body: '11 ve 12. sınıflar için TYT Deneme Sınavı 3, Cumartesi 10.00’da yapılacaktır. Sınav süresi 165 dakikadır.', audience: 'high', audienceLabel: 'Lise', author: 'Hakan Öztürk', authorRole: 'admin', publishedAt: minutesAgo(60 * 20), status: 'published', pinned: false },
    { id: 'an-10', title: 'Trigonometri soru çözüm saati', body: 'Perşembe 16.00’da çevrim içi soru çözüm saati yapacağız. Zorlandığınız soruları önceden mesajla gönderin.', audience: '11-B', audienceLabel: '11-B', author: 'Kaan Yıldırım', authorRole: 'teacher', publishedAt: minutesAgo(60 * 8), status: 'published', pinned: false },
    { id: 'an-8', title: 'Proje ödevi taslağı', body: 'Oran-orantı proje ödevinin taslağını paylaştım; yorumlarınızı bekliyorum.', audience: '7-A', audienceLabel: '7-A', author: 'Ayşe Yılmaz', authorRole: 'teacher', publishedAt: relativeDate(-3, 13, 0), status: 'draft', pinned: false },
  ],
  {
    searchText: (a) => `${a.title} ${a.body} ${a.audienceLabel}`,
    filter: (a, key, value) => (key === 'authorRole' ? a.authorRole === value : key === 'visibleTo' ? visibleTo(a, value) : String((a as unknown as Record<string, unknown>)[key]) === value),
    // Pinned first when sorted newest-first (desc).
    sorters: { publishedAt: (a, b) => Number(a.pinned) - Number(b.pinned) || a.publishedAt.localeCompare(b.publishedAt) },
    defaultSort: 'publishedAt',
  },
);

/** Which announcements a viewer sees: role audience, their level, or their class. */
function visibleTo(a: Announcement, viewer: string): boolean {
  if (a.status !== 'published') return false;
  const [role, level, className] = viewer.split('|');
  if (a.audience === 'all') return true;
  if (a.audience === 'teachers') return role === 'teacher';
  if (a.audience === 'students') return role === 'student';
  if (['primary', 'middle', 'high'].includes(a.audience)) return role === 'student' && level === a.audience;
  return a.audience === className;
}

export const supportRequests = createCollection<SupportRequest>(
  () => [
    { id: 'sr-1', subject: 'Öğrenci hesabına giriş yapılamıyor', category: 'account', requester: 'Ecrin Polat', requesterRole: 'student', priority: 'urgent', status: 'open', createdAt: minutesAgo(35), messages: [{ id: 'm1', from: 'Ecrin Polat', fromRole: 'student', text: 'Şifremi doğru yazmama rağmen giriş yapamıyorum.', at: minutesAgo(35) }] },
    { id: 'sr-2', subject: 'PDF yüklemesi tamamlanmıyor', category: 'file', requester: 'Ayşe Yılmaz', requesterRole: 'teacher', priority: 'normal', status: 'inProgress', createdAt: minutesAgo(140), messages: [{ id: 'm1', from: 'Ayşe Yılmaz', fromRole: 'teacher', text: 'Kesirler konu özeti PDF’i %80’de takılıyor.', at: minutesAgo(140) }, { id: 'm2', from: 'Hakan Öztürk', fromRole: 'admin', text: 'Dosya boyutunu kontrol ediyorum, 25 MB sınırını aşmış olabilir.', at: minutesAgo(90) }] },
    { id: 'sr-3', subject: 'Sınav sonucu görünmüyor', category: 'exam', requester: 'Kerem Arslan', requesterRole: 'student', priority: 'normal', status: 'open', createdAt: minutesAgo(300), messages: [{ id: 'm1', from: 'Kerem Arslan', fromRole: 'student', text: 'Dünkü quizin sonucunu göremiyorum.', at: minutesAgo(300) }] },
    { id: 'sr-4', subject: 'Yanlış cevap anahtarı', category: 'content', requester: 'Mehmet Aydın', requesterRole: 'teacher', priority: 'urgent', status: 'open', createdAt: minutesAgo(60 * 20), messages: [{ id: 'm1', from: 'Mehmet Aydın', fromRole: 'teacher', text: 'LGS 2024 Fen 7. sorunun cevabı C olmalı.', at: minutesAgo(60 * 20) }] },
    { id: 'sr-5', subject: 'Sınıf listesinde eksik öğrenci', category: 'account', requester: 'Zeynep Kara', requesterRole: 'teacher', priority: 'low', status: 'resolved', createdAt: relativeDate(-3, 9, 0), messages: [{ id: 'm1', from: 'Zeynep Kara', fromRole: 'teacher', text: '6-B listesinde iki öğrenci görünmüyor.', at: relativeDate(-3, 9, 0) }, { id: 'm2', from: 'Hakan Öztürk', fromRole: 'admin', text: 'Öğrenciler sınıfa eklendi.', at: relativeDate(-3, 11, 0) }] },
    { id: 'sr-6', subject: 'Toplantı bağlantısı açılmıyor', category: 'other', requester: 'Arda Şahin', requesterRole: 'student', priority: 'normal', status: 'resolved', createdAt: relativeDate(-5, 14, 0), messages: [{ id: 'm1', from: 'Arda Şahin', fromRole: 'student', text: 'Toplantı linki hata veriyor.', at: relativeDate(-5, 14, 0) }] },
    { id: 'sr-7', subject: 'Ödev dosyası yüklenmiyor', category: 'file', requester: 'Nehir Doğan', requesterRole: 'student', priority: 'normal', status: 'open', createdAt: minutesAgo(60 * 7), messages: [{ id: 'm1', from: 'Nehir Doğan', fromRole: 'student', text: 'Fen ödevimi yüklerken hata alıyorum.', at: minutesAgo(60 * 7) }] },
  ],
  {
    searchText: (r) => `${r.subject} ${r.requester}`,
    sorters: { createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt), priority: (a, b) => ['low', 'normal', 'urgent'].indexOf(a.priority) - ['low', 'normal', 'urgent'].indexOf(b.priority) },
    defaultSort: 'createdAt',
  },
);

const at = (days: number, h: number, m = 0) => relativeDate(days, h, m);

function eventsFor(role: StoreKey): CalendarEvent[] {
  if (role === 'studentHigh') {
    return [
      { id: 'ev-1', title: 'Trigonometri quiz', kind: 'exam', start: at(0, 13), end: at(0, 13, 30), classLabel: '11-B' },
      { id: 'ev-2', title: 'Newton yasaları çalışma kâğıdı teslimi', kind: 'homework', start: at(0, 23, 59), end: at(0, 23, 59), classLabel: '11-B' },
      { id: 'ev-3', title: 'Rehberlik görüşmesi — Tercih planı', kind: 'meeting', start: at(1, 15, 40), end: at(1, 16, 10), classLabel: null },
      { id: 'ev-4', title: 'Gazlar deney raporu (grup) teslimi', kind: 'homework', start: at(3, 17), end: at(3, 17), classLabel: '11-B' },
      { id: 'ev-5', title: 'TYT Deneme 3', kind: 'exam', start: at(5, 10), end: at(5, 12, 45), classLabel: '11-B' },
      { id: 'ev-6', title: 'Fizik proje haftası', kind: 'activity', start: at(6, 10), end: at(6, 12), classLabel: '11-B' },
      { id: 'ev-7', title: 'Münazara: Teknoloji ve eğitim', kind: 'activity', start: at(9, 14), end: at(9, 15), classLabel: '11-B' },
    ];
  }
  if (role === 'teacher') {
    return [
      { id: 'ev-1', title: 'Matematik — Kesirlerde işlemler', kind: 'lesson', start: at(0, 9), end: at(0, 9, 40), classLabel: '8-A' },
      { id: 'ev-2', title: 'Quiz — Üslü sayılar (10 soru)', kind: 'exam', start: at(0, 11), end: at(0, 11, 40), classLabel: '8-B' },
      { id: 'ev-3', title: 'Öğrenci görüşmesi — Mert Arslan', kind: 'meeting', start: at(0, 14), end: at(0, 14, 30), classLabel: '8-A' },
      { id: 'ev-4', title: 'Oran-orantı proje ödevi teslimi', kind: 'homework', start: at(2, 23, 59), end: at(2, 23, 59), classLabel: '7-A' },
      { id: 'ev-5', title: 'LGS Deneme Sınavı 2', kind: 'exam', start: at(3, 10), end: at(3, 12, 15), classLabel: '8-A, 8-B' },
      { id: 'ev-6', title: 'Matematik zümre toplantısı', kind: 'meeting', start: at(1, 15, 30), end: at(1, 16, 30), classLabel: null },
      { id: 'ev-7', title: 'Geometri atölyesi (grup etkinliği)', kind: 'activity', start: at(4, 13), end: at(4, 14), classLabel: '6-B' },
      { id: 'ev-8', title: 'Veli toplantısı', kind: 'meeting', start: at(5, 17), end: at(5, 18, 30), classLabel: '8-A' },
      { id: 'ev-9', title: 'Cebir quiz', kind: 'exam', start: at(8, 9), end: at(8, 9, 40), classLabel: '7-C' },
      { id: 'ev-10', title: 'Veri analizi ödevi teslimi', kind: 'homework', start: at(-2, 23, 59), end: at(-2, 23, 59), classLabel: '5-A' },
    ];
  }
  if (role === 'student') {
    return [
      { id: 'ev-1', title: 'Matematik quiz — Kesirlerle işlemler', kind: 'exam', start: at(0, 11), end: at(0, 11, 40), classLabel: '8-A' },
      { id: 'ev-2', title: 'Fen bilimleri ödevi — DNA ve kalıtım', kind: 'homework', start: at(1, 23, 59), end: at(1, 23, 59), classLabel: '8-A' },
      { id: 'ev-3', title: 'Öğretmen görüşmesi — Matematik performansı', kind: 'meeting', start: at(0, 14), end: at(0, 14, 30), classLabel: null },
      { id: 'ev-4', title: 'LGS Deneme Sınavı 2', kind: 'exam', start: at(3, 10), end: at(3, 12, 15), classLabel: '8-A' },
      { id: 'ev-5', title: 'Türkçe okuma etkinliği', kind: 'activity', start: at(2, 13), end: at(2, 14), classLabel: '8-A' },
      { id: 'ev-6', title: 'İnkılap Tarihi sunumu', kind: 'homework', start: at(6, 23, 59), end: at(6, 23, 59), classLabel: '8-A' },
      { id: 'ev-7', title: 'Veli toplantısı', kind: 'meeting', start: at(5, 17), end: at(5, 18, 30), classLabel: '8-A' },
    ];
  }
  return [];
}

const eventStores = new Map<StoreKey, ReturnType<typeof createCollection<CalendarEvent>>>();
export function calendarOf(role: UserRole) {
  const key = storeKey(role);
  if (!eventStores.has(key)) {
    eventStores.set(key, createCollection<CalendarEvent>(() => eventsFor(key), { searchText: (e) => `${e.title} ${e.classLabel ?? ''}`, sorters: { start: (a, b) => a.start.localeCompare(b.start) }, defaultSort: 'start' }));
  }
  return eventStores.get(key)!;
}

function meetingsFor(role: StoreKey): Meeting[] {
  if (role === 'studentHigh') {
    return [
      { id: 'mt-1', title: 'Rehberlik görüşmesi — Tercih planı', start: at(1, 15, 40), end: at(1, 16, 10), organizer: 'Rehberlik Servisi', participants: ['Elif Yıldız'], link: 'https://meet.demo.okul/rehberlik-elif', agenda: 'Hedef programlar ve TYT çalışma planı.', status: 'scheduled' },
      { id: 'mt-2', title: 'Trigonometri soru çözüm saati', start: at(2, 16), end: at(2, 16, 40), organizer: 'Kaan Yıldırım', participants: ['11-B'], link: 'https://meet.demo.okul/trigonometri', agenda: 'Toplam-fark formülleri soru çözümü.', status: 'scheduled' },
      { id: 'mt-3', title: 'Fizik deney değerlendirmesi', start: at(-3, 15), end: at(-3, 15, 30), organizer: 'Tuana Aslan', participants: ['11-B'], link: 'https://meet.demo.okul/fizik', agenda: 'Atış hareketi deney sonuçları.', status: 'done' },
    ];
  }
  const base: Meeting[] = [
    { id: 'mt-1', title: 'Öğretmen görüşmesi — Matematik performansı', start: at(0, 14), end: at(0, 14, 30), organizer: 'Ayşe Yılmaz', participants: ['Deniz Kaya'], link: 'https://meet.demo.okul/mat-deniz', agenda: 'Kesirler konusundaki gelişim ve destek planı.', status: 'scheduled' },
    { id: 'mt-2', title: 'Bireysel görüşme — Mert Arslan', start: at(0, 14, 30), end: at(0, 15), organizer: 'Ayşe Yılmaz', participants: ['Mert Arslan'], link: 'https://meet.demo.okul/mat-mert', agenda: 'Denklemler tekrar planı.', status: 'scheduled' },
    { id: 'mt-3', title: '8-A veli toplantısı', start: at(5, 17), end: at(5, 18, 30), organizer: 'Ayşe Yılmaz', participants: ['8-A velileri'], link: 'https://meet.demo.okul/8a-veli', agenda: 'LGS hazırlık süreci ve deneme sonuçları.', status: 'scheduled' },
    { id: 'mt-4', title: 'LGS hazırlık rehberlik oturumu', start: at(2, 15, 40), end: at(2, 16, 20), organizer: 'Rehberlik Servisi', participants: ['8-A', '8-B'], link: 'https://meet.demo.okul/lgs-rehberlik', agenda: 'Tercih dönemi ve çalışma planı.', status: 'scheduled' },
    { id: 'mt-5', title: 'Kesirler tekrar dersi (çevrim içi)', start: at(-2, 16), end: at(-2, 16, 40), organizer: 'Ayşe Yılmaz', participants: ['8-A'], link: 'https://meet.demo.okul/kesirler', agenda: 'Kesirlerle işlemler soru çözümü.', status: 'done' },
  ];
  return role === 'teacher' ? base.filter((m) => m.organizer === 'Ayşe Yılmaz') : base.filter((m) => m.participants.some((p) => p === 'Deniz Kaya' || p.startsWith('8-A')));
}

const meetingStores = new Map<StoreKey, ReturnType<typeof createCollection<Meeting>>>();
export function meetingsOf(role: UserRole) {
  const key = storeKey(role);
  if (!meetingStores.has(key)) {
    meetingStores.set(key, createCollection<Meeting>(() => meetingsFor(key), { searchText: (m) => `${m.title} ${m.participants.join(' ')}`, sorters: { start: (a, b) => a.start.localeCompare(b.start) }, defaultSort: 'start' }));
  }
  return meetingStores.get(key)!;
}

function conversationsFor(role: StoreKey): Conversation[] {
  if (role === 'studentHigh') {
    return [
      { id: 'cv-1', name: 'Kaan Yıldırım', subtitle: 'Matematik öğretmeni', unread: 1, updatedAt: minutesAgo(50), messages: [
        { id: 'c1', mine: true, text: 'Hocam, toplam-fark formüllerinde işaretleri karıştırıyorum.', at: minutesAgo(70) },
        { id: 'c2', mine: false, text: 'Birim çember üzerinde gösterelim; Perşembe soru çözüm saatine gel.', at: minutesAgo(50) },
      ] },
      { id: 'cv-2', name: 'Rehberlik Servisi', subtitle: 'Rehber öğretmen', unread: 0, updatedAt: relativeDate(-1, 11, 0), messages: [{ id: 'c1', mine: false, text: 'Yarınki tercih planı görüşmemizi unutma.', at: relativeDate(-1, 11, 0) }] },
      { id: 'cv-3', name: 'Hira Kurt', subtitle: 'Kimya öğretmeni', unread: 0, updatedAt: relativeDate(-3, 15, 0), messages: [{ id: 'c1', mine: false, text: 'Deney raporunda grafik eklemeyi unutmayın.', at: relativeDate(-3, 15, 0) }] },
    ];
  }
  if (role === 'teacher') {
    return [
      { id: 'cv-1', name: 'Deniz Kaya', subtitle: '8-A', unread: 2, updatedAt: minutesAgo(12), messages: [
        { id: 'c1', mine: false, text: 'Hocam, kesirlerde paydaları eşitlerken zorlanıyorum.', at: minutesAgo(40) },
        { id: 'c2', mine: true, text: 'Sana destek çalışması gönderdim, özetle birlikte bakalım.', at: minutesAgo(30) },
        { id: 'c3', mine: false, text: 'Teşekkürler! Özeti okudum, sorulara başladım.', at: minutesAgo(14) },
        { id: 'c4', mine: false, text: 'Bugünkü görüşme saat 14.00’te mi?', at: minutesAgo(12) },
      ] },
      { id: 'cv-2', name: 'Mert Arslan', subtitle: '8-A', unread: 0, updatedAt: minutesAgo(180), messages: [
        { id: 'c1', mine: false, text: 'Denklemler ödevini yükledim.', at: minutesAgo(200) },
        { id: 'c2', mine: true, text: 'Gördüm, akşam değerlendireceğim.', at: minutesAgo(180) },
      ] },
      { id: 'cv-3', name: 'Ece Demir', subtitle: '8-B', unread: 1, updatedAt: minutesAgo(60 * 6), messages: [{ id: 'c1', mine: false, text: 'Üslü sayılar quizi hangi konuları kapsıyor?', at: minutesAgo(60 * 6) }] },
      { id: 'cv-4', name: '8-A Sınıfı', subtitle: '32 öğrenci', unread: 0, updatedAt: minutesAgo(60 * 26), messages: [{ id: 'c1', mine: true, text: 'Deneme sınavı Cumartesi 10.00’da. Herkese başarılar!', at: minutesAgo(60 * 26) }] },
    ];
  }
  return [
    { id: 'cv-1', name: 'Ayşe Yılmaz', subtitle: 'Matematik öğretmeni', unread: 1, updatedAt: minutesAgo(30), messages: [
      { id: 'c1', mine: true, text: 'Hocam, kesirlerde paydaları eşitlerken zorlanıyorum.', at: minutesAgo(40) },
      { id: 'c2', mine: false, text: 'Sana destek çalışması gönderdim, özetle birlikte bakalım.', at: minutesAgo(30) },
    ] },
    { id: 'cv-2', name: 'Selin Aksoy', subtitle: 'Fen Bilimleri öğretmeni', unread: 0, updatedAt: minutesAgo(60 * 20), messages: [{ id: 'c1', mine: false, text: 'DNA ödevinde model çizimi zorunlu değil, ama artı puan.', at: minutesAgo(60 * 20) }] },
    { id: 'cv-3', name: 'Rehberlik Servisi', subtitle: 'Rehber öğretmen', unread: 0, updatedAt: relativeDate(-2, 10, 0), messages: [{ id: 'c1', mine: false, text: 'LGS tercih semineri Perşembe günü yapılacak.', at: relativeDate(-2, 10, 0) }] },
  ];
}

const chatStores = new Map<StoreKey, ReturnType<typeof createCollection<Conversation>>>();
export function conversationsOf(role: UserRole) {
  const key = storeKey(role);
  if (!chatStores.has(key)) {
    chatStores.set(key, createCollection<Conversation>(() => conversationsFor(key), { searchText: (c) => `${c.name} ${c.subtitle}`, sorters: { updatedAt: (a, b) => a.updatedAt.localeCompare(b.updatedAt) }, defaultSort: 'updatedAt' }));
  }
  return chatStores.get(key)!;
}
