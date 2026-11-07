/**
 * LAKNES Footer Component
 * Quiet, professional footer adhering to Stitch guidelines.
 */

import React from 'react';
import { BrandLogo } from './BrandLogo.tsx';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenArchitecture?: () => void;
}

export function Footer({ onNavigate, onOpenArchitecture }: FooterProps) {
  return (
    <footer className="w-full px-6 lg:px-12 py-16 max-w-7xl mx-auto flex flex-col bg-surface-container-lowest border-t border-outline-variant/20 text-on-surface-variant font-body-md">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
        {/* Brand Block */}
        <div className="md:col-span-4 flex flex-col items-start space-y-4">
          <button
            onClick={() => onNavigate('explore')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <BrandLogo size={32} />
            <span className="text-headline-md font-headline-md font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">
              LAKNES
            </span>
          </button>
          <p className="text-body-sm font-body-sm text-on-surface-variant max-w-sm leading-relaxed">
            The Web3 ecosystem platform connecting users, creators, and blockchain projects through discovery, participation, and growth.
          </p>
          <div className="pt-2 flex items-center gap-3 text-on-surface-variant">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded bg-surface-container border border-outline-variant/30 flex items-center justify-center hover:text-primary hover:border-primary-container/40 transition-colors"
              title="X / Twitter"
            >
              <span className="text-label-md font-label-md">𝕏</span>
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded bg-surface-container border border-outline-variant/30 flex items-center justify-center hover:text-primary hover:border-primary-container/40 transition-colors"
              title="Discord"
            >
              <span className="text-label-md font-label-md">DC</span>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded bg-surface-container border border-outline-variant/30 flex items-center justify-center hover:text-primary hover:border-primary-container/40 transition-colors"
              title="GitHub"
            >
              <span className="text-label-md font-label-md">GH</span>
            </a>
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded bg-surface-container border border-outline-variant/30 flex items-center justify-center hover:text-primary hover:border-primary-container/40 transition-colors"
              title="Telegram"
            >
              <span className="text-label-md font-label-md">TG</span>
            </a>
          </div>
        </div>

        {/* Navigation Columns */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Col 1: Explore */}
          <div>
            <h4 className="text-label-md font-label-md font-semibold text-on-surface uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-body-sm font-body-sm">
              <li>
                <button
                  onClick={() => onNavigate('explore')}
                  className="text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer"
                >
                  Ecosystem Discovery
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('projects')}
                  className="text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer"
                >
                  Verified Projects
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('quests')}
                  className="text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer"
                >
                  Campaigns & Quests
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: Opportunities */}
          <div>
            <h4 className="text-label-md font-label-md font-semibold text-on-surface uppercase tracking-wider mb-4">
              Opportunities
            </h4>
            <ul className="space-y-2.5 text-body-sm font-body-sm">
              <li>
                <button
                  onClick={() => onNavigate('creator-studio')}
                  className="text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer"
                >
                  Creator Collaborations
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('quests')}
                  className="text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer"
                >
                  Community Initiatives
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('quests')}
                  className="text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer"
                >
                  Grant Programs
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Builders */}
          <div>
            <h4 className="text-label-md font-label-md font-semibold text-on-surface uppercase tracking-wider mb-4">
              For Builders
            </h4>
            <ul className="space-y-2.5 text-body-sm font-body-sm">
              <li>
                <button
                  onClick={() => onNavigate('submit-project')}
                  className="text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer"
                >
                  Launch on LAKNES
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('projects')}
                  className="text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer"
                >
                  Project Registry
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('creator-studio')}
                  className="text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer"
                >
                  Creator Sourcing
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Standards */}
          <div>
            <h4 className="text-label-md font-label-md font-semibold text-on-surface uppercase tracking-wider mb-4">
              Standards
            </h4>
            <ul className="space-y-2.5 text-body-sm font-body-sm">
              <li>
                <button
                  onClick={() => onNavigate('submit-project')}
                  className="text-on-surface-variant hover:text-primary transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                  <span>Verification Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('creator-studio')}
                  className="text-on-surface-variant hover:text-primary transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px] text-secondary">shield</span>
                  <span>Creator Guidelines</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright and Links */}
      <div className="pt-8 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-body-sm font-body-sm text-outline">
        <div>
          &copy; {new Date().getFullYear()} LAKNES. All rights reserved.
        </div>
        <div className="flex items-center gap-6 text-label-sm font-label-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <span>PORTAL STATUS: PRODUCTION OPTIMAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
