CHAMPAGNE CHRISTELLE PHLIPAUX — EXPLOITATION DU SITE

Développement local

- `npm run dev` lance Netlify Dev et les fonctions locales.
- `npm run check` vérifie JavaScript, HTML, formatage et règles de commerce.

Paiement Stripe

Le site utilise Stripe Checkout hébergé, le parcours le plus simple à maintenir
pour la maison :

1. le panier demande une session via `create-checkout-session` ;
2. le serveur contrôle les produits, montants et frais de livraison ;
3. Stripe collecte les coordonnées, l’adresse de livraison, le paiement et
   affiche le rappel d’acceptation des CGV avant validation ;
4. `stripe-webhook` vérifie la signature Stripe et enregistre chaque commande
   dans le store Netlify Blobs `ccp-orders`, avec la version des CGV.

Variables Netlify nécessaires :

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SITE_URL` avec l’origine publique définitive du site
- `REVIEWS_ADMIN_TOKEN` pour la modération des avis

Avis Google publics

L’affichage des avis Google sur la boutique et la page `avis-clients.html`
passe par une fonction Netlify. La clé reste côté serveur et n’est jamais
envoyée au navigateur.

Variables Netlify à renseigner pour activer cet affichage :

- `GOOGLE_PLACES_API_KEY`, clé serveur autorisée à appeler Places API (New) ;
- `GOOGLE_PLACE_ID`, identifiant Google Places de la maison ;
- `GOOGLE_MAPS_PROFILE_URL`, facultative, pour imposer l’URL publique exacte de
  la fiche Google Maps.

Sans ces variables, le site affiche automatiquement un bouton vers la recherche
Google Maps de la maison, sans note ni avis inventé.

Variable optionnelle :

- `STRIPE_PUBLISHABLE_KEY`, seulement si l’ancien checkout embarqué est
  réactivé.

Événements Stripe à activer sur le webhook :

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Les prix affichés au navigateur sont dans `shop-config.js`. Les montants et les
Price IDs Stripe faisant foi au moment du paiement sont dans
`netlify/functions/checkout-shared.js`. Le test de commerce bloque le build si
les montants divergent ou si un identifiant attendu change.

Avant mise en ligne

- confirmer le domaine public dans `SITE_URL` ;
- effectuer une commande Stripe complète en mode test ;
- confirmer les mentions légales de la société et le médiateur de la
  consommation ;
- contrôler qu’une commande apparaît dans le store `ccp-orders`.
