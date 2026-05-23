import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoginView, setIsLoginView] = useState(true);
const [user, setUser] = useState(null);


  // NAYA: FastAPI ke error objects ko normal string mein badalne wala helper
  const formatError = (data) => {
    if (data.detail) {
      if (Array.isArray(data.detail)) {
        // Agar 422 validation error hai, toh pehla error message dikhao
        return data.detail[0].msg; 
      }
      if (typeof data.detail === 'string') {
        // Agar humara custom error hai (jaise "Invalid password")
        return data.detail;
      }
    }
    return "Something went wrong!";
  };

useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) return;
      try {
        const response = await fetch("http://localhost:8000/api/auth/me", {
          headers: { 
            "Authorization": `Bearer ${token}` 
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Agar token expire ho gaya toh logout kar do
          logout();
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    };

    fetchUserProfile();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        alert("Login successful!");
        return { success: true };
      } else {
        // 🔥 ERROR FIX YAHAN HAI
        return { success: false, error: formatError(data) };
      }
    } catch (error) {
      return { success: false, error: "Network error. Is backend running?" };
    }
  };

  const register = async (name, email, password, onSwitchToLogin) => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
           return { success: true,
              message: "Registration successful! Please login." };
            
      } else {
        // 🔥 ERROR FIX YAHAN HAI
        return { success: false, error: formatError(data) };
      }
    } catch (error) {
      return { success: false, error: "Network error. Is backend running?" };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return { token,user, isLoginView, setIsLoginView, login, register, logout };
};