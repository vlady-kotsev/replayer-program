use anchor_lang::prelude::*;

use crate::{constants::ADMIN_SEED, state::Admin};

#[derive(Accounts)]
#[instruction(args: RemoveAdminArgs)]
pub struct RemoveAdmin<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [ADMIN_SEED, admin.key().as_ref()],
        bump = admin_account.bump
    )]
    pub admin_account: Account<'info, Admin>,
    #[account(
        mut,
        close = admin,
        seeds = [ADMIN_SEED, args.removed_admin.as_ref()],
        bump
    )]
    pub removed_admin: Account<'info, Admin>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct RemoveAdminArgs {
    pub removed_admin: Pubkey,
}

impl<'info> RemoveAdmin<'info> {
    pub fn process(&mut self) -> Result<()> {
        Ok(())
    }
}
