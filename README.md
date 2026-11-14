# Zest Quest

**One little robot. Nine worlds. Ten tracks.**

A side-scrolling action platformer built around the included Lemonectric soundtrack and `background.md`. Run, double-jump, air-dash, bounce, thrust, and swim as VES–0457 searches for a new home for Planet Grapefruit’s people.

## Play locally

Requires Node.js 20 or later. No installation or runtime dependencies are needed to play:

```sh
node tools/server.mjs
```

Open **http://127.0.0.1:4173** in a modern browser. Serve over HTTP rather than opening `index.html` directly; the game uses JavaScript modules. Music starts after a user interaction.

The first level opens with Vessy’s ship landing on Planet Grapefruit, its hatch opening, and Vessy walking out. Gameplay and the expedition timer begin after the cutscene. Use **Skip intro**, Space, or Enter to start immediately. Pause and soundtrack browsing also pause the cutscene. Later worlds and stage retries start directly in gameplay.

| Control           | Action                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| A/D or left/right | Run                                                                            |
| Space, W, or up   | Jump; press again for one air jump                                             |
| Hold jump         | Jet thrust except in worlds 2, 5, 7, and 9; land to refill; swim up underwater |
| Shift or X        | Air dash, with brief immunity                                                  |
| S or down         | Drop through a raised ledge                                                    |
| E                 | Pulse nearby enemies; interact with objects and the Airlock aboard ship        |
| Hold left mouse   | Aim manually; auto-aim resumes on release                                      |
| Esc / P           | Pause                                                                          |
| M                 | Mute / unmute                                                                  |
| Touch             | Horizontal joystick plus jump, dash, and pulse buttons                         |

Each world now includes two additional themed chapters, adding 3,200 world units of terrain (57–71% longer than the original routes). There are **45 cores across the campaign**. Collect **five glowing seed cores** in each world, then board the ship at the far right. Cores collect on touch, so you keep moving. Smaller zest trails mark jump routes and recharge the pulse. Land on enemies to stomp them; the blaster also fires automatically.

Thrust stays disabled throughout these worlds, including falls and retries:

- **The Vessy Works (world 2):** laser damage disables the thruster until Citric Propulsion.
- **Globular Jelly Cluster (world 5):** “There is jelly stuck in your thrusters. It will evaporate soon.” Thrust returns in The Avocado Constant; jelly pads still bounce Vessy normally.
- **Vitamin Sea (world 7):** “Your thruster got wet, it no longer works.” Swimming still works. Orange You Glad starts with “Your thruster dried off!” and restores thrust.
- **Robots Change (world 9, soundtrack track 10):** “The Rootheart has jammed your thrusters. Little legs, big finale!” Thrust stays disabled through the final encounter.

Beacons save your position and repair some hull. Falling costs 14 hull (7 in Gentle mode), then returns you to the last beacon without losing collected cores. If hull reaches zero, retry **the current world**, keeping upgrades and completed worlds. Between stages, walk around Vessy’s ship and inspect its seven upgrade objects with **E**. The **Thruster station** offers **Extra zest tank**, adding 25% fuel capacity per installation; the **Dash bench** upgrades dash recharge. Each object opens a card to install its corresponding upgrade or keep exploring. Choose one upgrade per stop, then follow the yellow arrows to the **Airlock** and press **E** to travel to the next planet. Touch players use the joystick and **USE / E** button. The expedition timer pauses aboard ship. Progress lasts for the current session; volume preferences, Gentle mode, reduced motion, and the best score are saved on this device.

## Every track has a home

