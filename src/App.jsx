import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

// Only /home and /profile are handled here — every other route (auth,
// forgot-password, OTP, upload, hub, etc.) continues to be served as plain
// static HTML by the existing Vercel Edge Middleware and never reaches this
// bundle. See MIDDLEWARE_CHANGES.md for the exact rewrite rules to add.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
