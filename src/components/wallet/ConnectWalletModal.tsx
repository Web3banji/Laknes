import React from 'react';
import { useWallet } from '../../core/wallet/WalletContext';
import { Modal } from '../../design-system/primitives/Modal';
import { Button } from '../../design-system/primitives/Button';
import { useToast } from '../../design-system/primitives/Toast';
import { ShieldCheck, Wallet, ArrowUpRight, CheckCircle2, Copy, LogOut } from 'lucide-react';
import { formatAddress } from '../../core/network/config';

export const ConnectWalletModal: React.FC = () => {
  const { status, address, network, connectModalOpen, closeConnectModal, connect, disconnect } = useWallet();
  const { showToast, addressCopied, walletConnected } = useToast();

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      addressCopied(address);
    }
  };

  const handleConnect = async (providerId: string) => {
    const success = await connect(providerId);
    if (success && address) {
      walletConnected(address);
    }
  };

  const isConnected = status === 'connected' && Boolean(address);

  return (
    <Modal
      isOpen={connectModalOpen}
      onClose={closeConnectModal}
      title={isConnected ? 'Connected Account' : 'Connect Wallet'}
      description={
        isConnected
          ? `Active on ${network.name}`
          : 'Connect an Elysium-compatible EVM wallet to interact with verified ecosystem applications and liquidity venues.'
      }
      size="sm"
    >
      {isConnected ? (
        <div className="space-y-4">
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200/80">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span>Account Address</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Elysium Native
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="font-mono text-sm font-medium text-neutral-900 tabular-nums">
                {address ? formatAddress(address, 10, 8) : ''}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-200/60 transition-colors cursor-pointer"
                  title="Copy address"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`${network.blockExplorerUrls[0]}/address/${address}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-200/60 transition-colors"
                  title="View on Explorer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-neutral-500">Network ID: {network.chainId}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                disconnect();
                closeConnectModal();
                showToast({
                  type: 'info',
                  title: 'Disconnected',
                  message: 'Wallet disconnected',
                });
              }}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleConnect('injected')}
              className="w-full flex items-center justify-between p-3.5 rounded-lg border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-white group-hover:shadow-2xs transition-all">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    Browser Wallet
                  </div>
                  <div className="text-xs text-neutral-500">
                    MetaMask, Rabby, or injected Web3 provider
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => handleConnect('elysium-connect')}
              className="w-full flex items-center justify-between p-3.5 rounded-lg border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-white group-hover:shadow-2xs transition-all">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    Elysium Native Session
                  </div>
                  <div className="text-xs text-neutral-500">
                    Direct local cryptographic session
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
            </button>
          </div>

          <div className="pt-2">
            <p className="text-[11px] text-neutral-400 text-center leading-normal">
              Public exploration and ecosystem discovery do not require connecting a wallet.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
