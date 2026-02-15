use anchor_lang::prelude::*;

#[error_code]
pub enum ReplayerErrors {
    #[msg("The developer treasury must be initialized")]
    UninitializedDeveloperTreasury,
    #[msg("The game data overflows the maximum size")]
    GameDataLengthOverflow,
    #[msg("The game data chunk overflows the game size")]
    GameDataChunkLengthOverflow,
    #[msg("Game name cannot be empty")]
    InvalidGameName,
    #[msg("Game price cannot be 0")]
    InvalidGamePrice,
    #[msg("Game max supply cannot be 0")]
    InvalidGameMaxSupply,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Game is already finalized")]
    GameAlreadyFinalized,
    #[msg("Game can be finalized when all data is uploaded")]
    UnfinalizedGameData,
    #[msg("Corrupted game data")]
    GameDataDiscrepancy,
    #[msg("Collection already initialized")]
    CollectionAlreadyInitialized,
    #[msg("Invalid collection owner")]
    InvalidCollectionOwner,
    #[msg("Collection not initialized")]
    CollectionNotInitialized,
    #[msg("Core Asset already initialized")]
    AssetAlreadyInitialized,
    #[msg("Invalid fee percentage")]
    InvalidFeePercentage,
    #[msg("Invalid fee amount")]
    InvalidFeeAmount,
    #[msg("The account is blacklisted")]
    Blacklisted,
    #[msg("Game not initialized")]
    GameNotInitialized,
    #[msg("Game supply reached, no new game keys can be minted")]
    GameSupplyReached,
}
