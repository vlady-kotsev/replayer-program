use anchor_lang::prelude::*;

use crate::{
    constants::{BLACKLISTED_SEED, GAME_DATA_SEED, GAME_METADATA_SEED, MAX_GAMEDATA_LENGTH},
    error::ReplayerErrors,
    state::{Blacklist, GameData, GameMetadata},
};

#[derive(Accounts)]
#[instruction(args: AllocateGameArgs)]
pub struct AllocateGameAccount<'info> {
    #[account(mut)]
    pub developer: Signer<'info>,
    #[account(
        init,
        payer = developer,
        space = GameData::DISCRIMINATOR.len() + GameData::INIT_SPACE,
        seeds = [GAME_DATA_SEED, developer.key().as_ref(),args.game_name.as_bytes() ],
        bump
    )]
    pub game_data: AccountLoader<'info, GameData>,
    #[account(
        init,
        payer = developer,
        space = GameMetadata::DISCRIMINATOR.len()+GameMetadata::INIT_SPACE,
        seeds = [GAME_METADATA_SEED, developer.key().as_ref(), args.game_name.as_bytes()],
        bump
    )]
    pub game_metadata: Account<'info, GameMetadata>,
    #[account(
        seeds = [BLACKLISTED_SEED, developer.key().as_ref()],
        bump = blacklisted.bump
    )]
    pub blacklisted: Account<'info, Blacklist>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct AllocateGameArgs {
    pub game_name: String,
    pub game_uri: String,
    pub game_price: u64,
    pub game_hash: [u8; 32],
    pub max_supply: u64,
    pub game_data_length: u64,
}

impl<'info> AllocateGameAccount<'info> {
    pub fn process(
        &mut self,
        args: &AllocateGameArgs,
        bumps: &AllocateGameAccountBumps,
    ) -> Result<()> {
        require!(
            !self.blacklisted.is_blacklisted,
            ReplayerErrors::Blacklisted
        );
        let AllocateGameArgs {
            game_name,
            game_hash,
            game_uri,
            game_price,
            max_supply,
            game_data_length,
        } = args;

        require!(
            *game_data_length <= MAX_GAMEDATA_LENGTH as u64,
            ReplayerErrors::GameDataLengthOverflow
        );
        require!(game_name.ne(""), ReplayerErrors::InvalidGameName);
        require!(game_price.gt(&0), ReplayerErrors::InvalidGamePrice);
        require!(max_supply.gt(&0), ReplayerErrors::InvalidGameMaxSupply);

        *self.game_metadata = GameMetadata {
            data_hash: *game_hash,
            developer: self.developer.key(),
            game_name: game_name.clone(),
            game_uri: game_uri.clone(),
            price: *game_price,
            current_supply: 0,
            max_supply: *max_supply,
            bump: bumps.game_metadata,
        };

        let mut game_data = self.game_data.load_init()?;
        game_data.bump = bumps.game_data;
        game_data.length = *game_data_length;

        Ok(())
    }
}
