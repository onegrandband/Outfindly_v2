import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  generateRandomAccountCode,
  SECURITY_QUESTIONS,
} from '../services/accountSync.js';
import {
  XIcon,
  CloudIcon,
  DeviceIcon,
  CheckIcon,
  ShieldIcon,
  AlertIcon,
  CopyIcon,
  RefreshIcon,
  FolderIcon,
} from './Icons.jsx';
import { CustomDropdown } from './CustomDropdown.jsx';

export function AuthModal({ isOpen, onClose, onLoggedIn }) {
  const {
    user,
    signInWithGoogle,
    signInWithCode,
    registerWithCode,
    signOut,
    error,
    clearError,
  } = useAuth();

  // Mode: 'code-login' | 'code-create' | 'google'
  const [activeTab, setActiveTab] = useState('code-create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Registration state
  const [generatedCode, setGeneratedCode] = useState(() => generateRandomAccountCode());
  const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [registerAnswer, setRegisterAnswer] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  // Login state
  const [loginCode, setLoginCode] = useState('');
  const [loginAnswer, setLoginAnswer] = useState('');

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleGenerateNewCode = () => {
    setGeneratedCode(generateRandomAccountCode());
    setCodeCopied(false);
  };

  const handleCodeRegister = async (e) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!registerAnswer.trim()) {
      setFormError('Please enter an answer for your security question.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerWithCode(generatedCode, selectedQuestion, registerAnswer.trim());
      if (onLoggedIn) onLoggedIn();
      onClose();
    } catch (err) {
      setFormError(err.message || 'Could not create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeLogin = async (e) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!loginCode.trim()) {
      setFormError('Please enter your account code.');
      return;
    }
    if (!loginAnswer.trim()) {
      setFormError('Please enter your security question answer.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithCode(loginCode.trim(), loginAnswer.trim());
      if (onLoggedIn) onLoggedIn();
      onClose();
    } catch (err) {
      setFormError(err.message || 'Could not sign in with this code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setFormError(null);
    clearError();
    try {
      await signInWithGoogle();
      if (onLoggedIn) onLoggedIn();
      onClose();
    } catch (err) {
      setFormError(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const questionOptions = SECURITY_QUESTIONS.map((q) => ({
    value: q,
    label: q,
  }));

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md my-auto bg-[#12161f] border border-[#2d333b] rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b949e] hover:text-white p-1 rounded-lg hover:bg-[#1f2937] transition-colors cursor-pointer"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#1e293b] border border-[#334155] flex items-center justify-center text-sky-400 shrink-0">
            <CloudIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">
              {user ? 'Account & Cross-Device Sync' : 'Cross-Device Account Sync'}
            </h3>
            <p className="text-xs text-[#8b949e]">
              Sync avatars, searches & maker looks between PC, iPad & mobile
            </p>
          </div>
        </div>

        {/* Error message */}
        {(formError || error) && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <AlertIcon className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="flex-1">{formError || error}</span>
          </div>
        )}

        {/* If ALREADY SIGNED IN */}
        {user ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-[#161b22] border border-[#21262d] rounded-xl flex items-center gap-3">
              {user.isCodeAccount ? (
                <div className="w-11 h-11 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 font-bold flex items-center justify-center text-base shrink-0">
                  <ShieldIcon className="w-5 h-5" />
                </div>
              ) : user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-11 h-11 rounded-full border border-sky-500/30 object-cover shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-sky-950 text-sky-400 font-bold flex items-center justify-center text-base shrink-0">
                  {(user.displayName || 'U')[0].toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {user.displayName || 'Robloxian'}
                </p>
                {user.code && (
                  <p className="text-[11px] font-mono text-sky-400">
                    Code: {user.code}
                  </p>
                )}
                {user.email && (
                  <p className="text-[11px] text-[#8b949e] truncate">{user.email}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>Cloud Sync Active (Firestore)</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl text-xs text-[#8b949e] space-y-1.5">
              <p className="text-[#c9d1d9] font-medium">Synced Across Devices:</p>
              <p>• All uploaded files & wardrobe in Avatar Saver (/save)</p>
              <p>• Recent Roblox player searches</p>
              <p>• Custom avatar creations in Avatar Maker (/creator)</p>
              <p>• Bio expand preferences</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
              <button
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* NOT SIGNED IN: TABBED UI */
          <div className="space-y-4">
            {/* Tab switchers */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#090d13] border border-[#2d333b] rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('code-create');
                  setFormError(null);
                }}
                className={`py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === 'code-create'
                    ? 'bg-[#1f2937] text-white shadow-sm border border-[#374151]'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                New Random Code
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('code-login');
                  setFormError(null);
                }}
                className={`py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === 'code-login'
                    ? 'bg-[#1f2937] text-white shadow-sm border border-[#374151]'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                Sign In With Code
              </button>
            </div>

            {/* TAB 1: CREATE ACCOUNT WITH RANDOM CODE */}
            {activeTab === 'code-create' && (
              <form onSubmit={handleCodeRegister} className="space-y-3.5">
                <div className="p-3 bg-[#161b22] border border-[#2d333b] rounded-xl">
                  <div className="flex items-center justify-between text-xs text-[#8b949e] mb-1.5">
                    <span>Generated Access Code:</span>
                    <button
                      type="button"
                      onClick={handleGenerateNewCode}
                      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 text-[11px] font-semibold cursor-pointer"
                    >
                      <RefreshIcon className="w-3 h-3" />
                      <span>Reroll</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2 bg-[#090d13] border border-[#30363d] rounded-lg">
                    <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wider select-all">
                      {generatedCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] rounded-md text-xs text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {codeCopied ? (
                        <>
                          <CheckIcon className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#8b949e] mt-1.5">
                    Save this code! Enter it on your iPad, tablet, or phone to sync everything.
                  </p>
                </div>

                {/* Security Question */}
                <div>
                  <label className="block text-xs font-semibold text-[#c9d1d9] mb-1">
                    Choose Security Question:
                  </label>
                  <CustomDropdown
                    value={selectedQuestion}
                    onChange={setSelectedQuestion}
                    options={questionOptions}
                    className="w-full"
                    buttonClassName="w-full py-2 bg-[#090d13] border-[#2d333b] text-left text-xs"
                  />
                </div>

                {/* Security Question Answer */}
                <div>
                  <label className="block text-xs font-semibold text-[#c9d1d9] mb-1">
                    Your Secret Answer:
                  </label>
                  <input
                    type="text"
                    value={registerAnswer}
                    onChange={(e) => setRegisterAnswer(e.target.value)}
                    placeholder="e.g. Work at a Pizza Place"
                    className="w-full px-3 py-2 bg-[#090d13] border border-[#2d333b] focus:border-sky-500 rounded-lg text-xs text-white placeholder-[#6e7681] outline-none"
                    required
                  />
                  <p className="text-[10px] text-[#8b949e] mt-1">
                    Case-insensitive. Used to verify your identity when logging in on other devices.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !registerAnswer.trim()}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldIcon className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'Creating & Syncing...' : 'Create Account & Enable Cloud Sync'}
                  </span>
                </button>
              </form>
            )}

            {/* TAB 2: SIGN IN WITH EXISTING CODE */}
            {activeTab === 'code-login' && (
              <form onSubmit={handleCodeLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#c9d1d9] mb-1">
                    Your Account Code:
                  </label>
                  <input
                    type="text"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value)}
                    placeholder="e.g. RBX-7K9P-4M2Q"
                    className="w-full px-3 py-2 bg-[#090d13] border border-[#2d333b] focus:border-sky-500 rounded-lg text-xs font-mono text-white placeholder-[#6e7681] outline-none uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#c9d1d9] mb-1">
                    Security Question Answer:
                  </label>
                  <input
                    type="text"
                    value={loginAnswer}
                    onChange={(e) => setLoginAnswer(e.target.value)}
                    placeholder="Answer to your chosen question"
                    className="w-full px-3 py-2 bg-[#090d13] border border-[#2d333b] focus:border-sky-500 rounded-lg text-xs text-white placeholder-[#6e7681] outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !loginCode.trim() || !loginAnswer.trim()}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <DeviceIcon className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying & Syncing...' : 'Sign In & Sync to This Device'}</span>
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#21262d]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#12161f] px-2 text-[#8b949e]">Or Google</span>
              </div>
            </div>

            {/* Google alternative */}
            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-2 px-3 bg-[#161b22] hover:bg-[#21262d] border border-[#2d333b] text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>

            <p className="text-[10px] text-center text-[#8b949e]">
              No account required for local browsing — IndexedDB and LocalStorage keep everything ready on this device.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
