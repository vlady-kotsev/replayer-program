import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Replayer } from "../target/types/replayer";
import {
  GAME_METADATA_SEED,
  DEVELOPER_SEED,
  DEVELOPER_COLLECTION_SEED,
  DEVELOPER_TREASURY_SEED,
  GAME_KEY_ASSET_SEED,
  GLOBAL_TREASURY_SEED,
  MPL_CORE_PROGRAM_ID,
  GAME_DATA_SEED,
  GLOBAL_CONFIG_SEED,
} from "./constants";

const { PublicKey } = anchor.web3;

async function buyGame() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.replayer as Program<Replayer>;

  const player = provider.wallet.publicKey;

  const gameName = "my-game";
  const developerPubkey = provider.wallet.publicKey; // change to actual developer pubkey
  const gameNameBytes = Buffer.from(gameName);

  const [gameMetadata] = PublicKey.findProgramAddressSync(
    [GAME_METADATA_SEED, developerPubkey.toBuffer(), gameNameBytes],
    program.programId,
  );

  const [gameData] = PublicKey.findProgramAddressSync(
    [GAME_DATA_SEED, developerPubkey.toBuffer(), gameNameBytes],
    program.programId,
  );

  const [developerAccount] = PublicKey.findProgramAddressSync(
    [DEVELOPER_SEED, developerPubkey.toBuffer()],
    program.programId,
  );

  const [collection] = PublicKey.findProgramAddressSync(
    [DEVELOPER_COLLECTION_SEED, developerPubkey.toBuffer()],
    program.programId,
  );

  const [asset] = PublicKey.findProgramAddressSync(
    [
      GAME_KEY_ASSET_SEED,
      developerPubkey.toBuffer(),
      gameNameBytes,
      player.toBuffer(),
    ],
    program.programId,
  );

  const [globalTreasury] = PublicKey.findProgramAddressSync(
    [GLOBAL_TREASURY_SEED],
    program.programId,
  );

  const [developerTreasury] = PublicKey.findProgramAddressSync(
    [DEVELOPER_TREASURY_SEED, developerPubkey.toBuffer()],
    program.programId,
  );

  const [globalConfig] = PublicKey.findProgramAddressSync(
    [GLOBAL_CONFIG_SEED],
    program.programId,
  );

  const tx = await program.methods
    .buyGame({ gameName, developer: developerPubkey })
    .accountsStrict({
      player,
      gameMetadata,
      gameData,
      developerAccount,
      collection,
      asset,
      globalConfig,
      globalTreasury,
      developerTreasury,
      coreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("buyGame tx:", tx);
  console.log("Asset (Game Key NFT):", asset.toBase58());
}

buyGame().catch(console.error);
