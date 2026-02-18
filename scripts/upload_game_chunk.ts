import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as fs from "fs";
import * as path from "path";
import { Replayer } from "../target/types/replayer";
import { GAME_DATA_SEED, GAME_METADATA_SEED } from "./constants";

const { PublicKey } = anchor.web3;

// ~900 bytes to stay within transaction size limits
const CHUNK_SIZE = 900;

async function uploadGameChunks() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.replayer as Program<Replayer>;

  const developer = provider.wallet.publicKey;

  const gameName = "my-game";
  const gameNameBytes = Buffer.from(gameName);

  const gameFileData = fs.readFileSync(
    path.join(__dirname, "..", "INVADERS")
  );

  const [gameData] = PublicKey.findProgramAddressSync(
    [GAME_DATA_SEED, developer.toBuffer(), gameNameBytes],
    program.programId
  );

  const [gameMetadata] = PublicKey.findProgramAddressSync(
    [GAME_METADATA_SEED, developer.toBuffer(), gameNameBytes],
    program.programId
  );

  const totalChunks = Math.ceil(gameFileData.length / CHUNK_SIZE);
  console.log(
    `Uploading ${gameFileData.length} bytes in ${totalChunks} chunks...`
  );

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, gameFileData.length);
    const dataChunk = Buffer.from(gameFileData.subarray(start, end));

    const tx = await program.methods
      .uploadGameChunk({ dataChunk })
      .accountsStrict({
        developer,
        gameData,
        gameMetadata,
      })
      .rpc();

    console.log(
      `Chunk ${i + 1}/${totalChunks} uploaded (${start}-${end}), tx: ${tx}`
    );
  }

  console.log("All chunks uploaded successfully.");
}

uploadGameChunks().catch(console.error);
