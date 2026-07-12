// AdvoraHeader and AdvoraNav are registered as native custom elements by
// legacy/js/components.js (imported once in main.jsx). They are fully
// self-contained (shadow DOM, their own styles, their own auth/session
// logic), so the React-idiomatic move is to render them directly rather
// than reimplement them — this is the same header/sidebar/bottom-nav used
// across the whole site, untouched.
export default function AdvoraChrome() {
  return (
    <>
      <advora-header></advora-header>
      <advora-nav></advora-nav>
    </>
  );
}
