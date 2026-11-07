/**
 * LAKNES Footer Component (Yochi Editorial Design System)
 * Clean, compact editorial footer with brand mark, mono navigation, and platform core message.
 */

import React from 'react';
import { BrandLogo } from './BrandLogo.tsx';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenArchitecture?: () => void;
}

export function Footer({ onNavigate, onOpenArchitecture }: FooterProps) {
  return (
    <footer className="w-full bg-[var(--yo-bg)] border-t-[1.5px] border-[var(--yo-line)] text-[var(--yo-muted)] font-mono text-[10px] tracking-wider uppercase">
      <div className="lp-shell">
        <div className="lp-footer">
          {/* Brand Mark + Title */}
          <button
            onClick={() => onNavigate('explore')}
            className="lp-brand cursor-pointer"
            aria-label="Laknes, back to top"
          >
            <BrandLogo size={24} showText={true} />
          </button>

          {/* Core Mantra */}
          <span className="lp-footer-note">
            DISCOVER. PARTICIPATE. BUILD.
          </span>

          {/* Navigation */}
          <nav aria-label="Footer Navigation">
            <button
              onClick={() => onNavigate('explore')}
              className="hover:text-[var(--yo-ink)] transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit uppercase"
            >
              ECOSYSTEM
            </button>
            <button
              onClick={() => onNavigate('projects')}
              className="hover:text-[var(--yo-ink)] transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit uppercase"
            >
              PROJECTS
            </button>
            <button
              onClick={() => onNavigate('quests')}
              className="hover:text-[var(--yo-ink)] transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit uppercase"
            >
              QUESTS
            </button>
            <button
              onClick={() => onNavigate('creator-studio')}
              className="hover:text-[var(--yo-ink)] transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit uppercase"
            >
              STUDIO
            </button>
            <button
              onClick={() => onNavigate('submit-project')}
              className="hover:text-[var(--yo-ink)] transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit uppercase"
            >
              REGISTER
            </button>
            {onOpenArchitecture && (
              <button
                onClick={onOpenArchitecture}
                className="hover:text-[var(--yo-good)] transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit uppercase"
              >
                TESTS
              </button>
            )}
          </nav>

          {/* Copyright */}
          <span className="lp-copyright">
            &copy; 2026 LAKNES
          </span>
        </div>
      </div>
    </footer>
  );
}
