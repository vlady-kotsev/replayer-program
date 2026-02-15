use anchor_lang::prelude::*;

use crate::{constants::ADMIN_SEED, state::Admin};

#[derive(Accounts)]
#[instruction(args: AddAdminArgs)]
pub struct AddAdmin<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [ADMIN_SEED, admin.key().as_ref()],
        bump = admin_account.bump
    )]
    pub admin_account: Account<'info, Admin>,
    #[account(
        init,
        payer = admin,
        space= Admin::DISCRIMINATOR.len() + Admin::INIT_SPACE,
        seeds = [ADMIN_SEED, args.new_admin.as_ref()],
        bump
    )]
    pub new_admin: Account<'info, Admin>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct AddAdminArgs {
    pub new_admin: Pubkey,
}

impl<'info> AddAdmin<'info> {
    pub fn process(&mut self, bumps: &AddAdminBumps) -> Result<()> {
        *self.new_admin = Admin {
            bump: bumps.new_admin,
        };
        Ok(())
    }
}
