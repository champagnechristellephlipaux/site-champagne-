# Direction artistique — Champagne Christelle Phlipaux

## Positionnement

Champagne Christelle Phlipaux est une maison familiale créée en 1977 à
Channes, dans la Côte des Bar. Le site doit donner le sentiment d’une maison
indépendante, soignée et accessible. Le premium vient du lieu, de la matière,
du temps et de la précision, jamais d’un décor de luxe artificiel.

## Concept créatif

**Le carnet de maison.**

La composition emprunte à l’édition : grandes photographies documentaires,
titres de caractère, filets fins, légendes et espaces généreux. La chaleur vient
des papiers ivoire, des terres de vigne et des images de Channes. Les interfaces
commerciales restent plus structurées, mais utilisent la même typographie et
les mêmes couleurs.

Les directions « liquid glass », noir/or, motion-driven, néon, dégradés
spectaculaires et artisanat folklorique ont été écartées. Elles affaibliraient
la crédibilité d’une maison familiale et vieilliraient rapidement.

## Principes de composition

1. Une photographie réelle dominante par ouverture de page.
2. Un grand titre, un texte court et une action principale.
3. Des cartes uniquement pour un produit, un formulaire ou une transaction.
4. Les contenus éditoriaux utilisent des colonnes, des filets et du blanc.
5. Une asymétrie mesurée évite l’effet de grille SaaS.
6. Aucun élément décoratif ne doit concurrencer la bouteille ou le lieu.

## Tokens de couleur

| Token       | Valeur    | Usage                      |
| ----------- | --------- | -------------------------- |
| `paper-0`   | `#fffdf9` | Surface fonctionnelle      |
| `paper-50`  | `#faf7f1` | Navigation et champs       |
| `paper-100` | `#f3eee6` | Fond principal             |
| `paper-200` | `#e7ddd0` | Médias et séparations      |
| `ink-950`   | `#17110e` | Cave, panier, pied de page |
| `ink-900`   | `#231914` | Titres et texte principal  |
| `ink-700`   | `#5f5045` | Texte secondaire           |
| `earth-600` | `#78583e` | Liens, labels et focus     |
| `wine-700`  | `#6d2f35` | Accent rare                |

Le lie-de-vin n’est jamais une couleur de remplissage dominante. Il sert
uniquement lorsque le contenu justifie un accent de marque.

## Typographie

- **Cormorant Garamond** : titres, citations et légendes éditoriales.
- **Manrope** : paragraphes, navigation, boutons, prix, formulaires et commerce.
- Héros : `clamp(4rem, 6.3vw, 6.25rem)`.
- Titre de page : `clamp(3.5rem, 5.9vw, 5.75rem)`.
- Titre de section : `clamp(2.5rem, 3.8vw, 4rem)`.
- Titre de composant : `clamp(1.75rem, 2.4vw, 2.6rem)`.
- Corps : `1rem`, interligne `1.7`.
- Label : `0.72rem`, capitales espacées, usage ponctuel.

Les paragraphes longs sont limités à `68ch`. Une page ne doit pas cumuler plus
de trois niveaux typographiques visibles dans une même zone.

## Espacement

Le rythme repose sur une base de 4 px. Les paliers principaux sont 8, 12, 16,
24, 32, 48, 64, 80, 96 et 128 px.

- Gouttière responsive : `clamp(1.5rem, 4vw, 3.5rem)`.
- Section standard : `clamp(4.5rem, 8vw, 7.75rem)`.
- Section compacte : `clamp(3rem, 5vw, 5rem)`.
- Écart entre colonnes éditoriales : 40 à 96 px.

## Composants

### Navigation

Fond papier clair, filet inférieur et état actif souligné. Aucun halo ni
capsule autour des liens. Le bouton Boutique est sombre et compact.

### Boutons

- Hauteur minimale : 50 px.
- Rayon : 3 px.
- Primaire : fond cave, texte ivoire.
- Secondaire : fond transparent, filet terre.
- Aucun déplacement, zoom ou ombre au survol.
- Transition de couleur uniquement, entre 140 et 200 ms.

### Contenus éditoriaux

Les blocs `support`, `offer`, `ritual`, `editorial` et `trust` sont séparés par
des filets. Ils n’utilisent ni fond blanc individuel ni ombre. Sur mobile, les
colonnes deviennent une liste verticale avec séparateurs horizontaux.

### Produits et formulaires

Les cartes restent autorisées car elles regroupent une décision et une action.
Elles utilisent une surface ivoire, un filet fin, un rayon de 2 px et une ombre
uniquement lorsque la séparation avec le fond l’exige.

### Badges et pictogrammes

Les badges sont des labels typographiques sans capsule. Les pictogrammes
éventuels doivent être des SVG au trait de 1,5 px, sans emoji, sans illustration
générique et sans mélange de styles.

### Photographie

Priorité aux vendanges, vignes, cave, famille et bouteilles de la maison.
L’image documente un lieu ou un geste. Les collages, doubles arrière-plans,
textures artificielles et recadrages qui coupent l’étiquette sont interdits.

## Mouvement

Le contenu n’entre pas en scène au défilement. Les seuls mouvements autorisés
sont les changements d’état utiles : menu, panier, accordéon et retour visuel
d’un bouton. `prefers-reduced-motion` reste respecté.

## Responsive

- Contrôle à 375, 768, 1024 et 1440 px.
- Cible tactile minimale : 44 × 44 px.
- Aucun contenu sous une barre fixe.
- Les héros conservent une présence photographique sans masquer le titre.
- Les comparaisons et colonnes deviennent des listes structurées.

## Voix

La voix nomme les faits : Channes, les cépages, les formats, les accords, le
temps en cave et le conseil de Christelle.

À éviter : « ligne », « tenue », « juste », « net », « repère » lorsqu’ils ne
donnent aucune information, les promesses de prestige et les formulations que
n’importe quelle marque pourrait reprendre.

## Sources techniques

- Tokens : `assets/css/design-tokens.css`
- Composants et compositions : `assets/css/editorial-redesign.css`
- Styles historiques conservés pour compatibilité : `style.css`

Toute nouvelle décision partagée doit être ajoutée aux tokens avant d’être
utilisée dans un composant.
