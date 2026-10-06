import React from 'react';
import { AlertCircle, RotateCcw, WifiOff, XCircle, RefreshCw, Slash, Globe, ArrowRight } from 'lucide-react';
import { Button } from './Button';

export type ErrorType =
  | 'connection'
  | 'transaction'
  | 'data-loading'
  | 'wallet-rejection'
  | 'unsupported-network'
  | 'unavailable-feature'
  | 'custom';

export interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  actionText?: string;
  onRetry?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

interface ErrorDetails {
  title: string;
  whatHappened: string;
  whatNext: string;
  icon: React.ReactNode;
  primaryActionLabel: string;
}

const ERROR_CONFIGS: Record<Exclude<ErrorType, 'custom'>, ErrorDetails> = {
  connection: {
    title: 'Connection Disrupted',
    whatHappened: 'Unable to reach the official Elysium RPC endpoint. Network requests timed out or connection was lost.',
    whatNext: 'Check your internet connection, verify that your browser is online, or retry contacting the Elysium network.',
    icon: <WifiOff className="w-5 h-5 text-neutral-700" />,
    primaryActionLabel: 'Retry Connection',
  },
  transaction: {
    title: 'Transaction Unsuccessful',
    whatHappened: 'The requested on-chain call was not completed. Gas estimation or contract conditions were not fulfilled.',
    whatNext: 'Verify that your account has enough native LAVA to cover network gas fees and retry with appropriate slippage.',
    icon: <XCircle className="w-5 h-5 text-red-600" />,
    primaryActionLabel: 'Try Again',
  },
  'data-loading': {
    title: 'Unable to Load Ecosystem Data',
    whatHappened: 'We encountered an error while indexing project and quest metadata from the Elysium directory.',
    whatNext: 'Our background service is synchronizing. Please reload the current view to fetch the latest state.',
    icon: <RefreshCw className="w-5 h-5 text-neutral-700" />,
    primaryActionLabel: 'Reload View',
  },
  'wallet-rejection': {
    title: 'Signature Request Cancelled',
    whatHappened: 'The connection or transaction signature was declined in your wallet interface.',
    whatNext: 'No changes were made on-chain. When you are ready, initiate the action again and confirm in your wallet.',
    icon: <Slash className="w-5 h-5 text-neutral-600" />,
    primaryActionLabel: 'Authorize Again',
  },
  'unsupported-network': {
    title: 'Unsupported Network Detected',
    whatHappened: 'Your connected wallet is active on a different chain. LAKNES operates exclusively on Elysium Mainnet.',
    whatNext: 'Switch your active wallet network to Elysium Mainnet (Chain ID 1339, Currency: LAVA) to interact.',
    icon: <Globe className="w-5 h-5 text-amber-700" />,
    primaryActionLabel: 'Switch to Elysium (1339)',
  },
  'unavailable-feature': {
    title: 'Feature Temporarily Unavailable',
    whatHappened: 'This capability is awaiting live contract indexing synchronization on the Elysium network.',
    whatNext: 'You can explore verified projects, complete onboarding quests, or check the liquidity roadmap.',
    icon: <AlertCircle className="w-5 h-5 text-neutral-600" />,
    primaryActionLabel: 'Return to Discover',
  },
};

/**
 * Calm, useful Error State component.
 * Explicitly breaks down "what happened" and "what to do next" without technical stack traces.
 */
export function ErrorState({
  type = 'data-loading',
  title,
  message,
  actionText,
  onRetry,
  secondaryActionText,
  onSecondaryAction,
  className = '',
}: ErrorStateProps) {
  const config = type !== 'custom' ? ERROR_CONFIGS[type] : null;

  const resolvedTitle = title || config?.title || 'Unable to Complete Action';
  const whatHappened = message || config?.whatHappened || 'An unexpected condition interrupted the operation.';
  const whatNext = config?.whatNext;
  const primaryButtonLabel = actionText || config?.primaryActionLabel || 'Try Again';

  return (
    <div
      role="alert"
      className={`rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 text-center max-w-lg mx-auto ${className}`}
    >
      {/* Calm Icon Container */}
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 mb-4 shadow-2xs">
        {config?.icon || <AlertCircle className="w-5 h-5 text-neutral-700" />}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-neutral-950">
        {resolvedTitle}
      </h3>

      {/* Calm Structured Explanation */}
      <div className="mt-3 space-y-2 text-xs sm:text-sm text-neutral-600 leading-relaxed text-left bg-neutral-50/80 rounded-xl p-4 border border-neutral-100">
        <div>
          <span className="font-semibold text-neutral-900 block mb-0.5 text-xs">
            What happened
          </span>
          <p className="text-neutral-600 text-xs sm:text-sm leading-normal">
            {whatHappened}
          </p>
        </div>

        {whatNext && (
          <div className="pt-2 border-t border-neutral-200/60">
            <span className="font-semibold text-neutral-900 block mb-0.5 text-xs">
              What you can do next
            </span>
            <p className="text-neutral-600 text-xs sm:text-sm leading-normal">
              {whatNext}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(onRetry || onSecondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <Button
              variant="primary"
              onClick={onRetry}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              {primaryButtonLabel}
            </Button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <Button
              variant="secondary"
              onClick={onSecondaryAction}
            >
              {secondaryActionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
