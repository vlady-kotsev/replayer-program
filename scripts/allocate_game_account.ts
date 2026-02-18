import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Replayer } from "../target/types/replayer";
import { GAME_DATA_SEED, GAME_METADATA_SEED, BLACKLISTED_SEED } from "./constants";

const { PublicKey } = anchor.web3;

async function allocateGameAccount() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.replayer as Program<Replayer>;

  const developer = provider.wallet.publicKey;

  const gameName = "my-game";
  const gameUri = "https://example.com/game.json";
  const gamePrice = new anchor.BN(1_000); // 1 SOL in lamports
  const maxSupply = new anchor.BN(1000);

  const gameFileData = fs.readFileSync(
    path.join(__dirname, "..", "INVADERS")
  );
  const gameHash = Array.from(
    createHash("sha256").update(gameFileData).digest()
  );
  const gameDataLength = new anchor.BN(gameFileData.length);

  const gameNameBytes = Buffer.from(gameName);

  const [gameData] = PublicKey.findProgramAddressSync(
    [GAME_DATA_SEED, developer.toBuffer(), gameNameBytes],
    program.programId
  );

  const [gameMetadata] = PublicKey.findProgramAddressSync(
    [GAME_METADATA_SEED, developer.toBuffer(), gameNameBytes],
    program.programId
  );

  const [blacklisted] = PublicKey.findProgramAddressSync(
    [BLACKLISTED_SEED, developer.toBuffer()],
    program.programId
  );

  const tx = await program.methods
    .allocateGameAccount({
      gameName,
      gameUri,
      gamePrice,
      gameHash,
      maxSupply,
      gameDataLength,
    })
    .accountsStrict({
      developer,
      gameData,
      gameMetadata,
      blacklisted,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("allocateGameAccount tx:", tx);
  console.log("Game Data:", gameData.toBase58());
  console.log("Game Metadata:", gameMetadata.toBase58());
  console.log("Game Hash:", Buffer.from(gameHash).toString("hex"));
  console.log("Game Data Length:", gameFileData.length);
}

allocateGameAccount().catch(console.error);
