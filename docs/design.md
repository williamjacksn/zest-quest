# From soundtrack to side-scrolling expedition

## Story and structure

Planet Grapefruit is being consumed by the Fuzzy Plague. Sector 04 has 87 operational Vessy robots; VES–0457 is one small part of their search for a habitable planet. The campaign begins on the failing home world, crosses the robot works, and launches into space before visiting stranger habitats. The final stage asks the sample-collection robot to defend a future home.

The game now uses nine authored side-scrolling stages instead of repeated overhead arenas. Traversal is the main source of variety. Enemies add pressure to jumps, lifts, water passages, and unstable bridges rather than supplying an endless swarm.

## Music by context

“Welcome to the Juicy Way” plays on the title. “Orange You Glad” plays aboard the ship between worlds and continues during travel to the next planet. Tracks 2–10 each have a playable world, in album order. Bosses, deaths, and retries keep their world’s music. Music selection in the soundtrack drawer is an audition; closing it restores the active context.

| Recording                             | Stage identity and interaction                                                                                                                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The Fuzzy Plague of Planet Grapefruit | A home-world rooftop escape. Thorns interrupt running lines; broken roofs teach double jumping and air dashing.                                                                                                      |
| Vessy the Pulp Extraction Bot         | The robot works. Freight lifts carry the player vertically and horizontally; lasers cycle through off, warning, and active states.                                                                                   |
| Citric Propulsion                     | An asteroid launch route. Holding jump spends regenerating jet fuel; landing refills it. Crosswinds and solid asteroids interrupt flight.                                                                            |
| Among the Starfruit                   | A low-gravity island chain. Long arcs and drifting platforms make timing landings the central challenge.                                                                                                             |
| Globular Jelly Cluster                | Vertical bounce routes. Jelly pads automatically launch Vessy, including when running onto their raised lip. Air steering and a remaining air jump let the player correct the trajectory.                            |
| The Avocado Constant                  | Root bridges and seed presses. Roots crack before collapsing and regenerate after a few seconds. Moving presses force the player to watch the return stroke.                                                         |
| Vitamin Sea                           | A continuous underwater passage between dry shores. Holding jump swims upward; currents push in both directions. Coral creates upper and lower passages.                                                             |
| Orange You Glad                       | A citrus refinery. Conveyor belts move the player and carry momentum into jumps. Vents visibly hiss before erupting.                                                                                                 |
| Robots Change                         | A future habitat. Phase platforms flicker before disappearing; the final Rootheart alternates projectile volleys and summoned enemies. All five seed cores and the cleared encounter are required to board the ship. |

## Movement and recovery

Horizontal acceleration and air control make landings adjustable. Jump release shortens ordinary arcs. A second press grants one air jump, while a small coyote-time window allows jumping just after leaving an edge. The input buffer catches slightly early landing jumps. An air dash briefly suspends gravity and protects against enemy/environment damage; physical walls and asteroids still stop it. Physics runs in substeps no larger than 1/120 second to avoid tunneling through thin terrain.

Raised ledges are one-way, and down drops through them. Moving platforms carry grounded passengers. Jelly launches preserve their height without requiring jump to remain held. A small ring beneath the robot signals that an air jump remains, and Citric Propulsion adds a fuel meter.

Every stage has two additional authored chapters, each with a new core, themed obstacles, enemies, and recovery beacons. Routes are 3,200 world units longer, with five cores spread from the opening to the final approach. Existing gaps retain their original widths; the new chapters add jumps and encounters instead of stretching the geometry. The final boss and ship move to the new end of their route.

Five seed cores per stage collect immediately on touch, replacing stationary scanning. Optional zest trails describe useful jump arcs. Beacons repair once and establish a recovery point. Pit falls cost hull but preserve the stage’s collected cores. A complete hull loss offers a stage retry, retaining previous stages and upgrades. The nine-stage journey does not require restarting from the beginning after a late failure.

