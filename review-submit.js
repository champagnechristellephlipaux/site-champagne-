(function () {
  const ENDPOINT = "/.netlify/functions/submit-review";

  function formToPayload(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function setStatus(form, message, tone = "neutral") {
    const status = form.querySelector("[data-review-form-status]");
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
    status.dataset.tone = tone;
  }

  async function submitReview(event) {
    const form = event.currentTarget;
    event.preventDefault();

    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    setStatus(form, "Envoi de votre avis en cours…");

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formToPayload(form)),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const details = Array.isArray(data.details)
          ? ` ${data.details.join(" ")}`
          : "";
        throw new Error(
          `${data.error || "Votre avis n’a pas pu être envoyé."}${details}`,
        );
      }

      form.reset();
      setStatus(
        form,
        data.message ||
          "Merci. Votre avis a bien été reçu et sera relu avant publication.",
        "success",
      );
    } catch (error) {
      setStatus(
        form,
        error.message ||
          "L’envoi n’a pas abouti. Vous pouvez réessayer dans quelques instants.",
        "error",
      );
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }

  function initReviewForms() {
    document.querySelectorAll("[data-review-form]").forEach((form) => {
      form.addEventListener("submit", submitReview);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReviewForms);
  } else {
    initReviewForms();
  }
})();
