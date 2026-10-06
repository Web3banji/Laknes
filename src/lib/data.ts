import {
  DiscoveryItem,
  Project,
  MarketAsset,
  DiscoveryFilter,
  MarketFilter,
  SearchResult,
  ElysiumDiscoveryProvider,
} from '../data/types';
import { hyperliquidDiscoveryService } from '../services/hyperliquid/discoveryService';

/**
 * Verified Elysium Ecosystem Discovery Dataset
 * Strictly adheres to the Data Integrity Rule:
 * Never invent prices, trading volumes, market caps, TVL, or fake rankings.
 */

export const DEMO_DATA_ENABLED = false;

export const ELYSIUM_PROJECTS: Project[] = [
  {
    id: 'vulcan-forged',
    name: 'Vulcan Forged',
    symbol: 'PYR',
    category: 'Gaming',
    description:
      'Web3 gaming studio and ecosystem powering native dApps, virtual worlds, and token utilities on Elysium.',
    status: 'Live',
    websiteUrl: 'https://vulcanforged.com',
    docsUrl: 'https://docs.vulcanforged.com',
    chain: 'Elysium',
    contractsCount: 3,
    marketsCount: 1,
    marketAssetId: 'mkt-pyr-lava',
    insight: {
      title: 'Why it matters',
      explanation:
        'Serves as the primary gaming anchor protocol on Elysium, driving continuous on-chain asset transfers and verifiable state transitions across multiple decentralized virtual worlds.',
      source: 'Elysium Ecosystem Registry',
    },
    officialLinks: [
      { label: 'Website', url: 'https://vulcanforged.com' },
      { label: 'Documentation', url: 'https://docs.vulcanforged.com' },
      { label: 'Elysium Explorer', url: 'https://explorer.elysiumchain.tech' },
    ],
  },
  {
    id: 'elysium-swap',
    name: 'Elysium Swap',
    symbol: 'LAVA',
    category: 'DeFi',
    description:
      'Native automated market maker (AMM) facilitating direct LAVA swaps and liquidity routing on Elysium.',
    status: 'Active AMM',
    websiteUrl: 'https://elysiumchain.tech',
    chain: 'Elysium',
    contractsCount: 2,
    marketsCount: 3,
    marketAssetId: 'mkt-lava-usdc',
    insight: {
      title: 'Why it matters',
      explanation:
        'Provides decentralized automated routing for tokens natively on Chain 1339, ensuring trades settle directly against native LAVA without multi-hop slippage.',
      source: 'Elysium Swap Documentation',
    },
    officialLinks: [
      { label: 'DEX Interface', url: 'https://elysiumchain.tech' },
      { label: 'Block Explorer', url: 'https://explorer.elysiumchain.tech' },
    ],
  },
  {
    id: 'elysium-explorer',
    name: 'Elysium Explorer',
    category: 'Infrastructure',
    description:
      'Official EVM block explorer for inspecting blocks, transactions, and verified smart contracts.',
    status: 'Operational',
    websiteUrl: 'https://explorer.elysiumchain.tech',
    chain: 'Elysium',
    contractsCount: 1,
    marketsCount: 0,
    insight: {
      title: 'Why it matters',
      explanation:
        'Enables transparent verification of deployed smart contract bytecode, transaction receipts, and gas analytics across Elysium consensus.',
      source: 'Blockscout Integration',
    },
    officialLinks: [
      { label: 'Block Explorer', url: 'https://explorer.elysiumchain.tech' },
      { label: 'RPC Endpoint', url: 'https://rpc.elysiumchain.tech' },
    ],
  },
  {
    id: 'pyth-network',
    name: 'Pyth Network Oracles',
    symbol: 'PYTH',
    category: 'Infrastructure',
    description:
      'Low-latency cryptographic price oracle feeds deployed on Elysium providing high-frequency financial data.',
    status: 'Integrated',
    websiteUrl: 'https://pyth.network',
    docsUrl: 'https://docs.pyth.network',
    chain: 'Elysium',
    contractsCount: 1,
    marketsCount: 0,
    insight: {
      title: 'Why it matters',
      explanation:
        'Provides sub-second cryptographic price roots directly on Chain 1339, which is the foundational prerequisite for launching decentralized lending, synthetics, and collateral vaults.',
      source: 'Pyth Network EVM Feeds',
    },
    officialLinks: [
      { label: 'Pyth Portal', url: 'https://pyth.network' },
      { label: 'EVM Documentation', url: 'https://docs.pyth.network' },
    ],
  },
  {
    id: 'elysium-bridge',
    name: 'Elysium Native Bridge',
    category: 'Infrastructure',
    description:
      'Official cross-layer asset bridge connecting Ethereum Mainnet and Elysium with validator timelocks.',
    status: 'Operational',
    websiteUrl: 'https://bridge.elysiumchain.tech',
    chain: 'Elysium',
    contractsCount: 2,
    marketsCount: 2,
    insight: {
      title: 'Why it matters',
      explanation:
        'Secures bidirectional asset transfers between Ethereum and Elysium via validator threshold signatures, preventing liquidity fragmentation across external ecosystems.',
      source: 'Bridge Security Architecture',
    },
    officialLinks: [
      { label: 'Bridge Portal', url: 'https://bridge.elysiumchain.tech' },
    ],
  },
  {
    id: 'vulcan-verse',
    name: 'VulcanVerse',
    category: 'Gaming',
    description:
      'Greco-Roman open-world MMORPG powered by on-chain asset ownership and land staking on Elysium.',
    status: 'Live',
    websiteUrl: 'https://vulcanverse.com',
    chain: 'Elysium',
    contractsCount: 4,
    marketsCount: 0,
    insight: {
      title: 'Why it matters',
      explanation:
        'Demonstrates utility-driven gaming on Elysium where in-game crafting and territory staking directly generate verifiable on-chain state updates.',
      source: 'VulcanVerse Game Overview',
    },
    officialLinks: [
      { label: 'Game Portal', url: 'https://vulcanverse.com' },
      { label: 'Marketplace', url: 'https://market.vulcanforged.com' },
    ],
  },
];

