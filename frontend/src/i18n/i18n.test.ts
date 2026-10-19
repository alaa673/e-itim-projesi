import { describe, expect, it } from 'vitest';
import { resources } from './index';
import i18n from './index';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : flatten(value, `${prefix}${key}.`),
  );
}

/** Plural forms differ by language (_one/_other), so compare base keys. */
const base = (key: string) => key.replace(/_(zero|one|two|few|many|other)$/, '');

describe('translations', () => {
  it('supports exactly Turkish and English, Turkish by default', () => {
    expect(Object.keys(resources).sort()).toEqual(['en', 'tr']);
    expect(i18n.options.fallbackLng).toEqual(['tr']);
    expect(i18n.options.supportedLngs).not.toContain('ar');
  });

  for (const ns of Object.keys(resources.tr) as (keyof typeof resources.tr)[]) {
    it(`has the same keys in tr and en for "${ns}"`, () => {
      const tr = new Set(flatten(resources.tr[ns] as Tree).map(base));
      const en = new Set(flatten(resources.en[ns] as Tree).map(base));
      expect([...tr].filter((k) => !en.has(k))).toEqual([]);
      expect([...en].filter((k) => !tr.has(k))).toEqual([]);
    });
  }

  it('has no empty strings', () => {
    for (const lng of ['tr', 'en'] as const) {
      for (const [ns, tree] of Object.entries(resources[lng])) {
        const empty = flatten(tree as Tree).filter((key) => {
          const value = key.split('.').reduce<unknown>((node, part) => (node as Tree)[part], tree);
          return typeof value === 'string' && value.trim() === '';
        });
        expect(empty, `${lng}/${ns}`).toEqual([]);
      }
    }
  });
});
