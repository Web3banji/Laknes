import { StatusType } from '../../design-system/primitives/StatusIndicator';

/**
 * Chain Abstraction
 * Encapsulates chain-specific metadata without coupling the UI exclusively to one chain.
 */
export interface Chain {
  id: string; // e.g. 'elysium'
  name: string; // e.g. 'Elysium'
  networkName: string; // e.g. 'Elysium Mainnet'
  chainId: number; // 1339
  chainIdHex: string; // '0x53b'
  nativeAsset: {
    symbol: string; // 'LAVA'
    name: string; // 'Elysium LAVA'
    decimals: number; // 18
  };
  rpcUrl: string;
  explorerUrl: string;
  status: 'active' | 'maintenance' | 'offline';
}

export interface ProjectLink {
  label: string;
  url: string;
  type: 'website' | 'explorer' | 'docs' | 'github' | 'app';
}

export interface ProjectContract {
  address: string;
  label: string;
  standard?: 'EVM-ERC20' | 'EVM-ERC721' | 'EVM-ERC1155' | 'Core-Protocol' | string;
  verified?: boolean;
}

export interface ProjectTechnicalDetails {
  contractAddress?: string;
  tokenSymbol?: string;
  standard?: 'EVM-ERC20' | 'EVM-ERC721' | 'EVM-ERC1155' | 'Core-Protocol' | string;
  verifiedSource?: boolean;
}

export type VerificationStatus = 'verified' | 'unverified' | 'pending';

/**
 * Project Model
 * Central entity for discovery, onboarding, and lifecycle management.
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  summary?: string; // backwards compatibility
  logo?: string;
  category: 'Gaming' | 'DeFi' | 'Infrastructure' | 'Tooling' | 'Community' | string;
  status: StatusType | string;
  statusLabel?: string;
  verificationStatus: VerificationStatus;
  isVerified: boolean; // computed or explicit flag
  chain: string; // e.g. 'elysium'
  website: string;
  websiteUrl?: string; // backwards compatibility
  socialLinks?: {
    twitter?: string;
    discord?: string;
    github?: string;
    telegram?: string;
  };
  links: ProjectLink[];
  contracts?: ProjectContract[];
  technicalDetails?: ProjectTechnicalDetails;
  assets?: string[]; // IDs of associated assets
  markets?: string[]; // IDs of associated markets
  activity?: string[]; // IDs of associated activities
  questIds?: string[];
  liquidityStage?: 'Planning' | 'Readiness' | 'Active Migration' | 'Completed';
  createdAt?: string;
  isTrending?: boolean;
  isNew?: boolean;
}

/**
 * Asset Model
 * Represents fungible and protocol tokens existing on the chain.
 */
export interface Asset {
  id: string;
  symbol: string; // e.g. 'LAVA', 'PYR', 'USDC'
  name: string; // e.g. 'Vulcan Forged', 'Elysium LAVA'
  logo?: string;
  chain: string; // 'elysium'
  contractAddress?: string; // null/undefined for native currency
  isNative?: boolean;
  decimals: number;
  projectId?: string;
  projectName?: string;
  markets?: string[]; // IDs of markets where this asset trades
  price?: number | null; // null if unavailable, NEVER fake
  volume24h?: number | null; // null if unavailable
  marketCap?: number | null;
  marketDataSource?: string; // e.g. 'Elysium Swap AMM', 'Pyth Oracle'
  verifiedSource?: boolean;
}

/**
 * Market Model
 * Represents trading venues, spot pairs, and perpetuals.
 */
export type MarketType = 'spot' | 'perpetual';

export interface Market {
  id: string;
  asset: string; // Base asset symbol, e.g. 'PYR'
  quoteAsset: string; // Quote asset symbol, e.g. 'LAVA'
  pair: string; // e.g. 'PYR/LAVA'
  marketType: MarketType;
  venue: string; // e.g. 'Elysium Swap'
  venueUrl?: string;
  chain: string; // 'elysium'
  contractAddress?: string; // Pair or router contract
  price?: number | null;
  priceFormatted?: string;
  volume24h?: number | null;
  change24h?: number | null;
  openInterest?: number | null; // for perps
  liquidity?: number | null;
  dataSource: string; // e.g. 'Elysium Swap Router', 'Pyth Network'
  status: 'active' | 'paused' | 'unpaired';
}

/**
 * Activity Model
 * Verifiable events occurring in the ecosystem, projects, markets, and on-chain.
 */
export type ActivityCategory = 'ecosystem' | 'project' | 'market' | 'on_chain';

export interface Activity {
  id: string;
  chain: string;
  category: ActivityCategory;
  projectId?: string;
  projectName?: string;
  assetId?: string;
  marketId?: string;
  type: string; // e.g. 'Contract Deployed', 'Pair Created', 'Validator Verified', 'Protocol Upgrade'
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    txHash?: string;
    blockNumber?: number;
    explorerUrl?: string;
    contractAddress?: string;
    venue?: string;
    amount?: string;
  };
}

export interface QuestStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  requiresWallet: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  track: 'Onboarding' | 'Ecosystem Exploration' | 'Liquidity Participation' | 'Developer';
  steps: QuestStep[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  rewardInfo?: string;
  requirements?: string[];
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: 'Grant' | 'Liquidity Migration' | 'Ecosystem Test' | 'Community Role';
  projectId?: string;
  projectName?: string;
  actionLabel: string;
  actionType: 'internal_nav' | 'external_link';
  target: string;
  deadline?: string;
}

export interface EcosystemFilterParams {
  searchQuery?: string;
  category?: string;
  verifiedOnly?: boolean;
  viewFilter?: 'all' | 'trending' | 'new' | 'verified';
  chain?: string;
  limit?: number;
  offset?: number;
}
