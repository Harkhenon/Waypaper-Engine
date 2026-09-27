# Extension GNOME Shell — Waypaper Engine

Vidéo de fond d'écran pour GNOME (Wayland et X11), pilotée par l'application
Waypaper Engine via le schéma gsettings `com.harkhenon.waypaper`.

## Architecture

Identique à celle de Hanabi, éprouvée sur GNOME 45 à 50 :

1. `extension.js` — injecte un acteur dans chaque acteur de fond du shell
   (override de `BackgroundManager._createBackgroundActor`) et lance le
   renderer via `Meta.WaylandClient` quand `video-path` est défini.
2. `wallpaper.js` — l'acteur `LiveWallpaper` fait un `Clutter.Clone` de la
   fenêtre du renderer correspondant à son écran, avec retry tant que le
   renderer n'est pas mappé.
3. `renderer/renderer.js` — processus GJS/GTK4 autonome : une fenêtre plein
   écran par moniteur, un paintable partagé, `gtk4paintablesink` (GStreamer)
   ou repli `Gtk.MediaFile`. Boucle, pause et changement de fichier à la
   volée via gsettings.
4. `windowManager.js` — garde les fenêtres du renderer minimisées et en bas.
5. `launcher.js` — spawn en client Wayland du shell (invisible pour les
   autres applications).

L'application Electron pilote l'ensemble avec `gsettings set
com.harkhenon.waypaper video-path '<fichier>'` (vide = arrêt du rendu).

## Installation (manuelle)

```sh
cp -r gnome-shell-extension ~/.local/share/gnome-shell/extensions/waypaper-engine@harkhenon
glib-compile-schemas ~/.local/share/gnome-shell/extensions/waypaper-engine@harkhenon/schemas/
gnome-extensions enable waypaper-engine@harkhenon
```

L'application installe et active l'extension automatiquement depuis les
Paramètres (bouton « Installer l'extension »).

## Dépendances

- `gjs` (runtime), fourni par GNOME.
- Rendu optimal : `gtk4paintablesink` (paquet `gstreamer1.0-gtk4` sur
  Ubuntu, `gnome-shell` expose déjà la typelib).
- Repli sans GStreamer GTK : `Gtk.MediaFile` (intégré à GTK4).

## Crédits

Pattern technique adapté de [Hanabi](https://github.com/jeffshee/gnome-ext-hanabi)
de Jeff Shee (GPL-3.0-or-later). Merci également au projet DING pour le
pattern de lancement `Meta.WaylandClient`.
