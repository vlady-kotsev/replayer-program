use anchor_lang::prelude::*;

mod constants;
mod error;
mod instructions;
mod state;

pub use instructions::*;
declare_id!("3L4ZDN7REkTk97ybn5FS4NUBMmcbQQQjQbKH6kET595c");

#[program]
pub mod replayer {
    use super::*;

    #[instruction(discriminator = 0)]
    pub fn init_global_config(
        ctx: Context<InitGlobalConfig>,
        args: InitGlobalStateArgs,
    ) -> Result<()> {
        ctx.accounts.process(&args, &ctx.bumps)
    }

    #[instruction(discriminator = 1)]
    pub fn allocate_game_account(
        ctx: Context<AllocateGameAccount>,
        args: AllocateGameArgs,
    ) -> Result<()> {
        ctx.accounts.process(&args, &ctx.bumps)
    }

    #[instruction(discriminator = 2)]
    pub fn upload_game_chunk(
        ctx: Context<UploadGameChunk>,
        args: UploadGameChunkArgs,
    ) -> Result<()> {
        ctx.accounts.process(&args)
    }

    #[instruction(discriminator = 3)]
    pub fn finalize_game_upload(ctx: Context<FinalizeGameUpload>) -> Result<()> {
        ctx.accounts.process()
    }

    #[instruction(discriminator = 4)]
    pub fn create_developer(
        ctx: Context<CreateDeveloper>,
        args: CreateDeveloperArgs,
    ) -> Result<()> {
        ctx.accounts.process(&args, &ctx.bumps)
    }

    #[instruction(discriminator = 5)]
    pub fn add_admin(ctx: Context<AddAdmin>, _args: AddAdminArgs) -> Result<()> {
        ctx.accounts.process(&ctx.bumps)
    }

    #[instruction(discriminator = 6)]
    pub fn remove_admin(ctx: Context<RemoveAdmin>, _args: RemoveAdminArgs) -> Result<()> {
        ctx.accounts.process()
    }

    #[instruction(discriminator = 7)]
    pub fn buy_game(ctx: Context<BuyGame>, args: BuyGameArgs) -> Result<()> {
        ctx.accounts.process(&args, &ctx.bumps)
    }

    #[instruction(discriminator = 8)]
    pub fn withdraw_platform_fee(
        ctx: Context<WithdrawPlatfromFee>,
        args: WithdrawPlatfromFeeArgs,
    ) -> Result<()> {
        ctx.accounts.process(&args)
    }

    #[instruction(discriminator = 9)]
    pub fn withdraw_developer_fee(
        ctx: Context<WithdrawDeveloperFee>,
        args: WithdrawDeveloperFeeArgs,
    ) -> Result<()> {
        ctx.accounts.process(&args)
    }

    #[instruction(discriminator = 10)]
    pub fn blacklist_account(
        ctx: Context<BlacklistAccount>,
        args: BlacklistAccountArgs,
    ) -> Result<()> {
        ctx.accounts.process(&args)
    }
}
