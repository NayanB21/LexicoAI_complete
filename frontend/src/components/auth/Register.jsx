import { useState } from 'react';
import { User, Mail, Lock, ArrowRight, Hexagon } from 'lucide-react';

export default function Register({ onRegister, onSwitchToLogin, isLoading, error }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit =async  (e) => {
    e.preventDefault();
    // onRegister(name, email, password,onSwitchToLogin);
      const result = await onRegister(
    name,
    email,
    password
  );
      if(result.success){

    alert(result.message);

    onSwitchToLogin();

  }
  };

  return (
    <div className="relative w-full max-w-md p-8 rounded-[2rem] bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 shadow-[0_0_40px_rgba(168,85,247,0.1)] overflow-hidden animate-in fade-in zoom-in duration-500">
      
      {/* Abstract Background Glow (Purple) */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-500/10 text-purple-400 mb-4 ring-1 ring-purple-500/20">
          <Hexagon className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
          Join Lexico AI
        </h1>
        <p className="text-gray-400 text-sm">Create an account to start your journey</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center animate-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors">
              <User size={18} />
            </div>
            <input 
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-gray-700/50 text-white rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder-gray-600"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors">
              <Mail size={18} />
            </div>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-gray-700/50 text-white rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder-gray-600"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors">
              <Lock size={18} />
            </div>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-gray-700/50 text-white rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder-gray-600"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button 
          type="submit" disabled={isLoading}
          className="group relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-purple-500/25 mt-6"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
          {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
        </button>
      </form>

      <div className="mt-8 text-center relative z-10">
        <p className="text-gray-400 text-sm">
          Already have an account?{' '}
          <button 
            onClick={onSwitchToLogin}
            className="text-purple-400 font-medium hover:text-purple-300 transition-colors hover:underline underline-offset-4"
          >
            Log in here
          </button>
        </p>
      </div>
    </div>
  );
}