/**
 * Question content for the demo: computed maths items (answers are always correct) and a small
 * hand-written set for other subjects. Used by the archive, the question bank and the quiz player.
 */
import type { Difficulty } from '@/types';
import { createRandom } from '../utils';

export interface QuizItem {
  id: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  stem: string;
  options: string[];
  /** Index into options. */
  answer: number;
  explanation: string;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
export const letterOf = (index: number) => LETTERS[index];

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}
function frac(n: number, d: number): string {
  const g = gcd(n, d);
  const nn = n / g;
  const dd = d / g;
  return dd === 1 ? String(nn) : `${nn}/${dd}`;
}

/** Shuffle the correct value among distractors deterministically. */
function place(random: () => number, correct: string, distractors: string[], count = 4): { options: string[]; answer: number } {
  const unique = Array.from(new Set(distractors.filter((d) => d !== correct))).slice(0, count - 1);
  const answer = Math.floor(random() * count);
  const options = [...unique];
  options.splice(answer, 0, correct);
  return { options: options.slice(0, count), answer };
}

type Maker = (random: () => number, i: number) => Omit<QuizItem, 'id' | 'subject'>;

const MATH: Record<string, Maker> = {
  Kesirler: (r) => {
    const a = 1 + Math.floor(r() * 5), b = a + 1 + Math.floor(r() * 5), c = 1 + Math.floor(r() * 4), d = c + 1 + Math.floor(r() * 6);
    const correct = frac(a * d + c * b, b * d);
    return {
      topic: 'Kesirler', difficulty: 'easy',
      stem: `${a}/${b} + ${c}/${d} işleminin sonucu aşağıdakilerden hangisidir?`,
      ...place(r, correct, [frac(a + c, b + d), frac(a * c, b * d), frac(a * d + c * b + 1, b * d), frac(a + c, b * d)]),
      explanation: `Paydalar eşitlenir: (${a}·${d} + ${c}·${b}) / (${b}·${d}) = ${correct}.`,
    };
  },
  'Üslü İfadeler': (r) => {
    const base = 2 + Math.floor(r() * 3), m = 2 + Math.floor(r() * 4), n = 1 + Math.floor(r() * 3);
    const correct = `${base}^${m + n}`;
    return {
      topic: 'Üslü İfadeler', difficulty: 'medium',
      stem: `${base}^${m} · ${base}^${n} ifadesi aşağıdakilerden hangisine eşittir?`,
      ...place(r, correct, [`${base}^${m * n}`, `${base * 2}^${m + n}`, `${base}^${m - n}`, `${base * base}^${m}`]),
      explanation: `Tabanları aynı üslü ifadeler çarpılırken üsler toplanır: ${base}^(${m}+${n}) = ${correct}.`,
    };
  },
  Denklemler: (r) => {
    const x = 2 + Math.floor(r() * 9), a = 2 + Math.floor(r() * 5), b = 1 + Math.floor(r() * 12);
    const rhs = a * x + b;
    return {
      topic: 'Denklemler', difficulty: 'easy',
      stem: `${a}x + ${b} = ${rhs} denkleminde x kaçtır?`,
      ...place(r, String(x), [String(x + 1), String(x - 1), String(x + 2), String(rhs - b)]),
      explanation: `${a}x = ${rhs} − ${b} = ${rhs - b}, x = ${rhs - b} ÷ ${a} = ${x}.`,
    };
  },
  'Oran ve Orantı': (r) => {
    const k = 2 + Math.floor(r() * 4), a = 3 + Math.floor(r() * 5), b = 2 + Math.floor(r() * 6);
    return {
      topic: 'Oran ve Orantı', difficulty: 'medium',
      stem: `${a} kalem ${a * k * 5} TL ise aynı kalemlerden ${b} tanesi kaç TL'dir?`,
      ...place(r, String(b * k * 5), [String(b * k * 5 + 5), String(a * k * 5 - b), String(b * k * 4), String((b + 1) * k * 5)]),
      explanation: `Bir kalem ${k * 5} TL'dir; ${b} kalem ${b} · ${k * 5} = ${b * k * 5} TL eder.`,
    };
  },
  'Kareköklü İfadeler': (r) => {
    const n = 2 + Math.floor(r() * 8);
    const sq = n * n;
    return {
      topic: 'Kareköklü İfadeler', difficulty: 'easy',
      stem: `√${sq} + √${4 * sq} işleminin sonucu kaçtır?`,
      ...place(r, String(3 * n), [String(2 * n), String(5 * n), String(sq), String(4 * n)]),
      explanation: `√${sq} = ${n}, √${4 * sq} = ${2 * n}; toplam ${3 * n}.`,
    };
  },
  'Veri Analizi': (r) => {
    const vals = [0, 0, 0, 0, 0].map(() => 50 + Math.floor(r() * 50));
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / 5;
    const correct = Number.isInteger(avg) ? String(avg) : avg.toFixed(1).replace('.', ',');
    return {
      topic: 'Veri Analizi', difficulty: 'easy',
      stem: `Bir öğrencinin beş sınav puanı ${vals.join(', ')} ise puanlarının aritmetik ortalaması kaçtır?`,
      ...place(r, correct, [String(Math.round(avg) + 2), String(Math.max(...vals)), String(Math.round(avg) - 3), String(sum)]),
      explanation: `Toplam ${sum}, veri sayısı 5; ortalama ${sum} ÷ 5 = ${correct}.`,
    };
  },
  Olasılık: (r) => {
    const red = 2 + Math.floor(r() * 6), blue = 1 + Math.floor(r() * 6);
    const correct = frac(red, red + blue);
    return {
      topic: 'Olasılık', difficulty: 'medium',
      stem: `Bir torbada ${red} kırmızı ve ${blue} mavi bilye vardır. Rastgele çekilen bir bilyenin kırmızı olma olasılığı kaçtır?`,
      ...place(r, correct, [frac(blue, red + blue), frac(red, blue), frac(1, red + blue), frac(red + 1, red + blue + 1)]),
      explanation: `İstenen durum ${red}, tüm durumlar ${red + blue}: ${correct}.`,
    };
  },
  Geometri: (r) => {
    const a = 3 + Math.floor(r() * 9), b = 3 + Math.floor(r() * 9);
    return {
      topic: 'Geometri', difficulty: 'easy',
      stem: `Kenar uzunlukları ${a} cm ve ${b} cm olan dikdörtgenin çevresi kaç cm'dir?`,
      ...place(r, String(2 * (a + b)), [String(a * b), String(a + b), String(2 * a * b), String(2 * (a + b) + 2)]),
      explanation: `Çevre = 2 · (${a} + ${b}) = ${2 * (a + b)} cm.`,
    };
  },
  Üçgenler: (r) => {
    const x = 30 + Math.floor(r() * 50), y = 20 + Math.floor(r() * 40);
    return {
      topic: 'Üçgenler', difficulty: 'easy',
      stem: `Bir üçgenin iki iç açısı ${x}° ve ${y}° ise üçüncü açısı kaç derecedir?`,
      ...place(r, String(180 - x - y), [String(180 - x), String(360 - x - y), String(90 - y), String(180 - x - y + 10)]),
      explanation: `Üçgenin iç açıları toplamı 180°: 180 − ${x} − ${y} = ${180 - x - y}.`,
    };
  },
  'Cebirsel İfadeler': (r) => {
    const a = 2 + Math.floor(r() * 5), b = 1 + Math.floor(r() * 6);
    return {
      topic: 'Cebirsel İfadeler', difficulty: 'medium',
      stem: `${a}(x + ${b}) ifadesinin açılımı aşağıdakilerden hangisidir?`,
      ...place(r, `${a}x + ${a * b}`, [`${a}x + ${b}`, `x + ${a * b}`, `${a + b}x`, `${a}x + ${a + b}`]),
      explanation: `Dağılma özelliği: ${a}·x + ${a}·${b} = ${a}x + ${a * b}.`,
    };
  },
  Eşitsizlikler: (r) => {
    const a = 2 + Math.floor(r() * 4), b = 3 + Math.floor(r() * 10);
    const limit = Math.floor(b / a);
    return {
      topic: 'Eşitsizlikler', difficulty: 'hard',
      stem: `${a}x < ${b} eşitsizliğini sağlayan en büyük doğal sayı kaçtır?`,
      ...place(r, String(b % a === 0 ? limit - 1 : limit), [String(limit + 1), String(b), String(limit + 2), String(Math.max(0, limit - 2))]),
      explanation: `x < ${b}/${a}; bu koşulu sağlayan en büyük doğal sayı ${b % a === 0 ? limit - 1 : limit}.`,
    };
  },
  'Çarpanlar ve Katlar': (r) => {
    const a = 4 + Math.floor(r() * 10) * 2, b = 6 + Math.floor(r() * 8) * 3;
    const g = gcd(a, b);
    return {
      topic: 'Çarpanlar ve Katlar', difficulty: 'medium',
      stem: `${a} ve ${b} sayılarının en büyük ortak böleni (EBOB) kaçtır?`,
      ...place(r, String(g), [String(g * 2), String((a * b) / g), String(g + 1), String(Math.max(1, g - 1))]),
      explanation: `${a} ve ${b} sayılarını bölen en büyük sayı ${g}'dir.`,
    };
  },
};

