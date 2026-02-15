use anchor_lang::prelude::*;

use crate::{
    constants::{GAME_DATA_SEED, GAME_METADATA_SEED},
    error::ReplayerErrors,
    state::{GameData, GameMetadata},
};

#[derive(Accounts)]
pub struct UploadGameChunk<'info> {
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
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct UploadGameChunkArgs {
    pub data_chunk: Vec<u8>,
}

impl<'info> UploadGameChunk<'info> {
    pub fn process(&mut self, args: &UploadGameChunkArgs) -> Result<()> {
        require!(
            self.game_data.load()?.is_finalized == 0,
            ReplayerErrors::GameAlreadyFinalized
        );

        let game_data = self.game_data.load()?;

        let start_index = game_data.write_index as usize;
        let end_index = args
            .data_chunk
            .len()
            .checked_add(start_index)
            .ok_or(ReplayerErrors::Overflow)?;

        require!(
            end_index <= game_data.length as usize,
            ReplayerErrors::GameDataLengthOverflow
        );
        drop(game_data);
        let mut game_data_mut = self.game_data.load_mut()?;
        game_data_mut.data[start_index..end_index].copy_from_slice(&args.data_chunk);

        game_data_mut.write_index = end_index as u64;

        Ok(())
    }
}
