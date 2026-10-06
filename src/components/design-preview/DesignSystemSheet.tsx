import React, { useState } from 'react';
import { Button } from '../../design-system/primitives/Button';
import { Input } from '../../design-system/primitives/Input';
import { SearchInput } from '../../design-system/primitives/SearchInput';
import { Badge } from '../../design-system/primitives/Badge';
import { StatusIndicator } from '../../design-system/primitives/StatusIndicator';
import { ProgressBar } from '../../design-system/primitives/ProgressBar';
import { Tabs } from '../../design-system/primitives/Tabs';
import { Card } from '../../design-system/primitives/Card';
import { Modal } from '../../design-system/primitives/Modal';
import { Dropdown } from '../../design-system/primitives/Dropdown';
import {
  Skeleton,
  ProjectCardSkeleton,
  ProjectProfileSkeleton,
  QuestCardSkeleton,
  DashboardSkeleton,
  ChecklistSkeleton,
  ActivitySkeleton,
} from '../../design-system/primitives/Skeleton';
import { EmptyState } from '../../design-system/primitives/EmptyState';
import { ErrorState, ErrorType } from '../../design-system/primitives/ErrorState';
import { useToast } from '../../design-system/primitives/Toast';
import { QuestProgress } from '../quests/QuestProgress';
import { TOKENS } from '../../design-system/tokens';
import { CheckCircle2, AlertCircle, AlertTriangle, ArrowRight, ShieldCheck, Database, HelpCircle, Award, Copy, Wallet, Send, Check } from 'lucide-react';

export interface DesignSystemSheetProps {
  onSimulateStateChange: (state: 'normal' | 'loading' | 'empty' | 'error') => void;
  currentState: 'normal' | 'loading' | 'empty' | 'error';
}

