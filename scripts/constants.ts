import * as anchor from "@coral-xyz/anchor";

export const GLOBAL_CONFIG_SEED = Buffer.from("config");
export const ADMIN_SEED = Buffer.from("admin");
export const GLOBAL_TREASURY_SEED = Buffer.from("treasury");
export const DEVELOPER_SEED = Buffer.from("dev");
export const DEVELOPER_TREASURY_SEED = Buffer.from("dev_treasury");
export const DEVELOPER_COLLECTION_SEED = Buffer.from("dev_collection");
export const BLACKLISTED_SEED = Buffer.from("blacklisted");
export const GAME_DATA_SEED = Buffer.from("game");
export const GAME_METADATA_SEED = Buffer.from("metadata");
export const GAME_KEY_ASSET_SEED = Buffer.from("game_key");
export const MPL_CORE_PROGRAM_ID = new anchor.web3.PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);
