// Dados do Pix. Para alterar depois, troque apenas estes valores.
const PIX_QR_CODE_IMAGE = "";
const PIX_KEY = "";
const PIX_OWNER = "Miguel e Letícia";
const PIX_BANK = "";

const ajudaElements = {
  pixModal: document.querySelector("#pix-modal"),
  giftModal: document.querySelector("#gift-modal"),
  openPixButtons: document.querySelectorAll("[data-open-pix]"),
  closePixButtons: document.querySelectorAll("[data-close-modal]"),
  closeGiftButtons: document.querySelectorAll("[data-close-gift-modal]"),
  qrImage: document.querySelector("#pix-qr-image"),
  qrFrame: document.querySelector(".qr-frame"),
  pixKey: document.querySelector("#pix-key"),
  copyPix: document.querySelector("#copy-pix-button"),
  copyFeedback: document.querySelector("#copy-feedback"),
  giftGrid: document.querySelector("#gift-grid"),
  funGiftsTrack: document.querySelector("#fun-gifts-track"),
  funPrev: document.querySelector("[data-fun-prev]"),
  funNext: document.querySelector("[data-fun-next]"),
  giftModalTitle: document.querySelector("#gift-modal-title"),
  giftModalCopy: document.querySelector("#gift-modal-copy"),
  confirmGift: document.querySelector("#confirm-gift-button"),
};

const giftState = {
  selectedGift: null,
};

function openModal(modal) {
  if (!modal) {
    return;
  }

  modal.classList.add("is-visible");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  if (!modal) {
    return;
  }

  modal.classList.remove("is-visible");
  modal.setAttribute("aria-hidden", "true");
}

function openPixModal() {
  openModal(ajudaElements.pixModal);
}

function closePixModal() {
  closeModal(ajudaElements.pixModal);
}

function closeGiftModal() {
  closeModal(ajudaElements.giftModal);
}

async function copyPixKey() {
  if (!PIX_KEY) {
    ajudaElements.copyFeedback.textContent = "A chave Pix ainda será informada.";
    return;
  }

  try {
    await navigator.clipboard.writeText(PIX_KEY);
    ajudaElements.copyFeedback.textContent = "Chave copiada.";
  } catch (error) {
    console.error(error);
    ajudaElements.copyFeedback.textContent =
      "Não foi possível copiar automaticamente. Selecione a chave acima.";
  }
}

function setupPix() {
  ajudaElements.pixKey.textContent = PIX_KEY ? `Pix - ${PIX_KEY}` : "Pix será informado em breve.";

  const pixDetails = document.querySelector("#pix-details");
  if (pixDetails) {
    pixDetails.innerHTML = PIX_KEY
      ? `
        <span>${PIX_OWNER}</span>
        <span>${PIX_BANK}</span>
      `
      : "<span>Chave e QR Code ainda não cadastrados.</span>";
  }

  if (PIX_QR_CODE_IMAGE) {
    ajudaElements.qrImage.src = PIX_QR_CODE_IMAGE;
  } else {
    ajudaElements.qrFrame.classList.add("is-placeholder");
    ajudaElements.qrImage.removeAttribute("src");
  }

  ajudaElements.qrImage.addEventListener("error", () => {
    ajudaElements.qrFrame.classList.add("is-placeholder");
  });

  ajudaElements.openPixButtons.forEach((button) => {
    button.addEventListener("click", openPixModal);
  });

  ajudaElements.closePixButtons.forEach((button) => {
    button.addEventListener("click", closePixModal);
  });

  ajudaElements.copyPix.disabled = !PIX_KEY;
  ajudaElements.copyPix.addEventListener("click", copyPixKey);
}


function getGiftButtonText(gift) {
  return gift.buttonText || `Doar ${String(gift.name || "item").toLowerCase()}`;
}

function openGiftModal(gift) {
  giftState.selectedGift = gift;
  ajudaElements.giftModalTitle.innerHTML = `
    <span>Doe</span>
    <span>${gift.name}</span>
  `;
  ajudaElements.giftModalCopy.textContent =
    "Ao confirmar, você será redirecionado para o WhatsApp de Miguel e Letícia para combinar e confirmar sua doação com segurança.";
  openModal(ajudaElements.giftModal);
}

