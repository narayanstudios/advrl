import { useEffect, useMemo, useRef, useState } from 'react';
import AdvoraChrome from '../components/AdvoraChrome.jsx';
import Avatar from '../components/Avatar.jsx';
import ProfilePostsList from '../components/ProfilePostsList.jsx';
import { useLegacyStylesheet } from '../legacy/useLegacyStylesheet.js';

// Same demo data the original profile_ui.html inline script hard-coded.
// Kept as-is (not wired to a live API) — this page's data layer was never
// backend-connected in the source project, so preserving it verbatim is the
// correct "don't rewrite working logic" move.
const PROFILE = {
  name: 'Ananya Rao',
  username: '@ananya.codes',
  avatarUrl: '',
};

const RAW_POSTS = [
  { id: 'p1', img: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&q=60', caption: "Annotated the beta-sheet folding diagram from today's lecture — flow of hydrogen bonding finally clicked.", likes: 34 },
  { id: 'p2', img: 'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=600&q=60', caption: 'Full write-up on CRISPR off-target detection methods, linked in resources.', likes: 21 },
  { id: 'p3', img: '', caption: 'Quick reminder: office hours moved to Thursday 4–6pm this week only.', likes: 9 },
  { id: 'p4', img: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=600&q=60', caption: 'Lab notebook page on primer design for the qPCR set.', likes: 45 },
  { id: 'p5', img: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&q=60', caption: 'Comparing two staining protocols side by side — results in comments.', likes: 17 },
  { id: 'p6', img: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=600&q=60', caption: 'Cleaned up my notes on enzyme kinetics for anyone prepping for finals.', likes: 52 },
];

const RESOURCES = [
  { id: 'r1', title: 'Molecular Biology — Midterm Study Pack', type: 'PDF', date: 'Jun 14, 2026' },
  { id: 'r2', title: 'CRISPR Off-Target Detection Methods', type: 'DOCX', date: 'Jun 09, 2026' },
  { id: 'r3', title: 'Enzyme Kinetics — Slide Deck', type: 'PPT', date: 'May 28, 2026' },
  { id: 'r4', title: 'qPCR Primer Design Worksheet', type: 'XLSX', date: 'May 20, 2026' },
];

const FILE_ICONS = {
  PDF: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  DOCX: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="15" y2="11"/></>,
  PPT: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="14" r="2"/></>,
  XLSX: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 12l6 6M15 12l-6 6"/></>,
};

function iconFor(type) {
  return FILE_ICONS[type] || FILE_ICONS.PDF;
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}

export default function ProfilePage() {
  useLegacyStylesheet('/legacy/css/profile.css');
  useLegacyStylesheet('/legacy/css/postcard.css');

  const [tab, setTab] = useState('posts');
  const [copied, setCopied] = useState(false);
  const tabsRef = useRef(null);
  const underlineRef = useRef(null);

  // Adapt the demo POST shape (img/caption/likes) to the shape PostCard /
  // feed-engine's normalizePost expects (image/caption/likes), and give
  // each one the profile owner's identity so the card header is correct —
  // same data, just mapped onto the shared PostCard's post schema.
  const posts = useMemo(() => RAW_POSTS.map((p) => ({
    id: p.id,
    author: PROFILE.username,
    fullName: PROFILE.name,
    caption: p.caption,
    image: p.img,
    likes: p.likes,
    photoURL: PROFILE.avatarUrl,
  })), []);

  function moveUnderline(activeTabName) {
    const tabEl = tabsRef.current?.querySelector(`[data-tab="${activeTabName}"]`);
    if (!tabEl || !underlineRef.current) return;
    underlineRef.current.style.width = `${tabEl.offsetWidth}px`;
    underlineRef.current.style.transform = `translateX(${tabEl.offsetLeft}px)`;
  }

  useEffect(() => {
    const raf = requestAnimationFrame(() => moveUnderline(tab));
    function onResize() { moveUnderline(tab); }
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function handleEdit() {
    window.location.href = '/settings/profile';
  }
  function handleSettings() {
    window.location.href = '/settings';
  }
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: PROFILE.name, url }); } catch (e) {}
    } else {
      copyToClipboard(url);
    }
  }
  function handleCopyLink() {
    copyToClipboard(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <AdvoraChrome />
      <div className="main-layout">
        <main className="profile-shell" id="profileShell">
          <header className="p-page-header" id="pPageHeader">
            <div className="pph-user">
              <Avatar className="pph-avatar" id="pphAvatar" name={PROFILE.name} avatarUrl={PROFILE.avatarUrl} />
              <span className="pph-handle" id="pphHandle">{PROFILE.username}</span>
            </div>

            <div className="pph-actions">
              <button className="pph-icon-btn" title="Settings" aria-label="Settings" onClick={handleSettings}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
              <button className={`pph-icon-btn${copied ? ' copied' : ''}`} title={copied ? 'Copied' : 'Copy profile link'} aria-label="Copy profile link" onClick={handleCopyLink}>
                {copied ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                )}
              </button>
            </div>
          </header>

          <section className="p-header" id="pHeader">
            <Avatar className="p-avatar" id="pAvatar" name={PROFILE.name} avatarUrl={PROFILE.avatarUrl} />

            <div className="p-identity">
              <div className="p-name-row">
                <span className="p-name" id="pName">{PROFILE.name}</span>
              </div>
              <div className="p-username" id="pUsername">{PROFILE.username}</div>

              <p className="p-bio" id="pBio">
                Structural biology PhD candidate. I write up lecture notes and share
                annotated papers so the next cohort has it easier than I did.
              </p>

              <div className="p-meta">
                <span className="p-role-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                  Researcher
                </span>
                <span className="p-qual">PhD, Molecular Biology</span>
                <span className="p-dot">·</span>
                <a className="p-website" href="#" id="pWebsite">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  ananyarao.dev
                </a>
              </div>

              <div className="p-stats">
                <div className="p-stat">
                  <span className="p-stat-num" id="statPosts">{posts.length}</span>
                  <span className="p-stat-lbl">Posts</span>
                </div>
                <div className="p-stat-sep"></div>
                <div className="p-stat">
                  <span className="p-stat-num" id="statResources">{RESOURCES.length}</span>
                  <span className="p-stat-lbl">Resources</span>
                </div>
              </div>

              <div className="p-profile-actions">
                <button className="p-btn" id="btnEdit" onClick={handleEdit}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                  Edit Profile
                </button>
                <button className="p-btn" id="btnShare" onClick={handleShare}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
                  Share Profile
                </button>
              </div>
            </div>
          </section>

          <nav className="p-tabs" id="pTabs" ref={tabsRef}>
            <button className={`p-tab${tab === 'posts' ? ' active' : ''}`} data-tab="posts" onClick={() => setTab('posts')}>Posts</button>
            <button className={`p-tab${tab === 'resources' ? ' active' : ''}`} data-tab="resources" onClick={() => setTab('resources')}>Resources</button>
            <span className="p-tab-underline" id="pTabUnderline" ref={underlineRef}></span>
          </nav>

          <section className="p-panel" id="panelPosts" style={{ display: tab === 'posts' ? '' : 'none' }}>
            <ProfilePostsList posts={posts} />
          </section>

          <section className="p-panel" id="panelResources" style={{ display: tab === 'resources' ? '' : 'none' }}>
            {RESOURCES.length === 0 ? (
              <div className="p-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div className="p-empty-title">No Resources Yet</div>
                <div className="p-empty-sub">Upload your first study resource.</div>
              </div>
            ) : (
              <div className="p-resources-list" id="resourcesList">
                {RESOURCES.map((res) => (
                  <div className="p-resource-card" key={res.id}>
                    <div className="p-res-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconFor(res.type)}</svg>
                    </div>
                    <div className="p-res-meta">
                      <div className="p-res-title">{res.title}</div>
                      <div className="p-res-sub">
                        <span className="p-res-type">{res.type}</span>
                        <span>{res.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
