use anchor_lang::{
    prelude::*,
    system_program::{create_account, CreateAccount},
};

use crate::{
    constants::{ADMIN_SEED, BASIS_FACTOR, GLOBAL_CONFIG_SEED, GLOBAL_TREASURY_SEED},
    error::ReplayerErrors,
    program::Replayer,
    state::{Admin, GlobalConfig},
    ID,
};

#[derive(Accounts)]
pub struct InitGlobalConfig<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        init,
        payer = initializer,
        space = GlobalConfig::DISCRIMINATOR.len() + GlobalConfig::INIT_SPACE,
        seeds = [GLOBAL_CONFIG_SEED],
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(
        init,
        payer = initializer,
        space = Admin::DISCRIMINATOR.len() + Admin::INIT_SPACE,
        seeds = [ADMIN_SEED, initializer.key().as_ref()],
        bump
    )]
    pub admin: Account<'info, Admin>,
    #[account(
        mut,
        seeds = [GLOBAL_TREASURY_SEED],
        bump
    )]
    pub global_treasury: SystemAccount<'info>,
    #[account(
        address = ID,
        constraint = this.programdata_address()? == Some(program_data.key())
    )]
    pub this: Program<'info, Replayer>,
    #[account(
        constraint = program_data.upgrade_authority_address == Some(initializer.key())
    )]
    pub program_data: Account<'info, ProgramData>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct InitGlobalStateArgs {
    pub platform_fee: u64,
}

impl<'info> InitGlobalConfig<'info> {
    pub fn process(
        &mut self,
        args: &InitGlobalStateArgs,
        bumps: &InitGlobalConfigBumps,
    ) -> Result<()> {
        require!(
            args.platform_fee <= BASIS_FACTOR,
            ReplayerErrors::InvalidFeePercentage
        );

        self.admin.bump = bumps.admin;

        let signer_seeds: &[&[&[u8]]] = &[&[GLOBAL_TREASURY_SEED, &[bumps.global_treasury]]];

        let create_treasury_cpi_ctx = CpiContext::new_with_signer(
            self.system_program.to_account_info(),
            CreateAccount {
                from: self.initializer.to_account_info(),
                to: self.global_treasury.to_account_info(),
            },
            signer_seeds,
        );
        let lamports = Rent::get()?.minimum_balance(0);
        create_account(
            create_treasury_cpi_ctx,
            lamports,
            0,
            &self.system_program.key(),
        )?;

        *self.global_config = GlobalConfig {
            platform_fee: args.platform_fee,
            treasury_bump: bumps.global_treasury,
            bump: bumps.global_config,
        };

        Ok(())
    }
}
