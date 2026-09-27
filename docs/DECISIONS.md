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

## ADR-005 — GNOME : fond statique en v1, vidéo hors scope

**Décision** : GNOME reçoit un support partiel en v1 via le backend
`gnome-static` : l'aperçu du wallpaper est appliqué comme fond d'écran
image via le portail `org.freedesktop.portal.Wallpaper` (mécanisme
officiel des Paramètres GNOME), avec repli `dconf write` direct sur les
deux clés `picture-uri`/`picture-uri-dark` (le schéma CLI gsettings peut
être en retard sur le shell — constaté sur Ubuntu 26.04 / GNOME 50).

Le rendu vidéo animé reste hors scope v1 : pas de layer-shell, pas de
fenêtre root — une extension GNOME Shell dédiée serait nécessaire
(piste post-phase 2).

**Motif** : le fond statique couvre l'usage minimal sans dépendance ;
la vidéo sur GNOME exige un chantier spécifique (extension shell).

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

**Implémentation** (`src/main/pkg.ts`) : conteneur binaire — magic à taille
`int32` (ex. `PKGV0005`), nombre d'entrées `int32`, puis par entrée : chemin
à taille `int32` (UTF-8), offset `int32`, longueur `int32` ; les données
suivent la table. Le scanner Workshop utilise ce parseur comme repli quand
`project.json` n'est pas présent en clair dans le dossier de l'item. Format
documenté par rétro-ingénierie FOSS (RePKG, wallpaper-engine-kde-plugin).

## ADR-008 — Composants externes interdits (règles projet)

**Décision** : aucune fonction de requête API ou appel extérieur dans le code
de l'application tant que le propriétaire du projet ne l'a pas décidé. Seules
les fonctions dites « de test » (renvoi console) sont autorisées. Les listes
UI sont alimentées par des objets de données factices en attendant les
canaux IPC réels.

**Motif** : règle projet explicite, applicable dès le scaffolding.

## ADR-009 — Backend d'affichage de l'UI : Wayland natif par défaut

**Décision** : sous session Wayland, l'UI utilise le backend ozone Wayland
natif, avec `use-angle=gl` et les désactivations Vulkan
(`Vulkan,VulkanFromANGLE,DefaultANGLEVulkan`, `disable-vulkan-surface`,
`disable-vulkan-native-surface`). La variable `WAYPAPER_FORCE_XWAYLAND=1`
bascule sur XWayland (`ozone-platform=x11`). Le message Chromium
« --ozone-platform=wayland is not compatible with Vulkan » est cosmétique
dans notre configuration (GPU NVIDIA testé : la fenêtre s'affiche correctement).

**Motif** : le message d'erreur Vulkan se révèle bénin une fois le vrai
crash (ADR-010) corrigé. Testé sur Ubuntu + NVIDIA + Wayland : le natif
s'affiche, XWayland présente une fenêtre invisible avec le software
bitmap presenter. Sans impact produit : le rendu des wallpapers reste
délégué aux backends d'affichage (ADR-004/006), l'UI n'est pas le chemin
de rendu.

## ADR-010 — Fenêtre frameless (frame: false)

**Décision** : la fenêtre principale est créée sans frame natif
(`frame: false`). La barre de titre sera rendue par l'UI Mantine (anthracite),
avec les boutons minimiser/maximiser/fermer pilotés via l'API BrowserWindow
(minimize, maximize, close) exposés par le preload.

**Motif** : contournement du segfault Electron #49244 — l'init GTK du frame
natif fait segfaulter `new BrowserWindow()` sur Ubuntu (message
`Schema org.gnome.desktop.interface does not have key font-antialiasing`
avant le crash). Correctif amont en cours (PR Electron #54365, branches
43/44/45). L'app devra de toute façon offrir sa propre barre de titre
cohérente avec le thème anthracite ; ce bug précipite une décision qui
était déjà naturelle pour ce type d'application.

## ADR-011 — GTK3 explicite sous Linux

**Décision** : `--gtk-version=3` est posé inconditionnellement sous Linux
avant `app.whenReady()`.

**Motif** : Ubuntu + session GNOME : l'init GTK4 d'Electron loggue
`Schema org.gnome.desktop.interface does not have key font-antialiasing`.
Forcer GTK3 évite ce chemin et le rendu des polices reste correct.

## ADR-012 — Vidéo de fond GNOME via extension Shell dédiée

**Décision** : le rendu vidéo sous GNOME (Wayland natif et X11) est confié
à une extension GNOME Shell embarquée dans le dépôt
(`gnome-shell-extension/`), adaptée du pattern de Hanabi
(jeffshee/gnome-ext-hanabi, GPL-3.0-or-later, avec attribution) :

1. un processus renderer GJS/GTK4 (une fenêtre plein écran par moniteur,
   paintable partagé, `gtk4paintablesink`, repli `Gtk.MediaFile`) est lancé
   par l'extension via `Meta.WaylandClient` ;
2. l'extension injecte un acteur dans chaque acteur de fond du shell
   (override de `BackgroundManager._createBackgroundActor`) qui fait un
   `Clutter.Clone` de la fenêtre du renderer de son écran ;
3. l'application pilote l'ensemble par le schéma gsettings
   `com.harkhenon.waypaper` (clé `video-path`, vide = arrêt) — aucun
   canal IPC direct vers le shell, ce qui garde le process séparé du
   même père que ADR-006 (processus externes pilotés par commandes).

L'installation (copie vers `~/.local/share/gnome-shell/extensions/`,
`glib-compile-schemas`, `gnome-extensions enable`) est automatisée depuis
les Paramêtes (bouton « Installer l'extension ») — `src/main/gnomeExtension.ts`.

**Motif** : GNOME ne permet pas à un processus tiers de dessiner sous les
icônes du bureau (pas de couche équivalente à la fenêtre racine X11, et
l'API `Meta.Background` est réservée au shell). Hanabi démontre que ce
pattern fonctionne sur GNOME 45–50, y compris NVIDIA/Wayland, et c'est la
seule approche qui couvre le lock screen et l'aperçu des espaces de travail.
Le pilotage par gsettings évite toute API externe (ADR-008) et rend
l'extension autonome si l'app Electron n'est pas lancée.

## ADR-013 — Pilotage multi-écrans par le schéma gsettings

**Décision** : le schéma `com.harkhenon.waypaper` s'étend :

- `video-paths` (string JSON, défaut `''`) : map « index de moniteur →
  chemin de vidéo ». Prioritaire sur `video-path` pour l'écran concerné ;
- `monitors-json` (string JSON, défaut `''`) : liste des écrans (index,
  géométrie, échelle) publiée par l'extension pour l'UI de l'application ;
- `loop` (booléen, défaut `true`) : lecture en boucle, option de lecture
  au même titre que `paused`/`mute`.

Le renderer GJS crée un player par écran assigné (au lieu d'un paintable
partagé pour tous) et réagit à chaud aux changements de `video-paths`.
L'extension lance le renderer dès que `video-path` **ou** `video-paths`
est non vide.

**Motif** : l'assignation par écran est le besoin n°1 après le support
vidéo de base (multi-écrans hétérogènes). Le transport par gsettings reste
conforme à ADR-008 (aucune API externe) et à l'architecture ADR-012
(pilotage par commandes, extension autonome). L'index de moniteur du shell
est la clé stable entre l'UI et le renderer.
