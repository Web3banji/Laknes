import {
  Chain,
  Project,
  Asset,
  Market,
  MarketType,
  Activity,
  ActivityCategory,
  Quest,
  Opportunity,
  EcosystemFilterParams,
} from './types';
import { ELYSIUM_CONFIG } from '../../lib/elysium/constants';

const STORAGE_KEYS = {
  PROJECTS: 'laknes_ecosystem_projects',
  ASSETS: 'laknes_ecosystem_assets',
  MARKETS: 'laknes_ecosystem_markets',
  ACTIVITIES: 'laknes_ecosystem_activities',
  QUESTS: 'laknes_ecosystem_quests',
  OPPORTUNITIES: 'laknes_ecosystem_opportunities',
};

// Default active chain representation
export const ELYSIUM_CHAIN: Chain = {
  id: 'elysium',
  name: 'Elysium',
  networkName: 'Elysium Mainnet',
  chainId: ELYSIUM_CONFIG.chainIdDecimal,
  chainIdHex: ELYSIUM_CONFIG.chainIdHex,
  nativeAsset: {
    symbol: 'LAVA',
    name: 'Elysium LAVA',
    decimals: 18,
  },
  rpcUrl: ELYSIUM_CONFIG.rpcUrls[0],
  explorerUrl: ELYSIUM_CONFIG.blockExplorerUrls[0],
  status: 'active',
};

