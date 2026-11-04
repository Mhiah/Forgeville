# Forgeville — playable game prototype

A self-contained offline browser game. **No real tokens, NFTs, blockchain transactions, or NPC wallets.** The town economy, shopper decisions, design cards and royalties are simulated in JavaScript.

## Play

Open `index.html` in any modern browser. No dependencies, account or server required. For a single-file version, use `forgeville-playable.html`.

## Gameplay

Five rounds: read a trend → design a product (type, material, colour, price, quantity) → produce with your coin budget → watch 18 shoppers walk through the town square → review sales and continue.

### The living town
- **Market stalls:** your stall sits between Wren & Co. and Pip Studio, each showing its product and price.
- **Walking shoppers:** every buyer visit is an NPC who walks to your stall and buys (leaving with a bag in your product's colour) or says why they passed. Some cross the street and buy from a rival instead.
- **Rival regulars:** each rival also has its own customers every round, so the **season standings** are a real race.
- **Ambient town:** strollers browse the stalls between rounds. A *Skip to results* button fast-forwards a round.

### Your moves during a round
While shoppers arrive you can use each move once per round:
- **⚡ Flash sale:** 20% off for the next 6 shoppers.
- **📣 Hype it up:** ◈ 20 to draw 2 extra shoppers and raise interest for the next 6.
- **📦 Rush restock:** make 4 more items mid-round at 130% of unit cost.

A hint line suggests a move when shoppers keep saying "too pricey", hesitate, or you're about to sell out.

### Town events
Each round brings one surprise partway through: a sudden downpour (waterproof sells, everything else slows), a rival price cut, a tour bus of well-off visitors, a style influencer filming (trend-fit matters even more), or a heatwave (nobody wants jackets). The results panel reports the event and how each move performed.

### Design feedback
- Products are drawn in their chosen colour with a **material texture** (canvas weave, recycled speckle, waterproof gloss and droplets, premium sheen with gold stitching).
- A live **trend match** meter shows which parts of your design (product, material, colour) fit this week's trend.
- After each round, **Why shoppers decided** breaks down trend match, quality, price reach and competition, lists what passers-by said, and shows how many sales each rival made. Buyer categories have different tastes and wallets. Rival workshops increase saturation; optional design remixing pays 7% royalties. A 3% community fee grows the design challenge treasury. Unsold goods carry over and may sell at a 30% discount. The game tracks available cash, inventory and simulated sales per design.

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
`game.js` — state, shopper simulation, town animation and game logic
`forgeville-playable.html` — single-file build; regenerate with `python3 tools/build_single_file.py` after editing the other files