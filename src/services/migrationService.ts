import { isContractDeployed, getLavaBalance } from '../lib/elysium/rpcClient';
import { ELYSIUM_CONFIG } from '../lib/elysium/constants';

export type MigrationItemStatus = 'Not started' | 'In progress' | 'Waiting' | 'Completed' | 'Blocked';

export interface MigrationChecklistItem {
  id: string;
  stageNumber: number;
  stageName: string;
  title: string;
  purpose: string;
  requirement: string;
  status: MigrationItemStatus;
  actionLabel: string;
  actionType: 'verify_contract' | 'verify_balance' | 'external_doc' | 'external_app' | 'manual_attest';
  targetUrl?: string;
  documentationUrl: string;
  verificationMethod: string;
  technicalDetails?: string;
  completedAt?: string;
  verificationData?: any;
}

export interface MigrationStage {
  stageNumber: number;
  name: string;
  description: string;
  items: MigrationChecklistItem[];
}

export const INITIAL_MIGRATION_STAGES: MigrationStage[] = [
  {
    stageNumber: 1,
    name: 'Stage 1: Preparation',
    description: 'EVM architecture audit, compiler configuration, and administrative governance setup.',
    items: [
      {
        id: 'prep-compiler',
        stageNumber: 1,
        stageName: 'Preparation',
        title: 'EVM Bytecode & Compiler Target Alignment',
        purpose: 'Ensure smart contracts compile cleanly to Elysium EVM opcode specifications.',
        requirement: 'Compile Solidity source code using compiler version 0.8.20+ with the London or Paris EVM target.',
        status: 'Completed',
        actionLabel: 'View Compiler Specs',
        actionType: 'external_doc',
        documentationUrl: 'https://docs.elysiumchain.tech/developers',
        verificationMethod: 'Static inspection of Solidity compiler output artifacts and opcode set.',
        technicalDetails: 'Elysium supports full standard EVM semantics on Chain ID 1339. Avoid non-standard PUSH0 opcodes if targeting older EVM versions.',
      },
      {
        id: 'prep-multisig',
        stageNumber: 1,
        stageName: 'Preparation',
        title: 'Administrative Multisig Governance',
        purpose: 'Prevent single-key compromise for protocol upgradeability and minting controls.',
        requirement: 'Configure a minimum 3-of-5 threshold multisig wallet on Elysium for contract owner privileges.',
        status: 'In progress',
        actionLabel: 'Configure Multisig',
        actionType: 'manual_attest',
        documentationUrl: 'https://docs.elysiumchain.tech',
        verificationMethod: 'Attestation of multisig contract address with threshold verification.',
        technicalDetails: 'Governance transactions must require multiple signatures and a timelock delay before executing state changes.',
      },
    ],
  },
  {
    stageNumber: 2,
    name: 'Stage 2: Token / Ecosystem Setup',
    description: 'Deployment of ERC-20/721 contracts and source code verification on Blockscout.',
    items: [
      {
        id: 'token-deployment',
        stageNumber: 2,
        stageName: 'Token / Ecosystem Setup',
        title: 'Token Contract Deployment on Elysium Mainnet',
        purpose: 'Establish canonical token representation on Chain ID 1339.',
        requirement: 'Deploy verified ERC-20 contract to Elysium with 18 standard decimals and proper supply caps.',
        status: 'In progress',
        actionLabel: 'Verify Deployed Bytecode',
        actionType: 'verify_contract',
        documentationUrl: 'https://explorer.elysiumchain.tech',
        verificationMethod: 'Direct eth_getCode RPC query confirming non-empty bytecode on Elysium.',
        technicalDetails: 'RPC eth_getCode checks address on https://rpc.elysiumchain.tech to guarantee bytecode presence.',
      },
      {
        id: 'token-blockscout-verification',
        stageNumber: 2,
        stageName: 'Token / Ecosystem Setup',
        title: 'Source Code Verification on Elysium Blockscout',
        purpose: 'Provide complete transparency for users to inspect contract methods and security audits.',
        requirement: 'Submit Solidity Standard JSON input to explorer.elysiumchain.tech for exact ABI matching.',
        status: 'Not started',
        actionLabel: 'Open Blockscout Verifier',
        actionType: 'external_doc',
        documentationUrl: 'https://explorer.elysiumchain.tech/contract-verification',
        verificationMethod: 'Public verification check on Elysium Blockscout explorer.',
        technicalDetails: 'Verified source allows LAKNES and explorer tools to parse events and function calls accurately.',
      },
    ],
  },
  {
    stageNumber: 3,
    name: 'Stage 3: Migration / Bridging',
    description: 'Cross-chain relay setup between Ethereum Mainnet and Elysium Native Bridge.',
    items: [
      {
        id: 'bridge-registration',
        stageNumber: 3,
        stageName: 'Migration / Bridging',
        title: 'Elysium Native Bridge Registration',
        purpose: 'Enable bidirectional asset transfers with Ethereum without wrapped-token fragmentation.',
        requirement: 'Register token pair mapping with Elysium bridge validators at bridge.elysiumchain.tech.',
        status: 'Not started',
        actionLabel: 'Access Bridge Portal',
        actionType: 'external_app',
        targetUrl: 'https://bridge.elysiumchain.tech',
        documentationUrl: 'https://docs.elysiumchain.tech/bridge',
        verificationMethod: 'Validator confirmation of token pair relay mapping.',
        technicalDetails: 'Official bridge transfers are secured by threshold validator signatures and an on-chain timelock release.',
      },
      {
        id: 'bridge-timelock-caps',
        stageNumber: 3,
        stageName: 'Migration / Bridging',
        title: 'Relay Timelock & Rate Limit Guardrails',
        purpose: 'Protect ecosystem liquidity from sudden draining during migration volatility.',
        requirement: 'Enforce hourly and daily bridging velocity caps during initial migration phase.',
        status: 'Not started',
        actionLabel: 'Review Caps',
        actionType: 'manual_attest',
        documentationUrl: 'https://docs.elysiumchain.tech/security',
        verificationMethod: 'Bridge contract parameter inspection.',
      },
    ],
  },
  {
    stageNumber: 4,
    name: 'Stage 4: Liquidity / Market Preparation',
    description: 'Pairing pool reserves with native LAVA and locking initial liquidity provider tokens.',
    items: [
      {
        id: 'market-lava-pairing',
        stageNumber: 4,
        stageName: 'Liquidity / Market Preparation',
        title: 'Primary LAVA Base Pair Routing',
        purpose: 'Anchor protocol token liquidity to Elysium native gas currency for optimal route pricing.',
        requirement: 'Create AMM pool pairing your token directly against native LAVA on Elysium Swap.',
        status: 'Not started',
        actionLabel: 'Inspect DEX Router',
        actionType: 'external_doc',
        documentationUrl: 'https://docs.elysiumchain.tech/dex',
        verificationMethod: 'Factory contract query for pair address on Elysium Mainnet.',
        technicalDetails: 'LAVA base pair ensures minimal routing slippage and eliminates secondary swap hops.',
      },
      {
        id: 'market-lp-timelock',
        stageNumber: 4,
        stageName: 'Liquidity / Market Preparation',
        title: 'LP Token Timelock & Custody Lock',
        purpose: 'Give traders and ecosystem participants mathematical certainty against liquidity pulls.',
        requirement: 'Deposit 100% of initial LP tokens into an immutable on-chain timelock locker for $\\ge$ 12 months.',
        status: 'Not started',
        actionLabel: 'Attest Timelock',
        actionType: 'manual_attest',
        documentationUrl: 'https://explorer.elysiumchain.tech',
        verificationMethod: 'Locker smart contract event check on Elysium Blockscout.',
      },
    ],
  },
  {
    stageNumber: 5,
    name: 'Stage 5: Verification',
    description: 'Oracle feed validation, slippage simulation, and gas limits verification on Elysium.',
    items: [
      {
        id: 'verify-pyth-oracle',
        stageNumber: 5,
        stageName: 'Verification',
        title: 'Pyth Network Price Feed Integration',
        purpose: 'Provide tamper-resistant sub-second price roots for collateral and lending functions.',
        requirement: 'Integrate and test Pyth oracle contract address on Elysium Mainnet with fresh update fees.',
        status: 'Not started',
        actionLabel: 'Query Oracle State',
        actionType: 'external_doc',
        documentationUrl: 'https://docs.pyth.network/price-feeds/use-real-time-data/evm',
        verificationMethod: 'Calling getPriceNoOlderThan on the Elysium Pyth deployment.',
        technicalDetails: 'Pyth contracts are deployed directly to Elysium and verified on Blockscout.',
      },
      {
        id: 'verify-depth-slippage',
        stageNumber: 5,
        stageName: 'Verification',
        title: 'Slippage & Quoting Simulation',
        purpose: 'Ensure retail users experience healthy trade execution under varying volume levels.',
        requirement: 'Simulate buy and sell executions up to $10,000 equivalent with less than 1.5% price impact.',
        status: 'Not started',
        actionLabel: 'Run Simulation',
        actionType: 'manual_attest',
        documentationUrl: 'https://docs.elysiumchain.tech',
        verificationMethod: 'On-chain router dry run quote inspection.',
      },
    ],
  },
  {
    stageNumber: 6,
    name: 'Stage 6: Completion',
    description: 'Elysium ecosystem announcement and community onboarding quest publication.',
    items: [
      {
        id: 'completion-directory-listing',
        stageNumber: 6,
        stageName: 'Completion',
        title: 'LAKNES Verified Ecosystem Status',
        purpose: 'Publish verified protocol profile to Elysium participants across Discover feed.',
        requirement: 'All prior stages attested with verified contracts and liquidity safeguards.',
        status: 'Not started',
        actionLabel: 'Publish Listing',
        actionType: 'manual_attest',
        documentationUrl: 'https://docs.elysiumchain.tech',
        verificationMethod: 'Automatic LAKNES registry verification attestation.',
      },
      {
        id: 'completion-quest-publication',
        stageNumber: 6,
        stageName: 'Completion',
        title: 'Interactive Onboarding Quest Publication',
        purpose: 'Convert initial explorers into active dApp users through step-by-step verified quest.',
        requirement: 'Publish minimum 1 active quest in the LAKNES Project Workspace.',
        status: 'Not started',
        actionLabel: 'Launch Quest',
        actionType: 'manual_attest',
        documentationUrl: 'https://docs.elysiumchain.tech',
        verificationMethod: 'Published quest record confirmed in LAKNES data store.',
      },
    ],
  },
];

