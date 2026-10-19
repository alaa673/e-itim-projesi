import {
  Atom,
  BookOpenText,
  Calculator,
  Dna,
  Feather,
  FlaskConical,
  Globe,
  Landmark,
  Languages,
  type LucideIcon,
  Microscope,
  Music,
  Palette,
  Sigma,
} from 'lucide-react';

const ICONS: [RegExp, LucideIcon][] = [
  [/matematik|geometri/i, Calculator],
  [/fizik/i, Atom],
  [/kimya/i, FlaskConical],
  [/biyoloji/i, Dna],
  [/fen/i, Microscope],
  [/edebiyat/i, Feather],
  [/türkçe|okuma/i, BookOpenText],
  [/inkılap|tarih/i, Landmark],
  [/ingilizce|almanca|dil/i, Languages],
  [/coğrafya|sosyal/i, Globe],
  [/müzik/i, Music],
  [/görsel|resim/i, Palette],
  [/lgs|tyt|ayt/i, Sigma],
];

/** Lucide icon for a (Turkish) subject name. */
export function subjectIcon(subject: string | null | undefined): LucideIcon {
  if (!subject) return BookOpenText;
  return ICONS.find(([re]) => re.test(subject))?.[1] ?? BookOpenText;
}
