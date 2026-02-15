use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{
    constants::{ADMIN_SEED, GLOBAL_CONFIG_SEED, GLOBAL_TREASURY_SEED},
    state::{Admin, GlobalConfig},
};

#[derive(Accounts)]
pub struct WithdrawPlatfromFee<'info> {
    #[account(mut)]
    pub withdrawer: Signer<'info>,
    #[account(
        seeds = [ADMIN_SEED, withdrawer.key().as_ref()],
        bump = admin_account.bump
    )]
    pub admin_account: Account<'info, Admin>,
    #[account(
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(
        mut,
        seeds =[ GLOBAL_TREASURY_SEED],
        bump = global_config.treasury_bump
    )]
    pub global_treasury: SystemAccount<'info>,
    /// CHECK: any receiver address
    #[account(mut)]
    pub receiver: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct WithdrawPlatfromFeeArgs {
    pub amount: u64, // lamports
}

impl<'info> WithdrawPlatfromFee<'info> {
    pub fn process(&mut self, args: &WithdrawPlatfromFeeArgs) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] =
            &[&[GLOBAL_TREASURY_SEED, &[self.global_config.treasury_bump]]];

        let withdraw_cpi_ctx = CpiContext::new_with_signer(
            self.system_program.to_account_info(),
            Transfer {
                from: self.global_treasury.to_account_info(),
                to: self.receiver.to_account_info(),
            },
            signer_seeds,
        );

        transfer(withdraw_cpi_ctx, args.amount)
    }
}
