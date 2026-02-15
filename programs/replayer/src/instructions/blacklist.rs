use anchor_lang::prelude::*;

use crate::{
    constants::{ADMIN_SEED, BLACKLISTED_SEED},
    state::{Admin, Blacklist},
};

#[derive(Accounts)]
#[instruction(args: BlacklistAccountArgs)]
pub struct BlacklistAccount<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [ADMIN_SEED, admin.key().as_ref()],
        bump = admin_account.bump
    )]
    pub admin_account: Account<'info, Admin>,
    #[account(
        mut, 
        seeds = [BLACKLISTED_SEED, args.address.as_ref()],
        bump
    )]
    pub blacklist_account: Account<'info, Blacklist>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct BlacklistAccountArgs {
    pub address: Pubkey,
    pub is_blacklisted: bool
}

impl<'info> BlacklistAccount<'info> {
    pub fn process(&mut self, args: &BlacklistAccountArgs) -> Result<()> {
        self.blacklist_account.is_blacklisted = args.is_blacklisted;
        Ok(())
    }
}
