INSTALLATION (TRÈS SIMPLE)

1) Ouvrez index.html et boutique.html sur votre ordinateur (double-clic).
2) Pour mettre en ligne :
   - hébergeur classique : envoyez tous les fichiers (index.html, boutique.html, style.css, dossier assets/)
   - ou Netlify / OVH / o2switch : idem.

BRANCHER STRIPE (QUAND VOUS ÊTES PRÊT)
Dans boutique.html, cherchez : const STRIPE_LINKS = { ... }
Collez vos 12 Payment Links Stripe à la place des valeurs "A_REMPLACER".

ASTUCE STRIPE (Payment Links)
Créez 12 liens (Brut/Rosé/Demi-sec x 4 formats).
Prix déjà intégrés dans le site :
- Brut : 9 / 18 / 36 / 120
- Rosé : 11 / 20 / 38 / 132
- Demi-sec : 9 / 18 / 36 / 120

LIVRAISON
France uniquement.
Bouteilles à l’unité : +2,50€ / bouteille (à gérer via "Shipping rates" dans Stripe).
Cartons : livraison offerte (shipping rate gratuit).

LÉGAL
Ajoutez une page mentions légales/CGV si vous voulez (recommandé).



=== PANIER STRIPE (multi-produits) ===
Cette version ajoute un panier (75cl / Magnum / Carton de 6) pour Brut, Rosé, Demi-Sec.

1) Dans Stripe, crée 3 produits (Brut, Rosé, Demi-sec), chacun avec 3 prix :
   - 75 cl
   - Magnum 1,5 L
   - Carton 6 × 75 cl
   Récupère les IDs de prix (price_...)

2) Remplace les placeholders dans le fichier:
   - shop-config.js  (STRIPE_PRICE_IDS)

3) Déploiement Netlify (recommandé):
   - Le dossier /netlify/functions contient la fonction create-checkout-session.
   - Ajoute des variables d'environnement Netlify:
       STRIPE_SECRET_KEY = sk_live_... (ou sk_test_...)
       SUCCESS_URL = https://TON-DOMAINE/merci.html
       CANCEL_URL  = https://TON-DOMAINE/boutique.html

4) Paiement:
   - La boutique appelle /.netlify/functions/create-checkout-session
   - Stripe renvoie une URL de paiement (Checkout) et redirige le client.

NB: Les liens buy.stripe.com ne sont plus nécessaires quand le panier est activé.



=== Price IDs Stripe intégrés ===
Brut: 75cl / Magnum / Carton6 = price_1SuZHH... / price_1SwjyP... / price_1SuZId...
Rosé: 75cl / Magnum / Carton6 = price_1SmXMc... / price_1Smafn... / price_1Smafv...
Demi-sec: 75cl / Magnum / Carton6 = price_1SmXNe... / price_1SmahL... / price_1SmahX...