/** Hand-written items (no randomisation needed). */
const FIXED: Omit<QuizItem, 'id'>[] = [
  { subject: 'Fen Bilimleri', topic: 'DNA ve Genetik Kod', difficulty: 'easy', stem: 'DNA molekülünün yapısında bulunan şeker aşağıdakilerden hangisidir?', options: ['Riboz', 'Deoksiriboz', 'Glikoz', 'Fruktoz'], answer: 1, explanation: 'DNA’nın adı “deoksiribonükleik asit”tir; yapısındaki şeker deoksiribozdur.' },
  { subject: 'Fen Bilimleri', topic: 'DNA ve Genetik Kod', difficulty: 'medium', stem: 'DNA’da adenin bazının karşısına hangi baz gelir?', options: ['Guanin', 'Sitozin', 'Timin', 'Urasil'], answer: 2, explanation: 'DNA’da adenin her zaman timinle eşleşir (A–T), guanin sitozinle eşleşir (G–C).' },
  { subject: 'Fen Bilimleri', topic: 'DNA ve Genetik Kod', difficulty: 'medium', stem: 'Bir DNA molekülünde 300 adenin varsa kaç timin bulunur?', options: ['150', '300', '600', 'Bilinemez'], answer: 1, explanation: 'A–T eşleşmesi nedeniyle adenin ve timin sayıları eşittir.' },
  { subject: 'Fen Bilimleri', topic: 'Basınç', difficulty: 'medium', stem: 'Katılarda basınç ile yüzey alanı arasındaki ilişki için ne söylenebilir? (Ağırlık sabit)', options: ['Yüzey alanı arttıkça basınç artar', 'Yüzey alanı arttıkça basınç azalır', 'Basınç yüzey alanından bağımsızdır', 'Yüzey alanı azaldıkça basınç azalır'], answer: 1, explanation: 'P = F / A; kuvvet sabitken yüzey alanı arttıkça basınç azalır.' },
  { subject: 'Fen Bilimleri', topic: 'Basit Makineler', difficulty: 'easy', stem: 'Aşağıdakilerden hangisi bir basit makine değildir?', options: ['Makara', 'Kaldıraç', 'Eğik düzlem', 'Termometre'], answer: 3, explanation: 'Termometre bir ölçü aracıdır; diğerleri iş kolaylığı sağlayan basit makinelerdir.' },
  { subject: 'Fen Bilimleri', topic: 'Mevsimler ve İklim', difficulty: 'easy', stem: 'Mevsimlerin oluşmasının temel nedeni nedir?', options: ['Dünya’nın Güneş’e olan uzaklığının değişmesi', 'Dünya’nın eksen eğikliği ve Güneş etrafında dolanması', 'Ay’ın Dünya etrafında dolanması', 'Dünya’nın kendi ekseni etrafında dönmesi'], answer: 1, explanation: 'Eksen eğikliği nedeniyle güneş ışınlarının geliş açısı yıl boyunca değişir.' },
  { subject: 'Türkçe', topic: 'Paragrafta Anlam', difficulty: 'medium', stem: '“Kitap okumak, insanın dünyasını genişletir.” cümlesinde anlatılmak istenen nedir?', options: ['Kitaplar pahalıdır', 'Okumak bakış açısını zenginleştirir', 'Okumak zaman kaybıdır', 'Kitaplar sadece bilgi verir'], answer: 1, explanation: 'Cümle, okumanın kişinin bakış açısını ve deneyimini zenginleştirdiğini anlatır.' },
  { subject: 'Türkçe', topic: 'Fiilimsiler', difficulty: 'medium', stem: '“Koşan çocuk düştü.” cümlesindeki fiilimsi hangisidir?', options: ['Koşan', 'çocuk', 'düştü', 'Fiilimsi yoktur'], answer: 0, explanation: '“Koşan” sözcüğü -an ekiyle yapılmış bir sıfat-fiildir.' },
  { subject: 'Türkçe', topic: 'Söz Sanatları', difficulty: 'hard', stem: '“Rüzgâr kapıları çaldı.” cümlesinde hangi söz sanatı vardır?', options: ['Benzetme', 'Kişileştirme', 'Abartma', 'Konuşturma'], answer: 1, explanation: 'Rüzgâra insana özgü “kapı çalma” eylemi verilmiştir: kişileştirme.' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', topic: 'Milli Uyanış', difficulty: 'medium', stem: 'Amasya Genelgesi’nde ilk kez dile getirilen düşünce hangisidir?', options: ['Saltanatın kaldırılması', 'Milletin istiklalini yine milletin azim ve kararı kurtaracaktır', 'Cumhuriyetin ilanı', 'Halifeliğin kaldırılması'], answer: 1, explanation: 'Amasya Genelgesi ulusal egemenlik düşüncesini ilk kez açıkça ortaya koymuştur.' },
  { subject: 'İngilizce', topic: 'Friendship', difficulty: 'easy', stem: '“Can you come to my birthday party?” — Choose the best answer that accepts the invitation.', options: ['Sorry, I can’t.', 'Sure, I’d love to!', 'No, thanks.', 'I have to study.'], answer: 1, explanation: '“Sure, I’d love to!” kabul eden yanıttır.' },
  { subject: 'Fizik', topic: 'Newton’un Hareket Yasaları', difficulty: 'medium', stem: '2 kg kütleli bir cisme 10 N net kuvvet uygulanırsa ivmesi kaç m/s² olur?', options: ['2', '5', '10', '20'], answer: 1, explanation: 'F = m·a ⇒ a = 10 / 2 = 5 m/s².' },
  { subject: 'Kimya', topic: 'Atom ve Periyodik Sistem', difficulty: 'easy', stem: 'Periyodik sistemde aynı grupta bulunan elementlerin ortak özelliği nedir?', options: ['Kütle numaraları aynıdır', 'Değerlik elektron sayıları aynıdır', 'Nötron sayıları aynıdır', 'Erime noktaları aynıdır'], answer: 1, explanation: 'Aynı gruptaki elementlerin değerlik elektron sayıları aynıdır; benzer kimyasal özellik gösterirler.' },
  { subject: 'Biyoloji', topic: 'Hücre', difficulty: 'easy', stem: 'Hücrede protein sentezinin gerçekleştiği organel hangisidir?', options: ['Mitokondri', 'Ribozom', 'Golgi cisimciği', 'Lizozom'], answer: 1, explanation: 'Protein sentezi ribozomlarda gerçekleşir.' },
  { subject: 'Türk Dili ve Edebiyatı', topic: 'Divan Edebiyatı', difficulty: 'medium', stem: 'Divan edebiyatında en çok kullanılan nazım birimi hangisidir?', options: ['Dörtlük', 'Beyit', 'Bent', 'Serbest'], answer: 1, explanation: 'Divan şiirinde temel nazım birimi beyittir.' },
  { subject: 'Fen Bilimleri', topic: 'Mevsimler ve İklim', difficulty: 'easy', stem: 'Türkiye’de 21 Haziran’da aşağıdakilerden hangisi yaşanır?', options: ['En uzun gündüz', 'Gece ile gündüzün eşitliği', 'En kısa gündüz', 'Güneş ışınlarının Ekvator’a dik gelmesi'], answer: 0, explanation: '21 Haziran’da Güneş ışınları Yengeç Dönencesi’ne dik gelir; Kuzey Yarım Küre’de en uzun gündüz yaşanır.' },
  { subject: 'Fen Bilimleri', topic: 'Mevsimler ve İklim', difficulty: 'medium', stem: 'Mevsimlerin oluşmasının temel nedeni aşağıdakilerden hangisidir?', options: ['Dünya’nın Güneş’e uzaklığının değişmesi', 'Dünya’nın eksen eğikliği ve Güneş etrafında dolanması', 'Ay’ın Dünya etrafında dolanması', 'Dünya’nın kendi ekseni etrafında dönmesi'], answer: 1, explanation: 'Eksen eğikliği nedeniyle Güneş ışınlarının geliş açısı yıl boyunca değişir; bu da mevsimleri oluşturur.' },
  { subject: 'Fen Bilimleri', topic: 'Basınç', difficulty: 'easy', stem: 'Katı basıncı aşağıdakilerden hangisine bağlı değildir?', options: ['Yüzey alanı', 'Uygulanan kuvvet', 'Cismin rengi', 'Cismin ağırlığı'], answer: 2, explanation: 'Katı basıncı = kuvvet (ağırlık) ÷ yüzey alanı; renk basıncı etkilemez.' },
  { subject: 'Fen Bilimleri', topic: 'Basınç', difficulty: 'medium', stem: 'Bir kaptaki sıvının tabana yaptığı basınç aşağıdakilerden hangisi artırılırsa artar?', options: ['Kabın genişliği', 'Sıvının derinliği', 'Kabın şekli', 'Kabın rengi'], answer: 1, explanation: 'Sıvı basıncı sıvının derinliğine ve yoğunluğuna bağlıdır; kabın şekline bağlı değildir.' },
  { subject: 'Fen Bilimleri', topic: 'Basınç', difficulty: 'easy', stem: 'Kar ayakkabılarının tabanının geniş yapılmasının amacı nedir?', options: ['Basıncı artırmak', 'Basıncı azaltmak', 'Ağırlığı artırmak', 'Hızı artırmak'], answer: 1, explanation: 'Yüzey alanı büyüdükçe aynı ağırlığın oluşturduğu basınç azalır; kişi karda daha az batar.' },
  { subject: 'Fen Bilimleri', topic: 'Basit Makineler', difficulty: 'medium', stem: 'Sabit makara için aşağıdakilerden hangisi doğrudur?', options: ['Kuvvetten kazanç sağlar', 'Yoldan kazanç sağlar', 'Kuvvetin yönünü değiştirir', 'İşten kazanç sağlar'], answer: 2, explanation: 'Sabit makara yalnızca kuvvetin yönünü değiştirir; hiçbir basit makine işten kazanç sağlamaz.' },
  { subject: 'Fen Bilimleri', topic: 'Elektrik Yükleri', difficulty: 'hard', stem: 'Yünlü kumaşa sürtülen plastik çubuk negatif yükle yükleniyor. Bunun nedeni nedir?', options: ['Kumaştan çubuğa elektron geçmesi', 'Çubuktan kumaşa elektron geçmesi', 'Kumaştan çubuğa proton geçmesi', 'Çubuktan kumaşa proton geçmesi'], answer: 0, explanation: 'Sürtünmeyle elektriklenmede yalnızca elektronlar yer değiştirir; elektron alan cisim negatif yüklenir.' },
  { subject: 'Fen Bilimleri', topic: 'Canlılar ve Enerji İlişkileri', difficulty: 'easy', stem: 'Fotosentez için aşağıdakilerden hangisi gerekli değildir?', options: ['Karbondioksit', 'Su', 'Güneş ışığı', 'Oksijen'], answer: 3, explanation: 'Fotosentezde karbondioksit ve su ışık enerjisiyle besine dönüşür; oksijen ürün olarak açığa çıkar.' },
  { subject: 'Fen Bilimleri', topic: 'Madde ve Endüstri', difficulty: 'easy', stem: 'pH değeri 7’den küçük olan çözeltiler nasıl adlandırılır?', options: ['Asidik', 'Bazik', 'Nötr', 'Tuz'], answer: 0, explanation: 'pH < 7 asidik, pH = 7 nötr, pH > 7 bazik çözeltileri gösterir.' },
  { subject: 'Türkçe', topic: 'Paragrafta Anlam', difficulty: 'easy', stem: 'Bir paragrafta yazarın okura asıl iletmek istediği düşünceye ne ad verilir?', options: ['Konu', 'Ana düşünce', 'Başlık', 'Yardımcı düşünce'], answer: 1, explanation: 'Ana düşünce, yazarın paragrafla vermek istediği temel mesajdır.' },
  { subject: 'Türkçe', topic: 'Fiilimsiler', difficulty: 'medium', stem: '“Koşarak gelen çocuk kapıyı açtı.” cümlesinde kaç fiilimsi vardır?', options: ['1', '2', '3', 'Hiç yoktur'], answer: 1, explanation: '“Koşarak” zarf-fiil, “gelen” sıfat-fiildir; cümlede iki fiilimsi vardır.' },
  { subject: 'Türkçe', topic: 'Fiilimsiler', difficulty: 'medium', stem: 'Aşağıdaki cümlelerin hangisinde isim-fiil vardır?', options: ['Kitap okumayı çok severim.', 'Gülerek içeri girdi.', 'Eve gelince beni ara.', 'Koşan çocuk düştü.'], answer: 0, explanation: '“Okuma” sözcüğü -ma ekiyle türemiş bir isim-fiildir.' },
  { subject: 'Türkçe', topic: 'Söz Sanatları', difficulty: 'easy', stem: '“Rüzgâr kapıyı öfkeyle çarptı.” cümlesinde hangi söz sanatı vardır?', options: ['Benzetme', 'Kişileştirme', 'Abartma', 'Konuşturma'], answer: 1, explanation: 'Öfkelenmek insana özgüdür; rüzgâra insan özelliği verilmiştir (kişileştirme).' },
  { subject: 'Türkçe', topic: 'Cümlenin Ögeleri', difficulty: 'easy', stem: '“Annem sabah erkenden pazara gitti.” cümlesinin yüklemi hangisidir?', options: ['Annem', 'sabah erkenden', 'pazara', 'gitti'], answer: 3, explanation: 'Yüklem, cümlede iş veya oluş bildiren temel ögedir: “gitti”.' },
  { subject: 'Türkçe', topic: 'Yazım Kuralları', difficulty: 'medium', stem: 'Aşağıdakilerin hangisinde “de” bağlacının yazımı doğrudur?', options: ['Ben de geleceğim.', 'Bende geleceğim.', 'O’da gelecek.', 'Sizde gelin.'], answer: 0, explanation: 'Bağlaç olan “de” her zaman ayrı yazılır ve kesme işaretiyle ayrılmaz.' },
  { subject: 'Türkçe', topic: 'Noktalama', difficulty: 'medium', stem: 'Ögeleri arasında virgül bulunan sıralı cümleleri birbirinden ayırmak için hangi işaret kullanılır?', options: ['Nokta', 'Noktalı virgül', 'İki nokta', 'Ünlem'], answer: 1, explanation: 'Ögeleri arasında virgül bulunan sıralı cümleler noktalı virgülle ayrılır.' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', topic: 'Milli Uyanış', difficulty: 'easy', stem: 'Mustafa Kemal Samsun’a hangi tarihte çıkmıştır?', options: ['23 Nisan 1920', '19 Mayıs 1919', '29 Ekim 1923', '30 Ağustos 1922'], answer: 1, explanation: 'Mustafa Kemal 19 Mayıs 1919’da Samsun’a çıkarak Milli Mücadele’yi başlattı.' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', topic: 'Milli Uyanış', difficulty: 'medium', stem: 'Amasya Genelgesi’ndeki “Milletin istiklalini yine milletin azim ve kararı kurtaracaktır.” ifadesi neyi vurgular?', options: ['Saltanatın sürmesini', 'Millet iradesini ve milli egemenliği', 'Manda yönetimini', 'Yabancı devletlerden yardım istenmesini'], answer: 1, explanation: 'İfade, kurtuluşun milletin kendi gücü ve kararıyla olacağını, yani milli egemenliği vurgular.' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', topic: 'Ya İstiklal Ya Ölüm', difficulty: 'easy', stem: 'TBMM hangi tarihte açılmıştır?', options: ['19 Mayıs 1919', '23 Nisan 1920', '29 Ekim 1923', '3 Mart 1924'], answer: 1, explanation: 'Türkiye Büyük Millet Meclisi 23 Nisan 1920’de Ankara’da açıldı.' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', topic: 'Ya İstiklal Ya Ölüm', difficulty: 'medium', stem: 'Sakarya Meydan Muharebesi’nden sonra TBMM Mustafa Kemal’e hangi unvan ve rütbeyi vermiştir?', options: ['Başkomutanlık', 'Gazi unvanı ve mareşal rütbesi', 'Atatürk soyadı', 'Cumhurbaşkanlığı'], answer: 1, explanation: 'Sakarya zaferinden sonra TBMM, Mustafa Kemal’e “Gazi” unvanını ve mareşal rütbesini verdi.' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', topic: 'Çağdaş Türkiye Yolunda', difficulty: 'easy', stem: 'Cumhuriyet hangi tarihte ilan edilmiştir?', options: ['29 Ekim 1923', '23 Nisan 1920', '24 Temmuz 1923', '1 Kasım 1922'], answer: 0, explanation: 'Cumhuriyet 29 Ekim 1923’te ilan edildi.' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', topic: 'Bir Kahraman Doğuyor', difficulty: 'easy', stem: 'Mustafa Kemal hangi şehirde doğmuştur?', options: ['İstanbul', 'Selanik', 'Manastır', 'Ankara'], answer: 1, explanation: 'Mustafa Kemal 1881’de Selanik’te doğdu.' },
  { subject: 'İngilizce', topic: 'Friendship', difficulty: 'easy', stem: 'Choose the best response: “Would you like to come to my birthday party?”', options: ['Yes, I’d love to.', 'I am fine, thanks.', 'It is on Monday.', 'No, I don’t know.'], answer: 0, explanation: 'Bir davete olumlu cevap: “Yes, I’d love to.”' },
  { subject: 'İngilizce', topic: 'Teen Life', difficulty: 'easy', stem: 'I ______ playing the guitar. It is my favourite hobby.', options: ['am keen on', 'can’t stand', 'hate', 'dislike'], answer: 0, explanation: '“Favourite hobby” olumlu bir anlam taşır; “am keen on” (çok severim) uygundur.' },
  { subject: 'İngilizce', topic: 'In the Kitchen', difficulty: 'easy', stem: 'First, ______ the onions into small pieces.', options: ['chop', 'pour', 'boil', 'bake'], answer: 0, explanation: 'Soğanı küçük parçalara doğramak için “chop” kullanılır.' },
  { subject: 'İngilizce', topic: 'On the Phone', difficulty: 'easy', stem: '“Can I speak to Ayşe, please?” – “______”', options: ['Hold on, please.', 'Goodbye.', 'Nice to meet you.', 'I’m sorry to hear that.'], answer: 0, explanation: 'Telefonda “bekleyin, bağlıyorum” anlamında “Hold on, please.” denir.' },
  { subject: 'İngilizce', topic: 'The Internet', difficulty: 'easy', stem: 'Which one is a safe internet habit?', options: ['Sharing your password with friends', 'Using strong passwords', 'Opening emails from strangers', 'Downloading unknown files'], answer: 1, explanation: 'Güçlü şifre kullanmak güvenli internet alışkanlığıdır.' },
  { subject: 'İngilizce', topic: 'Adventures', difficulty: 'medium', stem: 'Rafting is ______ than walking in the park.', options: ['more dangerous', 'dangerouser', 'most dangerous', 'the more dangerous'], answer: 0, explanation: 'Uzun sıfatlarda karşılaştırma “more + sıfat + than” ile yapılır.' },
  { subject: 'Fizik', topic: 'Atışlar', difficulty: 'medium', stem: 'Hava direncinin önemsenmediği yatay atışta cismin yatay hızı için ne söylenebilir?', options: ['Sürekli artar', 'Sürekli azalır', 'Sabit kalır', 'Önce artar sonra azalır'], answer: 2, explanation: 'Yatay doğrultuda kuvvet olmadığı için yatay hız sabit kalır.' },
  { subject: 'Fizik', topic: 'Newton’un Hareket Yasaları', difficulty: 'medium', stem: 'Üzerine etki eden net kuvvet sıfır olan bir cisim için hangisi kesinlikle doğrudur?', options: ['Duruyordur', 'Sabit hızla gidiyordur', 'İvmesi sıfırdır', 'Hızı artıyordur'], answer: 2, explanation: 'Net kuvvet sıfırsa ivme sıfırdır; cisim duruyor ya da sabit hızla hareket ediyor olabilir.' },
  { subject: 'Fizik', topic: 'İş ve Enerji', difficulty: 'easy', stem: '2 kg kütleli bir cisim 3 m/s hızla hareket ediyor. Kinetik enerjisi kaç J’dür?', options: ['3', '6', '9', '18'], answer: 2, explanation: 'Ek = ½·m·v² = ½·2·3² = 9 J.' },
  { subject: 'Fizik', topic: 'İtme ve Momentum', difficulty: 'easy', stem: '4 kg kütleli ve 5 m/s hızla giden cismin momentumu kaç kg·m/s’dir?', options: ['9', '20', '1,25', '100'], answer: 1, explanation: 'p = m·v = 4·5 = 20 kg·m/s.' },
  { subject: 'Fizik', topic: 'Vektörler', difficulty: 'easy', stem: 'Büyüklükleri 3 N ve 4 N olan birbirine dik iki kuvvetin bileşkesi kaç N’dur?', options: ['1', '5', '7', '12'], answer: 1, explanation: 'Dik kuvvetlerde bileşke √(3² + 4²) = 5 N’dur.' },
  { subject: 'Fizik', topic: 'Tork', difficulty: 'easy', stem: 'Bir kuvvetin oluşturduğu tork aşağıdakilerden hangisine bağlı değildir?', options: ['Kuvvetin büyüklüğü', 'Kuvvetin dönme eksenine uzaklığı', 'Kuvvetin doğrultusu', 'Cismin rengi'], answer: 3, explanation: 'Tork; kuvvetin büyüklüğüne, dönme eksenine uzaklığına ve doğrultusuna bağlıdır.' },
  { subject: 'Kimya', topic: 'Gazlar', difficulty: 'medium', stem: 'Sabit sıcaklıkta belirli miktar gazın hacmi yarıya indirilirse basıncı nasıl değişir?', options: ['Yarıya iner', 'Değişmez', 'İki katına çıkar', 'Dört katına çıkar'], answer: 2, explanation: 'Boyle yasası: sabit sıcaklıkta P·V sabittir; hacim yarıya inerse basınç iki katına çıkar.' },
  { subject: 'Kimya', topic: 'Gazlar', difficulty: 'easy', stem: 'İdeal gaz denkleminde (PV = nRT) R neyi ifade eder?', options: ['Gaz sabitini', 'Mol sayısını', 'Sıcaklığı', 'Hacmi'], answer: 0, explanation: 'R ideal gaz sabitidir.' },
  { subject: 'Kimya', topic: 'Tepkime Hızları', difficulty: 'medium', stem: 'Aşağıdakilerden hangisi tepkime hızını genellikle artırmaz?', options: ['Sıcaklığı artırmak', 'Katalizör eklemek', 'Derişimi artırmak', 'Temas yüzeyini küçültmek'], answer: 3, explanation: 'Temas yüzeyini küçültmek çarpışma sayısını azaltır; tepkime yavaşlar.' },
  { subject: 'Kimya', topic: 'Kimyasal Denge', difficulty: 'medium', stem: 'Denge hâlindeki bir tepkime için hangisi doğrudur?', options: ['İleri ve geri tepkime hızları eşittir', 'Tepkime tamamen durmuştur', 'Ürün derişimi her zaman girenlere eşittir', 'Sıcaklık değişse de denge değişmez'], answer: 0, explanation: 'Dinamik dengede ileri ve geri tepkimeler eşit hızla sürer.' },
  { subject: 'Kimya', topic: 'Asit-Baz Dengesi', difficulty: 'easy', stem: '25 °C’de pH değeri 3 olan bir çözelti için hangisi doğrudur?', options: ['Baziktir', 'Asidiktir', 'Nötrdür', 'pOH değeri 3’tür'], answer: 1, explanation: 'pH < 7 olan çözeltiler asidiktir; bu çözeltinin pOH değeri 11’dir.' },
  { subject: 'Kimya', topic: 'Sıvı Çözeltiler', difficulty: 'easy', stem: 'Saf suya tuz eklendiğinde suyun kaynama noktası nasıl değişir?', options: ['Düşer', 'Yükselir', 'Değişmez', 'Önce düşer sonra yükselir'], answer: 1, explanation: 'Çözünen madde eklenmesi kaynama noktasını yükseltir (kaynama noktası yükselmesi).' },
  { subject: 'Biyoloji', topic: 'Sinir Sistemi', difficulty: 'easy', stem: 'Sinir sisteminin temel yapı ve görev birimi hangisidir?', options: ['Nefron', 'Nöron', 'Alveol', 'Sarkomer'], answer: 1, explanation: 'Sinir sisteminin yapı ve görev birimi nörondur.' },
  { subject: 'Biyoloji', topic: 'Endokrin Sistem', difficulty: 'easy', stem: 'Kan şekerini düşüren hormon hangisidir?', options: ['Glukagon', 'İnsülin', 'Adrenalin', 'Tiroksin'], answer: 1, explanation: 'İnsülin kandaki glikozun hücrelere alınmasını sağlayarak kan şekerini düşürür.' },
  { subject: 'Biyoloji', topic: 'Duyu Organları', difficulty: 'easy', stem: 'Gözde ışığa duyarlı reseptörlerin bulunduğu tabaka hangisidir?', options: ['Kornea', 'İris', 'Retina', 'Mercek'], answer: 2, explanation: 'Çubuk ve koni hücreleri retinada bulunur.' },
  { subject: 'Biyoloji', topic: 'Destek ve Hareket', difficulty: 'medium', stem: 'Çizgili kasta kasılmanın temel birimine ne ad verilir?', options: ['Sarkomer', 'Nöron', 'Nefron', 'Villus'], answer: 0, explanation: 'Sarkomer, çizgili kas telinde kasılmanın birimidir.' },
  { subject: 'Biyoloji', topic: 'Sindirim Sistemi', difficulty: 'medium', stem: 'Proteinlerin kimyasal sindirimi ilk olarak nerede başlar?', options: ['Ağız', 'Mide', 'İnce bağırsak', 'Kalın bağırsak'], answer: 1, explanation: 'Proteinlerin kimyasal sindirimi midede pepsin enzimiyle başlar.' },
  { subject: 'Biyoloji', topic: 'Sindirim Sistemi', difficulty: 'easy', stem: 'Besinlerin emiliminin büyük kısmı nerede gerçekleşir?', options: ['Mide', 'Yemek borusu', 'İnce bağırsak', 'Kalın bağırsak'], answer: 2, explanation: 'Emilimin büyük kısmı ince bağırsaktaki villuslarda gerçekleşir.' },
  { subject: 'Türk Dili ve Edebiyatı', topic: 'Halk Edebiyatı', difficulty: 'easy', stem: 'Halk şiirinde en çok kullanılan ölçü hangisidir?', options: ['Aruz', 'Hece', 'Serbest', 'Ölçüsüz'], answer: 1, explanation: 'Halk şiiri genellikle hece ölçüsüyle yazılır.' },
  { subject: 'Türk Dili ve Edebiyatı', topic: 'Divan Edebiyatı', difficulty: 'medium', stem: 'Divan edebiyatında Allah’ın birliğini anlatan şiirlere ne ad verilir?', options: ['Naat', 'Tevhit', 'Mersiye', 'Methiye'], answer: 1, explanation: 'Tevhit, Allah’ın birliğini ve büyüklüğünü anlatan şiirdir.' },
  { subject: 'Türk Dili ve Edebiyatı', topic: 'Roman', difficulty: 'medium', stem: 'Türk edebiyatının ilk yerli romanı kabul edilen eser hangisidir?', options: ['Taaşşuk-ı Talat ve Fitnat', 'İntibah', 'Araba Sevdası', 'Eylül'], answer: 0, explanation: 'Şemsettin Sami’nin “Taaşşuk-ı Talat ve Fitnat” (1872) adlı eseri ilk yerli roman kabul edilir.' },
  { subject: 'Türk Dili ve Edebiyatı', topic: 'Tiyatro', difficulty: 'easy', stem: 'Tiyatro eserlerinin ana bölümlerine ne ad verilir?', options: ['Perde', 'Kıta', 'Beyit', 'Dörtlük'], answer: 0, explanation: 'Tiyatro eserleri perdelere, perdeler de sahnelere ayrılır.' },
  { subject: 'Türk Dili ve Edebiyatı', topic: 'Deneme', difficulty: 'medium', stem: 'Yazarın bir konudaki kişisel görüşlerini kesin hükme varmadan, samimi bir dille anlattığı türe ne ad verilir?', options: ['Makale', 'Deneme', 'Fıkra', 'Eleştiri'], answer: 1, explanation: 'Deneme, kesin yargılara varmadan kişisel düşüncelerin samimi bir üslupla anlatıldığı türdür.' },
  { subject: 'Türk Dili ve Edebiyatı', topic: 'Şiir Bilgisi', difficulty: 'easy', stem: 'Dize sonlarındaki ses benzerliğine ne ad verilir?', options: ['Redif', 'Uyak (kafiye)', 'Ölçü', 'Nazım birimi'], answer: 1, explanation: 'Dize sonlarındaki ses benzerliğine uyak (kafiye) denir; aynı görevdeki ek veya sözcük tekrarı rediftir.' },
];

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺', '(': '⁽', ')': '⁾' };
/** "2^5" → "2⁵", "2^(3+4)" → "2⁽³⁺⁴⁾" so exponents read naturally. */
export function prettyMath(text: string): string {
  return text.replace(/\^(\([0-9+-]+\)|-?\d+)/g, (_, exp: string) => [...exp].map((c) => SUP[c] ?? c).join(''));
}
const pretty = (q: QuizItem): QuizItem => ({ ...q, stem: prettyMath(q.stem), options: q.options.map(prettyMath), explanation: prettyMath(q.explanation) });

let counter = 0;
/** Generate `count` items for a subject/topic (maths items are computed; others come from the fixed set). */
export function makeQuestions(subject: string, topic: string | null, count: number, seed: number): QuizItem[] {
  const random = createRandom(seed);
  const out: QuizItem[] = [];
  if (subject === 'Matematik') {
    const topics = topic && MATH[topic] ? [topic] : Object.keys(MATH);
    for (let i = 0; i < count; i += 1) {
      const maker = MATH[topics[i % topics.length]];
      counter += 1;
      out.push(pretty({ id: `q-${seed}-${i}-${counter}`, subject, ...maker(random, i) }));
    }
    return out;
  }
  const pool = FIXED.filter((q) => q.subject === subject && (!topic || q.topic === topic));
  const source = pool.length ? pool : FIXED.filter((q) => q.subject === subject);
  for (let i = 0; i < Math.min(count, source.length || 0); i += 1) {
    counter += 1;
    out.push({ id: `q-${seed}-${i}-${counter}`, ...source[i % source.length] });
  }
  return out;
}

export const MATH_TOPICS = Object.keys(MATH);
export const FIXED_QUESTIONS = FIXED;
