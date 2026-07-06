import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { AdminLogin } from './pages/AdminLogin';
import { Admin } from './pages/Admin';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05130b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default function App() {
  useEffect(() => {
    // 1. window.onerror override to safely suppress third-party exceptions
    const originalOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      const msgStr = String(message || "").toLowerCase();
      const srcStr = String(source || "").toLowerCase();
      
      if (
        msgStr.includes('script error') ||
        msgStr.includes('adsbygoogle') ||
        msgStr.includes('adsense') ||
        msgStr.includes('doubleclick') ||
        msgStr.includes('google') ||
        msgStr.includes('cloudinary') ||
        !source ||
        srcStr.includes('doubleclick') ||
        srcStr.includes('google') ||
        srcStr.includes('adsbygoogle')
      ) {
        return true; // Prevents the firing of the default event handler (suppresses the error)
      }
      
      if (originalOnError) {
        return originalOnError.apply(this, arguments as any);
      }
      return false;
    };

    // 2. error EventListener with priority handling
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message ? String(event.message).toLowerCase() : '';
      const filename = event.filename ? String(event.filename).toLowerCase() : '';
      
      if (
        msg.includes('script error') || 
        msg.includes('adsbygoogle') ||
        msg.includes('adsense') ||
        msg.includes('doubleclick') ||
        msg.includes('google') ||
        msg.includes('cloudinary') ||
        !event.filename ||
        filename.includes('doubleclick') ||
        filename.includes('google') ||
        filename.includes('adsbygoogle')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    };

    // 3. unhandledrejection EventListener
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason ? String(event.reason.message || event.reason).toLowerCase() : '';
      if (
        reason.includes('script error') || 
        reason.includes('adsbygoogle') ||
        reason.includes('adsense') ||
        reason.includes('doubleclick') ||
        reason.includes('google')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    };
    
    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleRejection, true);
    
    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.onerror = originalOnError;
    };
  }, []);

  return (
    <Router>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}
