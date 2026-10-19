import { useTranslation } from 'react-i18next';
import { daysFromToday, formatDate, formatTime } from '@/utils/format';

/** "12 dk önce" / "3 hours ago" / "2 days ago", falling back to a date. */
export function RelativeTime({ iso }: { iso: string }) {
  const { t, i18n } = useTranslation();
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  let text: string;
  if (minutes < 0) {
    // Future (scheduled items): "3 gün sonra" or today's time.
    const ahead = daysFromToday(iso);
    text = ahead <= 0 ? formatTime(iso, i18n.language) : ahead <= 7 ? t('time.inDays', { count: ahead }) : formatDate(iso, i18n.language);
  } else if (minutes < 60) text = t('time.minutesAgo', { count: Math.max(1, minutes) });
  else if (minutes < 60 * 24) text = t('time.hoursAgo', { count: Math.round(minutes / 60) });
  else {
    const days = -daysFromToday(iso);
    text = days <= 7 ? t('time.daysAgo', { count: days }) : formatDate(iso, i18n.language);
  }
  return (
    <time dateTime={iso} title={`${formatDate(iso, i18n.language)} ${formatTime(iso, i18n.language)}`}>
      {text}
    </time>
  );
}

/** "Bugün 23:59", "Yarın 20:00", "3 gün sonra" */
export function DueLabel({ iso }: { iso: string }) {
  const { t, i18n } = useTranslation();
  const days = daysFromToday(iso);
  const time = formatTime(iso, i18n.language);
  let text: string;
  if (days === 0) text = `${t('time.today')} ${time}`;
  else if (days === 1) text = `${t('time.tomorrow')} ${time}`;
  else if (days > 1 && days <= 7) text = `${formatDate(iso, i18n.language, { weekday: 'long' })} ${time}`;
  else text = formatDate(iso, i18n.language, { day: 'numeric', month: 'short' });
  return <time dateTime={iso}>{text}</time>;
}