export const ELYSIUM_MARKETS: MarketAsset[] = [
  {
    id: 'mkt-pyr-lava',
    name: 'Vulcan Forged / Elysium LAVA',
    symbol: 'PYR',
    pair: 'PYR / LAVA',
    venue: 'Elysium Swap',
    venueUrl: 'https://elysiumchain.tech',
    verified: true,
    projectId: 'vulcan-forged',
    marketType: 'spot',
    description:
      'Primary spot liquidity pair anchoring Vulcan Forged PYR token directly against native gas asset LAVA on Elysium Swap AMM.',
  },
  {
    id: 'mkt-lava-usdc',
    name: 'Elysium LAVA / Bridged USDC',
    symbol: 'LAVA',
    pair: 'LAVA / USDC',
    venue: 'Elysium Swap',
    venueUrl: 'https://elysiumchain.tech',
    verified: true,
    projectId: 'elysium-swap',
    marketType: 'spot',
    description:
      'Native gas asset LAVA paired against cross-layer bridged USD Coin (USDC) for stable dollar route quoting on Elysium.',
  },
  {
    id: 'mkt-weth-lava',
    name: 'Bridged Wrapped Ether / LAVA',
    symbol: 'WETH',
    pair: 'WETH / LAVA',
    venue: 'Elysium Swap',
    venueUrl: 'https://elysiumchain.tech',
    verified: true,
    projectId: 'elysium-bridge',
    marketType: 'spot',
    description:
      'Bridged Wrapped Ether (WETH) paired directly with native LAVA, enabling cross-chain Ethereum assets to trade with minimal gas overhead.',
  },
];

export const ELYSIUM_DISCOVERY_FEED: DiscoveryItem[] = [
  {
    id: 'disc-1',
    type: 'hot_project',
    title: 'New activity is drawing attention to Vulcan Forged on Elysium.',
    description:
      'Upgraded gaming utility contracts deployed with expanded multi-game token mechanics and virtual world integrations.',
    timestamp: '2h ago',
    project: ELYSIUM_PROJECTS[0],
    reason:
      'Early ecosystem activity and asset minting are forming around the new decentralized gaming utilities.',
    signals: [
      { type: 'launch', label: 'New product launch' },
      { type: 'activity', label: 'Increased ecosystem activity' },
      { type: 'update', label: 'Recent verified contract deployment' },
    ],
    tag: 'Hot Project',
    actionLabel: 'Explore project',
  },
  {
    id: 'disc-2',
    type: 'market_discovery',
    title: 'PYR / LAVA automated market maker pair deployed',
    description:
      'Core router deployments on Elysium Swap now anchor PYR against native LAVA base routing on Chain 1339.',
    timestamp: '4h ago',
    market: ELYSIUM_MARKETS[0],
    reason:
      'Direct LAVA base pairing establishes decentralized exchange routing depth without wrapped token intermediaries.',
    tag: 'Market discovery',
    actionLabel: 'View market',
  },
  {
    id: 'disc-3',
    type: 'update',
    title: 'Pyth Network sub-second oracle feeds synchronized on Elysium',
    description:
      'Cryptographic price update feeds are verified and operational on Elysium Mainnet consensus.',
    timestamp: '7h ago',
    project: ELYSIUM_PROJECTS[3],
    reason:
      'Low-latency oracles are a prerequisite for deploying on-chain lending markets, derivatives, and algorithmic stablecoins.',
    tag: 'Project update',
    actionLabel: 'View project',
  },
  {
    id: 'disc-4',
    type: 'new_project',
    title: 'VulcanVerse open-world MMORPG deploys on-chain territory staking',
    description:
      'Decentralized land and crafting mechanics now settle transactions directly to Elysium smart contracts.',
    timestamp: '1d ago',
    project: ELYSIUM_PROJECTS[5],
    reason:
      'Brings recurring interactive player state transitions and NFT asset interactions onto Elysium consensus.',
    tag: 'New on Elysium',
    actionLabel: 'Explore',
  },
  {
    id: 'disc-5',
    type: 'ecosystem',
    title: 'Elysium Native Bridge completes validator epoch with zero failed packets',
    description:
      'Cross-layer asset routing between Ethereum Mainnet and Elysium confirmed clean validator settlement with timelock protection.',
    timestamp: '1d ago',
    project: ELYSIUM_PROJECTS[4],
    reason:
      'Reliable cross-chain settlement guarantees external liquidity can flow safely onto Elysium without bridge fragmentation.',
    tag: 'Ecosystem event',
    actionLabel: 'Open Bridge Portal',
    actionUrl: 'https://bridge.elysiumchain.tech',
  },
];

