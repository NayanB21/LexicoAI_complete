import React, { useState, useEffect } from 'react';
import { LogOut, User, Mail, Shield, Save, X, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';

const TabAccount = ({ auth }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Naya state data store karne ke liye
  const [userData, setUserData] = useState(auth?.user || null);
  
  const [formData, setFormData] = useState({
    name: '',
    current_password: '',
    new_password: ''
  });

  // Jab component mount ho, tab user data check ya fetch karo
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:8000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (response.ok) {
          setUserData(data);
          setFormData(prev => ({ ...prev, name: data.name || '' }));
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    if (auth?.user) {
      setUserData(auth.user);
      setFormData(prev => ({ ...prev, name: auth.user.name || '' }));
    } else {
      // Agar props se data nahi aaya, toh backend se fetch maar lo
      fetchUserData();
    }
  }, [auth]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:8000/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name !== userData?.name ? formData.name : null,
          current_password: formData.current_password || null,
          new_password: formData.new_password || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        setFormData(prev => ({ ...prev, current_password: '', new_password: '' }));
        // Update local UI state immediately
        setUserData(prev => ({ ...prev, name: formData.name }));
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Backend not responding.' });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-4 pr-12">
        <h3 className="text-xl font-semibold text-white">Account Details</h3>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
          >
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <button 
            onClick={() => {
              setIsEditing(false);
              setMessage({ type: '', text: '' });
              setFormData(prev => ({ ...prev, name: userData?.name || '', current_password: '', new_password: '' }));
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-all"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
        
        {/* Name Field */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">Full Name</p>
            {isEditing ? (
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            ) : (
              <p className="text-lg text-white font-medium">{userData?.name || "Loading..."}</p>
            )}
          </div>
        </div>

        {/* Email Field (Non-editable generally for security) */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Email Address</p>
            <p className="text-lg text-white font-medium">{userData?.email || "Loading..."}</p>
          </div>
        </div>

        {/* Password Change Section (Only visible when editing) */}
        {isEditing && (
          <div className="pt-4 border-t border-white/10 space-y-4">
            <h4 className="text-sm font-semibold text-gray-300">Change Password (Optional)</h4>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-3">
                <input 
                  type="password" 
                  name="current_password"
                  placeholder="Current Password"
                  value={formData.current_password}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <input 
                  type="password" 
                  name="new_password"
                  placeholder="New Password"
                  value={formData.new_password}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Action Buttons */}
      {isEditing ? (
        <button 
          onClick={handleUpdate}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
        </button>
      ) : (
        <button 
          onClick={auth?.logout} 
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 p-3 rounded-xl font-medium transition-all border border-red-500/20"
        >
          <LogOut className="w-5 h-5" />
          Log Out Securely
        </button>
      )}
    </div>
  );
};

export default TabAccount;