# Forgeville 3D: Hackathon Submission

**Event:** Manycore Aholo Global 3D AI Hackathon ("Play in 3D, Create with Aholo") · #Manycorehackathon
**Project:** Forgeville 3D: The Workshop Game
**Team:** solo entry by Mia ([@Mhiah](https://github.com/Mhiah))
**Application track:** Gaming Application Award

## Confirmation

This project was built using **Aholo Lux3D** and can be run and demonstrated:

- All four products in the game (jacket, tote bag, sneakers, cap) are 3D models generated with Aholo Lux3D, from reference images made with the Aholo3D image generator. They are in [`assets/models/`](assets/models/).
- The game runs live at **[forgeville.myacxt.site](https://forgeville.myacxt.site)** in any modern desktop or phone browser, with nothing to install.
- It can also be run locally from this repository (see below).

## Submission materials

| Item | Where |
|---|---|
| Working demo (live game) | https://forgeville.myacxt.site |
| Demo video (1:28) | [`docs/Forgeville-3D-Demo.mp4`](docs/Forgeville-3D-Demo.mp4) |
| Project report (PDF) | [`docs/Forgeville-3D-Project-Report.pdf`](docs/Forgeville-3D-Project-Report.pdf) |
| Source code | https://github.com/Mhiah/Forgeville |
| Social media post | X post with #Manycorehackathon (link in the submission form) |

## Summary

Forgeville is a browser shop strategy game for casual players. Each round you read the trend, design a product (jacket, tote bag, sneakers or cap; canvas, recycled, waterproof or premium; one of six colours), set a price, pay for a batch, and open your stall in a 3D market square. A town of shoppers with different budgets and tastes walk up and buy or say why they passed. Rivals copy your hits and cut their prices, and a season runs for five market days.

## How Aholo Lux3D is used

1. **Prompt and reference image.** One prompt per product in the Aholo3D workspace: plain white, no logos, plain grey background.
2. **Image to 3D.** Lux3D turned each image into a textured 3D model, exported as GLB. The jacket and tote bag were made with the Standard model (100K faces, PBR). The sneakers and cap were made with the Turbo model.
3. **Web preparation.** Textures were resized to 1024 px WebP and the meshes quantized: 46.5 MB of raw exports became 11.4 MB in total.
4. **In the game.**
   - **Workbench:** the product you design is the live Lux3D model. You can drag to rotate it.
   - **Colour:** your colour choice sets the model's base colour.
   - **Material:** your material choice sets its roughness and metalness.
   - **3D market:** the Lux3D products sit on the stall counters in each shop's colours.
   - **Rival cards:** they use renders of the same models.

4 Lux3D models give 96 product variations (6 colours × 4 materials).

## What was made with Aholo and what was coded

| Part | Made with |
|---|---|
| Jacket, tote bag, sneakers, cap | **Aholo Lux3D** (+ Aholo3D image generation) |
| 3D market square (stalls, awnings, ground, trees) | Our code, three.js (`market3d.js`) |
| Workbench 3D viewer, recolouring, material finishes | Our code, Google `<model-viewer>` (`lux3d.js`) |
| Game rules, shoppers, rivals, results | Our code (`game.js`) |

## How to judge it (about 3 minutes)

1. Open https://forgeville.myacxt.site. The first load downloads about 11 MB of 3D models.
2. **3D market** (left panel): the Lux3D products are on the counters. Drag to look around.
3. **Workbench** (centre): drag the Lux3D product to rotate it.
4. Under the workbench, change the product, material and colour and watch the model change. Your stall in the 3D market updates too.
5. Set a price and batch size, then press **Produce & open your stall**. Shoppers walk up and decide. Try a flash sale or hype while they shop.
6. Read the results: who bought, why, and how the rivals react. The **Guide** button (top right) explains each step.

## Run locally

```bash
git clone https://github.com/Mhiah/Forgeville.git
cd Forgeville
python3 -m http.server 8000
# open http://localhost:8000
```

No build step and no install. three.js and `<model-viewer>` are included in `vendor/` with their licences.

## Licences and credits

- 3D product models generated with Aholo Lux3D; used under Aholo's terms of use.
- three.js (MIT) and Google `<model-viewer>` (Apache 2.0), included in `vendor/`.
- Game code and design © Mia (Mhiah).
