/**
 * Impression isolée d'un badge : le contenu est injecté dans le document principal, masqué
 * (`display:none`) sauf pendant l'impression, puis `window.print()` est déclenché sur la fenêtre
 * principale. Évite que le reste de la page (sidebar, colonne de sélection, grille responsive)
 * n'influence la mise en page imprimée — seule la carte/planche clonée est visible à l'impression.
 */
function printInMainDocument(innerHtml: string, extraPrintCss: string) {
  const root = document.createElement("div");
  root.id = "app-print-root";
  root.innerHTML = innerHtml;
  document.body.appendChild(root);

  const style = document.createElement("style");
  style.textContent = `
    @media print {
      body > :not(#app-print-root) { display: none !important; }
      #app-print-root { display: block !important; }
      ${extraPrintCss}
    }
  `;
  document.head.appendChild(style);

  let settled = false;
  function cleanup() {
    if (settled) return;
    settled = true;
    root.remove();
    style.remove();
    window.removeEventListener("afterprint", cleanup);
  }

  function triggerPrint() {
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 10000);
  }

  const images = Array.from(root.querySelectorAll("img"));
  if (images.length === 0) {
    triggerPrint();
    return;
  }
  let remaining = images.length;
  images.forEach((img) => {
    if (img.complete) {
      remaining -= 1;
      return;
    }
    const onSettle = () => {
      remaining -= 1;
      if (remaining <= 0) triggerPrint();
    };
    img.addEventListener("load", onSettle, { once: true });
    img.addEventListener("error", onSettle, { once: true });
  });
  if (remaining <= 0) triggerPrint();
  setTimeout(triggerPrint, 1500);
}

/** Imprime un badge unique (carte CR80 portrait, 54 x 85,6 mm) — format papier libre. */
export function printNode(node: HTMLElement) {
  printInMainDocument(node.outerHTML, "@page { size: auto; margin: 8mm; }");
}

/** Imprime une planche de badges sur A4, sans marge (la grille gère déjà son propre espacement,
 * comme lacaeducation-ui/lib/print-node.ts — demande explicite : papier prédécoupé). */
export function printBadgeSheet(node: HTMLElement) {
  printInMainDocument(node.outerHTML, "@page { size: A4; margin: 0; }");
}
