// ADVORA CONFIGRATION
const ADVORA_CONFIG = {
    brandName: "ADVORA",

    // Sidebar / bottom-nav links
    navLinks: [
        { name: "Home", url: "/home", icon: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>` },
        { name: "Quizzy", url: "#", icon: `<path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="19" cy="5" r="3"/>` },
        { name: "Hub", url: "/hub", icon: `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>` },
        { name: "Profile", url: "/profile", icon: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>` }
    ],

    // Header action buttons (Library / Chat / Upload) — fully config-driven now
    headerActions: [
        { name: "Library", url: "/library", badge: false, icon: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>` },
        { name: "Chat", url: "/chat", badge: true, icon: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>` }
    ],

    // Primary CTA button in header
    uploadButton: {
        name: "Upload",
        url: "/upload",
        icon: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>`
    },

    // User-card action buttons (settings / logout)
    userCardActions: [
        { name: "Settings", url: "/settings", danger: false, icon: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`, action: "settings" },
        { name: "Logout", url: "/authentication", danger: true, icon: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`, action: "logout" }
    ],

    topics: ["Technology", "Design", "Science", "Business", "Culture"],
    stats: { streak: "5 Days", hours: "12.5h" }
};

// ─── 1. HEADER COMPONENT (With Magic Inline Animation) ───
class AdvoraHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        // --- URL CHECK LOGIC ---
        const path = window.location.pathname.toLowerCase();
        // Treat root, /home, and /index.html as the homepage
        const isHomePage = path === '/' || path.endsWith('/home') || path.endsWith('/index.html');
        
        // Hide mobile header entirely if not on homepage
        if (!isHomePage) {
            this.classList.add('hide-mobile');
        }

        const desktopActionButtons = ADVORA_CONFIG.headerActions.map(action => `
            <button class="ib" title="${action.name}" data-url="${action.url}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${action.icon}</svg>
                ${action.badge ? '<span class="bdg"></span>' : ''}
            </button>
        `).join('');

        const mobileActionButtons = ADVORA_CONFIG.headerActions.map(action => `
            <button class="mob-icon-btn" title="${action.name}" data-url="${action.url}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${action.icon}</svg>
                ${action.badge ? '<span class="mob-bdg"></span>' : ''}
            </button>
        `).join('');

        this.shadowRoot.innerHTML = `
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                :host {
                    display: block; position: fixed; top: 0; left: 0; width: 100%; z-index: 1000;
                    background: rgba(255, 255, 255, 0.70); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
                    border-bottom: 1px solid rgba(232, 232, 236, 0.5); font-family: 'Inter', sans-serif;
                }
                
                /* ── DESKTOP HEADER ── */
                .topbar { height: 64px; display: flex; align-items: center; padding: 0 32px; gap: 24px; }
                .logo { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--tp, #111113); text-decoration: none; letter-spacing: -.5px; }
                .sw { flex: 1; max-width: 480px; position: relative; margin-left: 20px;}
                .sw input { width: 100%; height: 42px; border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 12px; padding: 0 16px 0 42px; font-size: 14px; background: rgba(247, 247, 248, 0.6); outline: none; transition: 0.2s; color: var(--tp); }
                .sw input:focus { background: #fff; border-color: rgba(232, 232, 236, 0.8); box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
                .si { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--ts); pointer-events: none; }
                .tba { margin-left: auto; display: flex; align-items: center; gap: 10px; }
                .ib { width: 42px; height: 42px; border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 12px; background: rgba(247, 247, 248, 0.6); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--ts); transition: all 0.2s; position: relative;}
                .ib:hover { background: #fff; color: var(--tp); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
                .bdg { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; background: #EF4444; border-radius: 50%; border: 2px solid #fff; }
                .bu { height: 42px; padding: 0 20px; background: var(--acc, #1A1A2E); color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
                .bu:hover { background: var(--acc2, #2E2E50); transform: translateY(-1px); }

                /* ── MOBILE HEADER STYLING ── */
                .mob-top { display: none; align-items: center; justify-content: space-between; height: 56px; padding: 0 12px; gap: 10px; position: relative; }
                
                .logo-container { position: relative; display: flex; align-items: center; height: 100%; min-width: 110px; cursor: pointer; }
                .state-logo { display: flex; align-items: center; gap: 4px; transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); transform: translateY(0); opacity: 1; }
                .mob-logo-text { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--tp); letter-spacing: -.5px; }
                
                .streak-pill { display: flex; align-items: center; gap: 4px; background: linear-gradient(135deg, #FF9800, #FF5722); padding: 2px 6px; border-radius: 999px; height: 20px; max-width: 70px; overflow: hidden; white-space: nowrap; box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3); transition: max-width 0.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.6s ease, padding 0.6s ease, box-shadow 0.6s ease; }
                .s-icon { font-size: 11px; line-height: 1; }
                .s-text { font-size: 10px; font-weight: 700; color: #fff; opacity: 1; transition: opacity 0.3s ease; }
                .streak-pill.wiped { max-width: 18px; padding: 2px; background: transparent; box-shadow: none; }
                .streak-pill.wiped .s-text { opacity: 0; pointer-events: none; }

                .state-stats { position: absolute; left: 0; display: flex; align-items: center; gap: 6px; transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); transform: translateY(15px); opacity: 0; pointer-events: none; white-space: nowrap; }
                .stat-micro { font-size: 10px; font-weight: 700; color: var(--tp); background: rgba(247, 247, 248, 0.9); border: 1px solid rgba(232, 232, 236, 0.8); padding: 4px 8px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.02); }

                .logo-container.show-stats .state-logo { opacity: 0; transform: translateY(-15px); pointer-events: none; }
                .logo-container.show-stats .state-stats { opacity: 1; transform: translateY(0); pointer-events: auto; }

                .mob-sw { flex: 1; position: relative; }
                .mob-sw input { width: 100%; height: 34px; border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 10px; padding: 0 12px 0 32px; font-size: 12px; background: rgba(247, 247, 248, 0.6); outline: none; transition: 0.2s; color: var(--tp); }
                .mob-sw input:focus { background: #fff; border-color: rgba(232, 232, 236, 0.8); }
                .mob-si { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ts); }

                .mob-actions { display: flex; align-items: center; gap: 6px; }
                .mob-icon-btn { width: 34px; height: 34px; background: transparent; border: none; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--ts); cursor: pointer; position: relative; transition: 0.2s; }
                .mob-icon-btn:hover { background: rgba(0,0,0,0.04); color: var(--tp); }
                .mob-bdg { position: absolute; top: 4px; right: 4px; width: 7px; height: 7px; background: #EF4444; border-radius: 50%; border: 2px solid #fff; }

                @media(max-width: 700px) {
                    /* If URL is not home, hide the entire header component on mobile */
                    :host(.hide-mobile) {
                        display: none !important;
                    }
                    .topbar { display: none; }
                    .mob-top { display: flex; }
                }

                /* ── SYSTEM DEFAULT DARK MODE (Header) ── */
                @media (prefers-color-scheme: dark) {
                    :host { background: rgba(9, 9, 11, 0.75); border-bottom-color: rgba(39, 39, 42, 0.6); }
                    .sw input, .mob-sw input { background: rgba(24, 24, 27, 0.6); border-color: rgba(39, 39, 42, 0.8); }
                    .sw input:focus, .mob-sw input:focus { background: #18181B; border-color: rgba(63, 63, 70, 0.8); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                    .ib { background: rgba(24, 24, 27, 0.6); border-color: rgba(39, 39, 42, 0.8); }
                    .ib:hover { background: #18181B; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                    .stat-micro { background: rgba(24, 24, 27, 0.9); border-color: rgba(39, 39, 42, 0.8); }
                    .mob-icon-btn:hover { background: rgba(255,255,255,0.08); }
                    .bdg, .mob-bdg { border-color: #09090B; }
                }
            </style>

            <div class="topbar">
                <a class="logo" href="/home">${ADVORA_CONFIG.brandName}</a>
                <div class="sw">
                    <svg class="si" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search content, topics, creators…">
                </div>
                <div class="tba">
                    ${desktopActionButtons}
                    <button class="bu" id="upload-btn-desktop" data-url="${ADVORA_CONFIG.uploadButton.url}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ADVORA_CONFIG.uploadButton.icon}</svg>
                        ${ADVORA_CONFIG.uploadButton.name}
                    </button>
                </div>
            </div>

            <div class="mob-top">
                <div class="logo-container" id="logo-trigger">
                    <div class="state-logo">
                        <span class="mob-logo-text">${ADVORA_CONFIG.brandName}</span>
                        <div class="streak-pill" id="streak-pill">
                            <span class="s-icon">🔥</span>
                            <span class="s-text">${ADVORA_CONFIG.stats.streak.split(' ')[0]}</span>
                        </div>
                    </div>
                    <div class="state-stats">
                        <div class="stat-micro">🔥 ${ADVORA_CONFIG.stats.streak.split(' ')[0]}</div>
                        <div class="stat-micro">⏱️ ${ADVORA_CONFIG.stats.hours}</div>
                    </div>
                </div>

                <div class="mob-sw">
                    <svg class="mob-si" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search...">
                </div>

                <div class="mob-actions">
                    ${mobileActionButtons}
                </div>
            </div>
        `;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                // If display: none kicks in, height becomes 0, which perfectly removes the gap!
                document.documentElement.style.setProperty('--advora-header-height', `${entry.contentRect.height}px`);
            }
        });
        resizeObserver.observe(this);

        setTimeout(() => {
            const pill = this.shadowRoot.getElementById('streak-pill');
            if (pill) pill.classList.add('wiped');
        }, 3000);

        const logoTrigger = this.shadowRoot.getElementById('logo-trigger');
        let resetTimer;

        logoTrigger.addEventListener('click', () => {
            logoTrigger.classList.add('show-stats');
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => {
                logoTrigger.classList.remove('show-stats');
            }, 5000);
        });

        // Wire up every config-driven button with a data-url to actually navigate
        this.shadowRoot.querySelectorAll('[data-url]').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.getAttribute('data-url');
                if (url && url !== '#') {
                    window.location.href = url;
                }
            });
        });
    }
}

// ─── 2. SIDEBAR / MOBILE NAV COMPONENT ───
class AdvoraNav extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentUser = null;
    }

    async initAuth() {
        try {
            const response = await window.LnrRelay.request('/auth/session');

            if (!response || response.success === false || !response.data) {
                window.location.href = '/login.html';
                return;
            }

            this.currentUser = response.data;

            const nameEl = this.shadowRoot.getElementById('nav-name');
            const emailEl = this.shadowRoot.getElementById('nav-email');
            const avatarEl = this.shadowRoot.getElementById('nav-avatar');

            const displayName = this.currentUser.fullName || this.currentUser.username || '';
            const profilePicUrl = this.currentUser.profilePic || '';

            if (nameEl) nameEl.textContent = displayName;
            if (emailEl) emailEl.textContent = this.currentUser.email || '';

            if (avatarEl) {
                if (profilePicUrl) {
                    avatarEl.innerHTML = `<img src="${profilePicUrl}" alt="${displayName}" class="uc-avatar-img" />`;
                    avatarEl.classList.add('has-img');
                } else {
                    avatarEl.textContent = displayName.trim().charAt(0).toUpperCase() || '?';
                    avatarEl.classList.remove('has-img');
                }
            }
        } catch (error) {
            console.error('[AdvoraNav] initAuth failed:', error);
            window.location.href = '/login.html';
        }
    }

    connectedCallback() {
        // --- DYNAMIC ACTIVE NAV LOGIC ---
        const currentPath = window.location.pathname.toLowerCase();

        const desktopLinks = ADVORA_CONFIG.navLinks.map((link) => {
            const isMatch = (link.url !== '#' && currentPath.includes(link.url.toLowerCase())) || (currentPath === '/' && link.url === '/home');
            return `
            <a class="ni ${isMatch ? 'active' : ''}" href="${link.url}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${link.icon}</svg>
                <span class="nav-text">${link.name}</span>
            </a>
        `}).join('');

        const topicLinks = ADVORA_CONFIG.topics.map(topic => `<a class="ni" href="#"><span class="nav-text">${topic}</span></a>`).join('');

        const mobileLinks = ADVORA_CONFIG.navLinks.slice(0, 2).map((link) => {
            const isMatch = (link.url !== '#' && currentPath.includes(link.url.toLowerCase())) || (currentPath === '/' && link.url === '/home');
            return `
            <button class="mn-item ${isMatch ? 'active' : ''}" data-url="${link.url}">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${link.icon}</svg>
            </button>
        `}).join('') + `
            <button class="mn-item" id="mob-plus-btn" data-url="${ADVORA_CONFIG.uploadButton.url}"><div class="mn-plus"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div></button>
        ` + ADVORA_CONFIG.navLinks.slice(2).map(link => {
            const isMatch = (link.url !== '#' && currentPath.includes(link.url.toLowerCase())) || (currentPath === '/' && link.url === '/home');
            return `
            <button class="mn-item ${isMatch ? 'active' : ''}" data-url="${link.url}">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${link.icon}</svg>
            </button>
        `}).join('');

        const userCardButtons = ADVORA_CONFIG.userCardActions.map(action => `
            <button class="uc-btn ${action.danger ? 'danger' : ''}" data-action="${action.action || ''}" data-url="${action.url || ''}" title="${action.name}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${action.icon}</svg>
            </button>
        `).join('');

        this.shadowRoot.innerHTML = `
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                :host { font-family: 'Inter', sans-serif; }

                .sidebar {
                    position: fixed; top: var(--advora-header-height, 64px); left: 0;
                    width: 260px; height: calc(100vh - var(--advora-header-height, 64px));
                    background: rgba(255, 255, 255, 0.70); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
                    border-right: 1px solid rgba(232, 232, 236, 0.6);
                    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 900; overflow: visible;
                }

                .sidebar-inner {
                    display: flex; flex-direction: column; padding: 24px 16px; gap: 16px;
                    width: 100%; height: 100%; overflow-x: hidden; overflow-y: auto; scrollbar-width: none;
                }
                .sidebar-inner::-webkit-scrollbar { display: none; }

                .sidebar-toggle-edge {
                    position: absolute; right: -14px; top: 15%; width: 28px; height: 28px; background: #fff;
                    border: 1px solid rgba(232, 232, 236, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.06); color: var(--ts); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1001;
                }
                .sidebar-toggle-edge:hover { background: rgba(247, 247, 248, 1); color: var(--tp); transform: scale(1.15); box-shadow: 0 6px 16px rgba(0,0,0,0.1); }
                .sidebar-toggle-edge svg { transition: transform 0.3s; }
                
                :host(.collapsed) .sidebar { width: 84px; }
                :host(.collapsed) .sidebar-inner { padding: 24px 10px; }
                :host(.collapsed) .nav-text, :host(.collapsed) .slbl, :host(.collapsed) .uc-info { display: none; opacity: 0; }
                :host(.collapsed) .uc-actions { flex-direction: column; }
                :host(.collapsed) .nav-group { padding: 8px 4px; }
                :host(.collapsed) .user-card { padding: 12px 6px; align-items: center; }
                :host(.collapsed) .sidebar-toggle-edge svg { transform: rotate(180deg); }

                .nav-group { background: rgba(247, 247, 248, 0.6); border-radius: 16px; padding: 8px; border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: inset 0 2px 4px rgba(0,0,0,0.01), 0 2px 8px rgba(0, 0, 0, 0.02); display: flex; flex-direction: column; gap: 4px; transition: 0.3s; }
                .ni { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; font-size: 14px; font-weight: 500; color: var(--ts); text-decoration: none; transition: all .2s; white-space: nowrap; }
                .ni svg { flex-shrink: 0; }
                .ni:hover { background: rgba(255, 255, 255, 0.8); color: var(--tp); box-shadow: 0 2px 6px rgba(0,0,0,0.02); }
                .ni.active { background: #fff; color: var(--tp); font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid rgba(232, 232, 236, 0.4); }
                .ni.active svg { stroke: var(--tp); }
                .slbl { font-size: 11px; font-weight: 600; color: var(--ts); letter-spacing: .08em; text-transform: uppercase; margin: 6px 0 4px 12px; transition: 0.2s; }

                .user-card { background: rgba(247, 247, 248, 0.6); border-radius: 16px; padding: 12px; border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: inset 0 2px 4px rgba(0,0,0,0.01), 0 2px 8px rgba(0, 0, 0, 0.02); transition: 0.3s; margin-top: auto; }
                .uc-top { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 0 2px; }
                .uc-avatar { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg,#1A1A2E,#4A4A8A); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 16px; flex-shrink: 0; box-shadow: 0 4px 10px rgba(26,26,46,.15); overflow: hidden; }
                .uc-avatar.has-img { background: #e5e5e5; }
                .uc-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .uc-info { flex: 1; min-width: 0; transition: 0.2s; }
                .uc-name { font-size: 13px; font-weight: 700; color: var(--tp); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .uc-email { font-size: 11px; color: var(--ts); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .uc-actions { display: flex; gap: 6px; }
                .uc-btn { flex: 1; height: 32px; border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 10px; background: rgba(255,255,255,0.5); font-size: 12px; font-weight: 600; color: var(--ts); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);}
                .uc-btn:hover { background: #fff; color: var(--tp); box-shadow: 0 4px 8px rgba(0,0,0,0.05); transform: translateY(-1px);}
                .uc-btn.danger { color: #EF4444; border-color: rgba(254, 226, 226, 0.6); background: rgba(255, 245, 245, 0.6);}
                .uc-btn.danger:hover { background: #FEE2E2; }

                .mob-nav-wrapper { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000; padding: 0 16px 20px 16px; pointer-events: none; }
                .mob-nav { pointer-events: auto; width: 100%; height: 65px; background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: space-around; padding: 0 8px; }
                .mn-item { display: flex; align-items: center; justify-content: center; color: var(--ts); border: none; background: transparent; cursor: pointer; transition: 0.2s; padding: 10px; border-radius: 16px;}
                .mn-item.active { color: var(--tp); background: rgba(247,247,248,0.8); }
                .mn-item svg { stroke: var(--ts); transition: 0.2s; }
                .mn-item.active svg { stroke: var(--tp); transform: scale(1.1); }
                .mn-plus { width: 44px; height: 44px; background: var(--tp); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(0,0,0,0.2); transition: 0.2s; }
                .mn-plus:hover { transform: scale(1.05) translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.25); }

                @media(max-width: 700px) {
                    .sidebar { display: none; }
                    .mob-nav-wrapper { display: block; }
                }

                /* ── SYSTEM DEFAULT DARK MODE (Sidebar & Nav) ── */
                @media (prefers-color-scheme: dark) {
                    .sidebar { background: rgba(9, 9, 11, 0.75); border-right-color: rgba(39, 39, 42, 0.6); }
                    .sidebar-toggle-edge { background: #18181B; border-color: rgba(63, 63, 70, 0.9); box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
                    .sidebar-toggle-edge:hover { background: #27272A; box-shadow: 0 6px 16px rgba(0,0,0,0.6); }
                    .nav-group, .user-card { background: rgba(24, 24, 27, 0.6); border-color: rgba(39, 39, 42, 0.8); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
                    
                    .ni:hover { background: rgba(39, 39, 42, 0.8); box-shadow: none; }
                    .ni.active { background: #18181B; border-color: rgba(63, 63, 70, 0.4); box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
                    
                    .uc-btn { background: rgba(39, 39, 42, 0.5); border-color: rgba(63, 63, 70, 0.8); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                    .uc-btn:hover { background: #27272A; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
                    .uc-btn.danger { background: rgba(220, 38, 38, 0.1); border-color: rgba(220, 38, 38, 0.3); }
                    .uc-btn.danger:hover { background: rgba(220, 38, 38, 0.2); }
                    
                    .mob-nav { background: rgba(9, 9, 11, 0.85); border-color: rgba(39, 39, 42, 0.8); box-shadow: 0 8px 32px rgba(0,0,0,0.6); }
                    .mn-item.active { background: rgba(39, 39, 42, 0.8); }
                    .mn-plus { box-shadow: 0 6px 16px rgba(0,0,0,0.6); }
                    .mn-plus:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.8); }
                }
            </style>

            <aside class="sidebar" id="desktop-sidebar">
                <button class="sidebar-toggle-edge" id="toggle-btn" title="Toggle Sidebar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div class="sidebar-inner">
                    <div class="nav-group">${desktopLinks}</div>
                    <div class="nav-group"><div class="slbl">Topics</div>${topicLinks}</div>
                    <div class="user-card">
                        <div class="uc-top">
                            <div class="uc-avatar" id="nav-avatar">?</div>
                            <div class="uc-info">
                                <div class="uc-name" id="nav-name">Loading...</div>
                                <div class="uc-email" id="nav-email">Loading...</div>
                            </div>
                        </div>
                        <div class="uc-actions">
                            ${userCardButtons}
                        </div>
                    </div>
                </div>
            </aside>
            <div class="mob-nav-wrapper">
                <nav class="mob-nav" id="mobile-nav">${mobileLinks}</nav>
            </div>
        `;

        this.shadowRoot.getElementById('toggle-btn').addEventListener('click', () => {
            this.classList.toggle('collapsed');
            setTimeout(updateLayoutVariables, 50);
            setTimeout(updateLayoutVariables, 300);
        });

        const updateLayoutVariables = () => {
            const isMobile = window.innerWidth <= 700;
            if (isMobile) {
                const mobNavHeight = this.shadowRoot.getElementById('mobile-nav').offsetHeight + 20;
                document.documentElement.style.setProperty('--advora-bottom-nav-height', `${mobNavHeight}px`);
                document.documentElement.style.setProperty('--advora-sidebar-width', `0px`);
            } else {
                const sidebarWidth = this.shadowRoot.getElementById('desktop-sidebar').offsetWidth;
                document.documentElement.style.setProperty('--advora-sidebar-width', `${sidebarWidth}px`);
                document.documentElement.style.setProperty('--advora-bottom-nav-height', `0px`);
            }
        };

        window.addEventListener('resize', updateLayoutVariables);
        setTimeout(updateLayoutVariables, 0);

        // Bottom mobile nav buttons (Home, Quizzy, Upload-plus, Hub, Profile) → navigate via data-url
        this.shadowRoot.querySelectorAll('.mn-item[data-url]').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.getAttribute('data-url');
                if (url && url !== '#') window.location.href = url;
            });
        });

        // User card action buttons (Settings / Logout) — config driven
        this.shadowRoot.querySelectorAll('.uc-btn[data-action]').forEach(btn => {
            const action = btn.getAttribute('data-action');

            if (action === 'logout') {
                btn.addEventListener('click', async () => {
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = '<span style="font-size: 14px;">⏳</span>';
                    btn.disabled = true;

                    try {
                        const response = await window.LnrRelay.request('/auth/logout', {
                            method: 'POST',
                            body: { uid: this.currentUser?.uid || null }
                        });

                        if (response && response.success !== false) {
                            window.location.href = btn.getAttribute('data-url') || '/authentication';
                        } else {
                            console.error('[AdvoraNav] Logout request did not succeed:', response);
                            btn.innerHTML = originalHtml;
                            btn.disabled = false;
                        }
                    } catch (err) {
                        console.error('[AdvoraNav] Logout failed:', err);
                        btn.innerHTML = originalHtml;
                        btn.disabled = false;
                    }
                });
            } else {
                // e.g. "settings" or any future action — plain navigation
                btn.addEventListener('click', () => {
                    const url = btn.getAttribute('data-url');
                    if (url) window.location.href = url;
                });
            }
        });

        this.initAuth();
    }
}

customElements.define('advora-header', AdvoraHeader);
customElements.define('advora-nav', AdvoraNav);
