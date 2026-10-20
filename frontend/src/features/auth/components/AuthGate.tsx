import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { SessionSplash } from './SessionSplash.js';
import { LoginScreen } from './LoginScreen.js';
import { ChangePasswordScreen } from './ChangePasswordScreen.js';
import { AuthSessionLocalRepository } from '../../../db/repositories/auth-session-local-repository.js';
import type { LocalAuthSession } from '../../../db/types.js';

export interface AuthGateProps {
  children: React.ReactNode | ((session: LocalAuthSession) => React.ReactNode);
  repo?: AuthSessionLocalRepository;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children, repo: customRepo }) => {
  const { status, session, login, changePassword, cancelMustChangePassword } = useAuth();
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  useEffect(() => {
    const repository = customRepo || new AuthSessionLocalRepository();
    repository.getSavedEmail().then((email) => {
      if (email) setSavedEmail(email);
    });
  }, [customRepo, status]);

  if (status === 'loading') {
    return <SessionSplash />;
  }

  if (status === 'unauthenticated') {
    return <LoginScreen onLogin={login} savedEmail={savedEmail} />;
  }

  if (status === 'must_change_password') {
    return (
      <ChangePasswordScreen
        onChangePassword={changePassword}
        onCancel={cancelMustChangePassword}
      />
    );
  }

  if (status === 'authenticated' && session) {
    if (typeof children === 'function') {
      return <>{children(session)}</>;
    }
    return <>{children}</>;
  }

  return <SessionSplash />;
};
