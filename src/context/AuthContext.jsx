import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
} from '../services/firebase.js';
import {
  getActiveCodeAccount,
  setActiveCodeAccount,
  loginWithCode,
  createCodeAccount,
} from '../services/accountSync.js';

const AuthContext = createContext({
  user: null,
  codeAccount: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithCode: async () => {},
  registerWithCode: async () => {},
  signOut: async () => {},
  error: null,
  clearError: () => {},
});

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [codeAccount, setCodeAccount] = useState(() => getActiveCodeAccount());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Merged user object: either code account, firebaseUser, or null
  const user = firebaseUser
    ? {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        isGoogle: true,
      }
    : codeAccount
    ? {
        uid: codeAccount.code,
        code: codeAccount.code,
        displayName: codeAccount.displayName || `Account ${codeAccount.code}`,
        isCodeAccount: true,
        securityQuestion: codeAccount.securityQuestion,
      }
    : null;

  const handleSignInWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  const handleSignInWithCode = async (code, securityAnswer) => {
    setError(null);
    try {
      const account = await loginWithCode(code, securityAnswer);
      setCodeAccount(account);
      return account;
    } catch (err) {
      console.error('Code Sign-in failed:', err);
      setError(err.message || 'Failed to sign in with code');
      throw err;
    }
  };

  const handleRegisterWithCode = async (code, securityQuestion, securityAnswer) => {
    setError(null);
    try {
      const account = await createCodeAccount(code, securityQuestion, securityAnswer);
      setCodeAccount(account);
      return account;
    } catch (err) {
      console.error('Code Registration failed:', err);
      setError(err.message || 'Failed to register account');
      throw err;
    }
  };

  const handleSignOut = async () => {
    setError(null);
    try {
      if (firebaseUser) {
        await firebaseSignOut(auth);
      }
      setActiveCodeAccount(null);
      setCodeAccount(null);
    } catch (err) {
      console.error('Sign-out failed:', err);
      setError(err.message || 'Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        codeAccount,
        loading,
        signInWithGoogle: handleSignInWithGoogle,
        signInWithCode: handleSignInWithCode,
        registerWithCode: handleRegisterWithCode,
        signOut: handleSignOut,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
