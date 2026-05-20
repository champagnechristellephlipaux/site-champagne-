(function () {
  const RECOMMENDATIONS = {
    brut: {
      name: "Brut Tradition",
      badge: "Signature de maison",
      href: "brut-tradition.html",
      shopHref: "boutique.html#brut",
      fallbackOffer: "magnum-reception",
      baseReason:
        "Le choix le plus lisible pour recevoir, ouvrir l’apéritif et tenir la table avec élégance.",
    },
    rose: {
      name: "Brut Rosé",
      badge: "Offrir &amp; célébrer",
      href: "brut-rose.html",
      shopHref: "boutique.html#rose",
      fallbackOffer: "rose-a-offrir",
      baseReason:
        "La cuvée la plus lumineuse pour offrir, célébrer ou apporter une note fruitée à table.",
    },
    demisec: {
      name: "Demi-Sec",
      badge: "Accords gourmands",
      href: "demi-sec.html",
      shopHref: "boutique.html#demisec",
      fallbackOffer: "douceur-gourmande",
      baseReason:
        "La cuvée la plus juste pour le dessert, le foie gras et les accords plus gourmands.",
    },
  };

  function computeRecommendation(state) {
    const scores = { brut: 0, rose: 0, demisec: 0 };

    if (state.occasion === "aperitif") scores.brut += 3;
    if (state.occasion === "cadeau") scores.rose += 3;
    if (state.occasion === "dessert") scores.demisec += 3;
    if (state.occasion === "reception") {
      scores.brut += 2;
      scores.rose += 1;
    }

    if (state.style === "frais") scores.brut += 2;
    if (state.style === "lumineux") scores.rose += 2;
    if (state.style === "gourmand") scores.demisec += 2;

    if (state.format === "magnum") scores.brut += 1;
    if (state.format === "selection") {
      scores.brut += 1;
      scores.rose += 1;
      scores.demisec += 1;
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const winner = sorted[0][0];
    const config = RECOMMENDATIONS[winner];

    let offerId = config.fallbackOffer;
    let offerLabel = "Choisir cette sélection";

    if (state.format === "selection" && state.occasion === "reception") {
      offerId = "table-de-fete";
    } else if (state.format === "selection") {
      offerId = "trio-decouverte";
    } else if (state.format === "magnum" && winner === "brut") {
      offerId = "magnum-reception";
    } else if (winner === "rose") {
      offerId = "rose-a-offrir";
      offerLabel = "Choisir cette cuvée";
    } else if (winner === "demisec") {
      offerId = "douceur-gourmande";
      offerLabel = "Choisir cette cuvée";
    }

    const reasons = [];
    if (state.occasion === "aperitif")
      reasons.push(
        "Vous cherchez un champagne qui ouvre le repas avec assurance.",
      );
    if (state.occasion === "cadeau")
      reasons.push("Vous cherchez une attention délicate, facile à situer.");
    if (state.occasion === "dessert")
      reasons.push(
        "Vous voulez une cuvée qui trouve sa place au moment gourmand.",
      );
    if (state.occasion === "reception")
      reasons.push(
        "Vous privilégiez une cuvée lisible pour plusieurs convives.",
      );

    if (state.style === "frais")
      reasons.push("Vous aimez les profils nets, droits et précis.");
    if (state.style === "lumineux")
      reasons.push(
        "Vous cherchez plus de fruit, d’éclat et d’énergie dans le verre.",
      );
    if (state.style === "gourmand")
      reasons.push("Vous aimez les cuvées plus rondes et plus enveloppantes.");

    if (state.format === "magnum")
      reasons.push("Le format réception compte dans votre décision.");
    if (state.format === "selection")
      reasons.push("Vous préférez une sélection déjà construite.");

    return {
      ...config,
      offerId,
      offerLabel,
      reasons,
    };
  }

  function renderResult(root, recommendation) {
    const target = root.querySelector("[data-choice-result]");
    if (!target) return;

    if (!recommendation) {
      target.innerHTML = `
        <div class="choice-result-card is-placeholder">
          <div class="badge">Conseil de maison</div>
          <strong>Indiquez le moment, le style et le format : la cuvée conseillée apparaîtra ici.</strong>
          <p>Vous pourrez ensuite lire la fiche ou choisir la sélection correspondante.</p>
        </div>
      `;
      return;
    }

    target.innerHTML = `
      <div class="choice-result-card">
        <div class="choice-result-top">
          <div>
            <div class="badge">${recommendation.badge}</div>
            <div class="h3">${recommendation.name}</div>
          </div>
          <div class="choice-result-mark">Conseil de maison</div>
        </div>
        <p class="choice-result-copy">${recommendation.baseReason}</p>
        <div class="choice-reason-list">
          ${recommendation.reasons.map((reason) => `<span>${reason}</span>`).join("")}
        </div>
        <div class="offer-actions" style="margin-top:10px;">
          <a class="btn primary" href="${recommendation.href}">Lire la fiche</a>
          <button class="btn" data-offer-add="${recommendation.offerId}" type="button">${recommendation.offerLabel}</button>
          <a class="btn" href="${recommendation.shopHref}">Choisir en boutique</a>
        </div>
      </div>
    `;
  }

  function evaluate(root) {
    const selected = {};
    root.querySelectorAll("[data-choice-group]").forEach((group) => {
      const name = group.getAttribute("data-choice-group");
      const active = group.querySelector(".is-active[data-choice-value]");
      if (active) selected[name] = active.getAttribute("data-choice-value");
    });

    const complete = ["occasion", "style", "format"].every(
      (key) => selected[key],
    );
    renderResult(root, complete ? computeRecommendation(selected) : null);
  }

  function bindRoot(root) {
    root.addEventListener("click", (event) => {
      const button = event.target.closest?.("[data-choice-value]");
      if (!button) return;

      const group = button.closest("[data-choice-group]");
      if (!group) return;

      group
        .querySelectorAll("[data-choice-value]")
        .forEach((node) => node.classList.remove("is-active"));
      button.classList.add("is-active");
      evaluate(root);
    });

    evaluate(root);
  }

  function init() {
    document.querySelectorAll("[data-choice-assistant]").forEach(bindRoot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
