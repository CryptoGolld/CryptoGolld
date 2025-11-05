export type CetusNetwork = 'mainnet' | 'testnet';
export interface PoolCreationConfig {
    network: CetusNetwork;
    /**
     * Optional override for the Sui fullnode RPC URL. When omitted the SDK default is used.
     */
    fullNodeUrl?: string;
    /**
     * Bech32 (`suiprivkey...`) or hex encoded private key. Can be omitted when provided via env.
     */
    privateKey?: string;
    /**
     * The base token (coin A) type argument that will be paired with SUI.
     */
    baseCoinType: string;
    /**
     * Optional override for the base token metadata object id.
     */
    baseMetadataId?: string;
    /**
     * The quote token (coin B) type argument. Defaults to `0x2::sui::SUI`.
     */
    quoteCoinType?: string;
    /**
     * Optional override for the quote token metadata object id.
     */
    quoteMetadataId?: string;
    /**
     * Human readable base token amount (e.g. `1.5`).
     */
    baseAmount: string;
    /**
     * Human readable quote token amount. When omitted it is derived from the base amount and initial price.
     */
    quoteAmount?: string;
    /**
     * Initial price of the base token denominated in the quote token.
     */
    initialPrice: string;
    /**
     * Lower bound price of the base token denominated in the quote token for the initial liquidity range.
     */
    lowerPrice: string;
    /**
     * Upper bound price of the base token denominated in the quote token for the initial liquidity range.
     */
    upperPrice: string;
    /**
     * Tick spacing to use for the pool (e.g. 60, 120, 300).
     */
    tickSpacing: number;
    /**
     * URI metadata associated with the pool. Optional.
     */
    uri?: string;
    /**
     * Slippage tolerance as a decimal (e.g. 0.01 for 1%). Default is 0.01.
     */
    slippage?: number;
    /**
     * When true, the script simulates the transaction but does not submit it on-chain.
     */
    dryRun?: boolean;
    /**
     * Optional explicit gas budget to set on the transaction.
     */
    gasBudget?: string;
    /**
     * Determines which side of the pair is treated as the fixed amount when minting the initial position.
     * Defaults to true (fix the base token amount).
     */
    fixAmountOnBase?: boolean;
}
export interface ResolvedPoolCreationConfig extends PoolCreationConfig {
    privateKey: string;
    quoteCoinType: string;
    baseMetadataId?: string;
    quoteMetadataId?: string;
}
export interface CliArgs {
    configPath?: string;
}
//# sourceMappingURL=types.d.ts.map