Six upgrade types affect fire rate, multishot, damage, dash recovery, hull, and collection/repair. Between worlds, Vessy walks through the ship workshop. A coffee machine, blaster rack, citric press, thruster bench, repair pod, and specimen lab each offer their corresponding upgrade through an E-key interaction and a confirmation card. Inspecting or dismissing a card is free; installing an upgrade uses that stop’s single choice and immediately applies the improvement. Yellow arrows then lead Vessy to the Airlock. Using the Airlock begins travel to the next world. Cabin movement is safe, pauses the expedition timer, and supports pause, soundtrack browsing, and touch interaction. Basic terrain routes are designed for the unupgraded movement set, so no particular upgrade is a mandatory key.

## Visual differences

The shared robot and citric color language retain the original identity. Each stage uses distinct layered scenery: plagued city silhouettes, industrial pipes, asteroids, star-shaped foliage, jelly growths, forest canopy, underwater vegetation, a warm refinery, and habitat domes. Metal ledges, squishy jelly shelves, cut root logs, reef shelves, and rocky starfruit islands differ in shape as well as color. Camera framing preserves space ahead of Vessy and shows terrain below the current platform.

The pixel-art pass paints the world at half CSS resolution and uses nearest-neighbor scaling for a consistent two-pixel display grid. Original code-painted sprites add armor shading, face panels, running/blinking frames, enemy shells, a root-and-petal boss, radio beacons, medkits, seed cores, and the landing ship. Cached material tiles add rivets, panel seams, bark grain, rock facets, moss, roots, and jelly highlights. Dithered planetary surfaces and two illustrated parallax layers fill out the worlds without changing their collision shapes. Background contrast stays below the interactive foreground. A small original bitmap alphabet replaces canvas system-font labels, while the HTML interface uses sharper borders and retro styling.

The responsive interface includes keyboard hints, a side-view map, route progress, and dedicated touch jump/dash/pulse buttons. Dialogs trap focus and return it when closed. Gentle mode halves damage; reduced motion disables decorative movement and camera shake while keeping visible environmental cycles consistent with the simulation. Spatial action still requires visual play; this is not a screen-reader-complete platformer.

## Recorded soundtrack analysis

The supplied recordings were decoded at 44.1 kHz with `mpg123-decoder`; all ten decoded without errors. Durations range from 176.45 to 225.48 seconds. The retained JSON records duration, RMS amplitude, sample peaks, zero-crossing rate, and basic envelope-autocorrelation pulse candidates.

The pulse candidates are not reliable BPM annotations. They may reflect half-time or harmonic relationships. Those measurements do not establish genre, instruments, or emotional character, and no listening review is claimed. The names of the tracks, the supplied story, and the album artwork informed the stage identities. Continuous music avoids imposing rhythm timing on traversal or combat.

Music uses two HTML audio voices for crossfades and loads recordings on demand. Original recordings are unchanged. Static deployment has no external service or runtime dependency.

## Verification scope

The automated suite checks movement, jump buffering/coyote behavior, double jumping, dropping through ledges, collision during dashes, moving passengers, spring launches, root collapse/regeneration, phase cycles, laser warnings, crusher motion, water/current forces, fuel, conveyors, core collection, recovery, stomping, pulse effects, upgrades, and the final gate. Offline DOM tests cover controls, pause/focus, retry, upgrades, travel, score, and every stage/menu music assignment. Randomized 90-second runs exercise each authored stage for finite values and bounded entity counts.

The route checker uses the actual movement/collision methods to connect authored surfaces at their baseline positions. Moving/phase/crumble platforms are held solid for this geometry check; underwater connectivity assumes continuous swimming. Separate mechanism tests verify their changing behavior. All stage surfaces and core routes connect to their exits with the base movement set in this bounded check. This is not an assertion that a full campaign was played in a browser.

Native canvas renders cover all nine stages at 1440×720, 390×650, and 844×290. Representative scenes were visually inspected. Managed policy rejected the loopback browser preview in the earlier implementation session, and no bypass or alternate browser route was used. Live layout, audio playback, and physical touch input remain unverified.
