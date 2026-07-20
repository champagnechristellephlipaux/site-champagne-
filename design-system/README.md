# Système visuel — Champagne Christelle Phlipaux

Ce système adapte le template de design tokens installé dans Codex au
positionnement réel de la maison. Il ne remplace pas le site par un thème
générique : il organise les décisions visuelles déjà pertinentes.

## Direction retenue

- Composition : page éditoriale centrée sur le terroir et la cuvée.
- Atmosphère : artisanale, calme, chaleureuse et précise.
- Typographies : Cormorant Garamond pour la voix éditoriale, Manrope pour les
  interfaces et les informations d'achat.
- Palette : brun profond, ivoire et nuances de champagne, sans dorure
  ostentatoire.
- Formes : rayons de 0 à 3 px, filets fins et ombres réservées au commerce.
- Mouvement : changements d’état brefs uniquement ; aucun effet d’entrée au
  défilement ni animation décorative.

## Hiérarchie des tokens

Les variables de `assets/css/design-tokens.css` suivent trois niveaux :

1. `primitive-*` : valeurs brutes de couleur, espace, rayon et durée ;
2. rôles sémantiques : `color-*`, `font-family-*`, `shadow-*` ;
3. composants : `button-*`, `card-*`, `panel-*`, `media-*`, `chip-*`.

Les styles propres à une page restent dans `style.css`. Une décision partagée
doit être modifiée dans les tokens plutôt que répétée dans plusieurs blocs.

## Modèles écartés

Les directions « liquid glass », néon, parallaxe appuyée, cartes excessivement
arrondies et animations continues ne correspondent ni à la maison ni aux
objectifs de performance et d'accessibilité.
