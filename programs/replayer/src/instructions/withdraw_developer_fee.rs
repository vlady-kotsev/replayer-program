use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{
    constants::{DEVELOPER_SEED, DEVELOPER_TREASURY_SEED},
    state::Developer,
};

#[derive(Accounts)]
pub struct WithdrawDeveloperFee<'info> {
    #[account(mut)]
    pub developer: Signer<'info>,
    #[account(
        seeds = [DEVELOPER_SEED, developer.key().as_ref()],
        bump = developer_account.bump
    )]
    pub developer_account: Account<'info, Developer>,
    #[account(
        mut,
        seeds =[DEVELOPER_TREASURY_SEED, developer.key().as_ref()],
        bump = developer_account.treasury_bump
    )]
    pub developer_treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct WithdrawDeveloperFeeArgs {
    pub amount: u64, // lamports
}

impl<'info> WithdrawDeveloperFee<'info> {
    pub fn process(&mut self, args: &WithdrawDeveloperFeeArgs) -> Result<()> {
        let developer_key = self.developer.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            DEVELOPER_TREASURY_SEED,
            developer_key.as_ref(),
            &[self.developer_account.treasury_bump],
        ]];

        let withdraw_cpi_ctx = CpiContext::new_with_signer(
            self.system_program.to_account_info(),
            Transfer {
                from: self.developer_treasury.to_account_info(),
                to: self.developer.to_account_info(),
            },
            signer_seeds,
        );

        transfer(withdraw_cpi_ctx, args.amount)
    }
}
