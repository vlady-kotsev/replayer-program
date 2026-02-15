use crate::{
    constants::{DEVELOPER_SEED, GAME_DATA_SEED, GAME_METADATA_SEED},
    error::ReplayerErrors,
    state::{Developer, GameData, GameMetadata},
};
use anchor_lang::prelude::*;
use solana_sha256_hasher::hash;

#[derive(Accounts)]
pub struct FinalizeGameUpload<'info> {
    #[account(mut)]
    pub developer: Signer<'info>,
    #[account(
        mut,
        seeds = [GAME_DATA_SEED, developer.key().as_ref(), game_metadata.game_name.as_bytes()],
        bump = game_data.load()?.bump
    )]
    pub game_data: AccountLoader<'info, GameData>,
    #[account(
        has_one = developer,
        seeds = [GAME_METADATA_SEED, developer.key().as_ref(), game_metadata.game_name.as_bytes()],
        bump = game_metadata.bump
    )]
    pub game_metadata: Account<'info, GameMetadata>,
    #[account(
        mut,
        seeds = [DEVELOPER_SEED, developer.key().as_ref()],
        bump = developer_account.bump
    )]
    pub developer_account: Account<'info, Developer>,
}

impl<'info> FinalizeGameUpload<'info> {
    pub fn process(&mut self) -> Result<()> {
        let game_data =self.game_data.load()?;
        require!(
           game_data.is_finalized == 0,
            ReplayerErrors::GameAlreadyFinalized
        );

        require!(
            game_data.write_index == game_data.length,
            ReplayerErrors::UnfinalizedGameData
        );

        let calculated_hash = hash(&game_data.data[..game_data.length as usize]);

        require!(
            calculated_hash.to_bytes() == self.game_metadata.data_hash,
            ReplayerErrors::GameDataDiscrepancy
        );
        
        drop(game_data);
        self.game_data.load_mut()?.is_finalized = 1;
        self.developer_account.games_published += 1;

        Ok(())
    }
}
