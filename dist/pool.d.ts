import type { Keypair } from '@mysten/sui/cryptography';
import type { DevInspectResults, SuiTransactionBlockResponse } from '@mysten/sui/client';
import type { ResolvedPoolCreationConfig } from './types.js';
export type PoolCreationResult = {
    type: 'executed';
    digest: string;
    response: SuiTransactionBlockResponse;
} | {
    type: 'dryRun';
    response: DevInspectResults;
};
export declare function createPoolWithLiquidity(config: ResolvedPoolCreationConfig, keypair: Keypair): Promise<PoolCreationResult>;
//# sourceMappingURL=pool.d.ts.map