import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, RotateCcw, Upload, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { FileDrop } from '@/components/ui/FileDrop';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useAction } from '@/hooks/useAction';
import { downloadCsv, parseCsv } from '@/utils/csv';
import { BRANCHES } from '@/config/catalog';
import { existingKeys, type ImportRow, importUsers } from '../services/adminApi';

type Kind = 'students' | 'teachers';
type Issue = 'missing' | 'email' | 'duplicateFile' | 'duplicateSystem' | 'class' | 'branch';
interface CheckedRow extends ImportRow {
  line: number;
  issues: Issue[];
}

const HEADERS: Record<Kind, string[]> = {
  students: ['ad', 'soyad', 'e-posta', 'okul no', 'sınıf'],
  teachers: ['ad', 'soyad', 'e-posta', 'branş'],
};
/** Template rows downloaded with the CSV template (`.example` is a reserved documentation domain). */
const SAMPLE: Record<Kind, string[][]> = {
  students: [
    ['Ada', 'Yıldırım', 'ada.yildirim@okul.example', '9001', '8-A'],
    ['Emir', 'Kılıç', 'emir.kilic@okul.example', '9002', '7-C'],
  ],
  teachers: [['Sena', 'Arı', 'sena.ari@okul.example', 'Matematik']],
};
const CLASS_RE = /^(1[0-2]|[1-9])-[A-F]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ROWS = 2000;

