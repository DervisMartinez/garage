# GARAGE — Design System & Visual Authority

## Visual World: Precision Motorsport Blue
A utilitarian, high-contrast, technical design language engineered for motorcyclists. Clean lines, geometric typography, dark obsidian backdrops with vivid Royal Blue accents inspired by performance racing telemetries (Yamaha Racing Blue / BMW M Motorsport).

## Color Authority
### Core Brand Tokens
- **Primary Accent (Light):** `#275FE3` (Royal Blue — assertive, high legibility in daylight)
- **Primary Accent (Dark):** `#4169E1` (Vivid Royal Blue — radiant on dark surfaces)
- **Secondary (Telemetry Info):** `#00e3fd` (Cyan / Tachometer beam)
- **Tertiary (Healthy Status):** `#00ae78` / `#4edea3` (Motorsport Emerald)
- **Alert / Danger:** `#ba1a1a` / `#ffb4ab` (Crimson warning)

### Surface Architecture
- **Dark Mode:**
  - `surface`: `#111319` (Obsidian baseline)
  - `surfaceContainerLow`: `#191c21` (Card cards & telemetry trays)
  - `surfaceContainer`: `#1d2025` (Elevated groups)
  - `surfaceContainerHigh`: `#272a30` (Modals & popups)
  - `outlineVariant`: `#40485c` (Subtle boundary lines)
- **Light Mode:**
  - `surface`: `#f5f5f7` (Ice-white matte)
  - `surfaceContainerLow`: `#ffffff` (Crisp cards)
  - `surfaceContainer`: `#ececf0` (Input wells)
  - `surfaceContainerHigh`: `#e0e0e6` (Floating sheets)

## Typography (Montserrat)
- **Headings & Titles:** `Montserrat_800ExtraBold` & `Montserrat_700Bold` (uppercase tracking +0.5px for technical indicators).
- **Interactive & Subheads:** `Montserrat_600SemiBold`
- **Body & Data Readings:** `Montserrat_500Medium` & `Montserrat_400Regular`
- **Rule:** Never use system fallback fonts or generic Arial/Inter. Emphasize metrics with font size and weight steps rather than chaotic color clashes.

## Iconography & Affordances
- **Vector Family:** Exclusively `@expo/vector-icons` (`MaterialIcons` & `MaterialCommunityIcons`).
- **Ban:** Never use raw emojis (like `✏️` or `⚙️`) as primary UI controls or status badges. Replace them with proper vector glyphs (`edit`, `build`, `speed`).
- **Touch Targets:** Minimum 48x48px hit areas for all interactive controls, buttons, and close actions.

## Motion & Tactility
- Modals slide in and glide upward smoothly over the keyboard with `KeyboardAvoidingView`.
- Cards in the Digital Wallet stack with progressive -140px negative vertical overlap, expanding on tap with smooth accordion layout transitions.
- Quick Log FAB floats with an elevation of 8 and a 64x64px circular hit target.
