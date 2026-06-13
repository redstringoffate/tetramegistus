# 🌌 Tetramegistus

Tetramegistus is an open-source, professional astrological engine that merges ancient esoteric systems with modern cloud computing architecture. 

## 📜 Vision & Core Philosophy
- **Anti-Monopolization:** Liberating astrological data from closed, "black-box" environments.
- **Absolute Transparency:** Fully open-source calculation logic for mathematical and systemic auditing.
- **Divine Objectivity:** Prioritizing a map-based perspective of fate to provide an objective, structural representation of the heavens, rather than relying on subjective observer views.

## 🏛️ System Architecture & Tech Stack
- **Core Engine:** Python, FastAPI (High-precision astronomical and aspect matrix calculations)
- **Database:** PostgreSQL (Immutable record keeping for registered vessels/souls)
- **Infrastructure:** Docker, Railway, automated CI/CD pipeline
- **Domain Isolation:** Strict physical and logical separation between the public gateway (`prima-materia.net`) and the core calculation engine (`tetramegistus.com`).

## ⛩️ The Dual-Core Architecture & Ritual Protocols
The routing architecture of Tetramegistus is not a standard web flow. It physically embodies the philosophical worldview of the engine through strict middleware barriers and esoteric UI triggers. 

**1. The Prima-Materia Gateway (The Barrier)**
- Visitors without a `[me]` seed (Soulless entities/Crawlers) are strictly confined to `prima-materia.net`.
- Once a vessel `[me]` is formed, the user is pulled into the core engine (`tetramegistus.com`). 
- **Retrograde Forbidden:** Once inside, any attempt to navigate back to the `prima-materia` index triggers an absolute redirect back to the engine. The system does not allow a formed soul to regress.

**2. The Reincarnate Protocol (Total Memory Purge)**
- **Trigger:** `Ctrl + Shift + 9` (PC) or a 9-second sustained press on the 'T-Drawer Tab' (Mobile) from within the main engine.
- **Action:** Triggers the "Reincarnate" ritual. It completely obliterates the `[me]` seed and all local storage data, forcefully ejecting the user back to the `prima-materia` void as a blank state.

**3. The Anamnesis Core & The Awakening Ritual (Direct Bypass)**
- Registered members can access their **Anamnesis Core** to generate a highly secure, one-time 16-digit bypass code.
- **Trigger:** `Ctrl + Shift + 8` (PC) or an 8-second sustained press on the dark void background (Mobile) at the `prima-materia.net` index.
- **Action:** This hidden tactical touch protocol reveals an invisible 16-digit input matrix. Entering the valid Anamnesis code allows the user to entirely bypass the `[me]` seed creation phase, instantly warping them into the `world` core in a fully authenticated state.

**4. The Logout Anchor (Graceful Degradation)**
- If a registered member logs out of the engine, the system intercepts the session termination. Before severing the connection, it instantly "bakes" a temporary `[me]` seed into the local storage. This prevents the user from crashing into an unstable "Soulless" state within the main `tetramegistus.com` domain, maintaining the integrity of the routing barrier.

---

## 🎚️ The Four Alchemical Stages (Core Engines)

The system reflects the evolution of the soul and destiny through four alchemical transmutations:

### 🌑 Stage 1. NIGREDO: Decomposition & Natal Matrix (N1 - N9)
- **Overview:** The foundational core of Tetramegistus. It deconstructs the astronomical coordinates of a chosen seed context to derive the primal natal matrix. The active seed selected in this stage serves as the absolute baseline context for all calculations across modules N2 through N9.

#### N1: Prima Materia & Seed Core (The Baseline Engine)
- **Overview:** An extension of the primal gateway architecture (`prima-materia.net`) operating directly within the core domain. It controls the generation, rectification, and contextual selection of all astrological charts (Seeds).
- **Interface & Control Matrix:**
  - **The Title:** Displays the foundational title "Prima Materia".
  - **Select Seed Dropdown:** Dictates the global active chart context for the entire engine. Modules N2 through N9 instantly calculate their metrics based on the seed chosen here.
  - **Append Seed / Edit Seed Buttons:** Interactive triggers that inherit the original initialization form (`Extends from genesis`). Upon invocation, the system title dynamically reverts to "Prima Materia" while maintaining the core engine routing.
  - **Delete Seed Button:** Executes contextual erasure based on the vessel's authentication tier.
- **Genesis Extensions (Differences from Primal `[me]` Seed Creation):**
  - **Seed Designation:** Introduces a dedicated `Target Name` input field for tracking external entities.
  - **Hour of Incarnation Toggle:** Implements a `Time Unknown` checkbox under the birth time configuration. If the exact incarnation hour of the primal `[me]` seed is unresolved, it can be retroactively rectified via this toggle inside the `Edit Seed` protocol.
- **Seed Mutability Rules:**
  - **The Primal `[me]` Seed:** The designation name is absolute and immutable. All other historical parameters (Birth Date, Time, Location) are fully mutable.
  - **Secondary Seeds:** All parameters, including the designation name, are completely mutable.
- **Data Persistence & Chronology:**
  - **Guest Storage:** Seeds are securely cached within the client-side Local Storage (identical to the tracking of the primal `[me]` seed).
  - **Member Storage:** Seeds are permanently anchored to the PostgreSQL database records via unique relational indices (`idx`).
  - **Chronological Hierarchy:** Seeds are listed in a strict oldest-to-newest hierarchy (`장자 우선`) within the selection matrix, appending newly manifested charts to the absolute end of the list.
  - **The Great Migration:** Upon registration, all locally cached guest seeds are extracted and migrated to the database server, flawlessly preserving their exact sequential creation order.
- **Destruction Mechanics (Purge vs. Soft Delete):**
  - **Guest Mode:** Deleting a seed completely purges the target data object from the browser's Local Storage.
  - **Member Mode:** Initiates a **Soft Delete** protocol. The relational index (`idx`) remains inside the database to protect historical integrity, but it is masked from the active interface.
  - **Grimoire Continuity:** If a soft-deleted seed has already been archived within the **Grimoire**, its manifested record remains intact and viewable. However, it is blocked from any new additions or recalculations.
 
#### N2: Principia (The Fundamental Matrix)
- **Overview:** The primary diagnostic interface of the Nigredo stage. It renders the exact astronomical positions of the seed across multiple zodiacal frameworks, dissecting them into micro-divisions (bounds, decans, dodecatemoria) and mapping them to their respective Sabian matrices.
- **Lords of Time (Chronocrators):** - Displays the ruling **Day Lord** and **Hour Lord** at the very top of the module.
  - **Twilight/Midnight Logic:** For charts generated between midnight and dawn, the Day Lord dynamically splits to display both perspectives (e.g., `Traditional (Previous Day) | Modern (Current Day)` formatting like `Jupiter | Venus`).
  - **Time Unknown:** Automatically nullifies the Hour Lord to a `-`.
- **The System Matrix (Zodiacal Frameworks):** Users can hot-swap the entire calculation engine via the `sys tab`.
  - **Tropical (Default)**
  - **Sidereal:** Opens a sub-menu of Ayanamsa calculations (`Lahiri` [Default], `Raman`, `KP`, `Fagan-Bradley`, `Yukteswar`).
  - **Draconic:** Anchors the North Node to 0° Aries.
  - **Ketunic:** A proprietary custom framework anchoring the *South Node* to 0° Aries.