| Track                                      | World or menu                             | Environmental challenge                                      |
| ------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------ |
| 01 · Welcome to the Juicy Way              | Title                                     | Begin the expedition                                         |
| 02 · The Fuzzy Plague of Planet Grapefruit | Planet Grapefruit                         | Broken rooftops, thorn patches, and chasms                   |
| 03 · Vessy the Pulp Extraction Bot         | The Vessy Works                           | Freight lifts and timed laser gates                          |
| 04 · Citric Propulsion                     | Citric Propulsion                         | Wide asteroid gaps, jet fuel, and crosswinds                 |
| 05 · Among the Starfruit                   | Among the Starfruit                       | Low gravity, drifting islands, and orbiting hazards          |
| 06 · Globular Jelly Cluster                | Globular Jelly Cluster                    | Automatic jelly springs and moving spores                    |
| 07 · The Avocado Constant                  | The Avocado Constant                      | Crumbling root bridges and moving seed presses               |
| 08 · Vitamin Sea                           | Vitamin Sea                               | Swimming, opposing currents, and coral passages              |
| 09 · Orange You Glad                       | Orange You Glad; ship workshop and travel | Upgrade between worlds; conveyors, momentum, and juice vents |
| 10 · Robots Change                         | Robots Change                             | Phase bridges and the Rootheart habitat encounter            |

The world’s assigned recording continues through its boss and retry screens. The soundtrack drawer shows each recording’s role and lets you audition all ten tracks; closing it restores the current stage/menu music. Opening the drawer pauses a running expedition.

## Build and deploy

The art uses a canvas painted at half the display resolution and enlarged with crisp pixel scaling. Original cached pixel sprites, a bitmap lettering set, textured terrain tiles, and layered world scenery are defined in `src/pixel-art.js`. No image download or art-generation service is needed to play or build.

```sh
node tools/build.mjs
```

Upload the **contents of `dist/`** to a static web host, preserving folders and filenames. The build includes the original MP3s and is approximately 60 MiB. There are no server functions, external fonts, CDN resources, accounts, or API keys. Relative asset paths support hosting in a subdirectory.

To inspect the packaged output locally:

```sh
node tools/server.mjs --dist
```

The development server binds only to loopback. Set `PORT` for another port. Production hosts should serve `.js` as JavaScript and `.mp3` as `audio/mpeg`, with byte-range support.

## Development and verification

The game has no runtime dependencies. Install development tools with `npm ci`:

```sh
npm test
npm run render
npm run routes
npm run analyze
```

- `npm test`: 40 mechanics, terrain, audio, cutscene, ship interaction, and offline interface checks, including all nine stage/menu track assignments, thruster upgrades, and no-thruster levels.
- `npm run render`: generates canvas-only scenes for the ship interior, first landing, and every world at desktop, phone, and short landscape dimensions in `docs/previews/`.
- `npm run routes`: checks surface connectivity with the actual jump/dash movement code. Timed/moving platforms are held at their authored positions, combat and damage are excluded, and underwater links assume continuous swimming. Separate tests exercise terrain cycles, swimming, and damage. This is a geometry/reachability check, not a full playthrough.
- `npm run analyze`: decodes the unchanged original recordings and regenerates `docs/soundtrack-analysis.json`.

All 40 automated checks pass and the static build succeeds. Representative canvas scenes, including the first landing and ship interior, were visually inspected. Managed browser policy blocked the local preview; live browser layout, audible playback, and physical touch input remain unverified. Offline interface tests use an audio stub.

## Source map

| File                   | Responsibility                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `src/levels.js`        | Nine authored platform routes, cores, checkpoints, enemy placements, and environmental set pieces |
| `src/core.js`          | Platform physics, terrain cycles, combat, collection, recovery, and progression                   |
| `src/renderer.js`      | Layered side-view scenery, characters, level artwork, effects, and route map                      |
| `src/ship.js`          | Interior layout and the seven upgrade stations                                                    |
| `src/ship-renderer.js` | Ship workshop, upgrade objects, yellow guidance arrows, and Airlock artwork                       |
| `src/pixel-art.js`     | Original pixel sprites, material textures, scenery tiles, bitmap lettering, and asset caching     |
| `src/game.js`          | Keyboard/touch input, HUD, dialogs, music routing, and preferences                                |
| `src/audio.js`         | Music crossfades and synthesized effects                                                          |
| `src/data.js`          | Track/world mapping and upgrades                                                                  |
| `docs/design.md`       | Design rationale, soundtrack analysis, and verification scope                                     |

The original recordings, cover, and story remain in the repository. Music is credited to **Lemonectric**, with **Phonetic Hero** on “Robots Change.”
