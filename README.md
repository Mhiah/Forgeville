# Forgeville — playable game prototype

A self-contained offline browser game. **No real tokens, NFTs, blockchain transactions, or NPC wallets.** The town economy, shopper decisions, design cards and royalties are simulated in JavaScript.

## Play

Open `index.html` in any modern browser. No dependencies, account or server required. For a single-file version, use `forgeville-playable.html`.

## Gameplay

Five rounds: read a trend → design a product (type, material, colour, price, quantity) → produce with your coin budget → watch 18 buyer visits → review sales and continue. Buyer categories have different tastes and wallets. Rival workshops increase saturation; optional design remixing pays 7% royalties. A 3% community fee grows the design challenge treasury. Unsold goods carry over and may sell at a 30% discount. The game tracks available cash, inventory and simulated sales per design.

## Technical notes

- Built in plain HTML/CSS/JavaScript; works offline.
- Prices, demand and decisions are game mechanics; no financial transactions.
- The design shelf is **NFT-ready concept UI only**. It does not mint anything.
- The town treasury is a simulated number, not a token.
- There is no wallet login, Solana integration or token launch.
- Future ideas: persistent saves, actual user designers, NPC personalities, richer town events, multiplayer competition, Solana program-controlled escrow, optional NFT minting.

## Files

`index.html` — layout and SVG town scene
`style.css` — responsive design
`game.js` — state, shopper simulation and game logic