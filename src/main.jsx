import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Shared modules, loaded exactly once, in the same order the original
// <script type="module"> tags appeared in home.html / profile_ui.html.
// data.js attaches window.AdvoraAPI, lnr-relay.js attaches window.LnrRelay,
// components.js registers the <advora-header>/<advora-nav> custom elements.
import './legacy/js/api/data.js';
import './legacy/js/lnr-relay.js';
import './legacy/js/components.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