export default function ImportPage() {
  const { t } = useTranslation(['admin', 'common']);
  const location = useLocation();
  const [kind, setKind] = useState<Kind>((location.state as { kind?: Kind } | null)?.kind ?? 'students');
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<CheckedRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [onlyIssues, setOnlyIssues] = useState(false);
  const { run, busy } = useAction();

  const reset = () => {
    setFiles([]);
    setRows(null);
    setParseError(null);
    setDone(null);
    setOnlyIssues(false);
  };

  const check = async (file: File) => {
    setParseError(null);
    setDone(null);
    const text = await file.text();
    const table = parseCsv(text);
    if (table.length < 2) {
      setParseError(t('import.errors.empty'));
      setRows(null);
      return;
    }
    const [, ...body] = table;
    if (body.length > MAX_ROWS) {
      setParseError(t('import.errors.tooMany', { max: MAX_ROWS }));
      setRows(null);
      return;
    }
    const existing = await existingKeys(kind);
    const seenEmails = new Map<string, number>();
    const seenNumbers = new Map<string, number>();
    const checked = body.map((cells, i): CheckedRow => {
      const [firstName = '', lastName = '', mail = '', extra = '', className = ''] = cells;
      const emailNorm = mail.toLocaleLowerCase('tr-TR');
      const issues: Issue[] = [];
      if (!firstName || !lastName || !mail || !extra || (kind === 'students' && !className)) issues.push('missing');
      if (mail && !EMAIL_RE.test(mail)) issues.push('email');
      if (kind === 'students' && className && !CLASS_RE.test(className.toUpperCase())) issues.push('class');
      if (kind === 'teachers' && extra && !BRANCHES.includes(extra)) issues.push('branch');
      if (emailNorm && seenEmails.has(emailNorm)) issues.push('duplicateFile');
      if (kind === 'students' && extra && seenNumbers.has(extra) && !issues.includes('duplicateFile')) issues.push('duplicateFile');
      if (existing.emails.includes(emailNorm) || (kind === 'students' && existing.numbers.includes(extra))) issues.push('duplicateSystem');
      seenEmails.set(emailNorm, i);
      if (extra) seenNumbers.set(extra, i);
      return { line: i + 2, firstName, lastName, email: mail, extra, className: className.toUpperCase(), issues };
    });
    setRows(checked);
  };

  const valid = useMemo(() => rows?.filter((r) => r.issues.length === 0) ?? [], [rows]);
  const invalid = (rows?.length ?? 0) - valid.length;
  const visible = (onlyIssues ? rows?.filter((r) => r.issues.length) : rows) ?? [];

  const steps = [t('import.steps.choose'), t('import.steps.check'), t('import.steps.import')];
  const step = done !== null ? 2 : rows ? 1 : 0;

  return (
    <>
      <PageHeader title={t('import.title')} description={t('import.description')} />

      <ol className="mb-6 grid gap-3 sm:grid-cols-3" aria-label={t('import.stepsLabel')}>
        {steps.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? 'step' : undefined}
            className={clsx('flex items-center gap-3 rounded-[16px] border px-4 py-3', i === step ? 'border-primary bg-accent-soft' : i < step ? 'border-success/30 bg-success/[0.06]' : 'border-border bg-surface')}
          >
            <span className={clsx('flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-bold', i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-muted-foreground')}>
              {i < step ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span className="text-[14.5px] font-semibold text-foreground">{label}</span>
          </li>
        ))}
      </ol>

      {done !== null ? (
        <Panel>
          <div className="flex flex-col items-center py-8 text-center">
            <span className="icon-tile h-16 w-16 rounded-full bg-success/[0.12] text-success">
              <CheckCircle2 className="h-8 w-8" aria-hidden />
            </span>
            <h2 className="mt-4 font-display text-[22px] font-extrabold text-foreground">{t('import.done.title', { count: done })}</h2>
            <p className="mt-1 max-w-md text-[14.5px] text-muted-foreground">{t('import.done.body')}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link to={kind === 'students' ? '/admin/students' : '/admin/teachers'} className={buttonClass('primary')}>
                {t(kind === 'students' ? 'import.done.toStudents' : 'import.done.toTeachers')}
              </Link>
              <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={reset}>
                {t('import.again')}
              </Button>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <Panel icon={FileSpreadsheet} title={t('import.fileTitle')}>
            <SegmentedControl
              label={t('import.kind')}
              value={kind}
              onChange={(v) => {
                setKind(v);
                reset();
              }}
              options={[
                { value: 'students', label: t('import.kinds.students') },
                { value: 'teachers', label: t('import.kinds.teachers') },
              ]}
            />
            <div className="mt-4 rounded-[14px] bg-surface-muted p-4 text-[13.5px] text-muted-foreground">
              <p className="font-semibold text-foreground">{t('import.columns')}</p>
              <p className="mt-1 font-mono text-[12.5px]">{HEADERS[kind].join(' ; ')}</p>
              <p className="mt-2">{t(kind === 'students' ? 'import.rulesStudents' : 'import.rulesTeachers')}</p>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 mt-2"
                icon={<Download className="h-4 w-4" aria-hidden />}
                onClick={() => downloadCsv(`pusula-${kind}-sablon`, [HEADERS[kind], ...SAMPLE[kind]])}
              >
                {t('actions.downloadTemplate', { ns: 'common' })}
              </Button>
            </div>
            <FileDrop
              className="mt-4"
              label={t('import.file')}
              accept=".csv,.txt"
              maxSize={5 * 1024 * 1024}
              hint={t('import.fileHint')}
              files={files}
              onChange={(next) => {
                setFiles(next);
                if (next[0]) void check(next[0]);
                else setRows(null);
              }}
              error={parseError ?? undefined}
            />
          </Panel>

          <Panel
            title={t('import.previewTitle')}
            description={rows ? t('import.summary', { total: rows.length, valid: valid.length, invalid }) : t('import.previewEmpty')}
            action={
              rows && invalid > 0 ? (
                <Button variant={onlyIssues ? 'soft' : 'ghost'} size="sm" aria-pressed={onlyIssues} onClick={() => setOnlyIssues((v) => !v)} icon={<AlertTriangle className="h-4 w-4" aria-hidden />}>
                  {t('import.onlyIssues')}
                </Button>
              ) : undefined
            }
            bodyClassName="px-0 sm:px-0"
          >
            {rows ? (
              <>
                <div className="scrollbar-thin max-h-[460px] overflow-auto">
                  <table className="w-full min-w-[640px] text-left text-[14px]">
                    <caption className="sr-only">{t('import.previewTitle')}</caption>
                    <thead className="sticky top-0 z-10 bg-surface-muted text-[13px] text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-5 py-2.5 font-semibold">{t('import.line')}</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">{t('common.fullName', { ns: 'common' })}</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">{t('common.email', { ns: 'common' })}</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">{kind === 'students' ? t('import.schoolNumber') : t('common.branch', { ns: 'common' })}</th>
                        {kind === 'students' && <th scope="col" className="px-3 py-2.5 font-semibold">{t('common.class', { ns: 'common' })}</th>}
                        <th scope="col" className="px-5 py-2.5 font-semibold">{t('common.status', { ns: 'common' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((r) => (
                        <tr key={r.line} className={clsx('border-b border-border last:border-0', r.issues.length && 'bg-danger/[0.04]')}>
                          <td className="px-5 py-2.5 tabular-nums text-muted-foreground">{r.line}</td>
                          <th scope="row" className="px-3 py-2.5 font-semibold text-foreground">{`${r.firstName} ${r.lastName}`.trim() || '—'}</th>
                          <td className="px-3 py-2.5 text-foreground">{r.email || '—'}</td>
                          <td className="px-3 py-2.5 text-foreground">{r.extra || '—'}</td>
                          {kind === 'students' && <td className="px-3 py-2.5 tabular-nums text-foreground">{r.className || '—'}</td>}
                          <td className="px-5 py-2.5">
                            {r.issues.length === 0 ? (
                              <Badge tone="success" icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}>
                                {t('import.ok')}
                              </Badge>
                            ) : (
                              <span className="flex flex-wrap gap-1">
                                {r.issues.map((issue) => (
                                  <Badge key={issue} tone="danger" icon={<XCircle className="h-3.5 w-3.5" aria-hidden />}>
                                    {t(`import.issues.${issue}`)}
                                  </Badge>
                                ))}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3 border-t border-border px-5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13.5px] text-muted-foreground">{invalid > 0 ? t('import.skipNote', { count: invalid }) : t('import.allValid')}</p>
                  <Button
                    variant="ink"
                    loading={busy}
                    disabled={valid.length === 0}
                    icon={<Upload className="h-4 w-4" aria-hidden />}
                    onClick={async () => {
                      const res = await run(() => importUsers(kind, valid), { success: t('import.done.toast', { count: valid.length }) });
                      if (res) setDone(res.created);
                    }}
                  >
                    {t('import.submit', { count: valid.length })}
                  </Button>
                </div>
              </>
            ) : (
              <p className="px-5 py-10 text-center text-[14.5px] text-muted-foreground sm:px-6">{t('import.previewHint')}</p>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
