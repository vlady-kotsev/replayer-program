use anchor_lang::prelude::*;

// Seeds
#[constant]
pub const GAME_DATA_SEED: &[u8] = b"game";
#[constant]
pub const GAME_METADATA_SEED: &[u8] = b"metadata";
#[constant]
pub const DEVELOPER_TREASURY_SEED: &[u8] = b"dev_treasury";
#[constant]
pub const GLOBAL_TREASURY_SEED: &[u8] = b"treasury";
#[constant]
pub const GLOBAL_CONFIG_SEED: &[u8] = b"config";
#[constant]
pub const DEVELOPER_SEED: &[u8] = b"dev";
#[constant]
pub const ADMIN_SEED: &[u8] = b"admin";
#[constant]
pub const DEVELOPER_COLLECTION_SEED: &[u8] = b"dev_collection";
#[constant]
pub const GAME_KEY_ASSET_SEED: &[u8] = b"game_key";
#[constant]
pub const BLACKLISTED_SEED: &[u8] = b"blacklisted";

// Other
pub const MAX_GAMEDATA_LENGTH: usize = 1024*9; // 9KB
pub const BASIS_FACTOR: u64 = 10_000;
