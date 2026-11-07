/**
 * LAKNES Authentication Modal (Yochi Editorial Design System)
 * Clean, focused authentication modal in paper/sumi aesthetic.
 * Supports both User and Project Account modes with instant Google OAuth approval.
 */

import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo.tsx';
import { laknesClient } from '../../client/api-client.ts';
import { triggerGoogleSignIn } from '../../client/firebase-auth.ts';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  initialAccountType?: 'user' | 'project';
  onClose: () => void;
  onLogin?: (email: string, password?: string) => Promise<any>;
  onRegister?: (username: string, email: string, password?: string, bio?: string, accountType?: 'user' | 'project') => Promise<any>;
  onGoogleLogin?: (payload: { credential?: string; email?: string; name?: string; picture?: string; accountType?: 'user' | 'project' }) => Promise<any>;
  onOpenProjectDashboard?: (projectId: string) => void;
  onNavigateToProjectOnboarding?: () => void;
  onUserSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  initialAccountType = 'user',
  onClose,
  onGoogleLogin,
  onOpenProjectDashboard,
  onNavigateToProjectOnboarding,
  onUserSuccess,
}: AuthModalProps) {
  const [accountType, setAccountType] = useState<'user' | 'project'>(initialAccountType);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [googleEmail, setGoogleEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAccountType(initialAccountType);
      setError(null);
      setSuccessMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialAccountType]);

  if (!isOpen) return null;

  const handlePostAuthRouting = async (authenticatedUser: any) => {
    if (!authenticatedUser?.id) {
      setTimeout(() => onClose(), 600);
      return;
    }

    if (accountType === 'project') {
      try {
        const userProjects = await laknesClient.getUserProjects(authenticatedUser.id);
        if (userProjects && userProjects.length > 0) {
          setSuccessMsg(`Welcome, Representative! Opening ${userProjects[0].name} workspace...`);
          setTimeout(() => {
            onClose();
            if (onOpenProjectDashboard) {
              onOpenProjectDashboard(userProjects[0].id);
            }
          }, 800);
          return;
        } else {
          setSuccessMsg('Account verified! Redirecting to create your Project Profile...');
          setTimeout(() => {
            onClose();
            if (onNavigateToProjectOnboarding) {
              onNavigateToProjectOnboarding();
            }
          }, 800);
          return;
        }
      } catch (err) {
        console.warn('Error fetching project memberships for post-auth routing', err);
        setSuccessMsg('Authenticated! Opening Project Registration...');
        setTimeout(() => {
          onClose();
          if (onNavigateToProjectOnboarding) {
            onNavigateToProjectOnboarding();
          }
        }, 800);
        return;
      }
    } else {
      setSuccessMsg('Signed in successfully! Welcome to LAKNES.');
      setTimeout(() => {
        onClose();
        if (onUserSuccess) {
          onUserSuccess();
        }
      }, 700);
    }
  };

  const executeGoogleLogin = async (payload: {
    credential?: string;
    email?: string;
    name?: string;
    picture?: string;
    accountType?: 'user' | 'project';
  }) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let authResult: any;
      if (onGoogleLogin) {
        authResult = await onGoogleLogin(payload);
      } else {
        authResult = await laknesClient.authenticateWithGoogle(payload);
      }
      await handlePostAuthRouting(authResult?.user);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err?.message || 'Authentication failed. Please verify your Google account email.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const googleRes = await triggerGoogleSignIn();
      await executeGoogleLogin({
        credential: googleRes.idToken,
        email: googleRes.email,
        name: googleRes.name,
        picture: googleRes.picture,
        accountType,
      });
    } catch (err: any) {
      console.warn('Google sign-in in modal:', err);
      setIsSubmitting(false);
      setShowEmailInput(true);
      if (err?.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser settings. Please allow popups or enter your Google email below.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setError('Google window was closed. Click above to retry or enter your Google email below:');
      } else {
        setError(err?.message || 'Please enter your Google (Gmail) address below to continue:');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md lp-modal-box p-6 sm:p-8 relative text-center"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1 border border-[var(--yo-line)] hover:border-[var(--yo-ink)] transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <BrandLogo size={36} showText={false} className="mb-2" />
          <span className="lp-eyebrow mb-1">AUTHENTICATION</span>
          <h2 className="yo-display text-2xl text-[var(--yo-ink)]">
            Sign In to LAKNES
          </h2>
          <p className="font-body text-xs text-[var(--yo-muted)] mt-1.5 leading-relaxed max-w-sm">
            {accountType === 'user'
              ? 'Authenticate with your Google account to explore protocols, track quests, and save bookmarks.'
              : 'Sign in with your project Google account to manage your protocol workspace and submit for verification.'}
          </p>
        </div>

        {/* Account Type Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] mb-6 font-mono text-[10px] font-bold uppercase">
          <button
            type="button"
            onClick={() => {
              setAccountType('user');
              setError(null);
            }}
            className={`py-2 px-3 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              accountType === 'user'
                ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)]'
                : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">person</span>
            <span>USER ACCOUNT</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountType('project');
              setError(null);
            }}
            className={`py-2 px-3 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              accountType === 'project'
                ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)]'
                : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">domain</span>
            <span>PROJECT ACCOUNT</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3 border border-[var(--yo-bad)] text-[var(--yo-bad)] text-xs font-mono mb-5 text-left">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 border border-[var(--yo-good)] text-[var(--yo-good)] text-xs font-mono font-bold mb-5 text-left">
            {successMsg}
          </div>
        )}

        {/* Google Sign-in */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="lp-button w-full justify-center text-xs"
            style={{ minHeight: '44px' }}
          >
            {isSubmitting ? (
              <span>CONNECTING WITH GOOGLE...</span>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>SIGN IN WITH GOOGLE</span>
                <span aria-hidden="true">↗</span>
              </>
            )}
          </button>

          {/* Fallback input */}
          {showEmailInput && (
            <div className="pt-2 text-left space-y-2">
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="lp-input font-mono"
              />
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (googleEmail.includes('@')) {
                    executeGoogleLogin({
                      email: googleEmail.trim().toLowerCase(),
                      name: googleEmail.split('@')[0],
                      accountType,
                    });
                  }
                }}
                className="lp-button lp-button-primary w-full justify-center text-xs"
                style={{ minHeight: '38px', padding: '6px 14px' }}
              >
                <span>CONFIRM GOOGLE SIGN-IN</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
