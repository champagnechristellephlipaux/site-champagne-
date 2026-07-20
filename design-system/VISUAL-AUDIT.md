# Audit visuel — 30 juin 2026

## Problèmes observés

- Trop de cartes indépendantes : 89 occurrences dans le HTML.
- Trop de badges et petits encadrés : 67 occurrences de la classe `badge`.
- 132 blocs déclenchaient un effet d’apparition au défilement.
- Les contenus éditoriaux reprenaient une grille régulière de trois cartes,
  proche d’un template SaaS.
- Le système de tokens décrivait encore un ancien thème sombre alors que le site
  utilisait désormais une direction papier et terre.
- Les polices de corps étaient parfois traitées comme des titres, ce qui
  affaiblissait la lecture.
- Les textes répétaient des abstractions comme « ligne », « tenue », « juste »,
  « net » ou « repère ».
- Les composants historiques contenaient encore de nombreux rayons, ombres et
  couleurs ad hoc.

## Décisions

- Conserver les cartes uniquement pour les produits, formulaires et étapes
  transactionnelles.
- Transformer les contenus en colonnes éditoriales séparées par des filets.
- Utiliser Manrope pour la lecture et Cormorant Garamond pour le caractère.
- Centraliser palette, typographie, espacements, rayons, mouvement et niveaux de
  superposition dans `assets/css/design-tokens.css`.
- Supprimer les entrées au défilement et limiter les transitions aux états
  utiles.
- Remplacer les badges visuels par des labels typographiques.
- Conserver une seule ombre de séparation, réservée aux surfaces commerciales.

## Familles contrôlées

- Accueil
- Boutique
- Fiches Brut Tradition, Brut Rosé et Demi-Sec
- Maison et terroir
- Cadeaux et événements
- Visites et dégustations
- Journal et articles
- Livraison et paiement
- Pages légales et pages de confirmation

## Risques restant à surveiller

- `style.css` contient encore des règles historiques nombreuses. Elles sont
  neutralisées par la couche éditoriale, mais pourront être supprimées lors
  d’une future passe technique dédiée.
- Certaines photographies anciennes ont un rendu plus composé que documentaire.
  Elles devront être remplacées lorsque de nouveaux visuels de la propriété
  seront disponibles.
