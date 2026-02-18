import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Replayer } from "../target/types/replayer";
import { GLOBAL_CONFIG_SEED, ADMIN_SEED, GLOBAL_TREASURY_SEED } from "./constants";

const { PublicKey } = anchor.web3;

async function initGlobalConfig() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.replayer as Program<Replayer>;

  const initializer = provider.wallet.publicKey;

  const [globalConfig] = PublicKey.findProgramAddressSync(
    [GLOBAL_CONFIG_SEED],
    program.programId
  );

  const [admin] = PublicKey.findProgramAddressSync(
    [ADMIN_SEED, initializer.toBuffer()],
    program.programId
  );

  const [globalTreasury] = PublicKey.findProgramAddressSync(
    [GLOBAL_TREASURY_SEED],
    program.programId
  );

  const [programData] = PublicKey.findProgramAddressSync(
    [program.programId.toBuffer()],
    new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111")
  );

  const platformFee = new anchor.BN(500); // 5% in basis points

  const tx = await program.methods
    .initGlobalConfig({ platformFee })
    .accountsStrict({
      initializer,
      globalConfig,
      admin,
      globalTreasury,
      this: program.programId,
      programData,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("initGlobalConfig tx:", tx);
  console.log("Global Config:", globalConfig.toBase58());
  console.log("Admin:", admin.toBase58());
  console.log("Global Treasury:", globalTreasury.toBase58());
}

initGlobalConfig().catch(console.error);
