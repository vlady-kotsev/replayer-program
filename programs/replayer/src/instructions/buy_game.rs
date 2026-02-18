use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use mpl_core::{instructions::CreateV2CpiBuilder, ID as CORE_ID};

use crate::{
    constants::{
        BASIS_FACTOR, DEVELOPER_COLLECTION_SEED, DEVELOPER_SEED, DEVELOPER_TREASURY_SEED,
        GAME_DATA_SEED, GAME_KEY_ASSET_SEED, GAME_METADATA_SEED, GLOBAL_CONFIG_SEED,
        GLOBAL_TREASURY_SEED,
    },
    error::ReplayerErrors,
    state::{Developer, GameData, GameMetadata, GlobalConfig},
};

#[derive(Accounts)]
#[instruction(args: BuyGameArgs)]
pub struct BuyGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [GAME_METADATA_SEED, args.developer.as_ref(), args.game_name.as_bytes()],
        bump = game_metadata.bump
    )]
    pub game_metadata: Account<'info, GameMetadata>,
    #[account(
        seeds = [GAME_DATA_SEED, args.developer.as_ref(), args.game_name.as_bytes()],
        bump = game_data.load()?.bump
    )]
    pub game_data: AccountLoader<'info, GameData>,
    #[account(
        seeds = [DEVELOPER_SEED,args.developer.as_ref()],
        bump = developer_account.bump
    )]
    pub developer_account: Account<'info, Developer>,
    /// CHECK: developer collection of games
    #[account(
        mut,
        constraint = collection.owner == &CORE_ID @ ReplayerErrors::InvalidCollectionOwner,
        constraint = !collection.data_is_empty() @ ReplayerErrors::CollectionNotInitialized,
        seeds = [DEVELOPER_COLLECTION_SEED, args.developer.as_ref()],
        bump = developer_account.collection_bump
    )]
    pub collection: UncheckedAccount<'info>,
    /// CHECK: the game NFT key
    #[account(
        mut,
        constraint = asset.data_is_empty() @ ReplayerErrors::AssetAlreadyInitialized,
        seeds = [GAME_KEY_ASSET_SEED, args.developer.as_ref(), args.game_name.as_bytes(), player.key().as_ref()],
        bump
    )]
    pub asset: UncheckedAccount<'info>,
    #[account(
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(
        mut,
        seeds = [GLOBAL_TREASURY_SEED],
        bump = global_config.treasury_bump
    )]
    pub global_treasury: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [DEVELOPER_TREASURY_SEED, args.developer.as_ref()],
        bump = developer_account.treasury_bump
    )]
    pub developer_treasury: SystemAccount<'info>,
    /// CHECK: metaplex core program
    #[account(
        address = CORE_ID
    )]
    pub core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct BuyGameArgs {
    pub game_name: String,
    pub developer: Pubkey,
}

impl<'info> BuyGame<'info> {
    pub fn process(&mut self, args: &BuyGameArgs, bumps: &BuyGameBumps) -> Result<()> {
        require!(
            self.game_data.load()?.is_finalized == 1,
            ReplayerErrors::GameNotInitialized
        );

        require!(
            self.game_metadata.current_supply < self.game_metadata.max_supply,
            ReplayerErrors::GameSupplyReached
        );
        let player_key = self.player.key();
        let mint_asset_signer_seeds: &[&[&[u8]]] = &[
            &[
                DEVELOPER_SEED,
                args.developer.as_ref(),
                &[self.developer_account.bump],
            ],
            &[
                GAME_KEY_ASSET_SEED,
                args.developer.as_ref(),
                args.game_name.as_bytes(),
                player_key.as_ref(),
                &[bumps.asset],
            ],
        ];

        CreateV2CpiBuilder::new(&self.core_program.to_account_info())
            .asset(&self.asset.to_account_info())
            .collection(Some(&self.collection.to_account_info()))
            .authority(Some(&self.developer_account.to_account_info()))
            .payer(&self.player.to_account_info())
            .owner(Some(&self.player.to_account_info()))
            .update_authority(None)
            .system_program(&self.system_program.to_account_info())
            .name(self.game_metadata.game_name.clone())
            .uri(self.game_metadata.game_uri.clone())
            .invoke_signed(mint_asset_signer_seeds)?;

        let platform_fee = self
            .game_metadata
            .price
            .checked_mul(self.global_config.platform_fee)
            .ok_or(ReplayerErrors::Overflow)?
            .checked_div(BASIS_FACTOR)
            .unwrap();

        let developer_fee = self.game_metadata.price - platform_fee;

        require!(developer_fee > 0, ReplayerErrors::InvalidFeeAmount);

        if platform_fee > 0 {
            let transfer_cpi_context = CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.player.to_account_info(),
                    to: self.global_treasury.to_account_info(),
                },
            );

            transfer(transfer_cpi_context, platform_fee)?;
        }

        let transfer_cpi_context = CpiContext::new(
            self.system_program.to_account_info(),
            Transfer {
                from: self.player.to_account_info(),
                to: self.developer_treasury.to_account_info(),
            },
        );

        transfer(transfer_cpi_context, developer_fee)?;

        self.game_metadata.current_supply += 1;

        Ok(())
    }
}
