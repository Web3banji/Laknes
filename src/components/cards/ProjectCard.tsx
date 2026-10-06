import React from 'react';
import { StatusType } from '../../design-system/primitives/StatusIndicator';
import { CheckCircle2, Coins, ArrowRight } from 'lucide-react';

export interface ProjectCardProps {
  name: string;
  description: string;
  category: string;
  status?: string;
  logo?: string;
  isVerified?: boolean;
  assets?: string[];
  marketsCount?: number;
  onClick?: () => void;
}

export function ProjectCard({
  name,
  description,
  category,
  status,
  logo,
  isVerified,
  assets,
  marketsCount,
  onClick,
}: ProjectCardProps) {
  return (
    <article
      onClick={onClick}
      className={`group rounded-2xl border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col justify-between ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div>
        {/* Header row: Logo & Status Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold text-sm">
            {logo ? (
              <img src={logo} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span>{name.charAt(0)}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isVerified && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            )}

            {status && (
              <span className="rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                {status}
              </span>
            )}
          </div>
        </div>

        {/* Project Name & Description */}
        <div className="mt-4">
          <h3 className="text-base font-semibold text-neutral-950 group-hover:text-neutral-800 transition-colors">
            {name}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-neutral-500">
            {description}
          </p>
        </div>

        {/* Associated Assets & Markets pill row */}
        {assets && assets.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-neutral-400 font-medium mr-0.5">
              Assets:
            </span>
            {assets.slice(0, 3).map((ast) => (
              <span
                key={ast}
                className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-mono font-medium text-neutral-700"
              >
                {ast.replace('asset-', '').toUpperCase()}
              </span>
            ))}
            {marketsCount !== undefined && marketsCount > 0 && (
              <span className="text-[11px] text-neutral-400 font-mono ml-auto">
                {marketsCount} {marketsCount === 1 ? 'market' : 'markets'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Category & Next Action */}
      <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-3.5">
        <span className="text-xs font-medium text-neutral-500">
          {category}
        </span>

        <span className="text-sm font-medium text-neutral-950 inline-flex items-center gap-1 transition-transform group-hover:translate-x-0.5">
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </article>
  );
}

/**
 * Data type for backwards compatibility
 */
export interface ProjectData {
  id: string;
  name: string;
  category: string;
  description: string;
  summary?: string;
  status?: StatusType | string;
  statusLabel?: string;
  logo?: string;
  websiteUrl?: string;
  docsUrl?: string;
  isVerified?: boolean;
  liquidityStage?: 'Planning' | 'Readiness' | 'Active Migration' | 'Completed';
}
