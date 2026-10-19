import { useEffect } from 'react';

export const APP_NAME = 'PUSULA';

/** Sets the browser tab title ("Page · PUSULA") so tabs, history and screen readers name the page. */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
