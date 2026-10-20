import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthContext.js';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider>.');
  }
  return context;
}