export const DesignSystemSheet: React.FC<DesignSystemSheetProps> = ({
  onSimulateStateChange,
  currentState,
}) => {
  const {
    showToast,
    questCompleted,
    addressCopied,
    walletConnected,
    txSubmitted,
    txConfirmed,
    txFailed,
  } = useToast();

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('segmented');
  const [dropdownVal, setDropdownVal] = useState('elysium');
  const [searchVal, setSearchVal] = useState('');
  const [progressVal, setProgressVal] = useState(65);
  const [testErrorType, setTestErrorType] = useState<ErrorType>('connection');
  const [questStepCount, setQuestStepCount] = useState(2);

  return (
    <div className="space-y-12">
      {/* Introduction */}
      <div className="border-b border-neutral-200/80 pb-6">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold tracking-wider text-neutral-500 uppercase mb-2">
            Design Constitution & Foundations
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
            LAKNES Design System & Primitives
          </h1>
          <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
            The complete visual and UX token foundation for LAKNES. Built with strict anti-slop rules, zero-pill discipline, tabular numeric alignment, and accessible semantic components.
          </p>
        </div>

        {/* Global state simulator switcher */}
        <div className="mt-6 p-4 rounded-lg bg-neutral-50 border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-neutral-900">
              Live State Simulator
            </div>
            <div className="text-xs text-neutral-500">
              Simulate how screens respond to data states across LAKNES.
            </div>
          </div>
          <Tabs
            variant="segmented"
            size="sm"
            activeTab={currentState}
            onChange={(val) => onSimulateStateChange(val as typeof currentState)}
            tabs={[
              { id: 'normal', label: 'Default / Populated' },
              { id: 'loading', label: 'Skeleton Loading' },
              { id: 'empty', label: 'Empty State' },
              { id: 'error', label: 'Error State' },
            ]}
          />
        </div>
      </div>

      {/* 0. Brand Kit & Official Logo */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-950 tracking-tight">
          0. Brand Kit & Official Identity
        </h2>
        <div className="p-6 rounded-lg border border-neutral-200/90 bg-white space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* White background display */}
            <div className="p-6 rounded-lg border border-neutral-200 bg-white flex flex-col items-center justify-center gap-3">
              <span className="text-xs text-neutral-400 font-medium self-start">
                Primary Brand Mark (White Canvas)
              </span>
              <img src="/logo.svg" alt="LAKNES Brand Logo" className="h-10 w-auto py-2" />
            </div>

            {/* Dark background contrast display */}
            <div className="p-6 rounded-lg border border-neutral-800 bg-[#09090b] flex flex-col items-center justify-center gap-3">
              <span className="text-xs text-neutral-400 font-medium self-start">
                Brand Mark on Dark Surface
              </span>
              <div className="flex items-center gap-3 py-2">
                <img src="/mark.svg" alt="LAKNES Mark" className="h-9 w-auto" />
                <span className="text-white font-bold tracking-[0.25em] text-lg uppercase">
                  LAKNES
                </span>
              </div>
            </div>
          </div>

          {/* Color palette extracted from brand kit */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-neutral-500">
              Logo Color Spectrum
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-md border border-neutral-200/80 bg-white space-y-1">
                <div className="h-8 rounded bg-[#4F46E5]" />
                <div className="text-xs font-semibold text-neutral-900">Deep Indigo</div>
                <div className="text-[10px] font-mono text-neutral-500">#4F46E5</div>
              </div>
              <div className="p-3 rounded-md border border-neutral-200/80 bg-white space-y-1">
                <div className="h-8 rounded bg-[#6366F1]" />
                <div className="text-xs font-semibold text-neutral-900">Electric Iris</div>
                <div className="text-[10px] font-mono text-neutral-500">#6366F1</div>
              </div>
              <div className="p-3 rounded-md border border-neutral-200/80 bg-white space-y-1">
                <div className="h-8 rounded bg-[#7C3AED]" />
                <div className="text-xs font-semibold text-neutral-900">Radiant Violet</div>
                <div className="text-[10px] font-mono text-neutral-500">#7C3AED</div>
              </div>
              <div className="p-3 rounded-md border border-neutral-200/80 bg-white space-y-1">
                <div className="h-8 rounded bg-[#38BDF8]" />
                <div className="text-xs font-semibold text-neutral-900">Luminous Sky</div>
                <div className="text-[10px] font-mono text-neutral-500">#38BDF8</div>
              </div>
              <div className="p-3 rounded-md border border-neutral-200/80 bg-white space-y-1">
                <div className="h-8 rounded bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-400" />
                <div className="text-xs font-semibold text-neutral-900">Brand Gradient</div>
                <div className="text-[10px] font-mono text-neutral-500">Tri-Stop Axis</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1. Typography Scale */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-950 tracking-tight">
          1. Typographic Hierarchy
        </h2>
        <div className="rounded-lg border border-neutral-200/90 divide-y divide-neutral-100 bg-white">
          <div className="p-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-400 w-36">Display (36px)</span>
            <div className="text-3xl font-semibold tracking-tight text-neutral-950 flex-1">
              Elysium Ecosystem Gateway
            </div>
          </div>
          <div className="p-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-400 w-36">Title Large (24px)</span>
            <div className="text-2xl font-semibold tracking-tight text-neutral-950 flex-1">
              Liquidity Migration Lifecycle
            </div>
          </div>
          <div className="p-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-400 w-36">Title Medium (16px)</span>
            <div className="text-base font-semibold text-neutral-900 flex-1">
              Elysium RPC Configuration Quest
            </div>
          </div>
          <div className="p-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-400 w-36">Body (14px)</span>
            <div className="text-sm text-neutral-600 flex-1 leading-relaxed">
              Verify your bytecode against Elysium EVM consensus and submit verified source.
            </div>
          </div>
          <div className="p-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-400 w-36">Tabular Numerals</span>
            <div className="text-sm font-mono tabular-nums text-neutral-900 flex-1">
              Chain: 1339 · Block: 28,941,048 · Gas: 21,000 · Ratio: 1.0000000000
            </div>
          </div>
        </div>
      </section>

      {/* 2. Buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-950 tracking-tight">
          2. Buttons & Actions
        </h2>
        <div className="p-6 rounded-lg border border-neutral-200/90 bg-white space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-medium text-neutral-500">Variants</div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Destructive</Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-neutral-500">Sizes & States</div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small (32px)</Button>
              <Button size="md">Medium (36px)</Button>
              <Button size="lg">Large (44px)</Button>
              <Button isLoading size="sm">Loading</Button>
              <Button disabled size="sm">Disabled</Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Inputs & Search */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-950 tracking-tight">
          3. Inputs & Search
        </h2>
        <div className="p-6 rounded-lg border border-neutral-200/90 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Elysium Contract Address"
            placeholder="0x…"
            helperText="Address of deployed smart contract"
          />
          <Input
            label="Token Symbol"
            value="LAVA"
            readOnly
            helperText="Native currency symbol"
          />
          <Input
            label="Invalid Input State"
            value="invalid-hex-format"
            error="Please provide a valid 42-character hexadecimal address"
          />
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-800">
              Interactive Search
            </label>
            <SearchInput
              value={searchVal}
              onChange={setSearchVal}
              placeholder="Search directory…"
            />
          </div>
        </div>
      </section>

      {/* 4. Zero-Pill Metadata & Status Indicators */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-950 tracking-tight">
          4. Zero-Pill Metadata & Status Indicators
        </h2>
        <div className="p-6 rounded-lg border border-neutral-200/90 bg-white space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-medium text-neutral-500">
              Accessible Status Indicators (Geometric Dot + Explicit Text Label)
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <StatusIndicator status="active" label="Live Protocol" />
              <StatusIndicator status="verified" label="Verified by LAKNES" />
              <StatusIndicator status="pending" label="Audit In Progress" />
              <StatusIndicator status="completed" label="Migration Complete" />
              <StatusIndicator status="draft" label="Draft Submission" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-neutral-500">
              Subtle Unboxed Metadata (with typographic separators)
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <span>DeFi Protocol</span>
              <span aria-hidden="true" className="text-neutral-300">·</span>
              <span>Elysium Mainnet</span>
              <span aria-hidden="true" className="text-neutral-300">·</span>
              <span className="font-mono tabular-nums">Chain ID: 1339</span>
              <span aria-hidden="true" className="text-neutral-300">·</span>
              <span>Audited</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-neutral-500">
              Clean Non-Pill Tags
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">EVM Compatible</Badge>
              <Badge variant="subtle">ERC-20</Badge>
              <Badge variant="outline">Blockscout</Badge>
              <Badge variant="success">Liquidity Active</Badge>
              <Badge variant="warning">Migration Pending</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Progress Indicators & Toast Feedback */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-950 tracking-tight">
          5. Progress Indicators & Notifications
        </h2>
        <div className="p-6 rounded-lg border border-neutral-200/90 bg-white space-y-6">
          <div className="space-y-3">
            <ProgressBar
              value={progressVal}
              label="Determinate Progress (Tabular Numerals)"
              showValue
            />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setProgressVal(Math.max(0, progressVal - 15))}>
                -15%
              </Button>
              <Button size="sm" variant="outline" onClick={() => setProgressVal(Math.min(100, progressVal + 15))}>
                +15%
              </Button>
            </div>
          </div>

          {/* Dedicated QuestProgress Component Demonstration */}
          <div className="pt-4 border-t border-neutral-100 space-y-3">
            <div className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Quest Progress Component
            </div>
            <div className="p-4 rounded-xl border border-neutral-200/90 bg-neutral-50/50 max-w-md">
              <QuestProgress completed={questStepCount} total={4} />
              <div className="mt-4 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setQuestStepCount(Math.max(0, questStepCount - 1))}
                  disabled={questStepCount === 0}
                >
                  Previous Step
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const next = Math.min(4, questStepCount + 1);
                    setQuestStepCount(next);
                    if (next === 4) {
                      questCompleted('Configure Elysium RPC & Network');
                    }
                  }}
                  disabled={questStepCount === 4}
                >
                  Complete Step
                </Button>
              </div>
            </div>
          </div>

          {/* 6 Specialized Toast System Triggers */}
          <div className="pt-4 border-t border-neutral-100 space-y-3">
            <div className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Lightweight Toast System (6 Core Events)
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => questCompleted('Configure Elysium RPC & Network')}
                leftIcon={<Award className="w-3.5 h-3.5" />}
              >
                Quest Completed
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => addressCopied('0x71C39a824eFe81320F108bE57C361284A1982b6C')}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Copied Address
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => walletConnected('0x88A3194Bca628b01c900D89319e71A2d1847F104')}
                leftIcon={<Wallet className="w-3.5 h-3.5" />}
              >
                Wallet Connected
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => txSubmitted('0x9a842187d9a1023bc8451829ea6718420b85718a')}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Tx Submitted
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => txConfirmed('0x9a842187d9a1023bc8451829ea6718420b85718a')}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Tx Confirmed
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => txFailed('Execution reverted: gas limit exceeded')}
                leftIcon={<AlertCircle className="w-3.5 h-3.5 text-red-600" />}
              >
                Tx Failed
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Skeletons & Complete State System */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-950 tracking-tight">
            6. Skeletons & Complete UI State System
          </h2>
          <span className="text-xs text-neutral-500">
            Equivalent skeletons for all core views
          </span>
        </div>

        <div className="p-6 rounded-lg border border-neutral-200/90 bg-white space-y-6">
          {/* Skeleton category demonstrations */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Skeleton Archetypes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-xs font-medium text-neutral-500">1. Project Card Skeleton</span>
                <ProjectCardSkeleton />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-neutral-500">2. Quest Card Skeleton</span>
                <QuestCardSkeleton />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-medium text-neutral-500">3. Project Profile Skeleton</span>
              <ProjectProfileSkeleton />
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-medium text-neutral-500">4. Checklist Skeleton (Migration & Verification)</span>
              <ChecklistSkeleton />
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-medium text-neutral-500">5. Activity Feed Skeleton</span>
              <ActivitySkeleton />
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-medium text-neutral-500">6. Dashboard Metric Skeleton</span>
              <DashboardSkeleton />
            </div>
          </div>

          {/* Empty State component test */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Polished Reusable Empty State
            </h3>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/30 p-4">
              <EmptyState
                title="No results found"
                description="This empty state provides clear guidance without fabricating numbers or cluttering the layout."
                action={
                  <Button variant="secondary" onClick={() => showToast({ type: 'info', title: 'Action clicked' })}>
                    Reset Filters
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Calm & Useful Error States (6 Core Failure Archetypes) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950 tracking-tight">
              7. Calm & Useful Error States
            </h2>
            <p className="text-xs text-neutral-500">
              Structured "What Happened" and "What To Do Next" without technical stack traces.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-lg border border-neutral-200/90 bg-white space-y-6">
          {/* Switcher for error archetypes */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'connection', label: '1. Connection Error' },
              { id: 'transaction', label: '2. Transaction Failure' },
              { id: 'data-loading', label: '3. Data Loading Failure' },
              { id: 'wallet-rejection', label: '4. Wallet Rejection' },
              { id: 'unsupported-network', label: '5. Unsupported Network' },
              { id: 'unavailable-feature', label: '6. Unavailable Feature' },
            ].map((err) => (
              <button
                key={err.id}
                type="button"
                onClick={() => setTestErrorType(err.id as ErrorType)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  testErrorType === err.id
                    ? 'bg-neutral-950 text-white shadow-2xs font-semibold'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/70'
                }`}
              >
                {err.label}
              </button>
            ))}
          </div>

          {/* Active Error State Preview */}
          <div className="p-6 rounded-2xl bg-neutral-50/50 border border-neutral-200/80">
            <ErrorState
              type={testErrorType}
              onRetry={() =>
                showToast({
                  type: 'info',
                  title: 'Retrying action…',
                  message: 'Executing recovery sequence.',
                })
              }
              secondaryActionText={testErrorType === 'connection' ? 'Network Status' : undefined}
              onSecondaryAction={
                testErrorType === 'connection'
                  ? () => window.open('https://explorer.elysiumchain.tech', '_blank')
                  : undefined
              }
            />
          </div>
        </div>
      </section>

      {/* Test Modal */}
      <Modal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Accessible Dialog Primitive"
        description="Supports Escape key, backdrop dismiss, and focus retention."
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setTestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setTestModalOpen(false)}>
              Confirm
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600 leading-relaxed">
          This modal dialog enforces single-elevation discipline without modal overload. It locks document scrolling while open and returns focus cleanly.
        </p>
      </Modal>
    </div>
  );
};
