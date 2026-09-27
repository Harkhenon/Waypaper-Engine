# Waypaper Engine

Gestionnaire de wallpapers animés pour Linux, compatible **X11** et **Wayland**.

## Stack technique

- **Electron** + **electron-vite**
- **React 19** + **Mantine UI v9** (composants complets)
- **SASS** (`src/renderer/src/assets/base.scss` uniquement, le style passe par le `createTheme` de Mantine)
- **TypeScript**

## Démarrage

```bash
npm install
npm run dev      # développement
npm run build    # build de production
```

## Scripts

| Script | Rôle |
| --- | --- |
| `npm run dev` | Lance l'app en mode développement |
| `npm run build` | Build de production (main, preload, renderer) |
| `npm run typecheck` | Vérification TypeScript (node + web) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run build:linux` | Package Linux (AppImage, deb) |

## Architecture

```
src/
├── main/            # Processus principal Electron
├── preload/         # Bridge contextIsolated (API exposée au renderer)
└── renderer/
    └── src/
        ├── assets/base.scss   # Seul fichier CSS autorisé
        ├── components/        # Composants décomposés
        ├── theme/theme.ts     # createTheme Mantine (anthracite)
        ├── App.tsx
        └── index.tsx
```

## Variables d'environnement (Linux)

| Variable | Effet |
| --- | --- |
| `WAYPAPER_NATIVE_WAYLAND=1` | Force le backend Wayland natif pour l'UI (au lieu de XWayland par défaut sous Wayland) |

Sous session Wayland, l'UI bascule par défaut sur XWayland (`ozone-platform=x11`)
pour contourner un bug amont Electron/Chromium (incompatibilité ozone Wayland /
Vulkan, notamment sur GPU NVIDIA). Voir `docs/DECISIONS.md` (ADR-009).

## Thème

Thème principal **gris anthracite** (`#2b2f31`), avec sélection de couleurs secondaires via `src/renderer/src/theme/theme.ts` (`createTheme` Mantine).

## Branches

- `main` : branche stable
- `dev` : branche de développement
