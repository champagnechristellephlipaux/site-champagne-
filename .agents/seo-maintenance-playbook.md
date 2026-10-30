# Maintenance SEO — Champagne Christelle Phlipaux

## Après une modification de prix, livraison ou contenu public

1. Mettre à jour la source de vérité et toutes les mentions visibles concernées.
2. Exécuter `npm run seo:sitemap` pour dater uniquement les pages réellement modifiées.
3. Exécuter `npm run merchant:feed` pour réaligner le flux Google Merchant avec les prix de la boutique.
4. Exécuter `npm run check` et le scanner SEO du projet.
5. Vérifier les pages prioritaires sur mobile et ordinateur.
6. Déployer seulement après validation des prix, formats et règles de livraison.
7. Dans Google Search Console, soumettre le sitemap puis demander l’indexation des pages prioritaires modifiées.

Pages prioritaires : accueil, boutique, pages de cuvées, coffret, cadeaux, événements et livraison.

## Flux Google Merchant

- URL après déploiement : `https://www.champagne-christelle-phlipaux.com/merchant-center-feed.xml`.
- Le flux contient uniquement les quatre offres principales : trois bouteilles de 75 cl et le coffret découverte.
- Les cuvées n’ayant pas de GTIN ni de référence fabricant, le flux transmet `identifier_exists=no`. Ne pas inventer de code-barres ou de MPN.
- Chaque offre est classée dans la catégorie Google des boissons alcoolisées `499676`, afin que Champagne soit identifié et traité selon les règles adaptées.
- Les prix, disponibilités, liens et images du flux sont vérifiés par `npm run test:site`.
- Après une nouvelle image principale, utiliser une nouvelle URL de fichier pour accélérer son retraitement par Google.
- Conserver les mises à jour automatiques de prix et de disponibilité activées dans Merchant Center, après vérification que la page publique et le flux affichent les mêmes valeurs.

## Contrôle hebdomadaire en période commerciale

- Requêtes de marque et requêtes non-marque dans Search Console.
- Impressions, clics, position moyenne et taux de clic par page.
- Prix visibles dans les résultats Google par rapport au site public.
- Erreurs de données structurées Produit et Marchand.
- Anciennes URL ou sous-domaines techniques encore présents dans les résultats.

## Contrôle mensuel

- Exactitude des fiches Google Business Profile, PagesJaunes, Twil et annuaires touristiques utiles.
- Nouveaux liens provenant de dépositaires, partenaires et organismes locaux reconnus.
- Pages avec beaucoup d’impressions mais peu de clics : retravailler le titre et la description, pas le contenu entier sans preuve.
- Pages sans impression : vérifier l’intention, le maillage interne et l’utilité réelle avant d’en créer une autre.

## Garde-fous

- Ne jamais revendiquer « le moins cher » sans comparaison datée, exhaustive et vérifiable.
- Ne jamais ajouter disponibilité, stock, délai, promotion, avis, note ou code produit non confirmé.
- Ne pas créer plusieurs pages visant la même intention que la boutique.
- Retirer ou rediriger toute ancienne version technique du site.
