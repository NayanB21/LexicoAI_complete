import { useState } from 'react';
import Login from './Login';
import Register from './Register';

export default function AuthScreen({ auth }) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email, password) => {
    setError('');
    setIsLoading(true);
    const result = await auth.login(email, password);
    if (!result.success) setError(result.error);
    setIsLoading(false);
  };

  const handleRegister = async (name, email, password) => {
    setError('');
    setIsLoading(true);
    const result = await auth.register(name, email, password);
    if (!result.success) setError(result.error);
    setIsLoading(false);
    return result;
  };

  return (
    // Premium dark background with deep mesh gradient feel
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0B0F19] overflow-hidden font-sans">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none"></div>
      
      {/* Container that renders either Login or Register */}
      <div className="relative z-10 w-full px-4 flex justify-center">
        {auth.isLoginView ? (
          <Login 
            onLogin={handleLogin} 
            onSwitchToRegister={() => { setError(''); auth.setIsLoginView(false); }} 
            isLoading={isLoading} 
            error={error} 
          />
        ) : (
          <Register 
            onRegister={handleRegister} 
            onSwitchToLogin={() => { setError(''); auth.setIsLoginView(true); }} 
            isLoading={isLoading} 
            error={error} 
          />
        )}
      </div>

    </div>
  );
}