use anchor_lang::{
    prelude::*,
    system_program::{create_account, CreateAccount},
};
use mpl_core::{instructions::CreateCollectionV2CpiBuilder, ID as CORE_ID};

use crate::{
    constants::{
        BLACKLISTED_SEED, DEVELOPER_COLLECTION_SEED, DEVELOPER_SEED, DEVELOPER_TREASURY_SEED,
    },
    error::ReplayerErrors,
    state::{Blacklist, Developer},
};

#[derive(Accounts)]
pub struct CreateDeveloper<'info> {
    #[account(mut)]
    pub developer: Signer<'info>,
    #[account(
        init,
        payer = developer,
        space = Developer::DISCRIMINATOR.len() + Developer::INIT_SPACE,
        seeds = [DEVELOPER_SEED, developer.key().as_ref()],
        bump
    )]
    pub developer_account: Account<'info, Developer>,
    #[account(
        mut,
        seeds = [DEVELOPER_TREASURY_SEED, developer.key().as_ref()],
        bump
    )]
    pub developer_treasury: SystemAccount<'info>,
    /// CHECK: developer collection account
    #[account(
        mut,
        constraint = developer_collection.data_is_empty() @ ReplayerErrors::CollectionAlreadyInitialized,
        seeds = [DEVELOPER_COLLECTION_SEED, developer.key().as_ref()],
        bump
    )]
    pub developer_collection: UncheckedAccount<'info>,
    #[account(
        init,
        payer = developer,
        space = Blacklist::DISCRIMINATOR.len() + Blacklist::INIT_SPACE,
        seeds = [BLACKLISTED_SEED, developer.key().as_ref()],
        bump
    )]
    pub blacklist_account: Account<'info, Blacklist>,
    /// CHECK: metaplex core program
    #[account(
        address = CORE_ID
    )]
    pub core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateDeveloperArgs {
    pub company_name: String,
    pub collection_uri: String,
}

impl<'info> CreateDeveloper<'info> {
    pub fn process(
        &mut self,
        args: &CreateDeveloperArgs,
        bumps: &CreateDeveloperBumps,
    ) -> Result<()> {
        *self.developer_account = Developer {
            games_published: 0,
            treasury_bump: bumps.developer_treasury,
            collection_bump: bumps.developer_collection,
            bump: bumps.developer_account,
        };

        *self.blacklist_account = Blacklist {
            is_blacklisted: false,
            bump: bumps.blacklist_account,
        };

        let signer_seeds: &[&[&[u8]]] = &[&[
            DEVELOPER_TREASURY_SEED,
            &self.developer.key().to_bytes(),
            &[bumps.developer_treasury],
        ]];

        let create_account_cpi_context = CpiContext::new_with_signer(
            self.system_program.to_account_info(),
            CreateAccount {
                from: self.developer.to_account_info(),
                to: self.developer_treasury.to_account_info(),
            },
            signer_seeds,
        );
        let lamports = Rent::get()?.minimum_balance(0);
        create_account(
            create_account_cpi_context,
            lamports,
            0,
            &self.system_program.key(),
        )?;

        CreateCollectionV2CpiBuilder::new(&self.core_program.to_account_info())
            .collection(&self.developer_collection.to_account_info())
            .payer(&self.developer.to_account_info())
            .update_authority(Some(&self.developer_account.to_account_info()))
            .system_program(&self.system_program.to_account_info())
            .name(args.company_name.clone())
            .uri(args.collection_uri.clone())
            .invoke()?;

        Ok(())
    }
}