- **Celestial Classifications & Hierarchy:** Bodies are strictly categorized in the following render order:
  1. **Planets:** The traditional 7 + the 3 modern outers.
  2. **Major Asteroids:** Chiron, Ceres, Juno, Pallas, Vesta, Eros, Psyche.
  3. **Lilith & Nodes:** Mean Lilith, True Lilith, Asteroid Lilith, North/South Nodes (Mean & True).
  4. **Fates:** The 4 absolute destiny markers (Moira, Klotho, Lachesis, Atropos).
- **Zodiac Mode (Default Structural Columns):**
  - Displays: `Celestial Bodies` | `Information` (Sign, D°M'S'', and 'r' for retrograde) | `House` | `Duad` | `Dod.` (Dodecatemoria) | `Decan` | `Bd.` (Egyptian Bounds) | `Sabian Symbol`.
  - **Global Settings Integration:** The `House` column recalculates dynamically based on the globally selected house system (e.g., Whole Sign, Placidus). The Sabian Symbol text switches natively between English and Korean via pre-compiled JSONs (bypassing AI translation for absolute accuracy).
- **Nakshatra Engine (Exclusive to N2 & A2):**
  - When the Sidereal framework is active, a `Zodiac / Nakshatra` toggle unlocks.
  - Switching to Nakshatra completely transforms the data rendering into Jyotish parameters.
  - **Jyotish Categories:** Splits into `Nakshatra & Grahas` (Sun through Ketu, separated Lilith/Chiron) and `Angles` (Ascendant, IC, Descendant, MC).
  - **Columns:** `Celestial Bodies` | `Information` (Using Vedic sign names like *Vrishabha*) | `Nakshatra` | `Pada` (Dynamically swaps to `Sub-lord` if the `KP` Ayanamsa is selected) | `Sabian Symbol`.
- **Fixed Star Conjunctions (Deep Space Markers):**
  - Precise longitudinal conjunctions with fixed stars are visually appended directly to the celestial indicators.
  - **Dynamic Orbs:** Configurable via global settings (0.5°, 1.0° [Default], 1.5°, 2.0°).
  - **Iconography:** Royal Stars (Aldebaran, Regulus, Antares, Fomalhaut) are marked with a Crown icon. Spica receives a unique icon. Other stars are classified by magnitude/importance (Major, Traditional, Common) with specific icons.
  - **Interactivity:** Hovering reveals the star's name, exact position, and current orb (rendered as a bottom toast on mobile). Clicking opens a localized, detailed popup explaining the star's esoteric influence. Multiple stars falling within the orb are displayed sequentially.
- **Visual Dignities & State Indicators:**
  - **Solar Proximity CSS:** Planets exhibit unique visual cues based on their relationship with the Sun (e.g., a crimson glow effect for `Combust`, distinct indicators for `Cazimi` and `Under the Beams`).
  - **Hover Metrics:** Essential planetary dignities are revealed upon hovering over the planet's `Information` cell. The ruling Day/Hour Lords in the matrix are bolded and highlighted on hover.
- **Time Unknown Handling:** If the active seed lacks a precise time, all `House` columns revert to `-`. In Nakshatra mode, the entire `Angles` section is visually blacked out with a system prompt indicating the impossibility of angular calculation without an incarnation hour.

#### N3: Domus (The Structural House Matrix)
- **Overview:** The architectural foundation of the chart. Domus replaces the physical limitations of a traditional circular natal wheel with an infinitely expandable, tabular data matrix. It dissects the spatial anchoring of the heavens into Cusps and Domains.
- **The Absolute Time Constraint (Global Lock):** Because house calculation relies entirely on planetary rotation, generating a chart with a `Time Unknown` attribute completely locks the N3 module (as well as N4, N7, N9, and their Albedo equivalents). 
- **Top Interface:** Permanently anchors the exact Ascendant (ASC) and Midheaven (MC) coordinates at the top of the module, followed by the Master Toggle (`Cusp / Domain`) and the System Matrix tab (Tropical / Sidereal / Draconic / Ketunic).

- **Paradigm I: Cusp Mechanics (Default)**
  - **Overview:** Renders the precise boundary lines of the 12 houses.
  - **Columns:** `Cusp` (Asc., 2h cusp, 3h cusp, I.C., etc.) | `Information` | `Range` | `Duad` | `Dod.` | `Decan` | `Bd.` | `Sabian Symbol`.
  - **Cusp Lords & Dignity Tracking:** Hovering over the `Information` cell dynamically queries the core engine to display the ruling planet(s) of that cusp, rendering its exact chart position and current dignity state (e.g., `Sun: Gemini, 10°48'37'' | Peregrine`). Dual rulers (e.g., Aquarius) natively display both lords.
  - **The Range Syntax:** A proprietary visualization of house volume and sign distribution. Rendered as `Total° (SignA° / SignB° / SignC°)`. For example, `35 (28/7)` under a Sagittarius cusp indicates a 35° house span containing 28° of Sagittarius and 7° of Capricorn.
  - **Fixed Stars:** Conjunctions are strictly limited to the four absolute Angles (Asc, IC, Dsc, MC); intermediate cusps do not trigger deep-space markers.
  - **Whole Sign Integration:** If the global setting dictates Whole Sign houses, all cusps reset to 0° of their respective signs, utilizing the persistently displayed ASC/MC top header as the primary angular reference.
  - **The Lagna Engine (Vedic Extension):** When the Sidereal framework is active, a unique `Zodiac / Lagna` sub-toggle unlocks. Switching to `Lagna` replaces the standard 12 cusps with Arudha Lagna (AL), A2 through A11, and Upapada Lagna (UL), formatting them by Sign and House placement (e.g., `Pisces 9H`).

- **Paradigm II: Domain Mechanics (The Absolute Wheel)**
  - **Overview:** Functions as the Tetramegistus equivalent of a drawn chart wheel. Instead of rendering boundary math, it renders the *contents* dwelling within those boundaries.
  - **Columns:** `House` (1st House, 2nd House, etc.) | `Information` | `Range` | `Planets` | `Asteroids` | `Hermetic`.
  - **Occupancy Sorting:** Entities within the `Planets`, `Asteroids`, and `Hermetic` columns are sorted strictly by their exact proximity to the house cusp. Empty domains output a `-`. Hovering over any entity reveals its precise D°M'S'' coordinate.
  - **Entity Classification Matrix:**
    - **Planets:** The standard 10 bodies + North/South Nodes (True & Mean) + Rahu/Ketu + Mean/True Lilith.
    - **Asteroids:** Chiron, Ceres, Pallas, Vesta, Juno, Eros, Psyche, and the Fates (Moira, Klotho, Lachesis, Atropos).
    - **Hermetic:** The esoteric mathematical points: Lots of Spirit, Fortune, Eros, Necessity, Victory, Courage, plus the alternative Hellenistic Valens calculations (Eros, Necessity), the pre-natal Syzygy, Vertex, and Anti-Vertex (the 180° opposition).

#### N4: Arcana (The Esoteric Point Matrix)
- **Overview:** Calculates the abstract and esoteric mathematical points of the chart, transcending physical celestial bodies to map Hermetic Lots, orbital intersections, and pre-natal lunations.
- **Sect & Calculation Toggle:**
  - Displays the ruling **Sect** (Day/Night) of the chart immediately below the title, as it fundamentally dictates the calculation formulas for the lots.
  - **The Algorithm Toggle (`Paulus / Valens`):** Allows users to hot-swap the foundational calculation algorithms. Default is `Paulus`.
- **The Three Esoteric Pillars:**
  - **Hermetic Lots:** Calculates the 7 primary Hellenistic parts: Lot of Fortune, Spirit, Necessity, Eros, Courage, Victory, and Nemesis. *Dynamic Shift:* Switching the master toggle to `Valens` dynamically recalculates and overwrites the Lots of Necessity and Eros using Vettius Valens' alternative formulas.
  - **Fate Axis:** Renders the precise coordinates of the Vertex and Anti-Vertex.
  - **Syzygy:** Calculates the Pre-natal Syzygy. Instead of a generic title, the engine dynamically identifies and displays the exact phase of the lunation (e.g., `New Moon`, `Full Moon`).
- **Data Rendering:** - Maintains the rigorous micro-divisional structure: `Information` | `House` | `Duad` | `Dod.` | `Decan` | `Bd.` | `Sabian Symbol`.
  - Integrates seamlessly with global `House` and `Language` settings for dynamic output formatting.

#### N5: Schema (The Aspect & Geometry Matrix)
- **Overview:** The ultimate geometric analyzer of the core engine. Schema maps the intricate angular relationships (Aspects) and multi-point sacred geometries (Patterns) formed by the celestial bodies. It completely rejects the standard industry practice of truncating reciprocal aspects, ensuring every entity maintains an absolute, self-contained interaction log.
- **The Dimensional Matrix Toggle (`Unus / Intersectus`):**
  - **Unus (Default):** Intra-system rendering. Analyzes patterns and aspects strictly within the boundaries of a single active zodiacal framework (e.g., Tropical-only relationships).
  - **Intersectus (Cross-System Synastry):** A highly advanced protocol that calculates the geometrical intersections between *two different zodiacal systems* for the exact same seed (e.g., plotting the active Tropical coordinates against the Draconic coordinates). Unlocks a dynamic dropdown to select the cross-referencing system.
- **Section I: PATTERNS (Sacred Geometry)**
  - **Overview:** Identifies complex, multi-point geometrical shapes (e.g., Grand Trine, Yod, T-Square). Unlike traditional software, Schema calculates these patterns across an expanded pool of entities, including minor asteroids, Nodes, and Lilith.
  - **Interaction Matrix:**
    - The `Shape` column lists the detected geometry. Hovering over the shape name renders its theoretical definition.
    - Clicking the shape expands the matrix to reveal all possible combinations (spanning columns `1` through `6`) that form this exact pattern within the chart.
    - Hovering over any individual celestial body within the combination array reveals its precise `Sign, D°M'S''` coordinate.
- **Section II: ASPECTS (The Angular Intersections)**
  - **Overview:** A highly structured, three-pane drill-down interface designed for absolute data symmetry.
  - **Entity Classification Tabs:** Users filter the primary focal point via categorical tabs: `Planets` (Default), `Major Asteroids`, `Lilith & Nodes`, `Fates`, and `Hermetic`.
  - **The Three-Pane UI Logic:**
    1. **Celestial Bodies:** Selecting a category populates the primary vertical list.
    2. **Aspects:** Clicking a specific body renders its angular interactions, categorized by `MAJOR` (Conjunction, Trine, Square, Sextile, Opposition) and `MINOR/ESOTERIC` (Quintile, Septile, Octile, Novile, Decile, Undecile, Semi-sextile). A quantitative badge displays the total count for each aspect type.
    3. **Objects:** Clicking a specific aspect dynamically lists the target bodies involved, alongside the exact calculated `Orb` (e.g., `1.89°`). Hovering over the target object displays its precise longitudinal coordinate.
  - **The Principle of Absolute Symmetry:** To prevent data fragmentation, Schema enforces strict self-containment. If the Sun is conjunct Pluto, the aspect is fully logged under the Sun's tree, and symmetrically fully logged under Pluto's tree. No reciprocal relationships are ever hidden or assumed.

#### N6: Divisio (The Harmonic & Varga Matrix)
- **Overview:** The ultimate divisional computation engine. Divisio splits the foundational natal matrix into its higher-frequency resonances and sub-harmonic realities, housing both Western Harmonic astrology and Vedic Jyotish Varga divisions under a unified command structure.
- **The Core Control Toggles:**
  - **Master Toggle (`Harmonics / Varga`):** Dictates the primary dimensional calculation paradigm. Default is `Harmonics`.
  - **Sub-Toggle (`Positions / Aspects`):** Available exclusively in `Harmonics` mode, switching between raw coordinate rendering and dynamic angular analysis. Default is `Positions`.

- **Paradigm I: Harmonics Mechanics (Western Resonance)**
  - Calculates the exact longitudinal multiplications for high-frequency charts: **H1–H12, H16, H20, H24, and H32**.
  - **Entity Matrix:** Operations are performed strictly on the 10 Planets, Chiron, Mean Lilith, True Lilith, and North Node (True).
  - **Positions Mode:** Renders the mathematically shifted coordinates (e.g., computing an H1 Virgo 10°27'29'' placement into its H2 Aquarius 20°54'57'' resonance) across all configured entities in a continuous structural list.
  - **Aspects Mode:** Unlocks a horizontal Harmonic Level tab (H1 to H32). Selecting a harmonic tier dynamically summons the exact **Three-Pane UI logic from N5** (`Celestial Bodies` -> `Aspects` -> `Objects`), allowing users to rigorously analyze the minor and major esoteric aspects formed *within* that specific harmonic frequency.

- **Paradigm II: Varga Mechanics (Jyotish Divisional Charts)**
  - Switching to Varga completely transforms the UI into the Vedic framework. The `Positions / Aspects` toggle is replaced by the **Ayanamsa Tab** (Default: `Lahiri`).
  - **The Graha Tabs:** Navigational tabs isolate the analysis by entity: `Lagna` (Ascendant), `Surya` (Sun), `Chandra` (Moon), `Budha` (Mercury), `Shukra` (Venus), `Mangala` (Mars), `Brihaspati` (Jupiter), `Shani` (Saturn), `Ketu`, and `Rahu`.
  - **Rendered Divisions:** D1, D2, D3, D4, D6, D7, D8, D9 (Navamsa), D10, D12, D16, D20, D24, D30, and D60.
  - **Interactive Definition:** Clicking any division title (e.g., `D7`) opens a localized esoteric popup revealing its Sanskrit title (e.g., `Saptamsa`) and its governing philosophical definition.
  - **Columns & Vedic Data Injection:**
    - `Information`: Renders the precise coordinate translated into Jyotish sign nomenclature.
    - `Nakshatra`: Computes the exact Nakshatra and its quarter phase (`Pada`), formatted as `Ashlesha-1`.
    - `Purushartha`: Renders the profound spiritual motivation axis combining both the Nakshatra and the Pada's purushartha (e.g., `Artha-D` for Artha-Dharma).
  - **The KP Ayanamsa Override:** If the `KP` Ayanamsa is active, the engine alters the fundamental display logic. Padas are mathematically replaced by **Sub-lords** (e.g., `Ashlesha-☋`), and the `Purushartha` column truncates to exclusively display the Nakshatra's singular purushartha, respecting the Krishnamurti Paddhati constraints.

#### N7: Hypostases (The Persona Matrix)
- **Overview:** A massive, proprietary expansion of the traditional "Nine Persona Charts" methodology. Instead of limiting persona generation to the standard 9 planets, Hypostases dynamically generates complete, independent astrological charts for *every* calculable entity—including minor asteroids, Lilith, esoteric angles, and Hermetic lots. The engine calculates the exact spatiotemporal moment the transiting Sun conjoins the natal position of the target entity, birthing a new "Persona" chart.
- **Relativistic Transit Engine:** The exact date and time of a persona chart's genesis fluctuate based on the active dimensional framework (Tropical / Sidereal / Draconic / Ketunic), as the engine rigorously calculates the precise transit speeds inherent to each specific zodiacal system.
- **The Core Control Toggles:**
  - **Master Toggle (`Sigilum / Plenitudo`):** Switches between the condensed executive matrix (Sigilum) and the fully expanded cross-reference grids (Plenitudo). Default is `Sigilum`.
  - **Entity Category Tabs:** Filters the target persona charts by `Planets`, `Major Asteroids`, `Lilith & Nodes`, `Fates`, `Angles`, and `Hermetic`.
- **Paradigm I: Sigilum Mechanics (The Executive Matrix)**
  - **Overview:** The default view. Provides a concentrated summary of the target entity's state *within its own newly generated universe*.
  - **Columns:** `Celestial Bodies` | `Information` | `House` | `ARIES 0°` | `DAY LORD` | `HOUR LORD` | `Duad` | `Dod.` | `Decan` | `Bd.` | `SABIAN SYMBOL`.
  - **Self-Referential Information:** The `Information` column displays the coordinate of the target body *inside* its persona chart (e.g., the Moon's placement within the Moon Persona Chart), allowing deep analysis of the persona's core state.
  - **The Aries 0° Anchor:** A unique architectural metric that tracks which House the absolute beginning of the zodiac (0° Aries) falls into for that specific persona chart, heavily utilized in Tetramegistus chart reading methodologies.
  - **Hover Interactivity:** Hovering over any Persona Chart title (e.g., `MOON`) reveals a tooltip containing its exact Genesis Date/Time and its absolute `Day Lord` & `Hour Lord` rulers.
- **Paradigm II: Plenitudo Mechanics (The Infinite Expansion)**
  - Unlocks a secondary sub-toggle: `Sabian / Tabula` (Default: `Sabian`).
  - **Sabian Mode (The Entity Cross-Grid):** Flips the architectural axis. The selected Persona Charts become the horizontal columns. The vertical rows list virtually every celestial body and angle calculable by the engine. The intersection cells render the exact `Information`, `House`, and `Sabian Symbol` text for that body within that specific persona's reality.
  - **Tabula Mode (The Absolute 360° Grid):** The signature Tetramegistus visualization framework. It entirely discards the concept of isolated chart wheels. The vertical axis represents the absolute 360 degrees of the zodiac (Aries 1 to Pisces 30). The columns represent the parallel Persona Charts. The grid maps exactly which celestial bodies and house cusps occupy which specific degree across multiple parallel realities simultaneously, allowing for unprecedented visual pattern recognition.

#### N8: Codex Tenebris (The Master Tabula)
- **Overview:** The absolute culmination of Tetramegistus's map-based astrological philosophy. Codex Tenebris is the progenitor of the 360° grid system. It entirely flattens the multi-dimensional architecture of a single seed, mapping hundreds of esoteric points and all four zodiacal frameworks side-by-side across the absolute 360 degrees of the zodiac.
- **The Rulership & System Controls:**
  - **The Ayanamsa Tab:** Selects the precise Vedic calculation framework (Lahiri, Raman, KP, Fagan-Bradley, Yukteswar) utilized specifically for the Sidereal column within the grid.
  - **The Calculation Toggle (`Traditional / Modern`):** A highly specialized algorithmic toggle. It dictates whether the engine uses traditional planetary rulers (e.g., Saturn for Aquarius) or modern rulers (e.g., Uranus for Aquarius) when calculating the complex formulas for the Arabic Lots matrix.
- **The Absolute 360° Matrix (Column Architecture):**
  - **SABIAN NUMBER:** The absolute vertical axis, from Aries 1 to Pisces 30.
  - **MINOR ASTEROIDS:** Computes over 100 deep-space obscure asteroids (e.g., Klytia, Aphrodite), strictly excluding the core Fates/Major asteroids handled in N2.
  - **TROPICAL | SIDEREAL | DRACONIC | KETUNIC:** The four primary dimensional frameworks rendered in absolute parallel. Shows exactly where every planet, angle, and house cusp falls across all dimensions simultaneously.
  - **ARABIC LOTS:** Computes and maps an exhaustive database of over 100 esoteric Hermetic and Arabic lots.
  - **SABIAN SYMBOLS:** The translated symbolic text anchoring the degree.
- **Deep Interactivity & Esoteric Definitions:**
  - **The Grimoire Popups:** Clicking on any Minor Asteroid or Arabic Lot triggers a localized popup revealing its deep esoteric definition and mythological context.
  - **Coordinate Tracking:** Hovering over any rendered entity across the grid instantly reveals its exact `D°M'S''` coordinate (rendered as a bottom toast notification on mobile).
- **Visual Hierarchy & CSS Stratification:**
  - The grid employs a strict visual hierarchy using dedicated CSS rendering to prevent data blindness.
  - **Chronocrators:** Entities currently serving as the `Day Lord` or `Hour Lord` are highlighted with exclusive visual styling to emphasize their temporal dominance.
  - **Entity Stratification:** Planets, Major Asteroids, Angles, and House Cusps are each rendered with distinct typography and color codes, allowing users to instantly differentiate structural points from moving bodies.
  - **Fixed Star Integration:** Conjunctions with deep-space fixed stars are explicitly marked with an asterisk (`*`) directly beside the entity in the grid. Hovering over the asterisk reveals the exact identity of the conjoined star.

#### N9: Chronomantia (The Timeline Engine)
- **Overview:** The ultimate chronological matrix. Chronomantia translates the spatial geometry of the natal chart into the dimension of time, mapping the exact temporal unfolding of fate using both Hellenistic/Medieval Time-Lord systems and Vedic planetary periods.
- **The Global Time Constraint:** Because all major chronological forecasting systems rely heavily on precise degree anchors (Ascendant, Moon, or specific Lots), generating a chart with a `Time Unknown` attribute completely locks the N9 module to prevent mathematical fabrications.
- **The Dimensional Timeline Toggle (`Zodiac / Jyotish`):** Switches the absolute temporal framework between Western deterministic timelines and Eastern karmic cycles. Default is `Zodiac`.

- **Paradigm I: Zodiac Mechanics (Hellenistic & Medieval Epochs)**
  - **The Temporal Paginator:** The left-most `DATE` column organizes time into 12-year epochs. Interactive Roman numeral buttons (`I` through `VI`) allow users to page through the entity's lifespan, with Epoch `I` initiating directly from the exact natal genesis date.
  - **Zodiacal Releasing (The Hermetic Peaks):**
    - Tracks the chronological activation of the Lots of `Spirit`, `Fortune`, and `Eros` across three sub-levels (`L1`, `L2`, `L3`).
    - **Loosing of the Bonds (LB):** The system automatically detects the critical astrological climax phase known as the "Loosing of the Bonds." When a timeline hits this phase, the exact temporal block is aggressively highlighted with a crimson red border.
    - Hovering over the main Lot headers dynamically reveals the exact coordinate data of that mathematical point.
  - **Firdaria (The Persian Periods):**
    - Maps the `Main` and `Sub` planetary periods. Hovering over the `FIRDARIA` master title instantly reveals the chart's foundational `Sect` (Day/Night), which dictates the entire period sequence.
  - **Profections:** Renders the annual shifting of the Ascendant. Hovering over the glyph reveals the base natal Ascendant metrics.
  - **Transits (The Outer Watchers):**
    - Positioned on the far right. The matrix employs an event-driven date generation logic: whenever *any* Time-Lord shifts in the ZR, Firdaria, or Profection columns, the engine instantly calculates and logs the exact transiting positions of the slow-moving outer planets (Jupiter, Saturn, Uranus, Neptune, Pluto) at that exact date.
    - Hovering over any planetary glyph in the Firdaria, Profections, or Transits columns reveals its precise `Sign, D°M'S''` and current dignity.

- **Paradigm II: Jyotish Mechanics (Vedic Vimshottari Dasha)**
  - Switching to `Jyotish` completely restructures the grid to project the Vedic karmic timeline.
  - **Ayanamsa Driven:** Unlocks the `Ayanamsa Tab`. Because the Dasha system is entirely rooted in the Moon's exact Nakshatra degree, changing the Ayanamsa dynamically recalculates the entire chronological sequence and its starting fractional remainder.
  - **The Dasha Grid:** Organized chronologically via `DATE` and `AGE` columns, drilling down into three levels of planetary rulership: `MAHADASHA`, `ANTARDASHA`, and `PRATYANTARDASHA`.
  - **Deep Vedic Tooltips:** Hovering over the Dasha Lord glyphs triggers an extensive tooltip revealing not just the planet's spatial coordinate and dignity, but its exact Nakshatra and Pada parameters, tying the timeframe back to its esoteric root.



### ⚪ Stage 2. ALBEDO: Purification & Relational Synthesis (A1 - A9)
- **Overview:** The Twin Engine to Nigredo. Albedo purifies and synthesizes the astronomical metrics of two intersecting souls, treating the relational entity as an independent celestial blueprint. Rather than inventing conflicting mathematical pathways, it derives synthesized coordinates and processes them through the core matrix architecture.

#### A1: Coniunctio & Relational Synthesis (The Davison Engine)
- **Overview:** The mandatory gatekeeper for Stage 2. Unlike Nigredo (which automatically boots with the primal `[me]` seed as default), Albedo demands the conscious manifestation of a synthesized relational context. 
- **Interface & Selection Matrix:**
  - **The Title:** Displays the definitive title "Coniunctio".
  - **Select seed_1 & Select seed_2 Dropdowns:** Populate dynamically using the active seed pool inherited directly from the N1 Prima Materia module.
  - **Exclusionary Filtering:** To prevent mathematical paradoxes, the `Select seed_2` dropdown dynamically filters out and excludes the active entity currently selected in `Select seed_1`.
- **Manifestation Mechanics:**
  - **The `Manifest Union +` Button:** Selecting items in the dropdowns alone will *not* initialize a synthesized context. The user must explicitly trigger the `Manifest Union +` button to execute the convergence calculation.
  - **Coniunctio Seed Blueprint:** Upon successful activation, a unique relational seed is compiled under the header `Coniunctio Seed:`, formatted precisely as `Union of x & y`.
- **Davison Computation & Inheritance Rules:**
  - **Data Mapping:** Below the `Union of a & b` moniker, the system displays the calculated Date, Time, Latitude, Longitude, and Timezone derived from the **Davison Midpoint** relational algorithm.
  - **Time Unknown Inheritance:** If either parent seed possesses a `Time Unknown` attribute, the resulting synthesized Coniunctio seed automatically inherits the `Time Unknown` condition, suppressing precise time-dependent divisional calculations.
- **Cascading Constraints & Sequential Locking:**
  - **Prerequisites:** A minimum of two distinct seeds must exist in the core system database or local storage to operate the interface.
  - **Global Context Lock:** The manifested Coniunctio seed governs the calculations for modules A2 through A10. If no Coniunctio seed has been actively generated or rendered, modules A2 through A10 remain completely **locked**, prompting the interface to display a mandatory directive requiring the user to forge a Coniunctio seed within A1 first.

#### A2: Coagulatio (The Relational Matrix)
- **Overview:** The structural mirror to N2. Coagulatio analyzes the synthesized relational entity, dissecting it through the same micro-divisions (bounds, decans, dodecatemoria) and Sabian matrices. It features a dual-paradigm calculation engine, switching between Spatial Midpoints (Composite) and Spatiotemporal Convergence (Davison).
- **The Core Control Toggles:**
  - **Master Toggle (`Composite / Davison`):** Dictates the primary calculation paradigm. Default is `Composite`.
  - **Sub-Toggle (`Composite / Anti-Composite`):** A proprietary esoteric mechanic that appears exclusively in `Composite` mode. Default is `Composite`.
- **Paradigm I: Composite & Anti-Composite Mechanics (Spatial Convergence)**
  - **The Anti-Composite System:** A unique theoretical framework calculating the absolute 180° opposition of the standard midpoint. If the standard composite represents the primary convergence of two entities, the Anti-Composite reveals the shadow or the secondary relational axis.
  - **Atemporal Nature:** Because Composite charts are spatial constructs lacking a physical manifestation in time, the **Day Lord and Hour Lord indicators are entirely disabled**.
  - **System Conversion Logic (Order of Operations):** When switching zodiacal frameworks via the `sys tab` (Tropical / Sidereal / Draconic / Ketunic), the engine executes conversion *before* synthesis. It calculates the specific system framework for Parent A and Parent B first, and derives the Composite from those converted coordinates, preventing mathematical paradoxes.
  - **Feature Constraints:** The Sidereal `Zodiac / Nakshatra` toggle is disabled in this mode. Fixed Star conjunctions are also omitted, as spatial midpoints cannot physically conjoin deep-space bodies.
  - **Data Rendering:** Maintains the exact structural column layout as N2: `Celestial Bodies` | `Information` | `House` | `Duad` | `Dod.` | `Decan` | `Bd.` | `Sabian Symbol`.
- **Paradigm II: Davison Mechanics (Spatiotemporal Convergence)**
  - When the Master Toggle is switched to `Davison`, the A2 module dynamically morphs to perfectly replicate the N2 architecture.
  - **The Shift:** The `Composite / Anti-Composite` sub-toggle instantly disappears.
  - **Chronocrator Reactivation:** Because the Davison method calculates a literal date, time, and location (derived from the A1 Coniunctio Seed), the **Day Lord and Hour Lord indicators reappear**.
  - **Full Mirroring:** The Davison paradigm operates identical to a natal seed. Fixed Star conjunctions, the Nakshatra engine, and all esoteric interactions from N2 are fully restored and operational.

#### A3: Ordinatio (The Relational House Matrix)
- **Overview:** The structural mirror to N3. Ordinatio governs the relational housing matrix, processing boundaries (Cusps) and occupancy (Domains) for synthesized charts. It inherits the strict structural constraints of the spatial midpoint paradigm while flawlessly adapting to spatiotemporal convergence.
- **Top Interface & Multi-Tiered Toggles:**
  - **The Title:** Displays the authoritative title "Ordinatio".
  - **Master Toggle (`Composite / Davison`):** Sets the absolute synthesis framework. Default is `Composite`.
  - **Sub-Toggle (`Composite / Anti-Composite`):** Controls the structural axis inversion. Appears exclusively when the Master Toggle is set to `Composite`. Default is `Composite`.
  - **Dynamic Angular Header (`ASC / MC`):** Displays the exact Ascendant and Midheaven coordinates. Upon initialization in Composite mode, it natively outputs the computed Composite ASC/MC values.
  - **Paradigm Toggle (`Cusp / Domain`):** Switches between boundary tracking and occupancy mapping. Default is `Cusp`.
  - **System Matrix Tab:** Tropical / Sidereal / Draconic / Ketunic framework selector.

- **Paradigm I: Composite & Anti-Composite Structural Rules (Spatial Domain)**
  - **Lagna Suppression:** Even within the Sidereal framework under the `Cusp` layout, the Vedic `Lagna` sub-toggle is strictly hidden and disabled, as mathematical midpoint charts cannot sustain relative Lagna metrics.
  - **Fixed Stars Omission:** In perfect alignment with the core system limits, Fixed Star conjunctions are entirely disabled across all cusps and angles.
  - **Domain Grid Modifications:** When switching to the `Domain` paradigm, the **`Hermetic` column is completely omitted and hidden** from the matrix. Midpoint charts do not calculate abstract esoteric lots. However, the `Planets` and `Asteroids` columns remain fully active, rendering bodies sorted by proximity to the composite cusps.

- **Paradigm II: Davison Structural Rules (Spatiotemporal Domain)**
  - When the Master Toggle is shifted to `Davison`, the interface dynamically restructures itself to align with the physical reality of time.
  - **Interface Purge:** The `Composite / Anti-Composite` sub-toggle instantly disappears from the view matrix.
  - **Absolute N3 Restoration:** The entire architectural structure transforms to match the exact behavior of the **N3: Domus** module. It extracts the full spatiotemporal coordinates of the **A1 Coniunctio Seed**, restoring all house calculation parameters, intermediate cusp attributes, and full column availability without spatial restrictions.

#### A4: Figura (The Relational Arcana)
- **Overview:** The Albedo counterpart to Arcana. Figura extracts the esoteric mathematical points—Hermetic Lots, Fate Axis, and Syzygy—of the synthesized relationship itself.
- **The Spatiotemporal Constraint (No Composite Mode):**
  - Because Hermetic Lots, Ascendant-dependent axes, and pre-natal Syzygies require an absolute physical grounding in time and space to exist, the standard spatial `Composite` mode is **mathematically locked and unavailable** in this module.
  - Figura operates **exclusively via the Davison framework** (derived from the A1 Coniunctio Seed), ensuring absolute mathematical integrity.
- **Full N4 Mirroring:** - Operates identically to the N4 architecture under the Davison paradigm. It includes the chart Sect detection, the `Paulus / Valens` algorithmic toggle, and the exact same Three Esoteric Pillars (`Hermetic Lots`, `Fate Axis`, `Syzygy`) formatted with full micro-divisional columns.

#### A5: Aspectus (The Relational Geometry Matrix)
- **Overview:** The Albedo counterpart to Schema. Aspectus maps the sacred geometry and angular intersections of the synthesized relational entity. It pushes the boundaries of synastry by allowing geometrical cross-referencing not just between zodiacal frameworks, but across different synthesis methodologies themselves.
- **The Core Control Toggles:**
  - **The Dimensional Matrix Toggle (`Unus / Intersectus`):** Operates identically to N5, switching between intra-system analysis (Unus) and cross-system synastry (Intersectus). Default is `Unus`.
  - **The Synthesis Paradigm Toggle (`Composite / Davison`):** Active only in `Unus` mode. Dictates whether the geometry is calculated from the spatial midpoint framework (Composite) or the spatiotemporal convergence framework (Davison). Default is `Composite`.
- **Paradigm I: Unus Mechanics (Intra-Relational Geometry)**
  - Operates under the strict structural layout of N5.
  - **Patterns:** Renders sacred geometrical shapes (Grand Trine, Yod, etc.) formed exclusively by the synthesized celestial bodies of the chosen paradigm (Composite or Davison). Hovering reveals the theoretical definition and expanding the list displays the exact coordinate matrices.
  - **Aspects:** Identical three-pane UI (`Celestial Bodies` -> `Aspects` -> `Objects`), enforcing the absolute symmetry principle for both major and minor/esoteric aspects.
- **Paradigm II: Intersectus Mechanics (The Infinite Convergence)**
  - When switched to `Intersectus`, the `Composite / Davison` toggle is overridden, unlocking the ultimate synastry cross-referencing engine.
  - **The Omni-Dimensional Dropdown:** Unlike N5 which only crosses a single seed's frameworks, A5 generates an infinitely expanded matrix. Users can calculate exact geometrical intersections between:
    - **Parent A's** isolated frameworks (Tropical, Sidereal, Draconic, Ketunic).
    - **Parent B's** isolated frameworks.
    - **The Composite Seed's** synthesized frameworks.
    - **The Davison Seed's** synthesized frameworks.
  - *Example:* A user can dynamically plot and calculate the exact minor aspects formed between Parent A's Draconic chart and the synthesized Tropical Composite chart, visualizing the absolute esoteric mechanics of the relationship.

#### A6: Multiplicatio (The Relational Harmonics)
- **Overview:** The Albedo mirror to Divisio. Multiplicatio extracts the high-frequency resonances and Jyotish sub-divisional realities of the synthesized relationship.
- **Spatiotemporal Source (Coniunctio Processing):**
  - Just as N6 processes the primal `[me]` seed, A6 operates entirely upon the **A1 Coniunctio Seed**, pushing the synthesized relational coordinates through the harmonic multipliers and Vedic varga grids.
- **Full N6 Mirroring:**
  - Maintains the exact dual-paradigm architecture (`Harmonics / Varga`).
  - **Harmonics:** Supports the full H1-H32 array, including the cross-analysis of relational aspects (Three-Pane UI) within specific harmonic frequencies.
  - **Varga:** Mirrors the complete 15-tier Jyotish division matrix (D1 to D60), preserving the Ayanamsa selectors, interactive Sanskrit definitions, and the rigorous `Purushartha / KP Sub-lord` data formatting for the synthesized relational entity.

#### A7: Evocationes (The Relational Persona Matrix)
- **Overview:** The Albedo counterpart to Hypostases. Evocationes maps the multi-dimensional parallel realities of the relationship itself, shifting the focus from individual soul layers to the sub-persona archetypes of the union. 
- **The Spatiotemporal Prerequisite:**
  - Because Persona charts fundamentally require calculating the exact chronological moment the transiting Sun conjoins a specific point in time, this module is strictly bound to spatiotemporal reality.
  - Consequently, it operates **exclusively upon the A1 Coniunctio Seed (Davison)**, as abstract geometric midpoint (Composite) coordinates cannot support relativistic transit calculations.
- **Full N7 Mirroring:**
  - Operates with absolute functional symmetry to the **N7: Hypostases** engine.
  - **Relativistic Transits:** Recalculates the exact relational genesis timelines across all active zodiacal frameworks (`Tropical`, `Sidereal`, `Draconic`, `Ketunic`), accounting for system-specific transit shifts.
  - **Sigilum Mode:** Retains the exact column architecture (`Celestial Bodies`, `Information`, `House`, `ARIES 0°`, `DAY LORD`, `HOUR LORD`, etc.), tracking internal relational parameters and the structural placement of 0° Aries within the relationship's sub-personas.
  - **Plenitudo & Tabula Grids:** Flawlessly synchronizes the complete cross-reference matrix and the signature 360-degree parallel timeline matrix (`Tabula`), allowing users to visualize how the relational entity splits and mirrors itself across higher metaphysical dimensions.

#### A8: Codex Lucis (The Relational Tabula)
- **Overview:** The Albedo counterpart to Codex Tenebris. Codex Lucis maps the infinite parallel realties of the relationship onto the absolute 360° grid. Because merging two independent souls alongside their synthesized midpoint (Composite) and spatiotemporal (Davison) charts across multiple zodiacal frameworks creates an exponential data overload, this module introduces advanced visibility and sorting controls to manage the matrix.
- **The Default Matrix:** To prevent cognitive overload upon initialization, the engine defaults to rendering a core comparative baseline: `Composite` | `Davison Tropical` | `Parent A Tropical` | `Parent B Tropical`.
- **Advanced Control Matrix:**
  - **System Settings (Visibility Modal):** A dedicated configuration UI that allows users to explicitly dictate which columns are rendered. Users can toggle the visibility of specific dimensions (Asteroids, Tropical, Sidereal, Draconic, Ketunic, Arabic Lots) for each of the four core entities (Parent A, Parent B, Composite, Davison).
  - **The Sorting Axis Toggle (`Seed / System`):** Dictates the structural hierarchy of the rendered columns.
    - **Seed Mode:** Columns are grouped logically by the entity (e.g., all of Parent A's selected frameworks are grouped together, followed by Parent B's, etc.).
    - **System Mode:** Columns are grouped by the dimensional framework (e.g., rendering Parent A's Tropical, Parent B's Tropical, and Davison's Tropical side-by-side for direct cross-entity systemic comparison).
- **Full N8 Mirroring:**
  - Retains the core functional architecture of N8.
  - Maintains the `Traditional / Modern` rulership algorithmic toggle for Arabic Lots.
  - Preserves the deep esoteric popups, interactive coordinate tracking, fixed star conjunction markers (`*`), and the strict CSS visual stratification to differentiate structural points from chronological bodies.

#### A9: Synchronicum (The Relational Timeline Matrix)
- **Overview:** The Albedo counterpart to Chronomantia. Synchronicum is a master chronological engine that maps the temporal evolution of the relationship. It offers two distinct analytical lenses: treating the relationship as a singular incarnated entity, or observing the parallel intersecting timelines of the two individual souls.
- **The Core Control Toggles:**
  - **Master Toggle (`Zodiac / Jyotish`):** Switches the temporal framework between Western deterministic timelines and Eastern karmic cycles. Default is `Zodiac`.
  - **The Relational Lens Toggle (`Davison / Synastry`):** Appears exclusively in `Zodiac` mode. Dictates whether the timeline calculates the unified spatiotemporal point or the separate parent entities. Default is `Davison`.

- **Paradigm I: Zodiac Mechanics (Hellenistic & Medieval Epochs)**
  - **Davison Mode:** Operates with absolute functional symmetry to N9's Zodiac mode. It processes the A1 Coniunctio Seed through the Zodiacal Releasing, Firdaria, and Profection systems, complete with all L3 sub-levels, LB (Loosing of the Bonds) detection, and event-driven transit logging for the relationship itself.
  - **Synastry Mode:** Splits the timeline matrix to render Parent A and Parent B side-by-side. 
    - To manage extreme data density in parallel tracking, the Zodiacal Releasing (Spirit, Fortune, Eros) is structurally constrained to render only up to Level 2 (`L1`, `L2`).
    - Firdaria and Profections for both parents are mapped simultaneously, allowing the astrologer to visually pinpoint the exact chronological epochs where their individual fate cycles align or collide.

- **Paradigm II: Jyotish Mechanics (The Trinitarian Timeline)**
  - Switching to `Jyotish` overrides the Relational Lens toggle, fusing the entire relational construct into a massive, three-pillar Vimshottari Dasha matrix.
  - **Parallel Karmic Cycles:** Computes and renders the Dasha cycles (Mahadasha, Antardasha, Pratyantardasha) of **Parent A**, the **Davison Seed**, and **Parent B** in absolute parallel chronological order.
  - **The Esoteric Genesis Markers:** The timeline dynamically sorts and initiates based on absolute chronological time, starting with the birth of the older parent. To mark the metaphysical intersections of the triad, the engine injects sacred textual markers directly into the grid:
    - **"Let there be Light.":** Appears precisely above the row where the Davison (Coniunctio) entity temporally "incarnates" and its specific Dasha timeline begins.
    - **"Consummatum est.":** (It is finished / completed) Appears precisely above the row where the younger parent's timeline initiates, marking the complete manifestation of the relational triad.

#### A10: Resonantia (The Sabian Synastry Matrix)
- **Overview:** The poetic and esoteric culmination of the Albedo stage. Resonantia discards the raw mathematical degrees and geometrical aspects to focus entirely on the hermeneutics of the relationship. It is a highly complex Sabian Synastry engine that parallel-maps the localized symbolic text of all four relational pillars (Parent A, Parent B, Composite, Davison) into a single, unified narrative grid.
- **The Core Control Matrix:**
  - **The System Matrix Tab:** Allows the user to shift the entire comparative grid across the four core dimensions (`Tropical`, `Sidereal`, `Draconic`, `Ketunic`), instantly recalculating and translating the Sabian texts for all four entities based on the new framework.
  - **The Axis Toggle (`Composite / Anti-Composite`):** Dictates the polarity of the spatial midpoint column, allowing the astrologer to read the primary Sabian narrative of the relationship, or flip it 180° to read its absolute shadow (Anti-Composite).
  - **Entity Category Tabs:** Filters the textual matrix by `Planets`, `Major Asteroids`, `Lilith & Nodes`, `Fates`, `Angles`, and `Hermetic`.
- **The Narrative Grid Architecture:**
  - **Columns:** Renders the layout as `CELESTIAL BODIES` | `COMPOSITE` | `DAVISON` | `A` | `B`.
  - **Sabian Convergence:** Unlike traditional synastry that looks for angular aspects, Resonantia allows the astrologer to visually trace the thematic and symbolic resonance of a specific planet (e.g., Venus) across the two individual souls and their dual synthesized forms simultaneously.
- **Underlying Spatiotemporal Proof (The Tooltip Engine):**
  - While the grid exclusively displays Sabian text, the engine never forgets its absolute mathematical foundation. Hovering over any Sabian text within the Davison, A, or B columns triggers a localized tooltip displaying the exact spatiotemporal metadata (`YYYY-MM-DD, HH:MM` and exact `Latitude/Longitude` coordinates) that birthed that specific symbolic degree, proving that the poetry is anchored in physical reality.



### 🟡 Stage 3. CITRINITAS: Transmutation & Experimental Self (C1 - C3)
- **Overview:** The third alchemical stage moves beyond the fixed architectural fate of a single seed or a paired relationship. Citrinitas is the dynamic, experimental sandbox for the astrologer. It allows for the manipulation of time, the rectification of the unknown, and the infinite parallel comparison of human data.

#### C1: Tabula (The Infinite Parallel Matrix)
- **Overview:** An experimental research module designed for the user. While N8 and A8 are strictly bound to the globally active Seed or Coniunctio context, C1 breaks these boundaries. It allows the astrologer to parallel-load an infinite *N* number of charts onto the absolute 360° grid for massive comparative analysis.
- **The Blank Slate Initialization:**
  - Because this module operates independently of the core engine's active seed, it initializes in an absolute void state, displaying a `NO DATA (CONFIGURE SETTINGS)` prompt across the grid.
- **Data Management Protocol (`MANAGE DATA`):**
  - A dedicated control suite for forging and importing temporary analytical vessels directly into the Tabula matrix.
  - **The `+` Button:** Imports or generates new base Natal charts specifically for this session.
  - **The `x` Button:** Generates Synthesized/Relational charts derived from the loaded data pool. As per core system logic, it synthesizes existing structural data rather than creating conflicting mathematical pathways.
  - **The `※` Icon:** Manages, edits, or deletes the active roster of loaded charts.
  - **Storage Isolation (The Sandbox Rule):** To prevent the pollution of permanent database records, all charts forged or loaded within the C1 module are temporarily cached exclusively in the client's browser `localStorage`. This absolute isolation applies to both Guests and fully authenticated Members.
- **Advanced System Settings:**
  - Expands upon the visibility modal introduced in A8. Users can meticulously select exactly which charts, which dimensional frameworks (Tropical, Sidereal, Draconic, Ketunic), and which esoteric points are rendered.
  - Users possess absolute control over the structural hierarchy, defining the exact left-to-right rendering order of the custom columns.
- **Full N8/A8 Mirroring:**
  - Retains the absolute 360° vertical axis (Aries 1 to Pisces 30) and the `Seed / System` structural sorting toggle.
  - Preserves the `Ayanamsa` selector and the `Traditional / Modern` rulership toggle for Arabic Lots.
  - Maintains all interactive esoteric popups, precise coordinate tracking tooltips, and the strict CSS visual stratification separating structural angles from celestial bodies.

#### C2: Hora Occulta (The Rectification Engine)
- **Overview:** The esoteric solution to the "Time Unknown" dilemma. Hora Occulta is a highly advanced birth time rectification module. Rather than relying solely on the mathematical reverse-engineering of life events, it utilizes a psychological elimination methodology—a process of *Via Negativa* (the negative way)—to isolate the exact hour of incarnation.
- **The Elimination Protocol (Via Negativa):** - The module operates similarly to an archetypal psychological assessment, dynamically generating targeted questions based on astrological shifts within the given date.
  - However, instead of asking the user to confirm positive traits (which are prone to subjective bias), it forces the user to eliminate what they definitively *are not*. By discarding the impossible, the engine narrows down the 24-hour cycle, outputting the most mathematically and psychologically viable timeframe candidates.
- **The Three Rituals (The Hebrew Mother Letters):**
  - Users can invoke one of three distinct rectification paradigms, represented by the foundational Hebrew Mother Letters.
  - **[ א ] Aleph (Planetary Lord Rectification):** - The Western structural approach. 
    - The engine dynamically generates elimination prompts based on the shifting Ascendant rulers throughout the day, deeply cross-referenced with heavy esoteric placements such as the Saturn-Chiron house combinations.
  - **[ מ ] Mem (The Lunar Matrix Rectification):** - The Vedic psychological approach. 
    - Prompts are formulated around the highly sensitive and rapidly shifting micro-divisions of the Moon, specifically tracking changes in the `Nakshatra` and `Pada` boundaries across the 24-hour span.
  - **[ ש ] Shin (The Illusory Self Rectification):** - The Jaimini astrological approach. 
    - Focuses on the friction between perception and reality. Questions are generated based on the specific combinations and transitions of the `Arudha Lagna` (how the world perceives the entity) versus the true physical `Ascendant`.

#### C3: Illuminatio (The Unconscious Labyrinth)
- **Overview:** The final esoteric descent of the Citrinitas stage. Illuminatio entirely abandons traditional chart rendering, transforming the engine into an interactive visual novel and psychological assessment hybrid. It probes the user's unconscious mind through deep mystical frameworks, structured precisely around the Five Levels of the Soul in Kabbalistic tradition (The 5 Lights).
- **The Five Lights (Interactive Paradigms):**
  - **[ נפש ] Nefesh (The Primal Soul):**
    - *System Framework:* Jyotish & Purushartha (Vedic spiritual motivations).
    - *Thematic Anchor:* Malkuth / The Moon / Nigredo.
  - **[ רוח ] Ruach (The Breath & Intellect):**
    - *System Framework:* Nordic Runes.
    - *Thematic Anchor:* Tiferet / Venus / Albedo.
  - **[ נשמה ] Neshamah (The Veiled Mystic / Tarot Engine):**
    - *System Framework:* A proprietary Hebrew 22-Letter Tarot matrix, strictly rejecting standardized Golden Dawn attributions in favor of a mathematically native Tetramegistus architecture.
    - *Mechanics:* Offers over 30 distinct psychological dilemmas and scenarios. The engine dynamically generates unique spreads based on the chosen path, pulling from a massive dual-language (EN/KO) JSON database exceeding 3 million characters. Users interactively navigate positional archetypes and deeply tailored situational scripts.
    - *Thematic Anchor:* Binah / Saturn.
  - **[ חיה ] Chayah (The Oracle of Stars):**
    - *System Framework:* Fixed Stars & Nakshatras.
    - *Mechanics:* The most epic, narrative-driven sequence of the engine. It operates as a hybrid between Dantean trials and a cosmic initiation, where the user undergoes the psychological trials of deep-space entities to be "chosen" by the stars.
    - *Thematic Anchor:* Chokmah / Jupiter / Citrinitas.
  - **[ יחידה ] Yechidah (The Absolute Singularity):**
    - *System Framework:* The 22 Paths of the Tree of Life (Sephiroth & Hebrew Letters).
    - *Thematic Anchor:* Kether / The Sun / Rubedo.

### 🔴 Stage 4. RUBEDO: Coagulation & Absolute Theory Archive (R1 - R2)
- **Overview:** The ultimate coagulation of symbols and knowledge into an absolute theoretical sanctuary.
- **Features:**
  - **R1 (Corpus Hermeticum):** Systematic database and archive of Hermetic texts.
  - **R2 (Sabian Symbols Matrix):** A highly structured, aspect-mapped Sabian dictionary and thesaurus, categorized precisely by decans, bounds, and aspects rather than simple degree divisions.

---

## 📚 GRIMOIRE: The Manifestation Engine
- **Overview:** A sophisticated compiler system that manifests digital astrological data into physical and local records.
- **Features:** - Highly precise JSON ruleset mapping for coordinate injections.
  - Batch generation of Excel (.xlsx) and PDF formats across N-series and A-series modules with local-server synchronization.

## 🚀 Deployment & Security Protocols (How to Manifest)
- **Environment:** `.env` isolation for database endpoints and core secrets.
- **Orchestration:** Dockerized container deployment with predefined port forwarding.
- **Admin Security (God Mode):** Multi-tiered progressive security protocols (including OTP) for panopticon system management.

## ⚖️ Ethics & Transparency
Tetramegistus stands against the monopolization of knowledge. The source code is transparently available for anyone to audit and contribute. We strictly oppose the use of this engine for commercial exploitation that distorts the mathematical and philosophical essence of astrology.
