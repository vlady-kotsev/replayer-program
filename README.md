# Replayer Program
<img width="200px" src="https://github.com/user-attachments/assets/aee18132-9a95-43ef-9ac6-2103816e4d01" />
<hr/>

A Solana program for decentralized game distribution and monetization. Developers upload game files, players purchase game keys minted as NFTs via [Metaplex Core](https://developers.metaplex.com/core), and platform fees are split automatically between the platform treasury and developers.

**Program ID:** `28bk4vaL8MfDZ5xbcitXNJjYbiRUaR3mnK21RnAjT8Ya`

## Architecture

### Accounts

| Account          | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| **GlobalConfig** | Platform-wide settings (fee in basis points 0-10000)               |
| **Admin**        | Marks an address as a platform administrator                       |
| **Developer**    | Tracks a developer's published games, treasury, and NFT collection |
| **GameData**     | Stores raw game file data (max 9 KB, uploaded in chunks)           |
| **GameMetadata** | Game name, price, supply cap, SHA-256 hash, developer reference    |
| **Blacklist**    | Flags whether a developer is blacklisted                           |

### Instructions

| Instruction                  | Who           | Description                                        |
| ---------------------------- | ------------- | -------------------------------------------------- |
| `init_global_config`         | Initial admin | Bootstrap platform config and treasury             |
| `add_admin` / `remove_admin` | Admin         | Manage platform administrators                     |
| `create_developer`           | Anyone        | Register as a developer, create NFT collection     |
| `allocate_game_account`      | Developer     | Create game data + metadata accounts               |
| `upload_game_chunk`          | Developer     | Upload game file in chunks                         |
| `finalize_game_upload`       | Developer     | Verify SHA-256 hash and finalize                   |
| `buy_game`                   | Player        | Purchase a game key (mints an NFT), splits payment |
| `withdraw_platform_fee`      | Admin         | Withdraw accumulated platform fees                 |
| `withdraw_developer_fee`     | Developer     | Withdraw earned revenue                            |
| `blacklist_account`          | Admin         | Blacklist/unblacklist a developer                  |

### Flow

```
1. Admin  -> init_global_config (set platform fee)
2. Dev    -> create_developer   (register + create NFT collection)
3. Dev    -> allocate_game_account -> upload_game_chunk (x N) -> finalize_game_upload
4. Player -> buy_game           (pays price, gets NFT key, fees split)
5. Admin  -> withdraw_platform_fee  /  Dev -> withdraw_developer_fee
```

## Tech Stack

- **Anchor** 0.32.1
- **Solana** (Rust + TypeScript client via `@coral-xyz/anchor`)
- **Metaplex Core** (`mpl-core` 0.11.1) for NFT minting
- **solana-sha256-hasher** for on-chain hash verification

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solanalabs.com/cli/install)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) 0.32.1
- [Yarn](https://yarnpkg.com/)

### Build & Test

```bash
# Install JS dependencies
yarn install

# Build the program
anchor build

# Run tests (starts a local validator automatically)
anchor test
```

### Scripts

Utility scripts for interacting with the deployed program live in `scripts/`:

```bash
npx ts-node scripts/init_global_config.ts
npx ts-node scripts/create_developer.ts
npx ts-node scripts/allocate_game_account.ts
npx ts-node scripts/upload_game_chunk.ts
npx ts-node scripts/finalize_game_upload.ts
npx ts-node scripts/buy_game.ts
npx ts-node scripts/add_admin.ts
```

## Related Repositories

This is part of the **Replayer** project. Check out the other repos:

- [replayer-fe](https://github.com/vlady-kotsev/replayer-fe) — Frontend
- [replayer-be](https://github.com/vlady-kotsev/replayer-be) — Backend

## License

MIT
