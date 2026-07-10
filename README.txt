CHAMPAGNE CHRISTELLE PHLIPAUX — EXPLOITATION DU SITE

Développement local

- `npm run dev` lance Netlify Dev et les fonctions locales.
- `npm run check` vérifie JavaScript, HTML, formatage et règles de commerce.

Paiement Stripe

Le site utilise un seul parcours :

1. le panier ouvre `checkout.html` ;
2. `create-checkout-elements-session` contrôle les produits, montants et frais
   de livraison côté serveur ;
3. `record-checkout-consent` enregistre l’acceptation des CGV avant paiement ;
4. `stripe-webhook` vérifie la signature Stripe et enregistre chaque commande
   dans le store Netlify Blobs `ccp-orders`.

Variables Netlify nécessaires :

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SITE_URL` avec l’origine publique définitive du site
- `REVIEWS_ADMIN_TOKEN` pour la modération des avis

Événements Stripe à activer sur le webhook :

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Les prix affichés au navigateur sont dans `shop-config.js`. Les prix et
identifiants Stripe faisant foi sont dans
`netlify/functions/checkout-shared.js`. Le test de commerce bloque le build si
les montants divergent.

Avant mise en ligne

- confirmer le domaine public dans `SITE_URL` ;
- effectuer une commande Stripe complète en mode test ;
- confirmer les mentions légales de la société et le médiateur de la
  consommation ;
- contrôler qu’une commande apparaît dans le store `ccp-orders`.
