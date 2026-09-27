# Décisions d'architecture (ADR)

Ce document fige les décisions prises avant le développement de l'interface.
Chaque décision est numérotée et motivée. Une révision d'une décision passe par
une nouvelle entrée, jamais par une modification silencieuse.

## ADR-001 — Positionnement produit

**Décision** : Waypaper Engine est une application autonome, pas un companion de
Wallpaper Engine. Elle vise une compatibilité maximale avec les items du
Workshop de Wallpaper Engine (appid `431960`), avec l'objectif à long terme
d'une proposition d'intégration à l'équipe Wallpaper Engine / Steam.

**Motif** : une app autonome fonctionnelle est réaliste ; un companion complet
sur Linux ne peut pas l'être (moteur Windows-only).

## ADR-002 — Licence : GPL-3.0

**Décision** : le projet est sous GPL-3.0.

**Motif** : le parseur du format `.pkg` s'inspire de travaux existants sous GPL
(`wallpaper-engine-kde-plugin`). Toute intégration officielle avec l'équipe
Wallpaper Engine passerait de toute façon par un accord séparé avec eux.

## ADR-003 — Import Workshop local uniquement

**Décision** : aucun téléchargement Workshop automatisé. L'utilisateur pointe
l'application vers un dossier local (`steamapps/workshop/content/431960/`)
déjà téléchargé via son client Steam.

**Motif** : SteamCMD exige des identifiants en clair et les downloader tiers
violent les CGU Steam. Un import local est propre et c'est le mode qu'une
intégration officielle privilégierait.

## ADR-004 — Architecture en trois couches

**Décision** :

```
Waypaper Engine (Electron)          ← UI, gestion, playlists, import Workshop
        │ IPC / CLI
        ▼
Moteur de rendu (renderer engine)   ← processus séparé
  ├── backend X11 (fenêtre root)
  ├── backend wlroots (wlr-layer-shell)
  └── backend KDE (KWin)
```

**Motif** : Electron/Chromium ne supporte pas `wlr-layer-shell` nativement.
Le rendu bureau doit être délégué à des backends spécialisés, pilotés par
l'application.

## ADR-005 — GNOME hors scope v1

**Décision** : GNOME n'est pas supporté en v1. Le support nécessiterait une
extension GNOME Shell dédiée (pas de layer-shell, pas de fenêtre root).

**Motif** : coût élevé, audience wlroots/KDE/X11 prioritaire. Réévalué après
la phase 2.

## ADR-006 — Rendu vidéo délégué à mpvpaper (v1)

**Décision** : en v1, le rendu vidéo est délégué à `mpvpaper` (wlroots) et aux
mécanismes X11. Un client layer-shell embarqué est une évolution possible
(phase 3+).

**Motif** : rapidité de mise en œuvre, robustesse de mpv, pas de réinvention
du plumbing vidéo. La valeur ajoutée de Waypaper Engine est le support
web/scene et la gestion, pas le décodage vidéo.

## ADR-007 — Parseur `.pkg` en lecture seule dès la phase 1

**Décision** : le format `.pkg` de Wallpaper Engine est parsé dès la phase 1,
en lecture seule, pour extraire les métadonnées (`title`, `preview`, `type`,
`description`) et trier la bibliothèque. Le rendu des scènes arrive en phase 3.

**Motif** : l'import Workshop est inutilisable sans comprendre le format ;
le rendu des scènes est un chantier séparé (moteur WebGL).

## ADR-008 — Composants externes interdits (règles projet)

**Décision** : aucune fonction de requête API ou appel extérieur dans le code
de l'application tant que le propriétaire du projet ne l'a pas décidé. Seules
les fonctions dites « de test » (renvoi console) sont autorisées. Les listes
UI sont alimentées par des objets de données factices en attendant les
canaux IPC réels.

**Motif** : règle projet explicite, applicable dès le scaffolding.

## ADR-009 — UI sous XWayland sur NVIDIA Wayland

**Décision** : sous session Wayland avec GPU NVIDIA, l'UI Electron bascule
automatiquement sur `ozone-platform=x11` (XWayland). Sur les autres GPU, on
force `use-angle=gl` et on désactive les chemins Vulkan
(`Vulkan,VulkanFromANGLE,DefaultANGLEVulkan`). La variable
`WAYPAPER_FORCE_XWAYLAND=1` force XWayland sur tout environnement.

**Motif** : bug amont Electron/Chromium non résolu — le backend ozone
Wayland tente d'initialiser Vulkan même avec les flags de désactivation
(référence : issues Electron #36633, Brave #55805), et NVIDIA est le cas le
plus récalcitrant. Sans impact produit : le rendu des wallpapers est délégué
aux backends d'affichage (ADR-004/006), l'UI n'est pas le chemin de rendu.
À réexaminer quand Electron corrigera l'amont.

