import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthError {
  message: string;
  code: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: AuthError | null;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Configurar persistência ao inicializar
  useEffect(() => {
    const setupAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error('Erro ao configurar persistência:', error);
      }
    };
    setupAuth();
  }, []);

  function signup(email: string, password: string) {
    setError(null);
    setLoading(true);
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Additional setup for new user if needed
      })
      .catch((error) => {
        setError({ message: error.message, code: error.code });
        throw error;
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function login(email: string, password: string) {
    setError(null);
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, password)
      .catch((error) => {
        setError({ message: error.message, code: error.code });
        throw error;
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function logout() {
    setError(null);
    setLoading(true);
    return signOut(auth)
      .catch((error) => {
        setError({ message: error.message, code: error.code });
        throw error;
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      try {
        setCurrentUser(user);
        setInitialized(true);
      } catch (error) {
        console.error('Erro ao atualizar estado do usuário:', error);
        setError({ 
          message: 'Erro ao atualizar estado do usuário', 
          code: 'auth/state-error' 
        });
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loading,
    error,
    initialized
  };

  return (
    <AuthContext.Provider value={value}>
      {initialized ? children : (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando aplicação...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}