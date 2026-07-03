# HVAC Truth Portability Plan

Expo is useful for a quick MVP, but the product should not be architecturally dependent on Expo.

## Current approach

The current app code is intentionally organized so the core product logic is portable:

- `src/domain/` contains pure TypeScript business rules.
- `src/content/` contains app-ready content libraries.
- `src/screens/` contains React Native presentation screens.
- `src/services/` contains backend clients.

The most important rule: keep troubleshooting, quote logic, safety rules, and contractor ranking outside the UI.

## Migration paths

### Option A: Bare React Native

Best if we want native modules, tighter control, and long-term mobile flexibility.

Migration steps:

1. Create a new bare React Native project.
2. Copy `src/domain`, `src/content`, `src/services`, and most `src/screens`.
3. Replace Expo startup scripts and packages.
4. Add native iOS and Android configuration.
5. Reconnect navigation and environment variables.

### Option B: Flutter

Best if we want stronger UI consistency and a clean app rebuild.

Migration steps:

1. Rebuild screens in Flutter.
2. Convert TypeScript domain logic into Dart services.
3. Keep the PRD, prompts, database schema, and content library.
4. Use the same Supabase/OpenAI backend strategy.

### Option C: Native Swift/Kotlin

Best only if the app becomes complex enough to justify two native codebases.

Migration steps:

1. Rebuild the UI natively.
2. Move business logic into backend APIs or duplicate logic in both platforms.
3. Keep Supabase/Postgres and cloud functions as the source of truth.

## Recommendation

Use the current package to validate screens, content, flows, and logic quickly. Before serious production hardening, move to bare React Native if Expo remains undesirable.
