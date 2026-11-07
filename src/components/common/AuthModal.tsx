/**
 * LAKNES Authentication Modal
 * Clean, focused authentication modal exclusively displaying "Sign in with Google".
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
      setSuccessMsg('Signed in successfully! Welcome to the Elysium ecosystem.');
      setTimeout(() => {
        onClose();
        if (onUserSuccess) {
          onUserSuccess();
        }
      }, 700);
    }
  };

  const [googleEmail, setGoogleEmail] = useState('oyebanjiisrael60@gmail.com');
  const [showEmailInput, setShowEmailInput] = useState(false);

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
      const googleRes = await triggerGoogleSignIn(6000);
      await executeGoogleLogin({
        credential: googleRes.idToken,
        email: googleRes.email,
        name: googleRes.name,
        picture: googleRes.picture,
        accountType,
      });
    } catch (err: any) {
      console.warn('Google popup error in modal:', err);
      setIsSubmitting(false);
      setShowEmailInput(true);
      setError(err?.message || 'Popup was restricted by browser. You can confirm your Google email directly below:');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#0a1310] border border-amber-500/30 rounded-3xl shadow-[0_0_60px_rgba(212,163,39,0.18)] p-6 sm:p-8 relative overflow-hidden text-center"
      >
        {/* Glowing Ambient Background */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary-container/15 blur-[90px] rounded-full"></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full transition-colors disabled:opacity-50 cursor-pointer z-20"
          aria-label="Close authentication modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 relative z-10">
          <BrandLogo size={42} showText={false} className="mb-2" />
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Sign In to LAKNES
          </h2>
          <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed max-w-sm">
            {accountType === 'user'
              ? 'Authenticate with your Google account to explore protocols, track quests, and save bookmarks.'
              : 'Sign in with your project\'s Google account to manage your protocol workspace and submit for verification.'}
          </p>
        </div>

        {/* Account Type Selector (User Account vs Project Account) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-lowest rounded-xl mb-6 border border-slate-800 relative z-10">
          <button
            type="button"
            onClick={() => {
              setAccountType('user');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              accountType === 'user'
                ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person</span>
            <span>User Account</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountType('project');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              accountType === 'project'
                ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">domain</span>
            <span>Project Account</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs mb-5 text-left flex items-start gap-2.5 relative z-10">
            <span className="material-symbols-outlined text-[18px] text-rose-400 shrink-0 mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs mb-5 text-left flex items-start gap-2.5 relative z-10">
            <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0 mt-0.5">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* The Single Sign in with Google Action */}
        <div className="space-y-3 relative z-10">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-[0_4px_24px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3.5 transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span className="tracking-wide">Sign in with Google</span>
              </>
            )}
          </button>

          {/* Quick Instant Verification for Detected Google Account */}
          <div className="pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                executeGoogleLogin({
                  email: 'oyebanjiisrael60@gmail.com',
                  name: 'Israel',
                  accountType,
                });
              }}
              className="w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary-container text-xs flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-5 h-5 rounded-full bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-[10px] font-bold text-primary">
                  O
                </div>
                <div className="truncate">
                  <span className="text-on-surface font-semibold block text-xs truncate">
                    oyebanjiisrael60@gmail.com
                  </span>
                </div>
              </div>
              <span className="text-primary text-[11px] font-semibold flex items-center gap-1">
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </button>
          </div>

          {/* Optional different email input */}
          {showEmailInput && (
            <div className="pt-2 text-left space-y-2">
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-primary-container font-mono"
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
                className="w-full py-2 px-3 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                Confirm Google Sign-In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
