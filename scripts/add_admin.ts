import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Replayer } from "../target/types/replayer";
import { ADMIN_SEED } from "./constants";

const { PublicKey } = anchor.web3;

async function addAdmin() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.replayer as Program<Replayer>;

  const admin = provider.wallet.publicKey;

  const newAdminPubkey = new PublicKey(
    "7dtBGQBsHArcESdjHdpAtdssrXwLhjDTrKfjPse8EfQf",
  );

  const [adminAccount] = PublicKey.findProgramAddressSync(
    [ADMIN_SEED, admin.toBuffer()],
    program.programId,
  );

  const [newAdminAccount] = PublicKey.findProgramAddressSync(
    [ADMIN_SEED, newAdminPubkey.toBuffer()],
    program.programId,
  );

  const tx = await program.methods
    .addAdmin({ newAdmin: newAdminPubkey })
    .accountsStrict({
      admin,
      adminAccount,
      newAdmin: newAdminAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("addAdmin tx:", tx);
  console.log("New Admin Pubkey:", newAdminPubkey.toBase58());
  console.log("New Admin Account:", newAdminAccount.toBase58());
}

addAdmin().catch(console.error);
