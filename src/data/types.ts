export type DiscoveryItemType =
  | 'hot_project'
  | 'project'
  | 'update'
  | 'market'
  | 'market_discovery'
  | 'new_project'
  | 'ecosystem';

export interface ProjectInsight {
  title: string;
  explanation: string;
  source?: string;
}

export interface TrendSignal {
  type: 'new' | 'activity' | 'launch' | 'market' | 'update';
  label: string;
}

export interface Project {
  id: string;
  name: string;
  symbol?: string;
  logoUrl?: string;
  category?: string;
  description?: string;
  status?: string;
  websiteUrl?: string;
  docsUrl?: string;
  chain?: string;
  contractsCount?: number;
  marketsCount?: number;
  insight?: ProjectInsight;
  marketAssetId?: string;
  officialLinks?: { label: string; url: string }[];
}

export interface MarketAsset {
  id: string;
  name: string;
  symbol: string;
  logoUrl?: string;
  pair?: string;
  venue?: string;
  venueUrl?: string;
  price?: number;
  change24h?: number;
  volume24h?: number;
  marketCap?: number;
  verified?: boolean;
  description?: string;
  projectId?: string;
  marketType?: 'spot' | 'perpetual';
}

export interface HotProjectInsight {
  project: Project;
  reason?: string;
  signals?: TrendSignal[];
}

export interface DiscoveryItem {
  id: string;
  type: DiscoveryItemType;
  title: string;
  description?: string;
  timestamp?: string;
  project?: Project;
  market?: MarketAsset;
  reason?: string; // "Why it matters" contextual intelligence
  signals?: TrendSignal[];
  tag?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export const discoveryFilters = [
  'For You',
  'Hot',
  'Projects',
  'Markets',
  'New',
] as const;

export type DiscoveryFilter = (typeof discoveryFilters)[number];

export const marketFilters = [
  'Trending',
  'Gainers',
  'New',
  'Volume',
] as const;

export type MarketFilter = (typeof marketFilters)[number];

export const projectCategories = [
  'All',
  'DeFi',
  'Infrastructure',
  'Gaming',
] as const;

export type ProjectCategory = (typeof projectCategories)[number];

export type NavigationTab =
  | 'discover'
  | 'markets'
  | 'hyperliquid'
  | 'projects'
  | 'search';

export type SearchResultType = 'project' | 'token' | 'address' | 'hyperliquid';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  projectId?: string;
  marketId?: string;
  hyperliquidMarketId?: string;
  address?: string;
}

export interface ElysiumDiscoveryProvider {
  getProjects(): Promise<Project[]>;
  getMarkets(): Promise<MarketAsset[]>;
  getDiscoveryFeed(filter?: DiscoveryFilter): Promise<DiscoveryItem[]>;
  search(query: string): Promise<SearchResult[]>;
}

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
  | { status: 'empty' };
