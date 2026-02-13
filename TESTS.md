# Instructions de test

## Tester en local (NE PAS double-cliquer)
### Option Python
python -m http.server 8000

Puis ouvrir :
http://localhost:8000/index.html
http://localhost:8000/boutique.html

### Option Node
npx serve .

## Vérifications rapides
- Accueil : images Brut/Demi-sec correctes
- Boutique : ajout au panier OK, checkout inchangé
- Nouvelles pages : cuvees / champagne-de-vigneron / cadeaux / evenements accessibles + liens footer
- SEO : robots.txt et sitemap.xml accessibles
