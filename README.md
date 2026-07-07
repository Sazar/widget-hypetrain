# 🚂 widget-hypetrain

Widget **Hype Train Twitch** pour StreamElements — barre de progression animée avec timer, niveau et pourcentage.

## Fonctionnalités

- 🔥 Barre de progression arrondie (pill shape) avec gradient animé
- 🏆 Niveau affiché en haut avec badge animé (effet level-up)
- ⏱️ Timer décompte en bas à gauche (rouge sous 30s)
- 📊 Pourcentage avant le prochain niveau en bas à droite
- 🎨 Couleurs personnalisables via color picker StreamElements
- ✨ Particules flottantes + reflet brillant sur la barre
- 🌑 Fond sombre semi-transparent avec backdrop blur

## Installation sur StreamElements

1. Aller sur [StreamElements](https://streamelements.com) → **My Overlays** → **New Overlay**
2. Ajouter un **Custom Widget**
3. Copier le contenu de chaque fichier dans l'onglet correspondant :
   - `widget.html` → onglet **HTML**
   - `widget.css` → onglet **CSS**
   - `widget.js` → onglet **JS**
   - `widget.json` → onglet **Fields**
4. Sauvegarder et tester !

## Paramètres personnalisables

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `barColor` | Color picker | Couleur principale de la barre | `#9147FF` |
| `barColorEnd` | Color picker | Couleur secondaire du gradient | `#FF6B6B` |
| `trainDuration` | Nombre | Durée du Hype Train (secondes) | `300` |

## Structure

```
widget-hypetrain/
├── README.md
├── widget.html
├── widget.css
├── widget.js
└── widget.json
```

## Événements StreamElements supportés

- `hypetrain-progress` — mise à jour de la progression
- `hypetrain-end` — fin du hype train
- API Twitch EventSub : `HypeTrainProgress` / `HypeTrainEnd`
