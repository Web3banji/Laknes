import React from 'react';
import { ProjectData } from '../cards/ProjectCard';
import { Modal } from '../../design-system/primitives/Modal';
import { Button } from '../../design-system/primitives/Button';
import { StatusIndicator } from '../../design-system/primitives/StatusIndicator';
import { ExternalLink, CheckCircle2, ArrowRight } from 'lucide-react';
import { useWallet } from '../../core/wallet/WalletContext';

export interface ProjectDetailModalProps {
  project: ProjectData | null;
  onClose: () => void;
  onMigrateLiquidity?: (project: ProjectData) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onMigrateLiquidity,
}) => {
  const { status, openConnectModal } = useWallet();

  if (!project) return null;

  return (
    <Modal
      isOpen={Boolean(project)}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span>{project.name}</span>
          <StatusIndicator
            status={
              project.status === 'live' ||
              project.status === 'active' ||
              project.status === 'verified' ||
              project.status === 'pending' ||
              project.status === 'completed'
                ? project.status
                : 'active'
            }
            label={project.statusLabel || (typeof project.status === 'string' ? project.status : 'Active')}
          />
        </div>
      }
      description={`${project.category} · Elysium Ecosystem`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          {project.websiteUrl ? (
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-950 font-medium"
            >
              <span>Visit Project</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {project.liquidityStage && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onMigrateLiquidity?.(project);
                }}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Liquidity Steps
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Overview */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-2">
            About the Project
          </h4>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {project.description || project.summary}
          </p>
        </div>

        {/* Technical & Ecosystem Status */}
        <div className="rounded-lg border border-neutral-200/90 divide-y divide-neutral-100 text-xs">
          <div className="flex items-center justify-between p-3">
            <span className="text-neutral-500">Native Network</span>
            <span className="font-medium text-neutral-900">Elysium Mainnet</span>
          </div>

          <div className="flex items-center justify-between p-3">
            <span className="text-neutral-500">Ecosystem Verification</span>
            <span className="flex items-center gap-1 text-neutral-800 font-medium">
              {project.isVerified ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />
                  Verified Registry
                </>
              ) : (
                'Pending Review'
              )}
            </span>
          </div>

          <div className="flex items-center justify-between p-3">
            <span className="text-neutral-500">Liquidity Migration Status</span>
            <span className="font-medium text-neutral-900">
              {project.liquidityStage || 'Completed / Native'}
            </span>
          </div>
        </div>

        {/* Wallet prompt note if applicable */}
        {status !== 'connected' && (
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80 flex items-center justify-between text-xs">
            <span className="text-neutral-600">
              Are you the project owner? Connect your wallet to manage lifecycle parameters.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                openConnectModal();
              }}
            >
              Connect
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
