import React from 'react';
import { HyperliquidMarket } from '../../services/hyperliquid/types';
import { RelativeTime } from './RelativeTime';
import { formatCurrency, formatNumber, formatPercentage } from '../../lib/formatters';
import { ArrowRight, Activity, TrendingUp, TrendingDown } from 'lucide-react';

export interface HyperliquidMarketCardProps {
  market: HyperliquidMarket;
  onSelect: (market: HyperliquidMarket) => void;
}

export function HyperliquidMarketCard({ market, onSelect }: HyperliquidMarketCardProps) {
  const isPerp = market.market_type === 'perp';
  const hasPrice = market.current_price !== undefined && market.current_price > 0;
  const hasVolume = market.volume24h !== undefined && market.volume24h > 0;
  const hasChange = market.price_change_24h !== undefined;
  const hasOI = isPerp && market.open_interest !== undefined && market.open_interest > 0;
  const hasFunding = isPerp && market.funding_rate !== undefined;

  return (
    <article
      onClick={() => onSelect(market)}
      className="group relative rounded-2xl border border-neutral-200/90 bg-white p-5 transition-all hover:border-neutral-400 hover:shadow-xs cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Badges & Relative Detection Time */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            {!market.is_historical && (
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/80 uppercase tracking-wider animate-pulse">
                NEW
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                isPerp
                  ? 'bg-purple-50 text-purple-700 border-purple-200/70'
                  : 'bg-blue-50 text-blue-700 border-blue-200/70'
              }`}
            >
              Hyperliquid {isPerp ? 'Perpetual' : 'Spot'}
            </span>
          </div>

          <RelativeTime
            timestamp={market.first_detected_at}
            isHistorical={market.is_historical}
            className="text-[11px] font-medium text-neutral-400"
          />
        </div>

        {/* Symbol & Name */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-semibold text-neutral-950 group-hover:text-neutral-700 transition-colors flex items-center gap-1.5">
              <span>{market.symbol}</span>
            </h3>
            <div className="text-xs text-neutral-400 font-mono mt-0.5">
              {market.baseToken} · {market.quoteToken}
            </div>
          </div>

          {/* Current Price */}
          {hasPrice && (
            <div className="text-right">
              <div className="font-mono text-base font-semibold text-neutral-950">
                {formatCurrency(market.current_price!)}
              </div>
              {hasChange && (
                <div
                  className={`text-xs font-mono font-medium flex items-center justify-end gap-0.5 ${
                    market.price_change_24h! >= 0
                      ? 'text-emerald-700'
                      : 'text-red-700'
                  }`}
                >
                  {market.price_change_24h! >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{formatPercentage(market.price_change_24h!).formatted}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Key Metrics Grid (strictly real Hyperliquid data) */}
        <div className="rounded-xl bg-neutral-50/80 p-3 grid grid-cols-2 gap-2 text-xs border border-neutral-100">
          {hasVolume && (
            <div>
              <span className="text-[10px] uppercase font-medium text-neutral-400 block">
                24h Volume
              </span>
              <span className="font-mono font-medium text-neutral-800">
                ${formatNumber(market.volume24h!)}
              </span>
            </div>
          )}

          {hasOI && (
            <div>
              <span className="text-[10px] uppercase font-medium text-neutral-400 block">
                Open Interest
              </span>
              <span className="font-mono font-medium text-neutral-800">
                ${formatNumber(market.open_interest!)}
              </span>
            </div>
          )}

          {hasFunding && (
            <div>
              <span className="text-[10px] uppercase font-medium text-neutral-400 block">
                1h Funding
              </span>
              <span className="font-mono font-medium text-neutral-800">
                {(market.funding_rate! * 100).toFixed(4)}%
              </span>
            </div>
          )}

          {market.oracle_price !== undefined && market.oracle_price > 0 && (
            <div>
              <span className="text-[10px] uppercase font-medium text-neutral-400 block">
                Oracle Price
              </span>
              <span className="font-mono font-medium text-neutral-800">
                {formatCurrency(market.oracle_price)}
              </span>
            </div>
          )}

          {market.maxLeverage !== undefined && (
            <div>
              <span className="text-[10px] uppercase font-medium text-neutral-400 block">
                Max Leverage
              </span>
              <span className="font-mono font-medium text-neutral-800">
                {market.maxLeverage}x
              </span>
            </div>
          )}

          {market.contractAddress && (
            <div className="col-span-2">
              <span className="text-[10px] uppercase font-medium text-neutral-400 block">
                Contract
              </span>
              <span className="font-mono text-[11px] text-neutral-600 truncate block">
                {market.contractAddress}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Explore Action */}
      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-neutral-900 group-hover:text-neutral-950">
        <span className="flex items-center gap-1.5 text-neutral-500 group-hover:text-neutral-950 transition-colors">
          <Activity className="h-3.5 w-3.5 text-emerald-600" />
          <span>Live Orderbook & Market Data</span>
        </span>
        <div className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          <span>Explore</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </article>
  );
}
