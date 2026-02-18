import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Replayer } from "../target/types/replayer";
import { GAME_DATA_SEED, GAME_METADATA_SEED, DEVELOPER_SEED } from "./constants";

const { PublicKey } = anchor.web3;

async function finalizeGameUpload() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.replayer as Program<Replayer>;

  const developer = provider.wallet.publicKey;

  const gameName = "my-game";
  const gameNameBytes = Buffer.from(gameName);

  const [gameData] = PublicKey.findProgramAddressSync(
    [GAME_DATA_SEED, developer.toBuffer(), gameNameBytes],
    program.programId
  );

  const [gameMetadata] = PublicKey.findProgramAddressSync(
    [GAME_METADATA_SEED, developer.toBuffer(), gameNameBytes],
    program.programId
  );

  const [developerAccount] = PublicKey.findProgramAddressSync(
    [DEVELOPER_SEED, developer.toBuffer()],
    program.programId
  );

  const tx = await program.methods
    .finalizeGameUpload()
    .accountsStrict({
      developer,
      gameData,
      gameMetadata,
      developerAccount,
    })
    .rpc();

  console.log("finalizeGameUpload tx:", tx);
  console.log("Game finalized successfully!");
}

finalizeGameUpload().catch(console.error);
