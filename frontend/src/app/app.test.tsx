import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '@/config/constants';
import { DEMO_USERS } from '@/mocks/mockUsers';
import { apiRequest } from '@/services/api';
import { authService } from '@/services/authService';
import { renderApp } from '@/test/renderApp';

const SLOW = { timeout: 4000 };

describe('authentication & routing', () => {
  it('redirects anonymous users to the login page', async () => {
    const { router } = await renderApp('/admin/students');
    expect(await screen.findByRole('heading', { name: 'Tekrar hoş geldin!' }, SLOW)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('validates the login form', async () => {
    const user = userEvent.setup();
    await renderApp('/login');
    await user.click(await screen.findByRole('button', { name: 'Giriş yap' }, SLOW));
    expect(await screen.findByText('Kullanıcı adını veya e-posta adresini gir.')).toBeInTheDocument();
    expect(screen.getByText('Şifrenizi girin.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Kullanıcı adı veya e-posta'), 'ad@');
    await user.click(screen.getByRole('button', { name: 'Giriş yap' }));
    expect(await screen.findByText('Geçerli bir e-posta adresi girin.')).toBeInTheDocument();
  });

  it('shows a clear error for wrong credentials and returns to the requested page after sign-in', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/teacher/results');
    await user.type(await screen.findByLabelText('Kullanıcı adı veya e-posta', {}, SLOW), 'ogretmen@demo.okul');
    await user.type(screen.getByLabelText('Şifre', { selector: 'input' }), 'wrong-pass');
    await user.click(screen.getByRole('button', { name: 'Giriş yap' }));
    expect(await screen.findByText('Kullanıcı adı, e-posta veya şifre hatalı.', {}, SLOW)).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Şifre', { selector: 'input' }));
    await user.type(screen.getByLabelText('Şifre', { selector: 'input' }), 'demo1234');
    await user.click(screen.getByRole('button', { name: 'Giriş yap' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/teacher/results'), SLOW);
  });

  it('toggles password visibility without losing the typed value', async () => {
    const user = userEvent.setup();
    await renderApp('/login');
    const password = await screen.findByLabelText('Şifre', { selector: 'input' }, SLOW);
    await user.type(password, 'secret-1');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Şifreyi göster' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(password).toHaveValue('secret-1');
    expect(screen.getByRole('button', { name: 'Şifreyi gizle' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('accepts a username instead of an e-mail address', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/login');
    await user.type(await screen.findByLabelText('Kullanıcı adı veya e-posta', {}, SLOW), 'ogretmen');
    await user.type(screen.getByLabelText('Şifre', { selector: 'input' }), 'demo1234');
    await user.click(screen.getByRole('button', { name: 'Giriş yap' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/teacher/dashboard'), SLOW);
  });

  it('tells the user when the server ends the session', async () => {
    const { router } = await renderApp('/admin/dashboard', { as: 'admin' });
    await screen.findByRole('navigation', { name: 'Ana menü' }, SLOW);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401, headers: { 'content-type': 'application/json' } })));
    await expect(apiRequest('/anything')).rejects.toMatchObject({ kind: 'unauthorized' });
    vi.unstubAllGlobals();
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'), SLOW);
    expect(await screen.findByText('Oturumun sona erdi. Devam etmek için yeniden giriş yap.')).toBeInTheDocument();
  });

  it('makes a user with an administrator-set password choose a new one first', async () => {
    const restore = vi.spyOn(authService, 'restoreSession').mockResolvedValue({ user: { ...DEMO_USERS.teacher, mustChangePassword: true }, isDemo: true });
    const user = userEvent.setup();
    const { router } = await renderApp('/teacher/results');
    expect(await screen.findByRole('heading', { name: 'Yeni şifreni belirle' }, SLOW)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/change-password');
    await user.type(screen.getByLabelText('Mevcut şifre'), 'demo1234');
    await user.type(screen.getByLabelText('Yeni şifre'), 'kendiSifrem42');
    await user.type(screen.getByLabelText('Yeni şifre (tekrar)'), 'kendiSifrem42');
    await user.click(screen.getByRole('button', { name: 'Şifreyi değiştir' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/teacher/results'), SLOW);
    restore.mockRestore();
  });

  it('labels demo access clearly and signs in with a demo role card', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/login');
    expect(await screen.findByRole('heading', { name: 'Demo erişimi' }, SLOW)).toBeInTheDocument();
    const card = screen.getByRole('button', { name: 'Öğrenci olarak gir' });
    expect(card).toHaveAttribute('data-role', 'student');
    expect(card).toHaveAccessibleDescription('Dersler, görevler ve gelişim');
    await user.click(card);
    await waitFor(() => expect(router.state.location.pathname).toBe('/student/dashboard'), SLOW);
    await screen.findByRole('heading', { name: /Küçük adımlar/ }, SLOW);
    expect(screen.getByText('Merhaba Deniz!')).toBeInTheDocument();
    expect(document.body.dataset.role).toBe('student');
  });

  it('blocks a student from the admin area (UX guard; backend still enforces access)', async () => {
    await renderApp('/admin/students', { as: 'student' });
    expect(await screen.findByText('Bu sayfaya erişiminiz yok', {}, SLOW)).toBeInTheDocument();
  });

  it('shows a not-found page for unknown addresses', async () => {
    await renderApp('/student/does-not-exist', { as: 'student' });
    expect(await screen.findByText('Sayfa bulunamadı', {}, SLOW)).toBeInTheDocument();
  });

  it('keeps high-school guidance pages out of reach for middle-school students', async () => {
    await renderApp('/student/guidance/majors', { as: 'student' });
    expect(await screen.findByText('Sayfa bulunamadı', {}, SLOW)).toBeInTheDocument();
  });

  it('opens high-school guidance pages for high-school students', async () => {
    await renderApp('/student/guidance/majors', { as: 'studentHigh' });
    expect(await screen.findByRole('heading', { name: 'Bölüm Önerileri', level: 1 }, SLOW)).toBeInTheDocument();
    expect(await screen.findByText('Bilgisayar Mühendisliği', {}, SLOW)).toBeInTheDocument();
  });

  it('signs out and clears the demo session', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/admin/dashboard', { as: 'admin' });
    await user.click(await screen.findByRole('button', { name: 'Hesap menüsü' }, SLOW));
    await user.click(screen.getByRole('menuitem', { name: 'Çıkış yap' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(window.sessionStorage.getItem(STORAGE_KEYS.demoSession)).toBeNull();
  });
});

describe('role navigation', () => {
  it('shows role-specific menus', async () => {
    await renderApp('/teacher/dashboard', { as: 'teacher' });
    const nav = await screen.findByRole('navigation', { name: 'Ana menü' }, SLOW);
    expect(within(nav).getByText('Takip ve Destek')).toBeInTheDocument();
    expect(within(nav).queryByText('Sınav Arşivi')).not.toBeInTheDocument();
  });
});

describe('students table (admin)', () => {
  it('loads 20 rows, then 20 more, and resets on search', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/students', { as: 'admin' });
    const table = await screen.findByRole('table', { name: 'Öğrenciler' }, SLOW);
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(21), SLOW); // header + 20
    expect(screen.getByText(/^20 \/ \d+ kayıt gösteriliyor$/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '20 Daha Fazla Göster' }));
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(41), SLOW);

    await user.type(screen.getByLabelText('Ara'), 'zzzz-nobody');
    expect(await screen.findByText('Aramanızla eşleşen kayıt yok', {}, SLOW)).toBeInTheDocument();
  });

  it('prevents duplicate archive submissions while the request is pending', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/students', { as: 'admin' });
    const table = await screen.findByRole('table', { name: 'Öğrenciler' }, SLOW);
    const archiveButtons = await within(table).findAllByRole('button', { name: /^Arşivle:/ }, SLOW);
    await user.click(archiveButtons.find((b) => !b.hasAttribute('disabled'))!);

    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Arşivle' });
    await user.click(confirm);
    expect(confirm).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Vazgeç' })).toBeDisabled();
    expect(await screen.findByText(/arşivlendi$/, {}, SLOW)).toBeInTheDocument();
  });
});

describe('teacher support exercise', () => {
  it('sends a support exercise from the results table', async () => {
    const user = userEvent.setup();
    await renderApp('/teacher/results', { as: 'teacher' });
    const table = await screen.findByRole('table', { name: 'Öğrenci sonuçları' }, SLOW);
    const supportButtons = await within(table).findAllByRole('button', { name: /^Destek alıştırması gönder:/ }, SLOW);
    await user.click(supportButtons[0]);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Önizle' }));
    await user.click(within(dialog).getByRole('button', { name: 'Gönder' }));
    expect(await screen.findByText(/Destek alıştırması .* gönderildi/, {}, SLOW)).toBeInTheDocument();
  });
});

describe('language and theme', () => {
  it('switches to English and remembers the choice', async () => {
    const user = userEvent.setup();
    await renderApp('/login');
    await user.click(await screen.findByRole('button', { name: /Arayüz dili/ }, SLOW));
    await user.click(screen.getByRole('menuitemradio', { name: 'English' }));
    expect(await screen.findByRole('heading', { name: 'Welcome back!' })).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.language)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('toggles dark mode and remembers the choice', async () => {
    const user = userEvent.setup();
    await renderApp('/login');
    await user.click(await screen.findByRole('button', { name: 'Koyu temaya geç' }, SLOW));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
    await user.click(screen.getByRole('button', { name: 'Açık temaya geç' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('applies the role accent to the page', async () => {
    await renderApp('/student/dashboard', { as: 'student' });
    await screen.findByRole('heading', { name: /Küçük adımlar/ }, SLOW);
    expect(document.body.dataset.role).toBe('student');
  });
});

describe('help requests', () => {
  it('lets a student report a problem and lists it under "Taleplerim"', async () => {
    const user = userEvent.setup();
    await renderApp('/student/help', { as: 'student' });
    await user.type(await screen.findByLabelText('Konu', {}, SLOW), 'Deneme sonucu görünmüyor');
    await user.type(screen.getByLabelText('Açıklama'), 'Dün çözdüğüm denemenin sonucu listede yok.');
    await user.click(screen.getByRole('button', { name: 'Gönder' }));
    expect(await screen.findByText('Talebin okul yönetimine iletildi', {}, SLOW)).toBeInTheDocument();
    expect(await screen.findByText('Deneme sonucu görünmüyor', {}, SLOW)).toBeInTheDocument();
  });

  it('validates the help form before sending', async () => {
    const user = userEvent.setup();
    await renderApp('/teacher/help', { as: 'teacher' });
    await user.click(await screen.findByRole('button', { name: 'Gönder' }, SLOW));
    expect(await screen.findAllByText('Daha uzun bir metin girin.')).toHaveLength(2);
  });
});

describe('account settings', () => {
  it('rejects a wrong current password without changing anything', async () => {
    const user = userEvent.setup();
    await renderApp('/student/account/settings', { as: 'student' });
    await user.type(await screen.findByLabelText('Mevcut şifre', {}, SLOW), 'not-the-password');
    await user.type(screen.getByLabelText('Yeni şifre'), 'yeniSifre42');
    await user.type(screen.getByLabelText('Yeni şifre (tekrar)'), 'yeniSifre42');
    await user.click(screen.getByRole('button', { name: 'Şifreyi değiştir' }));
    expect(await screen.findByText('Mevcut şifre doğru değil.', {}, SLOW)).toBeInTheDocument();
  });
});