export const migrationService = {
  /**
   * Load migration stages for a project from persistent storage
   */
  getProjectStages: (projectId: string): MigrationStage[] => {
    if (typeof window === 'undefined') return INITIAL_MIGRATION_STAGES;
    try {
      const stored = localStorage.getItem(`laknes_migration_stages_${projectId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return INITIAL_MIGRATION_STAGES;
  },

  /**
   * Save updated stages for a project
   */
  saveProjectStages: (projectId: string, stages: MigrationStage[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`laknes_migration_stages_${projectId}`, JSON.stringify(stages));
    } catch {}
  },

  /**
   * Update the status of a specific item
   */
  updateItemStatus: (
    projectId: string,
    itemId: string,
    newStatus: MigrationItemStatus,
    verificationData?: any
  ): MigrationStage[] => {
    const stages = migrationService.getProjectStages(projectId);
    const updatedStages = stages.map((stage) => ({
      ...stage,
      items: stage.items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            status: newStatus,
            completedAt: newStatus === 'Completed' ? new Date().toISOString() : undefined,
            verificationData,
          };
        }
        return item;
      }),
    }));

    migrationService.saveProjectStages(projectId, updatedStages);
    return updatedStages;
  },

  /**
   * Live on-chain verification of a contract address via eth_getCode
   */
  verifyContractDeployment: async (
    projectId: string,
    itemId: string,
    contractAddress: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress.trim())) {
      return {
        success: false,
        message: 'Invalid contract address. Must be a valid 42-character hex address.',
      };
    }

    try {
      const deployed = await isContractDeployed(contractAddress.trim());
      if (deployed) {
        migrationService.updateItemStatus(projectId, itemId, 'Completed', {
          contractAddress: contractAddress.trim(),
          verifiedOnChain: true,
          timestamp: Date.now(),
        });
        return {
          success: true,
          message: `Bytecode confirmed on Elysium Mainnet at ${contractAddress.slice(0, 8)}...`,
        };
      } else {
        return {
          success: false,
          message: 'No bytecode found at this address on Elysium Mainnet (Chain ID 1339). Please verify deployment.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'RPC check failed. Unable to reach Elysium endpoint.',
      };
    }
  },
};
