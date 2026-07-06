import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, Mail } from 'lucide-react';
import { loginAdmin, checkAdminEmailAuthorized } from '../lib/store';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    const isAuthorized = await checkAdminEmailAuthorized(email);
    if (!isAuthorized) {
      setError('Unauthorized Access');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginAdmin('admin123');
      navigate('/admin');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          loginAdmin('admin123');
          navigate('/admin');
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            setError('Invalid admin credentials.');
          } else {
            setError('Error setting up admin account.');
          }
        }
      } else {
        setError('Invalid admin credentials.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#05130b] text-green-50 font-sans flex items-center justify-center p-4 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="w-full max-w-md bg-[#071c10] border border-green-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[80px]"></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-600 to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <Crown size={32} className="text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center text-white uppercase tracking-widest mb-2">Admin Access</h1>
          <p className="text-center text-green-100/50 mb-8 text-sm">Enter your credentials to manage the directory</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-green-100/70 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="Enter admin email..."
                  className={`w-full bg-[#05130b] border ${error ? 'border-red-500' : 'border-green-800'} focus:border-amber-500 rounded-xl py-3 pl-10 pr-4 text-white placeholder-green-100/20 focus:outline-none transition-colors`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-green-100/70 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter admin password..."
                  className={`w-full bg-[#05130b] border ${error ? 'border-red-500' : 'border-green-800'} focus:border-amber-500 rounded-xl py-3 pl-10 pr-4 text-white placeholder-green-100/20 focus:outline-none transition-colors`}
                />
              </div>
              {error && <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>}
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#092212] rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-green-100/30">
            <a href="/" className="hover:text-amber-400 transition-colors">Return to Homepage</a>
          </div>
        </div>
      </div>
    </div>
  );
}
