# Roadmap

## Phase 1 — Socle : import + lecture vidéo/web

- Import d'un dossier Workshop local (ADR-003)
- Parseur `.pkg` en lecture seule : métadonnées (`title`, `preview`, `type`)
- Bibliothèque d'items avec tri/filtre par type
- Rendu vidéo : `mpvpaper` (wlroots) + backend X11 (ADR-006)
- Rendu web : processus Chromium dédié par backend d'affichage (ADR-004)
- UI Mantine : thème anthracite, sélection de la couleur secondaire

## Phase 2 — Gestion

- Playlists (conteneur XML Workshop)
- Multi-écrans
- Scheduling et profils
- Scan/parsing du dossier : statuts par item, détection du type

## Phase 3 — Moteur scene

- Rendu des scènes WebGL (interpréteur des scènes WE)
- Client layer-shell embarqué (évaluation vs mpvpaper)
- Réexamen du support GNOME (ADR-005)

## Phase 4 — Intégration

- Proposition à l'équipe Wallpaper Engine
- Discussion intégration Steam éventuelle
