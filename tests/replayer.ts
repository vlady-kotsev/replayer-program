import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Replayer } from "../target/types/replayer";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { expect } from "chai";
import { createHash } from "crypto";
import BN from "bn.js";

const CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
);

function findPda(seeds: Buffer[], programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

describe("replayer", () => {
  const provider = anchor.AnchorProvider.env();
  console.log(`HEH ${provider.publicKey.toBase58()}`);
  anchor.setProvider(provider);
  const program = anchor.workspace.replayer as Program<Replayer>;
  const connection = provider.connection;
  const initializer = provider.wallet as anchor.Wallet;

  const developerKeypair = Keypair.generate();
  const playerKeypair = Keypair.generate();
  const newAdminKeypair = Keypair.generate();
  const secondAdminKeypair = Keypair.generate();

  const gameName = "TestGame";
  const gameUri = "https://example.com/game";
  const gamePrice = new BN(1_000_000);
  const maxSupply = new BN(100);
  const platformFeeBps = new BN(500);

  const gameData = Buffer.alloc(64);
  for (let i = 0; i < gameData.length; i++) {
    gameData[i] = i % 256;
  }
  const gameHash = Array.from(createHash("sha256").update(gameData).digest());

  const [globalConfig] = findPda([Buffer.from("config")], program.programId);
  const [globalTreasury] = findPda(
    [Buffer.from("treasury")],
    program.programId,
  );
  const [adminPda] = findPda(
    [Buffer.from("admin"), initializer.publicKey.toBuffer()],
    program.programId,
  );
  const [developerAccount] = findPda(
    [Buffer.from("dev"), developerKeypair.publicKey.toBuffer()],
    program.programId,
  );
  const [developerTreasury] = findPda(
    [Buffer.from("dev_treasury"), developerKeypair.publicKey.toBuffer()],
    program.programId,
  );
  const [developerCollection] = findPda(
    [Buffer.from("dev_collection"), developerKeypair.publicKey.toBuffer()],
    program.programId,
  );
  const [blacklistAccount] = findPda(
    [Buffer.from("blacklisted"), developerKeypair.publicKey.toBuffer()],
    program.programId,
  );
  const [gameDataPda] = findPda(
    [
      Buffer.from("game"),
      developerKeypair.publicKey.toBuffer(),
      Buffer.from(gameName),
    ],
    program.programId,
  );
  const [gameMetadataPda] = findPda(
    [
      Buffer.from("metadata"),
      developerKeypair.publicKey.toBuffer(),
      Buffer.from(gameName),
    ],
    program.programId,
  );
  const [newAdminPda] = findPda(
    [Buffer.from("admin"), newAdminKeypair.publicKey.toBuffer()],
    program.programId,
  );
  const [secondAdminPda] = findPda(
    [Buffer.from("admin"), secondAdminKeypair.publicKey.toBuffer()],
    program.programId,
  );
  const [assetPda] = findPda(
    [
      Buffer.from("game_key"),
      developerKeypair.publicKey.toBuffer(),
      Buffer.from(gameName),
      playerKeypair.publicKey.toBuffer(),
    ],
    program.programId,
  );

  before(async () => {
    const sig1 = await connection.requestAirdrop(
      developerKeypair.publicKey,
      10 * LAMPORTS_PER_SOL,
    );
    const sig2 = await connection.requestAirdrop(
      playerKeypair.publicKey,
      10 * LAMPORTS_PER_SOL,
    );
    const sig3 = await connection.requestAirdrop(
      newAdminKeypair.publicKey,
      10 * LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction(sig1);
    await connection.confirmTransaction(sig2);
    await connection.confirmTransaction(sig3);
  });

  describe("init_global_config", () => {
    it("initializes global config", async () => {
      const programData = PublicKey.findProgramAddressSync(
        [program.programId.toBuffer()],
        new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111"),
      )[0];

      await program.methods
        .initGlobalConfig({ platformFee: platformFeeBps })
        .accountsStrict({
          initializer: initializer.publicKey,
          globalConfig,
          admin: adminPda,
          globalTreasury,
          this: program.programId,
          programData,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const config = await program.account.globalConfig.fetch(globalConfig);
      expect(config.platformFee.toNumber()).to.equal(500);
    });

    it("rejects fee above 10000 bps", async () => {
      const programData = PublicKey.findProgramAddressSync(
        [program.programId.toBuffer()],
        new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111"),
      )[0];

      try {
        await program.methods
          .initGlobalConfig({ platformFee: new BN(10001) })
          .accountsStrict({
            initializer: initializer.publicKey,
            globalConfig,
            admin: adminPda,
            globalTreasury,
            this: program.programId,
            programData,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).to.be.instanceOf(Error);
      }
    });
  });

  describe("add_admin", () => {
    it("adds a new admin", async () => {
      await program.methods
        .addAdmin({ newAdmin: newAdminKeypair.publicKey })
        .accountsStrict({
          admin: initializer.publicKey,
          adminAccount: adminPda,
          newAdmin: newAdminPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const admin = await program.account.admin.fetch(newAdminPda);
      expect(admin.bump).to.be.greaterThan(0);
    });

    it("rejects non-admin signer", async () => {
      try {
        await program.methods
          .addAdmin({ newAdmin: secondAdminKeypair.publicKey })
          .accountsStrict({
            admin: developerKeypair.publicKey,
            adminAccount: PublicKey.findProgramAddressSync(
              [Buffer.from("admin"), developerKeypair.publicKey.toBuffer()],
              program.programId,
            )[0],
            newAdmin: secondAdminPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([developerKeypair])
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).to.be.instanceOf(Error);
      }
    });
  });

  describe("remove_admin", () => {
    it("removes an admin", async () => {
      await program.methods
        .addAdmin({ newAdmin: secondAdminKeypair.publicKey })
        .accountsStrict({
          admin: initializer.publicKey,
          adminAccount: adminPda,
          newAdmin: secondAdminPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .removeAdmin({ removedAdmin: secondAdminKeypair.publicKey })
        .accountsStrict({
          admin: initializer.publicKey,
          adminAccount: adminPda,
          removedAdmin: secondAdminPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      try {
        await program.account.admin.fetch(secondAdminPda);
        expect.fail("account should be closed");
      } catch (e) {
        expect(e).to.be.instanceOf(Error);
      }
    });
  });

  describe("create_developer", () => {
    it("creates a developer account", async () => {
      await program.methods
        .createDeveloper({
          companyName: "Test Studio",
          collectionUri: "https://example.com/collection",
        })
        .accountsStrict({
          developer: developerKeypair.publicKey,
          developerAccount,
          developerTreasury,
          developerCollection,
          blacklistAccount,
          coreProgram: CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([developerKeypair])
        .rpc();

      const dev = await program.account.developer.fetch(developerAccount);
      expect(dev.gamesPublished.toNumber()).to.equal(0);
    });
  });

  describe("allocate_game_account", () => {
    it("allocates a game account", async () => {
      await program.methods
        .allocateGameAccount({
          gameName,
          gameUri,
          gamePrice,
          gameHash,
          maxSupply,
          gameDataLength: new BN(gameData.length),
        })
        .accountsStrict({
          developer: developerKeypair.publicKey,
          gameData: gameDataPda,
          gameMetadata: gameMetadataPda,
          blacklisted: blacklistAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([developerKeypair])
        .rpc();

      const metadata = await program.account.gameMetadata.fetch(
        gameMetadataPda,
      );
      expect(metadata.gameName).to.equal(gameName);
      expect(metadata.price.toNumber()).to.equal(1_000_000);
      expect(metadata.currentSupply.toNumber()).to.equal(0);
      expect(metadata.maxSupply.toNumber()).to.equal(100);
      expect(metadata.developer.toBase58()).to.equal(
        developerKeypair.publicKey.toBase58(),
      );
      expect(metadata.isFinalized).to.be.false;
    });

    it("rejects empty game name", async () => {
      const [gd] = findPda(
        [
          Buffer.from("game"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(""),
        ],
        program.programId,
      );
      const [gm] = findPda(
        [
          Buffer.from("metadata"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(""),
        ],
        program.programId,
      );

      try {
        await program.methods
          .allocateGameAccount({
            gameName: "",
            gameUri,
            gamePrice,
            gameHash,
            maxSupply,
            gameDataLength: new BN(64),
          })
          .accountsStrict({
            developer: developerKeypair.publicKey,
            gameData: gd,
            gameMetadata: gm,
            blacklisted: blacklistAccount,
            systemProgram: SystemProgram.programId,
          })
          .signers([developerKeypair])
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e.toString()).to.include("InvalidGameName");
      }
    });

    it("rejects zero game price", async () => {
      const name = "ZeroPriceGame";
      const [gd] = findPda(
        [
          Buffer.from("game"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );
      const [gm] = findPda(
        [
          Buffer.from("metadata"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );

      try {
        await program.methods
          .allocateGameAccount({
            gameName: name,
            gameUri,
            gamePrice: new BN(0),
            gameHash,
            maxSupply,
            gameDataLength: new BN(64),
          })
          .accountsStrict({
            developer: developerKeypair.publicKey,
            gameData: gd,
            gameMetadata: gm,
            blacklisted: blacklistAccount,
            systemProgram: SystemProgram.programId,
          })
          .signers([developerKeypair])
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e.toString()).to.include("InvalidGamePrice");
      }
    });

    it("rejects zero max supply", async () => {
      const name = "ZeroSupplyGame";
      const [gd] = findPda(
        [
          Buffer.from("game"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );
      const [gm] = findPda(
        [
          Buffer.from("metadata"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );

      try {
        await program.methods
          .allocateGameAccount({
            gameName: name,
            gameUri,
            gamePrice,
            gameHash,
            maxSupply: new BN(0),
            gameDataLength: new BN(64),
          })
          .accountsStrict({
            developer: developerKeypair.publicKey,
            gameData: gd,
            gameMetadata: gm,
            blacklisted: blacklistAccount,
            systemProgram: SystemProgram.programId,
          })
          .signers([developerKeypair])
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e.toString()).to.include("InvalidGameMaxSupply");
      }
    });

    it("rejects data length exceeding max", async () => {
      const name = "OverflowGame";
      const [gd] = findPda(
        [
          Buffer.from("game"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );
      const [gm] = findPda(
        [
          Buffer.from("metadata"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );

      try {
        await program.methods
          .allocateGameAccount({
            gameName: name,
            gameUri,
            gamePrice,
            gameHash,
            maxSupply,
            gameDataLength: new BN(9217),
          })
          .accountsStrict({
            developer: developerKeypair.publicKey,
            gameData: gd,
            gameMetadata: gm,
            blacklisted: blacklistAccount,
            systemProgram: SystemProgram.programId,
          })
          .signers([developerKeypair])
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e.toString()).to.include("GameDataLengthOverflow");
      }
    });
  });

  describe("upload_game_chunk", () => {
    it("uploads game data in a single chunk", async () => {
      await program.methods
        .uploadGameChunk({ dataChunk: Buffer.from(gameData) })
        .accountsStrict({
          developer: developerKeypair.publicKey,
          gameData: gameDataPda,
          gameMetadata: gameMetadataPda,
        })
        .signers([developerKeypair])
        .rpc();
    });

    it("uploads game data in multiple chunks", async () => {
      const name = "ChunkedGame";
      const data = Buffer.alloc(128);
      for (let i = 0; i < data.length; i++) data[i] = i % 256;
      const hash = Array.from(createHash("sha256").update(data).digest());

      const [gd] = findPda(
        [
          Buffer.from("game"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );
      const [gm] = findPda(
        [
          Buffer.from("metadata"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );

      await program.methods
        .allocateGameAccount({
          gameName: name,
          gameUri,
          gamePrice,
          gameHash: hash,
          maxSupply,
          gameDataLength: new BN(data.length),
        })
        .accountsStrict({
          developer: developerKeypair.publicKey,
          gameData: gd,
          gameMetadata: gm,
          blacklisted: blacklistAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([developerKeypair])
        .rpc();

      const chunkSize = 64;
      for (let i = 0; i < data.length; i += chunkSize) {
        await program.methods
          .uploadGameChunk({
            dataChunk: Buffer.from(data.subarray(i, i + chunkSize)),
          })
          .accountsStrict({
            developer: developerKeypair.publicKey,
            gameData: gd,
            gameMetadata: gm,
          })
          .signers([developerKeypair])
          .rpc();
      }
    });
  });

  describe("finalize_game_upload", () => {
    it("finalizes a fully uploaded game", async () => {
      await program.methods
        .finalizeGameUpload()
        .accountsStrict({
          developer: developerKeypair.publicKey,
          gameData: gameDataPda,
          gameMetadata: gameMetadataPda,
          developerAccount,
        })
        .signers([developerKeypair])
        .rpc();

      const dev = await program.account.developer.fetch(developerAccount);
      expect(dev.gamesPublished.toNumber()).to.equal(1);

      const metadata = await program.account.gameMetadata.fetch(
        gameMetadataPda,
      );
      expect(metadata.isFinalized).to.be.true;
    });

    it("rejects finalizing an already finalized game", async () => {
      try {
        await program.methods
          .finalizeGameUpload()
          .accountsStrict({
            developer: developerKeypair.publicKey,
            gameData: gameDataPda,
            gameMetadata: gameMetadataPda,
            developerAccount,
          })
          .signers([developerKeypair])
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e.toString()).to.include("GameAlreadyFinalized");
      }
    });

    it("rejects finalizing with incomplete upload", async () => {
      const name = "IncompleteGame";
      const data = Buffer.alloc(128);
      const hash = Array.from(createHash("sha256").update(data).digest());

      const [gd] = findPda(
        [
          Buffer.from("game"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );
      const [gm] = findPda(
        [
          Buffer.from("metadata"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );

      await program.methods
        .allocateGameAccount({
          gameName: name,
          gameUri,
          gamePrice,
          gameHash: hash,
          maxSupply,
          gameDataLength: new BN(128),
        })
        .accountsStrict({
          developer: developerKeypair.publicKey,
          gameData: gd,
          gameMetadata: gm,
          blacklisted: blacklistAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([developerKeypair])
        .rpc();

      await program.methods
        .uploadGameChunk({ dataChunk: Buffer.from(data.subarray(0, 64)) })
        .accountsStrict({
          developer: developerKeypair.publicKey,
          gameData: gd,
          gameMetadata: gm,
        })
        .signers([developerKeypair])
        .rpc();

      try {
        await program.methods
          .finalizeGameUpload()
          .accountsStrict({
            developer: developerKeypair.publicKey,
            gameData: gd,
            gameMetadata: gm,
            developerAccount,
          })
          .signers([developerKeypair])
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e.toString()).to.include("UnfinalizedGameData");
      }
    });

    it("rejects finalizing with wrong hash", async () => {
      const name = "WrongHashGame";
      const data = Buffer.alloc(64);
      for (let i = 0; i < data.length; i++) data[i] = i % 256;
      const wrongHash = Array.from(Buffer.alloc(32, 0xff));

      const [gd] = findPda(
        [
          Buffer.from("game"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );
      const [gm] = findPda(
        [
          Buffer.from("metadata"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );

      await program.methods
        .allocateGameAccount({
          gameName: name,
          gameUri,
          gamePrice,
          gameHash: wrongHash,
          maxSupply,
          gameDataLength: new BN(data.length),
        })
        .accountsStrict({
          developer: developerKeypair.publicKey,
          gameData: gd,
          gameMetadata: gm,
          blacklisted: blacklistAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([developerKeypair])
        .rpc();

      await program.methods
        .uploadGameChunk({ dataChunk: Buffer.from(data) })
        .accountsStrict({
          developer: developerKeypair.publicKey,
          gameData: gd,
          gameMetadata: gm,
        })
        .signers([developerKeypair])
        .rpc();

      try {
        await program.methods
          .finalizeGameUpload()
          .accountsStrict({
            developer: developerKeypair.publicKey,
            gameData: gd,
            gameMetadata: gm,
            developerAccount,
          })
          .signers([developerKeypair])
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e.toString()).to.include("GameDataDiscrepancy");
      }
    });
  });

  describe("buy_game", () => {
    it("purchases a game key", async () => {
      const devTreasuryBefore = await connection.getBalance(developerTreasury);
      const globalTreasuryBefore = await connection.getBalance(globalTreasury);

      await program.methods
        .buyGame({ gameName, developer: developerKeypair.publicKey })
        .accountsStrict({
          player: playerKeypair.publicKey,
          gameMetadata: gameMetadataPda,
          gameData: gameDataPda,
          developerAccount,
          collection: developerCollection,
          asset: assetPda,
          globalConfig,
          globalTreasury,
          developerTreasury,
          coreProgram: CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([playerKeypair])
        .rpc();

      const metadata = await program.account.gameMetadata.fetch(
        gameMetadataPda,
      );
      expect(metadata.currentSupply.toNumber()).to.equal(1);

      const devTreasuryAfter = await connection.getBalance(developerTreasury);
      const globalTreasuryAfter = await connection.getBalance(globalTreasury);

      const expectedPlatformFee = Math.floor((1_000_000 * 500) / 10_000);
      const expectedDevFee = 1_000_000 - expectedPlatformFee;

      expect(globalTreasuryAfter - globalTreasuryBefore).to.equal(
        expectedPlatformFee,
      );
      expect(devTreasuryAfter - devTreasuryBefore).to.equal(expectedDevFee);
    });

    it("rejects buying same game twice by same player", async () => {
      try {
        await program.methods
          .buyGame({ gameName, developer: developerKeypair.publicKey })
          .accountsStrict({
            player: playerKeypair.publicKey,
            gameMetadata: gameMetadataPda,
            gameData: gameDataPda,
            developerAccount,
            collection: developerCollection,
            asset: assetPda,
            globalConfig,
            globalTreasury,
            developerTreasury,
            coreProgram: CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([playerKeypair])
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).to.be.instanceOf(Error);
      }
    });

    it("rejects buying when supply is reached", async () => {
      const name = "LimitedGame";
      const data = Buffer.alloc(32);
      for (let i = 0; i < data.length; i++) data[i] = i;
      const hash = Array.from(createHash("sha256").update(data).digest());

      const [gd] = findPda(
        [
          Buffer.from("game"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );
      const [gm] = findPda(
        [
          Buffer.from("metadata"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );

      await program.methods
        .allocateGameAccount({
          gameName: name,
          gameUri,
          gamePrice,
          gameHash: hash,
          maxSupply: new BN(1),
          gameDataLength: new BN(data.length),
        })
        .accountsStrict({
          developer: developerKeypair.publicKey,
          gameData: gd,
          gameMetadata: gm,
          blacklisted: blacklistAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([developerKeypair])
        .rpc();

      await program.methods
        .uploadGameChunk({ dataChunk: Buffer.from(data) })
        .accountsStrict({
          developer: developerKeypair.publicKey,
          gameData: gd,
          gameMetadata: gm,
        })
        .signers([developerKeypair])
        .rpc();

      await program.methods
        .finalizeGameUpload()
        .accountsStrict({
          developer: developerKeypair.publicKey,
          gameData: gd,
          gameMetadata: gm,
          developerAccount,
        })
        .signers([developerKeypair])
        .rpc();

      const [col] = findPda(
        [Buffer.from("dev_collection"), developerKeypair.publicKey.toBuffer()],
        program.programId,
      );
      const [asset1] = findPda(
        [
          Buffer.from("game_key"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
          playerKeypair.publicKey.toBuffer(),
        ],
        program.programId,
      );

      await program.methods
        .buyGame({ gameName: name, developer: developerKeypair.publicKey })
        .accountsStrict({
          player: playerKeypair.publicKey,
          gameMetadata: gm,
          gameData: gd,
          developerAccount,
          collection: col,
          asset: asset1,
          globalConfig,
          globalTreasury,
          developerTreasury,
          coreProgram: CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([playerKeypair])
        .rpc();

      const secondBuyer = Keypair.generate();
      const sig = await connection.requestAirdrop(
        secondBuyer.publicKey,
        5 * LAMPORTS_PER_SOL,
      );
      await connection.confirmTransaction(sig);

      const [asset2] = findPda(
        [
          Buffer.from("game_key"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
          secondBuyer.publicKey.toBuffer(),
        ],
        program.programId,
      );

      try {
        await program.methods
          .buyGame({ gameName: name, developer: developerKeypair.publicKey })
          .accountsStrict({
            player: secondBuyer.publicKey,
            gameMetadata: gm,
            gameData: gd,
            developerAccount,
            collection: col,
            asset: asset2,
            globalConfig,
            globalTreasury,
            developerTreasury,
            coreProgram: CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([secondBuyer])
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e.toString()).to.include("GameSupplyReached");
      }
    });
  });

  describe("withdraw_platform_fee", () => {
    it("withdraws platform fees to receiver", async () => {
      const receiver = Keypair.generate();
      const receiverBalBefore = await connection.getBalance(receiver.publicKey);
      const withdrawAmount = new BN(10_000);

      await program.methods
        .withdrawPlatformFee({ amount: withdrawAmount })
        .accountsStrict({
          withdrawer: initializer.publicKey,
          adminAccount: adminPda,
          globalConfig,
          globalTreasury,
          receiver: receiver.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const receiverBalAfter = await connection.getBalance(receiver.publicKey);
      expect(receiverBalAfter - receiverBalBefore).to.equal(10_000);
    });

    it("rejects non-admin withdrawal", async () => {
      try {
        await program.methods
          .withdrawPlatformFee({ amount: new BN(1) })
          .accountsStrict({
            withdrawer: developerKeypair.publicKey,
            adminAccount: PublicKey.findProgramAddressSync(
              [Buffer.from("admin"), developerKeypair.publicKey.toBuffer()],
              program.programId,
            )[0],
            globalConfig,
            globalTreasury,
            receiver: developerKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([developerKeypair])
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).to.be.instanceOf(Error);
      }
    });
  });

  describe("withdraw_developer_fee", () => {
    it("withdraws developer fees", async () => {
      const devBalBefore = await connection.getBalance(
        developerKeypair.publicKey,
      );
      const withdrawAmount = new BN(10_000);

      await program.methods
        .withdrawDeveloperFee({ amount: withdrawAmount })
        .accountsStrict({
          developer: developerKeypair.publicKey,
          developerAccount,
          developerTreasury,
          systemProgram: SystemProgram.programId,
        })
        .signers([developerKeypair])
        .rpc();

      const devBalAfter = await connection.getBalance(
        developerKeypair.publicKey,
      );
      expect(devBalAfter).to.be.greaterThan(devBalBefore - 100_000);
    });
  });

  describe("blacklist_account", () => {
    it("blacklists a developer", async () => {
      await program.methods
        .blacklistAccount({
          address: developerKeypair.publicKey,
          isBlacklisted: true,
        })
        .accountsStrict({
          admin: initializer.publicKey,
          adminAccount: adminPda,
          blacklistAccount,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const bl = await program.account.blacklist.fetch(blacklistAccount);
      expect(bl.isBlacklisted).to.be.true;
    });

    it("prevents blacklisted developer from allocating games", async () => {
      const name = "BlockedGame";
      const [gd] = findPda(
        [
          Buffer.from("game"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );
      const [gm] = findPda(
        [
          Buffer.from("metadata"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );

      try {
        await program.methods
          .allocateGameAccount({
            gameName: name,
            gameUri,
            gamePrice,
            gameHash,
            maxSupply,
            gameDataLength: new BN(64),
          })
          .accountsStrict({
            developer: developerKeypair.publicKey,
            gameData: gd,
            gameMetadata: gm,
            blacklisted: blacklistAccount,
            systemProgram: SystemProgram.programId,
          })
          .signers([developerKeypair])
          .rpc();
        expect.fail("should have thrown");
      } catch (e) {
        expect(e.toString()).to.include("Blacklisted");
      }
    });

    it("unblacklists a developer", async () => {
      await program.methods
        .blacklistAccount({
          address: developerKeypair.publicKey,
          isBlacklisted: false,
        })
        .accountsStrict({
          admin: initializer.publicKey,
          adminAccount: adminPda,
          blacklistAccount,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const bl = await program.account.blacklist.fetch(blacklistAccount);
      expect(bl.isBlacklisted).to.be.false;
    });

    it("allows unblacklisted developer to allocate games again", async () => {
      const name = "UnblockedGame";
      const data = Buffer.alloc(32);
      const hash = Array.from(createHash("sha256").update(data).digest());
      const [gd] = findPda(
        [
          Buffer.from("game"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );
      const [gm] = findPda(
        [
          Buffer.from("metadata"),
          developerKeypair.publicKey.toBuffer(),
          Buffer.from(name),
        ],
        program.programId,
      );

      await program.methods
        .allocateGameAccount({
          gameName: name,
          gameUri,
          gamePrice,
          gameHash: hash,
          maxSupply,
          gameDataLength: new BN(data.length),
        })
        .accountsStrict({
          developer: developerKeypair.publicKey,
          gameData: gd,
          gameMetadata: gm,
          blacklisted: blacklistAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([developerKeypair])
        .rpc();

      const metadata = await program.account.gameMetadata.fetch(gm);
      expect(metadata.gameName).to.equal(name);
    });
  });
});
