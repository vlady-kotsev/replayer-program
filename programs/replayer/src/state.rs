use anchor_lang::prelude::*;

#[account(discriminator = 1)]
#[derive(InitSpace)]
pub struct GlobalConfig {
    pub platform_fee: u64, // basis points
    pub treasury_bump: u8,
    pub bump: u8,
}

#[account(discriminator = 2)]
#[derive(InitSpace)]
pub struct Developer {
    pub games_published: u64,
    pub treasury_bump: u8,
    pub collection_bump: u8,
    pub bump: u8,
}

#[account(zero_copy, discriminator = 3)]
#[derive(InitSpace)]
#[repr(C)]
pub struct GameData {
    pub write_index: u64,
    pub length: u64,
    pub is_finalized: u8,
    pub bump: u8,
    pub _padding: [u8; 6],
    pub data: [u8; 1024 * 1024], // 1MB
}

#[account(discriminator = 4)]
#[derive(InitSpace)]
pub struct GameMetadata {
    pub data_hash: [u8; 32],
    pub developer: Pubkey,
    #[max_len(40)]
    pub game_name: String,
    #[max_len(200)]
    pub game_uri: String,
    pub price: u64, // lamports
    pub current_supply: u64,
    pub max_supply: u64,
    pub bump: u8,
}

#[account(discriminator = 5)]
#[derive(InitSpace)]
pub struct Admin {
    pub bump: u8,
}

#[account(discriminator = 6)]
#[derive(InitSpace)]
pub struct Blacklist {
    pub is_blacklisted: bool,
    pub bump: u8,
}
