import React from 'react';
import { HyperliquidMarket } from '../../services/hyperliquid/types';
import { useHyperliquidOrderbook } from '../../hooks/useHyperliquidDiscovery';
import { RelativeTime } from './RelativeTime';
import { formatCurrency, formatNumber, formatPercentage } from '../../lib/formatters';
import {
  ArrowLeft,
  ExternalLink,
  Activity,
  Layers,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export interface HyperliquidMarketDetailProps {
  market: HyperliquidMarket;
  onBack: () => void;
  backLabel?: string;
}

export function HyperliquidMarketDetail({
  market,
  onBack,
  backLabel = 'Back to New on Hyperliquid',
}: HyperliquidMarketDetailProps) {
  const isPerp = market.market_type === 'perp';
  const coinKey = isPerp ? market.baseToken : (market.raw_metadata?.universe?.name || market.baseToken);
  const orderbook = useHyperliquidOrderbook(coinKey);
  const [copied, setCopied] = React.useState(false);

  const handleCopyContract = () => {
    if (market.contractAddress) {
      navigator.clipboard.writeText(market.contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tradeUrl = `https://app.hyperliquid.xyz/trade/${market.baseToken}`;

  // Calculate orderbook spread & max depth
  const bestBid = orderbook?.bids[0]?.px;
  const bestAsk = orderbook?.asks[0]?.px;
  const spread = bestBid && bestAsk ? bestAsk - bestBid : undefined;
  const spreadPct = bestBid && spread ? (spread / bestBid) * 100 : undefined;

  const maxBidSize = orderbook?.bids.reduce((acc, b) => Math.max(acc, b.sz), 0) || 1;
  const maxAskSize = orderbook?.asks.reduce((acc, a) => Math.max(acc, a.sz), 0) || 1;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>{backLabel}</span>
      </button>

      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-950">
                {market.symbol}
              </h1>
              {!market.is_historical && (
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 uppercase tracking-wider animate-pulse">
                  NEW LISTING
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium border ${
                  isPerp
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                Hyperliquid {isPerp ? 'Perpetual' : 'Spot'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-mono text-neutral-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live WebSocket
              </span>
            </div>

            <div className="text-xs text-neutral-500 font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Base: {market.baseToken}</span>
              <span>·</span>
              <span>Quote: {market.quoteToken}</span>
              <span>·</span>
              <span>Market ID: #{market.market_id}</span>
              <span>·</span>
              <span className="text-neutral-700 font-medium">Status: {market.status}</span>
            </div>

            {/* Detection timestamp note */}
            <div className="text-xs text-neutral-500 pt-1">
              <span>First detected on Hyperliquid: </span>
              <span className="font-mono text-neutral-800 font-medium">
                {new Date(market.first_detected_at).toLocaleString()}
              </span>{' '}
              (
              <RelativeTime
                timestamp={market.first_detected_at}
                isHistorical={market.is_historical}
                className="text-neutral-600 font-medium"
              />
              )
            </div>
          </div>

          {/* Trade CTA */}
          <a
            href={tradeUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="self-start sm:self-auto shrink-0 inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors shadow-2xs"
          >
            <span>Trade on Hyperliquid</span>
            <ExternalLink className="h-3.5 w-3.5 text-neutral-300" />
          </a>
        </div>

        {/* Live Price & 24h Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-100">
          <div className="rounded-xl bg-neutral-50/80 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
              Current Price
            </span>
            <span className="text-lg font-mono font-semibold text-neutral-950 block">
              {market.current_price !== undefined ? formatCurrency(market.current_price) : '—'}
            </span>
          </div>

          <div className="rounded-xl bg-neutral-50/80 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
              24h Change
            </span>
            <span
              className={`text-lg font-mono font-semibold flex items-center gap-1 ${
                market.price_change_24h !== undefined
                  ? market.price_change_24h >= 0
                    ? 'text-emerald-700'
                    : 'text-red-700'
                  : 'text-neutral-400'
              }`}
            >
              {market.price_change_24h !== undefined ? (
                <>
                  {market.price_change_24h >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{formatPercentage(market.price_change_24h).formatted}</span>
                </>
              ) : (
                '—'
              )}
            </span>
          </div>

          <div className="rounded-xl bg-neutral-50/80 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
              24h Volume
            </span>
            <span className="text-lg font-mono font-semibold text-neutral-950 block">
              {market.volume24h !== undefined ? `$${formatNumber(market.volume24h)}` : '—'}
            </span>
          </div>

          <div className="rounded-xl bg-neutral-50/80 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
              {isPerp ? 'Open Interest' : 'Previous Day Close'}
            </span>
            <span className="text-lg font-mono font-semibold text-neutral-950 block">
              {isPerp
                ? market.open_interest !== undefined
                  ? `$${formatNumber(market.open_interest)}`
                  : '—'
                : market.prev_day_price !== undefined
                ? formatCurrency(market.prev_day_price)
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Live Orderbook (L2 Book Stream) */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-neutral-700" />
            <h2 className="text-sm font-semibold text-neutral-950">
              Live Hyperliquid Orderbook (L2)
            </h2>
          </div>
          {spread !== undefined && (
            <div className="text-xs font-mono text-neutral-500">
              Spread:{' '}
              <span className="text-neutral-900 font-semibold">
                {spread < 0.01 ? spread.toFixed(6) : spread.toFixed(2)}
              </span>{' '}
              ({spreadPct?.toFixed(3)}%)
            </div>
          )}
        </div>

        {orderbook && (orderbook.bids.length > 0 || orderbook.asks.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Bids (Buys) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-neutral-400 pb-1 border-b border-neutral-100">
                <span className="text-emerald-700">Bid Price ($)</span>
                <span>Size ({market.baseToken})</span>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto font-mono text-xs">
                {orderbook.bids.slice(0, 8).map((bid, i) => {
                  const depthPct = Math.min(100, (bid.sz / maxBidSize) * 100);
                  return (
                    <div
                      key={`bid-${i}`}
                      className="relative flex items-center justify-between py-1 px-1.5 rounded"
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-emerald-50 rounded"
                        style={{ width: `${depthPct}%` }}
                      />
                      <span className="relative z-10 text-emerald-700 font-medium">
                        {bid.px < 1 ? bid.px.toFixed(6) : bid.px.toFixed(2)}
                      </span>
                      <span className="relative z-10 text-neutral-700">
                        {bid.sz.toFixed(4)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asks (Sells) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-neutral-400 pb-1 border-b border-neutral-100">
                <span className="text-red-700">Ask Price ($)</span>
                <span>Size ({market.baseToken})</span>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto font-mono text-xs">
                {orderbook.asks.slice(0, 8).map((ask, i) => {
                  const depthPct = Math.min(100, (ask.sz / maxAskSize) * 100);
                  return (
                    <div
                      key={`ask-${i}`}
                      className="relative flex items-center justify-between py-1 px-1.5 rounded"
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-red-50 rounded"
                        style={{ width: `${depthPct}%` }}
                      />
                      <span className="relative z-10 text-red-700 font-medium">
                        {ask.px < 1 ? ask.px.toFixed(6) : ask.px.toFixed(2)}
                      </span>
                      <span className="relative z-10 text-neutral-700">
                        {ask.sz.toFixed(4)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-neutral-400">
            Connecting to Hyperliquid L2 book stream...
          </div>
        )}
      </section>

      {/* 3. Deep Market Parameters (Hyperliquid Native Specs) */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Hyperliquid Market Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {isPerp && market.funding_rate !== undefined && (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 space-y-1">
              <span className="text-[11px] uppercase font-medium text-neutral-400 block">
                1h Funding Rate
              </span>
              <span className="font-mono font-semibold text-neutral-900 block text-sm">
                {(market.funding_rate * 100).toFixed(4)}%
              </span>
              <span className="text-[11px] text-neutral-500">
                Annualized est: {(market.funding_rate * 100 * 24 * 365).toFixed(2)}% APR
              </span>
            </div>
          )}

          {isPerp && market.oracle_price !== undefined && (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 space-y-1">
              <span className="text-[11px] uppercase font-medium text-neutral-400 block">
                Oracle Price
              </span>
              <span className="font-mono font-semibold text-neutral-900 block text-sm">
                {formatCurrency(market.oracle_price)}
              </span>
              <span className="text-[11px] text-neutral-500">
                Native Hyperliquid Pyth / CEX medianizer
              </span>
            </div>
          )}

          {isPerp && market.maxLeverage !== undefined && (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 space-y-1">
              <span className="text-[11px] uppercase font-medium text-neutral-400 block">
                Max Allowed Leverage
              </span>
              <span className="font-mono font-semibold text-neutral-900 block text-sm">
                {market.maxLeverage}x
              </span>
              <span className="text-[11px] text-neutral-500">Cross or Isolated margin</span>
            </div>
          )}

          {market.szDecimals !== undefined && (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 space-y-1">
              <span className="text-[11px] uppercase font-medium text-neutral-400 block">
                Order Size Decimals
              </span>
              <span className="font-mono font-semibold text-neutral-900 block text-sm">
                {market.szDecimals} decimals
              </span>
              <span className="text-[11px] text-neutral-500">
                Min increment: {(1 / Math.pow(10, market.szDecimals)).toFixed(market.szDecimals)}
              </span>
            </div>
          )}

          {market.tokenId && (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 space-y-1 col-span-1 sm:col-span-2">
              <span className="text-[11px] uppercase font-medium text-neutral-400 block">
                Hyperliquid Token ID
              </span>
              <span className="font-mono text-xs text-neutral-900 block truncate">
                {market.tokenId}
              </span>
            </div>
          )}

          {market.contractAddress && (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 space-y-1 col-span-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-medium text-neutral-400 block">
                  EVM Contract Address
                </span>
                <button
                  type="button"
                  onClick={handleCopyContract}
                  className="text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-[10px] text-emerald-600 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <span className="font-mono text-xs text-neutral-900 block truncate">
                {market.contractAddress}
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
