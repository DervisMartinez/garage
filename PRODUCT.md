# GARAGE — Product Truth

## Purpose
GARAGE is a smart digital garage and predictive maintenance tracker designed specifically for motorcycle owners. It eliminates unexpected mechanical breakdowns and road emergencies by continuously calculating real-time component wear, tracking fuel efficiency, and safely vaulting road legal documentation in a tactile Apple Wallet-style digital pouch.

## Primary Audience & Operating Scene
- **Audience:** Motorcycle commuters, couriers, tourers, and riders who manage one or multiple bikes.
- **Operating Scene:** 
  - On the road, at gas stations, in mechanic workshops, and at traffic checkpoints.
  - Frequently used outdoors under direct bright sunlight (demands high text contrast) or during late night rides (demands true dark mode without battery drain).
  - Quick, single-hand interactions (updating current odometer in < 3 seconds, flashing legal documents to officers with 1 tap).

## Core Capabilities & Workflows
1. **Predictive Telemetry & Wear Calculation:**
   - Tracks 10 mechanical subsystems: Engine Oil, Front/Rear Tires, Front/Rear Brakes, Drive Chain, Air Filter, Fuel Filter, Spark Plugs.
   - Dynamically respects chemical oil formulation lifespans: Mineral (3,000 km), Semi-Synthetic (5,000 km), Full Synthetic (8,000 km).
   - Warns with high-priority banners when any component dips below 15% remaining life.
2. **Digital Road Wallet (Billetera):**
   - Stores Driver's License, Medical Certificate, Vehicle Registration (Carnet de Circulación), and RCV Insurance.
   - Multi-bike isolation: Personal documents are shared across all vehicles; bike-specific documents (RCV, Title, Circulation) filter automatically per active motorcycle.
   - Fullscreen tactile inspection modal with pinch/zoom visibility for traffic checkpoints.
3. **Quick Fuel & Efficiency Logging:**
   - Single-tap floating action button to capture liters and USD cost.
   - Estimates tank level, average consumption (km/L), and remaining range.
4. **Interactive Odometer Sync:**
   - Prompt-on-launch or single tap on the dashboard odometer widget to synchronize the current odometer reading in seconds.

## Platform & Technical Constraints
- **Stack:** Expo SDK 57 (React Native 0.86), React 19, TypeScript, Supabase (PostgreSQL + Storage Blobs).
- **Offline / Connectivity:** Must handle spotty cellular data gracefully with local persistence (`AsyncStorage`) and optimistic UI updates.
- **Accessibility:** Touch targets ≥ 48px, high contrast ratios (WCAG AA compliant), clear typographic hierarchy.