function buildWhatsappUrl(gift) {
  const phone = window.pmWhatsappPhone || "";
  const label = gift?.price ? `${gift?.name || "um item"} (${gift.price})` : gift?.name || "um item";
  const message = gift?.whatsappMessage || `Oi Miguel e Letícia, quero doar "${label}" para vocês! Como podemos te enviar?`;
  const encodedMessage = encodeURIComponent(message);
  return phone ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://api.whatsapp.com/send?text=${encodedMessage}`;
}

function confirmGiftDonation() {
  if (!giftState.selectedGift) {
    return;
  }

  window.open(buildWhatsappUrl(giftState.selectedGift), "_blank", "noopener,noreferrer");
  closeGiftModal();
}

function renderGifts() {
  const gifts = Array.isArray(window.pmPresentes) ? window.pmPresentes : [];
  if (!ajudaElements.giftGrid) {
    return;
  }

  ajudaElements.giftGrid.innerHTML = "";

  for (const gift of gifts) {
    const card = document.createElement("article");
    card.className = "gift-card";
    card.innerHTML = `
      <button class="gift-media" type="button" aria-label="Doar ${gift.name}">
        <img src="${gift.image}" alt="${gift.name}" />
        <span class="gift-placeholder">${gift.name}<br />adicione a imagem depois</span>
      </button>
      <h3>${gift.name}</h3>
      <button class="gift-action" type="button">${getGiftButtonText(gift)}</button>
    `;

    const media = card.querySelector(".gift-media");
    const image = card.querySelector("img");
    const action = card.querySelector(".gift-action");

    image.addEventListener("error", () => {
      media.classList.add("is-placeholder");
    });

    media.addEventListener("click", () => openGiftModal(gift));
    action.addEventListener("click", () => openGiftModal(gift));

    ajudaElements.giftGrid.append(card);
  }
}

function renderFunGifts() {
  const funGifts = Array.isArray(window.pmCotasDivertidas) ? window.pmCotasDivertidas : [];

  if (!ajudaElements.funGiftsTrack) {
    return;
  }

  ajudaElements.funGiftsTrack.innerHTML = "";

  for (const gift of funGifts) {
    const card = document.createElement("article");
    card.className = "fun-card";
    card.dataset.funGift = String(gift.name || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (card.dataset.funGift === "despertador-para-a-noiva") {
      card.classList.add("is-alarm-card");
    }

    const hasImage = Boolean(gift.image);
    card.innerHTML = `
      <button class="fun-card__media${hasImage ? "" : " is-placeholder"}" type="button" aria-label="Presentear ${gift.name}">
        ${hasImage ? `<img src="${gift.image}" alt="${gift.name}" />` : `<span>imagem em breve</span>`}
      </button>
      <div class="fun-card__body">
        <h3>${gift.name}</h3>
        <strong>${gift.price || ""}</strong>
        <button class="fun-card__action" type="button">${gift.buttonText || "Presentear"}</button>
      </div>
    `;

    const media = card.querySelector(".fun-card__media");
    const image = card.querySelector("img");
    const action = card.querySelector(".fun-card__action");

    if (image) {
      image.addEventListener("error", () => {
        media.classList.add("is-placeholder");
        media.innerHTML = "<span>imagem em breve</span>";
      });
    }

    media.addEventListener("click", () => openGiftModal(gift));
    action.addEventListener("click", () => openGiftModal(gift));

    ajudaElements.funGiftsTrack.append(card);
  }
}

function setupFunCarousel() {
  if (!ajudaElements.funGiftsTrack) {
    return;
  }

  const scrollByCard = (direction) => {
    const card = ajudaElements.funGiftsTrack.querySelector(".fun-card");
    const distance = card ? card.getBoundingClientRect().width + 16 : 260;
    ajudaElements.funGiftsTrack.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  ajudaElements.funPrev?.addEventListener("click", () => scrollByCard(-1));
  ajudaElements.funNext?.addEventListener("click", () => scrollByCard(1));
}

function setupGiftModal() {
  ajudaElements.closeGiftButtons.forEach((button) => {
    button.addEventListener("click", closeGiftModal);
  });

  ajudaElements.confirmGift.addEventListener("click", confirmGiftDonation);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePixModal();
    closeGiftModal();
  }
});

setupPix();
setupGiftModal();
setupFunCarousel();
renderFunGifts();
renderGifts();
