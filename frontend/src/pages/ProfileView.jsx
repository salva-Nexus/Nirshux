// ProfileView.jsx
import React, { useState } from 'react';
import axios from 'axios';

const ProfileView = ({ userData, onRefresh, triggerNotification }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(userData.fullName);
  const [loading, setLoading] = useState(false);
  
  // Modal Controls
  const [activeModal, setActiveModal] = useState(null); 
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    oldEmail: '', 
    code: '', 
    newEmail: '', 
    newPassword: '', 
    confirmPassword: '' 
  });

  const closeModal = () => {
    setActiveModal(null);
    setStep(1);
    setLoading(false);
    setFormData({ oldEmail: '', code: '', newEmail: '', newPassword: '', confirmPassword: '' });
  };

  // --- IDENTITY LOGIC ---
  const handleUpdateName = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/investor/update-name', { fullName: newName }, { headers: { 'x-auth-token': token } });
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, fullName: newName };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setIsEditingName(false);
      onRefresh();
      triggerNotification("IDENTITY_SYNC_SUCCESS");
    } catch (err) { 
      triggerNotification("SYNC_ERROR"); 
    } finally {
      setLoading(false);
    }
  };

const requestEmailCode = async () => {
    // FIXED: No longer checking for newEmail here. 
    // We only need the current one to send the security code.
    if (!formData.oldEmail) return triggerNotification("ENTER_CURRENT_EMAIL");
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/investor/request-email-update', 
        { oldEmail: formData.oldEmail }, // Only sending old email
        { headers: { 'x-auth-token': token } }
      );
      setStep(2); 
      triggerNotification("CODE_DISPATCHED_TO_CURRENT_MAIL");
    } catch (err) { 
      triggerNotification(err.response?.data?.msg || "TRANSMISSION_FAILED"); 
    } finally {
      setLoading(false);
    }
};

  const verifyEmailCode = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Step 2: Check if code is valid before asking for new email
      await axios.post('http://localhost:5000/api/investor/verify-update-code', 
        { code: formData.code }, 
        { headers: { 'x-auth-token': token } }
      );
      setStep(3);
      triggerNotification("SECURITY_CLEARED_PROCEED");
    } catch (err) {
      triggerNotification("INVALID_OR_EXPIRED_CODE");
    } finally {
      setLoading(false);
    }
  };

  const finalizeEmailUpdate = async () => {
    if (!formData.newEmail) return triggerNotification("ENTER_NEW_EMAIL");
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/investor/confirm-email-update', 
        { code: formData.code, newEmail: formData.newEmail }, 
        { headers: { 'x-auth-token': token } }
      );

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, email: formData.newEmail.toLowerCase() };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      triggerNotification("EMAIL_UPDATED");
      closeModal();
      onRefresh();
    } catch (err) { 
      triggerNotification(err.response?.data?.msg || "UPDATE_ERROR"); 
    } finally {
      setLoading(false);
    }
  };

  // --- PASSWORD RESET PROTOCOL ---
  const requestPasswordCode = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email: userData.email });
      setStep(2);
      triggerNotification("RESET_CODE_SENT");
    } catch (err) { 
      triggerNotification("DISPATCH_ERROR"); 
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPasswordCode = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/verify-otp', { email: userData.email, code: formData.code });
      setStep(3);
      triggerNotification("SECURITY_CLEARED_PROCEED");
    } catch (err) {
      triggerNotification("INVALID_OR_EXPIRED_CODE");
    } finally {
      setLoading(false);
    }
  };

  const finalizePasswordReset = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      return triggerNotification("PASSWORDS_DO_NOT_MATCH");
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', { 
        email: userData.email, 
        password: formData.newPassword 
      });
      triggerNotification("PASSWORD_PROTOCOL_UPDATED");
      closeModal();
    } catch (err) { 
      triggerNotification("RESET_FAILED"); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl relative">
      <header className="mb-12">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic">ACCOUNT <span className="text-nirshux-accent">PROFILE</span></h1>
        <p className="text-gray-500 font-mono text-xs mt-2 uppercase">Member Since: {new Date(userData.createdAt).toLocaleDateString()}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Identity Protocol</label>
          <div className="flex items-center justify-between">
            {isEditingName ? (
              <div className="flex gap-2 w-full">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-black/40 border border-nirshux-accent/30 rounded-xl px-4 py-2 text-white outline-none w-full" />
                <button onClick={handleUpdateName} disabled={loading} className="text-nirshux-accent font-black text-xs uppercase italic disabled:opacity-50">
                   {loading ? "..." : "Save"}
                </button>
              </div>
            ) : (
              <><h2 className="text-2xl font-black italic text-white uppercase">{userData.fullName}</h2><button onClick={() => setIsEditingName(true)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 text-xl">✎</button></>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Communication Security</label>
          <div className="flex items-center justify-between mb-6">
            <p className="font-bold text-gray-200">{userData.email}</p>
            <button onClick={() => setActiveModal('email')} className="text-[10px] font-black bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white transition-all uppercase tracking-widest">Update</button>
          </div>
          <button onClick={() => { setActiveModal('password'); setStep(1); }} className="text-[10px] font-black text-nirshux-accent hover:text-white transition-colors uppercase italic">Request Password Reset →</button>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeModal}></div>
          <div className="relative bg-[#0A0A0A] border border-white/10 w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={closeModal} className="absolute top-6 right-8 text-gray-500 hover:text-white text-3xl">×</button>

            {activeModal === 'email' && (
              <div className="space-y-6">
                <h3 className="text-xl font-black italic uppercase">Update Email</h3>
                {step === 1 && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-gray-400 uppercase">Phase 1: Confirm Identity</p>
                    <input placeholder="Current Email Address" onChange={(e) => setFormData({...formData, oldEmail: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-nirshux-accent/50" />
                    <button onClick={requestEmailCode} disabled={loading} className="w-full py-4 bg-nirshux-accent text-black font-black rounded-2xl uppercase tracking-widest disabled:opacity-50">
                        {loading ? "Transmitting..." : "Generate Code"}
                    </button>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-nirshux-accent font-bold uppercase">Phase 2: Terminal Verification</p>
                    <input placeholder="Enter 6-Digit Code" maxLength={6} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full bg-white/5 border border-nirshux-accent/50 rounded-2xl px-5 py-4 text-center text-2xl font-mono tracking-[0.5em] text-white outline-none" />
                    <button onClick={verifyEmailCode} disabled={loading} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase tracking-widest disabled:opacity-50">
                        {loading ? "Verifying..." : "Verify & Proceed"}
                    </button>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-gray-400 uppercase">Phase 3: Update Protocol</p>
                    <input placeholder="New Email Address" onChange={(e) => setFormData({...formData, newEmail: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-nirshux-accent/50" />
                    <button onClick={finalizeEmailUpdate} disabled={loading} className="w-full py-4 bg-nirshux-accent text-black font-black rounded-2xl uppercase tracking-widest disabled:opacity-50">
                        {loading ? "Updating..." : "Confirm New Email"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeModal === 'password' && (
              <div className="space-y-6">
                <h3 className="text-xl font-black italic uppercase">Reset Password</h3>
                {step === 1 && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400 uppercase leading-relaxed text-center">System will dispatch a security code to {userData.email}</p>
                    <button onClick={requestPasswordCode} disabled={loading} className="w-full py-4 bg-nirshux-accent text-black font-black rounded-2xl uppercase tracking-widest disabled:opacity-50">
                        {loading ? "Sending..." : "Send Security Code"}
                    </button>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-nirshux-accent font-bold uppercase">Phase 2: Terminal Verification</p>
                    <input placeholder="000000" maxLength={6} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full bg-white/5 border border-nirshux-accent/50 rounded-2xl px-5 py-4 text-center text-2xl font-mono tracking-[0.5em] text-white outline-none" />
                    <button onClick={handleVerifyPasswordCode} disabled={loading} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase tracking-widest disabled:opacity-50">
                        {loading ? "Verifying..." : "Verify Access"}
                    </button>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-gray-400 uppercase">Phase 3: Secure Credential Rewrite</p>
                    <input type="password" placeholder="New Password" onChange={(e) => setFormData({...formData, newPassword: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none" />
                    <input type="password" placeholder="Confirm New Password" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none" />
                    <button onClick={finalizePasswordReset} disabled={loading} className="w-full py-4 bg-nirshux-accent text-black font-black rounded-2xl uppercase tracking-widest disabled:opacity-50">
                        {loading ? "Rewriting..." : "Rewrite Password"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;