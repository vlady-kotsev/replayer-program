import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Replayer } from "../target/types/replayer";
import {
  DEVELOPER_SEED,
  DEVELOPER_TREASURY_SEED,
  DEVELOPER_COLLECTION_SEED,
  BLACKLISTED_SEED,
  MPL_CORE_PROGRAM_ID,
} from "./constants";

const { PublicKey } = anchor.web3;

async function createDeveloper() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.replayer as Program<Replayer>;

  const developer = provider.wallet.publicKey;

  const [developerAccount] = PublicKey.findProgramAddressSync(
    [DEVELOPER_SEED, developer.toBuffer()],
    program.programId
  );

  const [developerTreasury] = PublicKey.findProgramAddressSync(
    [DEVELOPER_TREASURY_SEED, developer.toBuffer()],
    program.programId
  );

  const [developerCollection] = PublicKey.findProgramAddressSync(
    [DEVELOPER_COLLECTION_SEED, developer.toBuffer()],
    program.programId
  );

  const [blacklistAccount] = PublicKey.findProgramAddressSync(
    [BLACKLISTED_SEED, developer.toBuffer()],
    program.programId
  );

  const companyName = "My Game Studio";
  const collectionUri = "https://example.com/collection.json";

  const tx = await program.methods
    .createDeveloper({ companyName, collectionUri })
    .accountsStrict({
      developer,
      developerAccount,
      developerTreasury,
      developerCollection,
      blacklistAccount,
      coreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("createDeveloper tx:", tx);
  console.log("Developer Account:", developerAccount.toBase58());
  console.log("Developer Treasury:", developerTreasury.toBase58());
  console.log("Developer Collection:", developerCollection.toBase58());
}

createDeveloper().catch(console.error);
