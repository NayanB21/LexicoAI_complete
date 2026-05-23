import { useState } from 'react';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function Login({ onLogin, onSwitchToRegister, isLoading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };



  return (
    <div className="relative w-full max-w-md p-8 rounded-[2rem] bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 shadow-[0_0_40px_rgba(59,130,246,0.1)] overflow-hidden animate-in fade-in zoom-in duration-500">
      
      {/* Abstract Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/30 blur-[50px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/10 text-blue-400 mb-4 ring-1 ring-blue-500/20">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-400 text-sm">Sign in to continue your Lexico AI sessions</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center animate-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
              <Mail size={18} />
            </div>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-gray-700/50 text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-600"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
              <Lock size={18} />
            </div>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-gray-700/50 text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-600"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button 
          type="submit" disabled={isLoading}
          className="group relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-blue-500/25 mt-6"
        >
          {isLoading ? 'Authenticating...' : 'Sign In'}
          {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
        </button>
      </form>

      <div className="mt-8 text-center relative z-10">
        <p className="text-gray-400 text-sm">
          Don't have an account?{' '}
          <button 
            onClick={onSwitchToRegister}
            className="text-blue-400 font-medium hover:text-blue-300 transition-colors hover:underline underline-offset-4"
          >
            Create one now
          </button>
        </p>
      </div>
    </div>
  );
}