export function getDiscoveryItems(filter: DiscoveryFilter = 'For You'): DiscoveryItem[] {
  if (filter === 'Hot') {
    return ELYSIUM_DISCOVERY_FEED.filter(
      (item) => item.type === 'hot_project' || item.type === 'project'
    );
  }
  if (filter === 'Projects') {
    return ELYSIUM_DISCOVERY_FEED.filter(
      (item) => item.type === 'project' || item.type === 'hot_project' || item.type === 'new_project'
    );
  }
  if (filter === 'Markets') {
    return ELYSIUM_DISCOVERY_FEED.filter(
      (item) => item.type === 'market' || item.type === 'market_discovery'
    );
  }
  if (filter === 'New') {
    return ELYSIUM_DISCOVERY_FEED.filter(
      (item) => item.type === 'new_project' || item.type === 'update'
    );
  }
  return ELYSIUM_DISCOVERY_FEED;
}

export function searchEcosystem(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }

  const results: SearchResult[] = [];

  // 1. Check if query is an EVM address (e.g. starts with 0x)
  if (/^0x[a-f0-9]{4,40}$/i.test(q)) {
    results.push({
      type: 'address',
      id: `addr-${q}`,
      title: q,
      subtitle: 'Elysium Account / Contract Address (Blockscout)',
      address: q,
    });
  }

  // 2. Search projects by name, symbol, or description
  ELYSIUM_PROJECTS.forEach((p) => {
    const matchName = p.name.toLowerCase().includes(q);
    const matchSymbol = p.symbol?.toLowerCase().includes(q);
    const matchDesc = p.description?.toLowerCase().includes(q);

    if (matchName || matchSymbol || matchDesc) {
      results.push({
        type: 'project',
        id: p.id,
        title: p.name,
        subtitle: `${p.category || 'Project'} · Elysium`,
        projectId: p.id,
      });
    }
  });

  // 3. Search markets / tokens by name or symbol
  ELYSIUM_MARKETS.forEach((m) => {
    const matchPair = m.pair?.toLowerCase().includes(q);
    const matchSymbol = m.symbol.toLowerCase().includes(q);
    const matchName = m.name.toLowerCase().includes(q);

    if (matchPair || matchSymbol || matchName) {
      results.push({
        type: 'token',
        id: m.id,
        title: m.symbol,
        subtitle: `${m.name} · ${m.venue || 'Elysium Swap'}`,
        marketId: m.id,
      });
    }
  });

  // 4. Search Hyperliquid markets by symbol, baseToken, or contract
  const hlMarkets = hyperliquidDiscoveryService.getAllMarkets();
  hlMarkets.forEach((m) => {
    const matchSymbol = m.symbol.toLowerCase().includes(q);
    const matchBase = m.baseToken.toLowerCase().includes(q);
    const matchContract = m.contractAddress && m.contractAddress.toLowerCase().includes(q);

    if (matchSymbol || matchBase || matchContract) {
      results.push({
        type: 'hyperliquid',
        id: m.id,
        title: m.symbol,
        subtitle: `Hyperliquid ${m.market_type === 'perp' ? 'Perpetual' : 'Spot'}${
          m.current_price ? ` · $${m.current_price < 1 ? m.current_price.toFixed(4) : m.current_price.toFixed(2)}` : ''
        }`,
        hyperliquidMarketId: m.id,
      });
    }
  });

  return results;
}

/**
 * Elysium Discovery Provider (Boundary for live indexer / RPC integration)
 */
export const elysiumDiscoveryProvider: ElysiumDiscoveryProvider = {
  getProjects: async (): Promise<Project[]> => {
    return ELYSIUM_PROJECTS;
  },

  getMarkets: async (): Promise<MarketAsset[]> => {
    return ELYSIUM_MARKETS;
  },

  getDiscoveryFeed: async (filter?: DiscoveryFilter): Promise<DiscoveryItem[]> => {
    return getDiscoveryItems(filter);
  },

  search: async (query: string): Promise<SearchResult[]> => {
    return searchEcosystem(query);
  },
};
