# Changelog — Expérience immersive (UX/DA)

## Objectif
Renforcer la sensation "maison de champagne" : calme, temps long, terroir, désir de découverte.
Sans gadget, sans luxe ostentatoire, en restant rapide et mobile-first.

## Changements majeurs

### 1) Rythme & immersion
- Ajout d'un **Page Hero immersif** sur les pages clés (image plein écran + dégradé + titre).
- Déplacement du **H1** dans le hero pour conserver **1 seul H1/page** et renforcer la hiérarchie.

Pages concernées :
- boutique.html, cuvees.html, maison.html, terroir.html
- champagne-de-vigneron.html, cadeaux.html, evenements.html
- depositaires.html, blog-creation.html, blog-composition.html, blog-actualites.html
- cgv.html, mentions-legales.html, politique-confidentialite.html

### 2) Navigation mobile premium
- Ajout d'un menu **hamburger** (progressif) via JS, sans dépendance externe.
- Overlay menu sobre, accessible (Escape / focus-visible).

### 3) Micro-interactions lentes & maîtrisées
- Ajout d'un système de **reveal on scroll** (IntersectionObserver), respectant `prefers-reduced-motion`.
- Hover et transitions adoucis (CTA, cartes).

### 4) Texture & matière
- Ajout d'une **texture légère** (CSS) pour casser l'effet "plat" sans image lourde.
- Ajustements de contrastes sur images (hero) pour une lecture premium.

### 5) Parcours "visite"
- Ajout sur l’accueil d’une section **Dégustation & visite** (CTA mailto), pour renforcer la projection.

## Fichiers modifiés
- style.css (styles immersifs, hero, navigation mobile, reveal, focus)
- index.html (micro-rythme + section Visite + reveal sur hero)
- + multiples pages HTML : ajout page-hero et déplacement H1
- consent.js : inchangé
- boutique/cart/checkout JS : inchangés (fonctionnel préservé)

## Fichiers ajoutés
- ui.js (navigation mobile + reveal + focus sur ancres)
