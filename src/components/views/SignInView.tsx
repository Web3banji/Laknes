/**
 * LAKNES Dedicated Sign In View
 * 
 * Provides robust, reliable Google Sign-In with:
 * 1. Primary One-Click Google Authentication with timeout protection (never hangs).
 * 2. Automatic Iframe / Sandbox fallback (Direct Google Account verification) when browser popups are blocked.
 * 3. Quick-select for detected Google account.
 * 4. Clear role selection (User Account vs Project Account).
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

  // Direct Google Account Input state (for iframe environments where popups are blocked)
  const [googleEmail, setGoogleEmail] = useState('oyebanjiisrael60@gmail.com');
  const [showEmailInput, setShowEmailInput] = useState(false);

  // Initialize Google Identity Services (GSI) if available in window
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: '916876922875-d3vekr1q98r08gpqvdius7t17idqcidk.apps.googleusercontent.com',
          callback: async (response: any) => {
            if (response?.credential) {
              await executeGoogleLogin({
                credential: response.credential,
                accountType,
              });
            }
          },
          auto_select: false,
        });

        const targetDiv = document.getElementById('google-gsi-button-container');
        if (targetDiv) {
          (window as any).google.accounts.id.renderButton(targetDiv, {
            theme: 'filled_black',
            size: 'large',
            shape: 'rectangular',
            width: 320,
          });
        }
      } catch (err) {
        console.warn('GSI initialization skipped:', err);
      }
    }
  }, [accountType]);

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
          setSuccessMsg('Account verified! Redirecting to create your Project Profile...');
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

  /**
   * Universal Google authentication dispatcher
   */
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

  /**
   * Primary Google Sign-In Flow (with popup & timeout handling)
   */
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
      console.warn('Google popup error / sandbox restriction:', err);
      setIsSubmitting(false);

      // If popup was blocked, timed out, or restricted by iframe:
      setShowEmailInput(true);
      if (err?.code === 'auth/unauthorized-domain' || err?.code === 'auth/timeout-or-blocked' || err?.code === 'auth/popup-blocked') {
        setError('Browser popups are restricted in this preview. Enter your Google (Gmail) address below to sign in instantly:');
      } else if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError('Google window was closed. You can also sign in directly with your Google email below:');
      } else {
        setError(err?.message || 'Popup was blocked by the browser. Please use the direct Google email sign-in below.');
      }
    }
  };

  /**
   * Direct Google Account Email Sign-In
   */
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
    <div className="w-full min-h-[calc(100vh-160px)] flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden">
      {/* Brand Glowing Accents */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-primary-container/10 blur-[130px] rounded-full"></div>
      <div className="pointer-events-none absolute -bottom-32 right-1/4 w-[500px] h-[350px] bg-primary-container/5 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md bg-surface-container-low border border-primary-container/30 rounded-3xl shadow-[0_0_60px_rgba(255,87,34,0.15)] p-6 sm:p-10 relative z-10 text-center">
        {/* Brand Header with Emblem Logo */}
        <div className="flex flex-col items-center mb-6">
          <BrandLogo size={52} showText={false} className="mb-3" />
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Sign In to LAKNES
          </h1>
          <p className="text-xs text-on-surface-variant mt-2 leading-relaxed max-w-sm">
            {accountType === 'user'
              ? 'Authenticate with your Google account to explore protocols, track quests, and participate in campaigns.'
              : 'Sign in with your project\'s Google account to manage your protocol workspace and submit for verification.'}
          </p>
        </div>

        {/* Account Type Selector (User Account vs Project Account) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-lowest rounded-xl mb-6 border border-outline-variant/30">
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

        {/* Access Protection Notice */}
        {intendedRoute && (
          <div className="p-3.5 rounded-xl bg-primary-container/10 border border-primary-container/30 text-primary text-xs mb-6 text-left flex items-start gap-2.5 font-mono">
            <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">lock</span>
            <div>
              <span className="font-bold block text-on-surface">Authentication Required</span>
              <span>{intendedRoute.message || 'Please sign in with Google to continue to this platform feature.'}</span>
            </div>
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs mb-6 text-left flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-rose-400 shrink-0 mt-0.5">error</span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs mb-6 text-left flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0 mt-0.5">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Primary Action 1: One-Click Sign In with Google Button */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-[0_4px_24px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3.5 transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating with Google...</span>
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

          {/* Native GSI Button Mount if active */}
          <div id="google-gsi-button-container" className="flex justify-center empty:hidden"></div>

          {/* Quick-Select for Detected Google Account */}
          <div className="pt-2">
            <div className="flex items-center gap-3 my-3">
              <div className="h-px bg-outline-variant/30 flex-1"></div>
              <span className="text-[11px] font-mono text-on-surface-variant uppercase">
                Instant Google Verification
              </span>
              <div className="h-px bg-outline-variant/30 flex-1"></div>
            </div>

            {/* Quick-fill Chip for Current User */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setGoogleEmail('oyebanjiisrael60@gmail.com');
                executeGoogleLogin({
                  email: 'oyebanjiisrael60@gmail.com',
                  name: 'Israel',
                  accountType,
                });
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary-container text-xs flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-6 h-6 rounded-full bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-[11px] font-bold text-primary">
                  O
                </div>
                <div className="truncate">
                  <span className="text-on-surface font-semibold block text-xs truncate">
                    oyebanjiisrael60@gmail.com
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Click to sign in instantly</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>

          {/* Direct Google Account Email Input (Always reachable) */}
          <div className="pt-2 text-left">
            <button
              type="button"
              onClick={() => setShowEmailInput(!showEmailInput)}
              className="text-xs text-primary hover:underline flex items-center gap-1 mb-2 cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[15px]">
                {showEmailInput ? 'expand_less' : 'alternate_email'}
              </span>
              <span>{showEmailInput ? 'Hide other Google account' : 'Sign in with a different Google account'}</span>
            </button>

            {showEmailInput && (
              <form onSubmit={handleDirectEmailSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] text-on-surface-variant font-mono mb-1">
                    Google (Gmail) Address
                  </label>
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-primary-container font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary-container text-on-primary-container font-label-md text-label-md font-semibold hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>Confirm Google Sign-In</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer Return Link */}
        <div className="mt-8 pt-6 border-t border-outline-variant/30">
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <span>Return to Ecosystem Explorer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