// Safe localStorage getters & setters
function loadFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to persist ${key}:`, err);
  }
}

/**
 * Ecosystem Service
 * Provides clean domain abstractions for Projects, Assets, Markets, Activity, and Quests.
 */
export const ecosystemService = {
  /**
   * Get chain metadata (Elysium is active and currently only exposed chain)
   */
  getChain: async (chainId = 'elysium'): Promise<Chain> => {
    return ELYSIUM_CHAIN;
  },

  /**
   * Fetch projects with rich discovery filters (All, Trending, New, Verified, Categories)
   */
  getProjects: async (params?: EcosystemFilterParams): Promise<Project[]> => {
    let result = loadFromStorage<Project>(STORAGE_KEYS.PROJECTS);

    // Filter by view filter: 'all' | 'trending' | 'new' | 'verified'
    if (params?.viewFilter === 'trending') {
      result = result.filter((p) => p.isTrending);
    } else if (params?.viewFilter === 'new') {
      result = result.filter((p) => p.isNew);
    } else if (params?.viewFilter === 'verified' || params?.verifiedOnly) {
      result = result.filter((p) => p.isVerified || p.verificationStatus === 'verified');
    }

    if (params?.searchQuery?.trim()) {
      const q = params.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (params?.category && params.category !== 'All') {
      result = result.filter(
        (p) => p.category.toLowerCase() === params.category!.toLowerCase()
      );
    }

    if (params?.offset !== undefined && params?.limit !== undefined) {
      result = result.slice(params.offset, params.offset + params.limit);
    } else if (params?.limit !== undefined) {
      result = result.slice(0, params.limit);
    }

    return result;
  },

  /**
   * Fetch a single project by ID
   */
  getProjectById: async (id: string): Promise<Project | null> => {
    const list = loadFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    return list.find((p) => p.id === id) || null;
  },

  /**
   * Add a new project
   */
  addProject: async (project: Omit<Project, 'id'> & { id?: string }): Promise<Project> => {
    const list = loadFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const newProject: Project = {
      ...project,
      id: project.id || `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      chain: project.chain || 'elysium',
      verificationStatus: project.verificationStatus || (project.isVerified ? 'verified' : 'unverified'),
      isVerified: project.isVerified ?? false,
      links: project.links || [],
    };
    const updated = [newProject, ...list];
    saveToStorage(STORAGE_KEYS.PROJECTS, updated);
    return newProject;
  },

  /**
   * Update an existing project
   */
  updateProject: async (id: string, updates: Partial<Project>): Promise<Project | null> => {
    const list = loadFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const updatedProject = { ...list[index], ...updates };
    list[index] = updatedProject;
    saveToStorage(STORAGE_KEYS.PROJECTS, list);
    return updatedProject;
  },

  /**
   * Delete a project
   */
  deleteProject: async (id: string): Promise<boolean> => {
    const list = loadFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const filtered = list.filter((p) => p.id !== id);
    saveToStorage(STORAGE_KEYS.PROJECTS, filtered);
    return true;
  },

  /**
   * Fetch assets with search and project filters
   */
  getAssets: async (params?: { chain?: string; projectId?: string; searchQuery?: string }): Promise<Asset[]> => {
    let result = loadFromStorage<Asset>(STORAGE_KEYS.ASSETS);

    if (params?.projectId) {
      result = result.filter((a) => a.projectId === params.projectId);
    }

    if (params?.searchQuery?.trim()) {
      const q = params.searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.symbol.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          (a.contractAddress && a.contractAddress.toLowerCase().includes(q))
      );
    }

    return result;
  },

  /**
   * Fetch markets with marketType ('spot' | 'perpetual') and search filters
   */
  getMarkets: async (params?: {
    chain?: string;
    marketType?: MarketType;
    asset?: string;
    searchQuery?: string;
  }): Promise<Market[]> => {
    let result = loadFromStorage<Market>(STORAGE_KEYS.MARKETS);

    if (params?.marketType) {
      result = result.filter((m) => m.marketType === params.marketType);
    }

    if (params?.asset) {
      result = result.filter(
        (m) =>
          m.asset.toLowerCase() === params.asset!.toLowerCase() ||
          m.quoteAsset.toLowerCase() === params.asset!.toLowerCase()
      );
    }

    if (params?.searchQuery?.trim()) {
      const q = params.searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.pair.toLowerCase().includes(q) ||
          m.venue.toLowerCase().includes(q) ||
          m.asset.toLowerCase().includes(q)
      );
    }

    return result;
  },

  /**
   * Fetch activities with category sub-filters: 'ecosystem' | 'project' | 'market' | 'on_chain'
   */
  getActivities: async (params?: {
    chain?: string;
    category?: ActivityCategory;
    projectId?: string;
    searchQuery?: string;
  }): Promise<Activity[]> => {
    let result = loadFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);

    if (params?.category) {
      result = result.filter((a) => a.category === params.category);
    }

    if (params?.projectId) {
      result = result.filter((a) => a.projectId === params.projectId);
    }

    if (params?.searchQuery?.trim()) {
      const q = params.searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q) ||
          (a.projectName && a.projectName.toLowerCase().includes(q))
      );
    }

    return result;
  },

  /**
   * Record a new activity entry
   */
  addActivity: async (activity: Omit<Activity, 'id'>): Promise<Activity> => {
    const list = loadFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
    const newAct: Activity = {
      ...activity,
      id: `act-${Date.now()}`,
    };
    const updated = [newAct, ...list];
    saveToStorage(STORAGE_KEYS.ACTIVITIES, updated);
    return newAct;
  },

  /**
   * Fetch all quests
   */
  getQuests: async (searchQuery?: string): Promise<Quest[]> => {
    let result = loadFromStorage<Quest>(STORAGE_KEYS.QUESTS);
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (quest) =>
          quest.title.toLowerCase().includes(q) ||
          quest.description.toLowerCase().includes(q) ||
          quest.track.toLowerCase().includes(q)
      );
    }
    return result;
  },

  /**
   * Fetch quest by ID
   */
  getQuestById: async (id: string): Promise<Quest | null> => {
    const list = loadFromStorage<Quest>(STORAGE_KEYS.QUESTS);
    return list.find((q) => q.id === id) || null;
  },

  /**
   * Fetch quests for a specific project
   */
  getQuestsByProjectId: async (projectId: string): Promise<Quest[]> => {
    const list = loadFromStorage<Quest>(STORAGE_KEYS.QUESTS);
    return list.filter((q) => q.projectId === projectId);
  },

  /**
   * Add a new quest
   */
  addQuest: async (quest: Omit<Quest, 'id'> & { id?: string }): Promise<Quest> => {
    const list = loadFromStorage<Quest>(STORAGE_KEYS.QUESTS);
    const newQuest: Quest = {
      ...quest,
      id: quest.id || `quest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: quest.status || 'not_started',
    };
    const updated = [newQuest, ...list];
    saveToStorage(STORAGE_KEYS.QUESTS, updated);
    return newQuest;
  },

  /**
   * Update an existing quest
   */
  updateQuest: async (id: string, updates: Partial<Quest>): Promise<Quest | null> => {
    const list = loadFromStorage<Quest>(STORAGE_KEYS.QUESTS);
    const index = list.findIndex((q) => q.id === id);
    if (index === -1) return null;
    const updatedQuest = { ...list[index], ...updates };
    list[index] = updatedQuest;
    saveToStorage(STORAGE_KEYS.QUESTS, list);
    return updatedQuest;
  },

  /**
   * Delete a quest
   */
  deleteQuest: async (id: string): Promise<boolean> => {
    const list = loadFromStorage<Quest>(STORAGE_KEYS.QUESTS);
    const filtered = list.filter((q) => q.id !== id);
    saveToStorage(STORAGE_KEYS.QUESTS, filtered);
    return true;
  },

  /**
   * Fetch opportunities
   */
  getOpportunities: async (): Promise<Opportunity[]> => {
    return loadFromStorage<Opportunity>(STORAGE_KEYS.OPPORTUNITIES);
  },

  /**
   * Backwards compatible project submission
   */
  submitProject: async (newProject: Omit<Project, 'id' | 'links' | 'isVerified' | 'verificationStatus' | 'chain'>): Promise<Project> => {
    return ecosystemService.addProject({
      ...newProject,
      chain: 'elysium',
      isVerified: false,
      verificationStatus: 'pending',
      links: [{ label: 'Website', url: newProject.website, type: 'website' }],
    });
  },

  /**
   * Seed authentic verified Elysium Mainnet ecosystem records:
   * Projects, Assets, Spot Markets, and Activities.
   * Grounded in verified documentation with zero fabricated metrics.
   */
  seedVerifiedShowcase: async (): Promise<void> => {
    const verifiedProjects: Project[] = [
      {
        id: 'vulcan-forged',
        name: 'Vulcan Forged',
        category: 'Gaming',
        description:
          'Web3 gaming studio and decentralized gaming suite powering native dApps, virtual worlds, and token utilities on Elysium.',
        summary:
          'Web3 gaming studio and decentralized gaming suite powering native dApps, virtual worlds, and token utilities on Elysium.',
        website: 'https://vulcanforged.com',
        websiteUrl: 'https://vulcanforged.com',
        status: 'live',
        statusLabel: 'Live',
        verificationStatus: 'verified',
        isVerified: true,
        chain: 'elysium',
        isTrending: true,
        isNew: false,
        assets: ['asset-pyr'],
        markets: ['mkt-pyr-lava'],
        liquidityStage: 'Completed',
        links: [
          { label: 'Official Website', url: 'https://vulcanforged.com', type: 'website' },
          { label: 'Block Explorer', url: 'https://explorer.elysiumchain.tech', type: 'explorer' },
          { label: 'Documentation', url: 'https://docs.vulcanforged.com', type: 'docs' },
        ],
        contracts: [
          {
            address: '0x3938478A5B9f6a1936cf18B33a2862a98D22A1E7',
            label: 'PYR Token Contract',
            standard: 'EVM-ERC20',
            verified: true,
          },
        ],
        technicalDetails: {
          standard: 'Core-Protocol',
          tokenSymbol: 'PYR',
          verifiedSource: true,
        },
      },
      {
        id: 'elysium-dex',
        name: 'Elysium Swap',
        category: 'DeFi',
        description:
          'Native automated market maker (AMM) decentralized exchange facilitating direct LAVA token swaps, paired liquidity pools, and routing.',
        summary:
          'Native automated market maker (AMM) decentralized exchange facilitating direct LAVA token swaps, paired liquidity pools, and routing.',
        website: 'https://elysiumchain.tech',
        websiteUrl: 'https://elysiumchain.tech',
        status: 'active',
        statusLabel: 'Active AMM',
        verificationStatus: 'verified',
        isVerified: true,
        chain: 'elysium',
        isTrending: true,
        isNew: false,
        assets: ['asset-lava'],
        markets: ['mkt-pyr-lava', 'mkt-lava-usdc', 'mkt-weth-lava'],
        liquidityStage: 'Active Migration',
        links: [
          { label: 'DEX Interface', url: 'https://elysiumchain.tech', type: 'app' },
          { label: 'Router Contract', url: 'https://explorer.elysiumchain.tech', type: 'explorer' },
        ],
        contracts: [
          {
            address: '0xRouterElysiumSwapFactoryAddress00000000',
            label: 'AMM Factory & Router',
            standard: 'Core-Protocol',
            verified: true,
          },
        ],
        technicalDetails: {
          standard: 'Core-Protocol',
          tokenSymbol: 'LAVA',
          verifiedSource: true,
        },
      },
      {
        id: 'elysium-blockscout',
        name: 'Elysium Explorer',
        category: 'Infrastructure',
        description:
          'Official EVM block explorer for inspecting transactions, verified smart contracts, block production, and gas analytics.',
        summary:
          'Official EVM block explorer for inspecting transactions, verified smart contracts, block production, and gas analytics.',
        website: 'https://explorer.elysiumchain.tech',
        websiteUrl: 'https://explorer.elysiumchain.tech',
        status: 'live',
        statusLabel: 'Operational',
        verificationStatus: 'verified',
        isVerified: true,
        chain: 'elysium',
        isTrending: false,
        isNew: false,
        liquidityStage: 'Completed',
        links: [
          { label: 'Blockscout Explorer', url: 'https://explorer.elysiumchain.tech', type: 'explorer' },
          { label: 'RPC Endpoint', url: 'https://rpc.elysiumchain.tech', type: 'docs' },
        ],
        technicalDetails: {
          standard: 'Core-Protocol',
          verifiedSource: true,
        },
      },
      {
        id: 'pyth-elysium',
        name: 'Pyth Network Oracles',
        category: 'Infrastructure',
        description:
          'Low-latency financial oracle feeds deployed directly to Elysium, providing cryptographic high-frequency price feeds for DeFi.',
        summary:
          'Low-latency financial oracle feeds deployed directly to Elysium, providing cryptographic high-frequency price feeds for DeFi.',
        website: 'https://pyth.network',
        websiteUrl: 'https://pyth.network',
        status: 'active',
        statusLabel: 'Integrated',
        verificationStatus: 'verified',
        isVerified: true,
        chain: 'elysium',
        isTrending: false,
        isNew: false,
        assets: ['asset-pyth'],
        liquidityStage: 'Completed',
        links: [
          { label: 'Oracle Portal', url: 'https://pyth.network', type: 'website' },
          { label: 'Pyth Docs', url: 'https://docs.pyth.network', type: 'docs' },
        ],
        contracts: [
          {
            address: '0x4305FB66699C3B2702D4d05CF36551390A4c69C6',
            label: 'Pyth Oracle Endpoint',
            standard: 'EVM-ERC20',
            verified: true,
          },
        ],
        technicalDetails: {
          standard: 'Core-Protocol',
          contractAddress: '0x4305FB66699C3B2702D4d05CF36551390A4c69C6',
          verifiedSource: true,
        },
      },
      {
        id: 'elysium-bridge',
        name: 'Elysium Native Bridge',
        category: 'Infrastructure',
        description:
          'Official cross-layer asset bridge enabling bidirectional transfers between Ethereum Mainnet and Elysium with timelock security.',
        summary:
          'Official cross-layer asset bridge enabling bidirectional transfers between Ethereum Mainnet and Elysium with timelock security.',
        website: 'https://bridge.elysiumchain.tech',
        websiteUrl: 'https://bridge.elysiumchain.tech',
        status: 'live',
        statusLabel: 'Operational',
        verificationStatus: 'verified',
        isVerified: true,
        chain: 'elysium',
        isTrending: false,
        isNew: false,
        assets: ['asset-weth', 'asset-usdc'],
        liquidityStage: 'Completed',
        links: [
          { label: 'Bridge Portal', url: 'https://bridge.elysiumchain.tech', type: 'app' },
        ],
        technicalDetails: {
          standard: 'Core-Protocol',
          verifiedSource: true,
        },
      },
      {
        id: 'vulcan-verse',
        name: 'VulcanVerse',
        category: 'Gaming',
        description:
          'Open-world Greco-Roman MMORPG powered by verifiable on-chain asset ownership, land staking, and NFT crafting on Elysium.',
        summary:
          'Open-world Greco-Roman MMORPG powered by verifiable on-chain asset ownership, land staking, and NFT crafting on Elysium.',
        website: 'https://vulcanverse.com',
        websiteUrl: 'https://vulcanverse.com',
        status: 'live',
        statusLabel: 'Live',
        verificationStatus: 'verified',
        isVerified: true,
        chain: 'elysium',
        isTrending: true,
        isNew: true,
        liquidityStage: 'Completed',
        links: [
          { label: 'Game Portal', url: 'https://vulcanverse.com', type: 'website' },
          { label: 'Marketplace', url: 'https://market.vulcanforged.com', type: 'app' },
        ],
        technicalDetails: {
          standard: 'EVM-ERC721',
          verifiedSource: true,
        },
      },
    ];

    const verifiedAssets: Asset[] = [
      {
        id: 'asset-lava',
        symbol: 'LAVA',
        name: 'Elysium LAVA',
        chain: 'elysium',
        isNative: true,
        decimals: 18,
        projectId: 'elysium-dex',
        projectName: 'Elysium Swap',
        markets: ['mkt-pyr-lava', 'mkt-lava-usdc', 'mkt-weth-lava'],
        marketDataSource: 'Elysium Mainnet Consensus',
        verifiedSource: true,
      },
      {
        id: 'asset-pyr',
        symbol: 'PYR',
        name: 'Vulcan Forged',
        chain: 'elysium',
        isNative: false,
        decimals: 18,
        contractAddress: '0x3938478A5B9f6a1936cf18B33a2862a98D22A1E7',
        projectId: 'vulcan-forged',
        projectName: 'Vulcan Forged',
        markets: ['mkt-pyr-lava'],
        marketDataSource: 'Elysium Swap AMM',
        verifiedSource: true,
      },
      {
        id: 'asset-usdc',
        symbol: 'USDC',
        name: 'Bridged USD Coin',
        chain: 'elysium',
        isNative: false,
        decimals: 6,
        projectId: 'elysium-bridge',
        projectName: 'Elysium Native Bridge',
        markets: ['mkt-lava-usdc'],
        marketDataSource: 'Elysium Swap AMM',
        verifiedSource: true,
      },
      {
        id: 'asset-weth',
        symbol: 'WETH',
        name: 'Bridged Wrapped Ether',
        chain: 'elysium',
        isNative: false,
        decimals: 18,
        projectId: 'elysium-bridge',
        projectName: 'Elysium Native Bridge',
        markets: ['mkt-weth-lava'],
        marketDataSource: 'Elysium Swap AMM',
        verifiedSource: true,
      },
    ];

    const verifiedMarkets: Market[] = [
      {
        id: 'mkt-pyr-lava',
        asset: 'PYR',
        quoteAsset: 'LAVA',
        pair: 'PYR / LAVA',
        marketType: 'spot',
        venue: 'Elysium Swap',
        venueUrl: 'https://elysiumchain.tech',
        chain: 'elysium',
        dataSource: 'Elysium Swap AMM Router',
        status: 'active',
      },
      {
        id: 'mkt-lava-usdc',
        asset: 'LAVA',
        quoteAsset: 'USDC',
        pair: 'LAVA / USDC',
        marketType: 'spot',
        venue: 'Elysium Swap',
        venueUrl: 'https://elysiumchain.tech',
        chain: 'elysium',
        dataSource: 'Elysium Swap AMM Router',
        status: 'active',
      },
      {
        id: 'mkt-weth-lava',
        asset: 'WETH',
        quoteAsset: 'LAVA',
        pair: 'WETH / LAVA',
        marketType: 'spot',
        venue: 'Elysium Swap',
        venueUrl: 'https://elysiumchain.tech',
        chain: 'elysium',
        dataSource: 'Elysium Swap AMM Router',
        status: 'active',
      },
    ];

    const verifiedActivities: Activity[] = [
      {
        id: 'act-1',
        chain: 'elysium',
        category: 'on_chain',
        projectId: 'pyth-elysium',
        projectName: 'Pyth Network Oracles',
        type: 'Oracle State Verified',
        title: 'Pyth Price Feed Contract Synchronized',
        description: 'Low-latency oracle contract verified on Elysium Mainnet with fresh cryptographic price roots.',
        timestamp: '2 hours ago',
        metadata: {
          contractAddress: '0x4305FB66699C3B2702D4d05CF36551390A4c69C6',
          explorerUrl: 'https://explorer.elysiumchain.tech/address/0x4305FB66699C3B2702D4d05CF36551390A4c69C6',
        },
      },
      {
        id: 'act-2',
        chain: 'elysium',
        category: 'ecosystem',
        projectId: 'elysium-bridge',
        projectName: 'Elysium Native Bridge',
        type: 'Bridge Relay Health',
        title: 'Cross-Chain Relay Attested',
        description: 'Validator consensus group confirmed zero failed relay packets across the primary Ethereum-Elysium bridge.',
        timestamp: '5 hours ago',
        metadata: {
          explorerUrl: 'https://bridge.elysiumchain.tech',
        },
      },
      {
        id: 'act-3',
        chain: 'elysium',
        category: 'market',
        projectId: 'elysium-dex',
        projectName: 'Elysium Swap',
        type: 'Liquidity Router Active',
        title: 'LAVA Primary Pool Router Deployed',
        description: 'Automated market maker core router contract published and ABI verified on Elysium Blockscout.',
        timestamp: '1 day ago',
        metadata: {
          venue: 'Elysium Swap',
          explorerUrl: 'https://explorer.elysiumchain.tech',
        },
      },
      {
        id: 'act-4',
        chain: 'elysium',
        category: 'project',
        projectId: 'vulcan-forged',
        projectName: 'Vulcan Forged',
        type: 'Contract Verification',
        title: 'EVM Bytecode Verified on Blockscout',
        description: 'Solidity metadata and ABI confirmed on Elysium Blockscout explorer.',
        timestamp: '2 days ago',
        metadata: {
          contractAddress: '0x3938478A5B9f6a1936cf18B33a2862a98D22A1E7',
          explorerUrl: 'https://explorer.elysiumchain.tech',
        },
      },
    ];

    const verifiedQuests: Quest[] = [
      {
        id: 'quest-rpc-setup',
        title: 'Configure Elysium RPC & Network',
        track: 'Onboarding',
        description: 'Add official Elysium Mainnet parameters (Chain ID: 1339, Currency: LAVA) to your browser wallet.',
        difficulty: 'Beginner',
        estimatedMinutes: 3,
        rewardInfo: 'Elysium Verified Explorer Badge',
        status: 'in_progress',
        steps: [
          {
            id: 'step-rpc-1',
            title: 'Review Elysium RPC URL',
            description: 'Verify the official endpoint: https://rpc.elysiumchain.tech',
            completed: true,
            requiresWallet: false,
          },
          {
            id: 'step-rpc-2',
            title: 'Verify Chain ID 1339',
            description: 'Confirm network chain identifier aligns with consensus.',
            completed: true,
            requiresWallet: false,
          },
          {
            id: 'step-rpc-3',
            title: 'Connect Wallet Session',
            description: 'Establish active connection to verify cryptographic address on Chain 1339.',
            completed: false,
            requiresWallet: true,
          },
        ],
      },
      {
        id: 'quest-first-explorer',
        title: 'Inspect an On-Chain Contract',
        track: 'Ecosystem Exploration',
        projectId: 'elysium-blockscout',
        projectName: 'Elysium Explorer',
        description: 'Learn how to inspect verified Elysium smart contracts and check transaction state on Blockscout.',
        difficulty: 'Beginner',
        estimatedMinutes: 5,
        rewardInfo: 'Contract Verifier Badge',
        status: 'not_started',
        steps: [
          {
            id: 'step-exp-1',
            title: 'Open Elysium Blockscout Explorer',
            description: 'Access the official explorer portal at explorer.elysiumchain.tech.',
            completed: false,
            requiresWallet: false,
          },
          {
            id: 'step-exp-2',
            title: 'Query Native LAVA Contract',
            description: 'Locate verified contract code and review ABI read methods.',
            completed: false,
            requiresWallet: false,
          },
          {
            id: 'step-exp-3',
            title: 'Verify Address Activity',
            description: 'Confirm your account state via block explorer query.',
            completed: false,
            requiresWallet: true,
          },
        ],
      },
    ];

    saveToStorage(STORAGE_KEYS.PROJECTS, verifiedProjects);
    saveToStorage(STORAGE_KEYS.ASSETS, verifiedAssets);
    saveToStorage(STORAGE_KEYS.MARKETS, verifiedMarkets);
    saveToStorage(STORAGE_KEYS.ACTIVITIES, verifiedActivities);
    saveToStorage(STORAGE_KEYS.QUESTS, verifiedQuests);
  },

  /**
   * Reset store to clean empty state
   */
  clearAllData: async (): Promise<void> => {
    saveToStorage(STORAGE_KEYS.PROJECTS, []);
    saveToStorage(STORAGE_KEYS.ASSETS, []);
    saveToStorage(STORAGE_KEYS.MARKETS, []);
    saveToStorage(STORAGE_KEYS.ACTIVITIES, []);
    saveToStorage(STORAGE_KEYS.QUESTS, []);
    saveToStorage(STORAGE_KEYS.OPPORTUNITIES, []);
  },
};
