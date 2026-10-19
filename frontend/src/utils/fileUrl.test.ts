import { describe, expect, it } from 'vitest';
import { resolveFileUrl } from './fileUrl';

describe('resolveFileUrl', () => {
  it('keeps https links and resolves server paths against the API origin', () => {
    expect(resolveFileUrl('https://cdn.okul.edu.tr/a.pdf', '/api')).toBe('https://cdn.okul.edu.tr/a.pdf');
    expect(resolveFileUrl('/files/a.pdf', 'https://api.okul.edu.tr/api')).toBe('https://api.okul.edu.tr/files/a.pdf');
    expect(resolveFileUrl('/files/a.pdf', '/api')).toBe(`${window.location.origin}/files/a.pdf`);
  });

  it('allows plain http only while developing on localhost', () => {
    expect(window.location.hostname).toBe('localhost');
    expect(resolveFileUrl('http://localhost:3000/files/a.pdf', '/api')).toBe('http://localhost:3000/files/a.pdf');
  });

  it('refuses unsafe or missing links', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', '//evil.example/a.pdf', '/\\evil.example', '', null, undefined]) {
      expect(resolveFileUrl(bad, '/api')).toBeNull();
    }
  });
});
