import { useEffect } from 'react';

/**
 * Loads a stylesheet (served as a static file from /public/legacy/css/) while
 * the calling component is mounted, and removes it on unmount.
 *
 * Why not just `import '../legacy/css/home.css'` at the top of the file?
 * Because home.css and profile.css each independently declare their own
 * `:root` variables and reuse some generic class names (`.card`, `.wh`,
 * etc). On the original site they were never on the page at the same time.
 * Loading them as native <link> tags that get inserted/removed on
 * mount/unmount reproduces that exact isolation inside the single-page app,
 * with zero changes to the CSS files themselves.
 */
export function useLegacyStylesheet(href) {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.legacyStylesheet = href;
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [href]);
}
