# Matrice de compatibilité Wallpaper Engine

AppID Steam : `431960`. Dossier Workshop : `steamapps/workshop/content/431960/<item_id>/`.

| Type d'item | Format | Faisabilité Linux | Statut cible | Phase |
|---|---|---|---|---|
| Video | `.mp4`, `.webm` dans le `.pkg` | Décodage standard (mpv) | ✅ Complet | 1 |
| Web | HTML/CSS/JS | Rendu Chromium (point fort d'Electron) | ✅ Complet | 1 |
| Playlist | Conteneur XML (types ci-dessus) | Complet dès que les types sous-jacents le sont | ✅ Complet | 2 |
| Scene | `.pkg` (pack propriétaire non documenté) | Réimplémentation du moteur de rendu WebGL de WE | ⚠️ En chantier | 3 |
| Application | `.exe` compilé (Windows-only) | Impossible sans Wine | ❌ Hors scope | — |

## Notes techniques

- **`.pkg`** : format pack propriétaire, rétro-ingénierié par des projets FOSS
  (référence : `wallpaper-engine-kde-plugin`). Parseur en lecture seule dès la
  phase 1 (métadonnées), moteur de rendu en phase 3.
- **Rendu bureau** : Electron ne sait pas afficher sous les icônes du bureau.
  Voir ADR-004 : backends X11 / wlroots (layer-shell) / KDE.
- **Type Application** : signifié comme non supporté dans l'UI, jamais masqué.
