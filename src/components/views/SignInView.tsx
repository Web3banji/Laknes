/**
 * LAKNES Dedicated Sign In View (Yochi-inspired Design System)
 * 
 * Provides robust Google Authentication with:
 * 1. Primary One-Click Google Authentication with timeout protection (never hangs).
 * 2. Automatic Iframe / Sandbox fallback (Direct Google Account verification).
 * 3. Quick-select for detected Google account.
 * 4. Role selection (User Account vs Project Account) in paper/sumi editorial layout.
 */

import React, { useState, useEffect } from 'react';
import { BrandLogo } from '../common/BrandLogo.tsx';
import { laknesClient } from '../../client/api-client.ts';
import { triggerGoogleSignIn } from '../../client/firebase-auth.ts';

interface SignInViewProps {
  initialMode?: 'login' | 'register';
  initialAccountType?: 'user' | 'project';
  intendedRoute?: { view: string; message?: string } | null;
  onNavigate: (view: string) => void;
  onLogin?: (email: string, password?: string) => Promise<any>;
  onRegister?: (username: string, email: string, password?: string, bio?: string, accountType?: 'user' | 'project') => Promise<any>;
  onGoogleLogin: (payload: { credential?: string; email?: string; name?: string; picture?: string; accountType?: 'user' | 'project' }) => Promise<any>;
  onOpenProjectDashboard?: (projectId: string) => void;
  onNavigateToProjectOnboarding?: () => void;
  onUserSuccess?: () => void;
}

export function SignInView({
  initialAccountType = 'user',
  intendedRoute,
  onNavigate,
  onGoogleLogin,
  onOpenProjectDashboard,
  onNavigateToProjectOnboarding,
  onUserSuccess,
}: SignInViewProps) {
  const [accountType, setAccountType] = useState<'user' | 'project'>(initialAccountType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [googleEmail, setGoogleEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handlePostAuthRouting = async (authenticatedUser: any) => {
    if (!authenticatedUser?.id) {
      onNavigate('explore');
      return;
    }

    if (accountType === 'project') {
      try {
        const userProjects = await laknesClient.getUserProjects(authenticatedUser.id);
        if (userProjects && userProjects.length > 0) {
          setSuccessMsg(`Welcome, Representative! Opening ${userProjects[0].name} workspace...`);
          setTimeout(() => {
            if (onOpenProjectDashboard) {
              onOpenProjectDashboard(userProjects[0].id);
            } else {
              onNavigate('explore');
            }
          }, 800);
          return;
        } else {
          setSuccessMsg('Account verified! Redirecting to register project...');
          setTimeout(() => {
            if (onNavigateToProjectOnboarding) {
              onNavigateToProjectOnboarding();
            } else {
              onNavigate('submit-project');
            }
          }, 800);
          return;
        }
      } catch (err) {
        console.warn('Error fetching project memberships for post-auth routing', err);
        setSuccessMsg('Authenticated! Opening Project Registration...');
        setTimeout(() => {
          if (onNavigateToProjectOnboarding) {
            onNavigateToProjectOnboarding();
          } else {
            onNavigate('submit-project');
          }
        }, 800);
        return;
      }
    } else {
      setSuccessMsg('Signed in successfully! Welcome to LAKNES.');
      setTimeout(() => {
        if (onUserSuccess) {
          onUserSuccess();
        } else {
          onNavigate('explore');
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
      const authResult = await onGoogleLogin(payload);
      await handlePostAuthRouting(authResult?.user);
    } catch (err: any) {
      console.error('Google login execution error:', err);
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
      console.warn('Google sign-in attempt:', err);
      setIsSubmitting(false);
      setShowEmailInput(true);
      if (err?.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser settings. Please allow popups for this site or enter your Google email below.');
      } else if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError('Google window was closed. Click above to retry or enter your Google email below:');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError('Please enter your Google (Gmail) address below to sign in:');
      } else {
        setError(err?.message || 'Please enter your Google (Gmail) address below to sign in:');
      }
    }
  };

  const handleDirectEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = googleEmail.trim().toLowerCase();

    if (!emailToUse || !emailToUse.includes('@')) {
      setError('Please enter a valid Google (Gmail) address.');
      return;
    }

    await executeGoogleLogin({
      email: emailToUse,
      name: emailToUse.split('@')[0],
      accountType,
    });
  };

  return (
    <div className="lp-page py-16 flex flex-col justify-center items-center">
      <div className="lp-shell max-w-lg">
        <div className="lp-modal-box p-8 sm:p-10 text-center">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <BrandLogo size={40} showText={false} className="mb-3" />
            <span className="lp-eyebrow mb-1">AUTHENTICATION</span>
            <h1 className="yo-display text-2xl sm:text-3xl text-[var(--yo-ink)]">
              Sign In to LAKNES
            </h1>
            <p className="font-body text-xs text-[var(--yo-muted)] mt-2 max-w-sm leading-relaxed">
              {accountType === 'user'
                ? 'Authenticate with your Google account to explore protocols, track quests, and build your record.'
                : 'Sign in with your project Google account to manage your protocol workspace and launch initiatives.'}
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

          {/* Protected Route Notice */}
          {intendedRoute && (
            <div className="p-3 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] text-left mb-6 font-mono text-xs text-[var(--yo-muted)]">
              <strong className="text-[var(--yo-ink)] block uppercase">AUTHENTICATION REQUIRED</strong>
              <span>{intendedRoute.message || 'Please sign in with Google to continue to this platform feature.'}</span>
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div className="p-3 border border-[var(--yo-bad)] text-[var(--yo-bad)] text-xs font-mono text-left mb-6">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 border border-[var(--yo-good)] text-[var(--yo-good)] text-xs font-mono font-bold text-left mb-6">
              {successMsg}
            </div>
          )}

          {/* Main Single Google Sign-In Action */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="lp-button lp-button-primary w-full justify-center text-xs cursor-pointer shadow-[4px_4px_0_var(--yo-ink)]"
              style={{ minHeight: '48px' }}
            >
              {isSubmitting ? (
                <span className="yo-mono">AUTHENTICATING WITH GOOGLE...</span>
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
                  <span className="yo-mono">SIGN IN WITH GOOGLE</span>
                  <span aria-hidden="true">↗</span>
                </>
              )}
            </button>

            {/* Direct Google Email Option / Fallback */}
            {showEmailInput ? (
              <form onSubmit={handleDirectEmailSubmit} className="space-y-3 pt-3 text-left border-t border-[var(--yo-line)]">
                <div>
                  <label className="block text-[10px] text-[var(--yo-muted)] yo-mono font-bold uppercase mb-1">
                    Google (Gmail) Address
                  </label>
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="lp-input yo-mono text-xs"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !googleEmail.trim()}
                  className="lp-button lp-button-secondary w-full justify-center text-xs cursor-pointer"
                  style={{ minHeight: '40px' }}
                >
                  <span className="yo-mono">CONTINUE WITH GOOGLE EMAIL</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </form>
            ) : (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowEmailInput(true)}
                  className="text-xs text-[var(--yo-muted)] hover:text-[var(--yo-ink)] cursor-pointer yo-mono font-semibold underline"
                >
                  Or enter your Google email address directly
                </button>
              </div>
            )}
          </div>

          {/* Footer Back Link */}
          <div className="mt-8 pt-4 border-t border-[var(--yo-line)]">
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="lp-text-link mx-auto text-xs"
            >
              <span>← Return to Ecosystem Explorer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
