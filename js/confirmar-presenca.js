const editNoticeMessage =
  "Este grupo já confirmou presença anteriormente. Você pode atualizar as respostas se necessário.";
const firstSuccessMessage = "Presença confirmada com sucesso.";
const updateSuccessMessage = "Presença atualizada com sucesso.";
const groupNotFoundMessage =
  "Não encontramos este convite. Você pode pesquisar seu nome abaixo.";
const groupFields = "id, display_name, search_name, is_confirmed, confirmed_at";
const guestFields = "id, group_id, full_name, attendance_status, guest_order, created_at";
const groupWithGuestsFields = `${groupFields}, guests(${guestFields})`;

const state = {
  groups: [],
  selectedGroup: null,
  choices: new Map(),
};

const elements = {
  form: document.querySelector("#search-form"),
  search: document.querySelector("#guest-search"),
  status: document.querySelector("#search-status"),
  results: document.querySelector("#results-list"),
  panel: document.querySelector("#selection-panel"),
  groupName: document.querySelector("#selected-group-name"),
  groupMeta: document.querySelector("#selected-group-meta"),
  changeGroup: document.querySelector("#change-group-button"),
  locked: document.querySelector("#locked-message"),
  guestList: document.querySelector("#guest-list"),
  confirm: document.querySelector("#confirm-button"),
  success: document.querySelector("#success-message"),
  blessingModal: document.querySelector("#blessing-modal"),
  blessingCloseButtons: document.querySelectorAll("[data-blessing-close]"),
};

const supabaseClient = window.pmSupabase;
let attendanceWriteMode = "modern";

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function setStatus(message = "") {
  elements.status.textContent = message;
}

function getDirectGroupId() {
  return new URLSearchParams(window.location.search).get("group")?.trim() || "";
}

function openBlessingModal() {
  if (!elements.blessingModal) {
    return;
  }

  elements.blessingModal.classList.add("is-visible");
  elements.blessingModal.setAttribute("aria-hidden", "false");
}

function closeBlessingModal() {
  if (!elements.blessingModal) {
    return;
  }

  elements.blessingModal.classList.remove("is-visible");
  elements.blessingModal.setAttribute("aria-hidden", "true");
}

function normalizeAttendanceStatus(status) {
  const normalized = normalizeText(status);

  if (normalized === "yes" || normalized === "going" || normalized === "vai") {
    return "yes";
  }

  if (
    normalized === "no" ||
    normalized === "not_going" ||
    normalized === "nao" ||
    normalized === "nao vai"
  ) {
    return "no";
  }

  return "pending";
}

function statusForDatabase(status) {
  if (attendanceWriteMode === "legacy") {
    return status === "yes" ? "going" : "not_going";
  }

  return status;
}

function shouldRetryWithLegacyStatus(error) {
  const text = normalizeText([error?.message, error?.details, error?.hint, error?.code].join(" "));
  return (
    attendanceWriteMode === "modern" &&
    (text.includes("attendance_status") ||
      text.includes("check") ||
      text.includes("constraint") ||
      text.includes("invalid"))
  );
}

function isInvalidGroupIdError(error) {
  const text = normalizeText([error?.message, error?.details, error?.hint, error?.code].join(" "));
  return error?.code === "22P02" || text.includes("invalid input syntax for type uuid");
}

function getGuests(group) {
  return Array.isArray(group.guests)
    ? [...group.guests].sort(
        (a, b) =>
          (Number(a.guest_order) || 0) - (Number(b.guest_order) || 0) ||
          a.full_name.localeCompare(b.full_name, "pt-BR"),
      )
    : [];
}

function buildSearchHaystack(group) {
  const guestNames = getGuests(group)
    .map((guest) => guest.full_name)
    .join(" ");

  return normalizeText([group.display_name, group.search_name, guestNames].join(" "));
}

function formatGroupMeta(group) {
  const total = getGuests(group).length;
  const label = total === 1 ? "1 convidado" : `${total} convidados`;
  return group.is_confirmed ? `${label} · já confirmou antes` : label;
}

function renderResults(groups) {
  elements.results.innerHTML = "";

  if (!elements.search.value.trim()) {
    setStatus("Digite seu nome, sobrenome ou família.");
    return;
  }

  if (!groups.length) {
    setStatus("Nenhum grupo encontrado. Tente outro nome ou sobrenome.");
    return;
  }

  setStatus(`${groups.length} resultado${groups.length === 1 ? "" : "s"} encontrado${groups.length === 1 ? "" : "s"}.`);

  for (const group of groups) {
    const button = document.createElement("button");
    button.className = "result-button";
    button.type = "button";
    button.innerHTML = `
      <span class="result-title">${group.display_name}</span>
      <span class="result-meta">${formatGroupMeta(group)}</span>
    `;
    button.addEventListener("click", () => selectGroup(group.id));
    elements.results.append(button);
  }
}

function searchGroups(term) {
  const normalizedTerm = normalizeText(term);

  if (!normalizedTerm) {
    return [];
  }

  return state.groups.filter((group) => buildSearchHaystack(group).includes(normalizedTerm));
}

function resetSelection() {
  state.selectedGroup = null;
  state.choices.clear();
  elements.panel.classList.remove("is-visible");
  elements.locked.classList.remove("is-visible");
  elements.success.classList.remove("is-visible");
  elements.guestList.innerHTML = "";
  elements.confirm.hidden = false;
  elements.confirm.disabled = false;
}

async function fetchGroupById(groupId) {
  const { data: group, error: groupError } = await supabaseClient
    .from("guest_groups")
    .select(groupFields)
    .eq("id", groupId)
    .maybeSingle();

  if (groupError) {
    throw groupError;
  }

  if (!group) {
    return null;
  }

  const { data: guests, error: guestsError } = await supabaseClient
    .from("guests")
    .select(guestFields)
    .eq("group_id", groupId)
    .order("guest_order", { ascending: true })
    .order("full_name", { ascending: true });

  if (guestsError) {
    throw guestsError;
  }

  return {
    ...group,
    guests: guests || [],
  };
}

function renderSelectedGroup(group) {
  state.selectedGroup = group;
  state.choices.clear();
  elements.results.innerHTML = "";
  elements.panel.classList.add("is-visible");
  elements.success.classList.remove("is-visible");
  elements.groupName.textContent = group.display_name;
  elements.groupMeta.textContent = formatGroupMeta(group);
  elements.confirm.textContent = group.is_confirmed ? "Atualizar presença" : "Confirmar presença";
  elements.confirm.disabled = false;
  elements.confirm.hidden = false;

  if (group.is_confirmed) {
    elements.locked.textContent = editNoticeMessage;
    elements.locked.classList.add("is-visible");
    setStatus("Revise as respostas e atualize se necessário.");
  } else {
    elements.locked.classList.remove("is-visible");
    setStatus("Marque cada convidado antes de confirmar.");
  }

  renderGuests(group);
}

async function selectGroup(groupId) {
  setStatus("Carregando respostas atuais...");

  try {
    const group = await fetchGroupById(groupId);
    if (!group) {
      setStatus(groupNotFoundMessage);
      return;
    }

    state.groups = state.groups.map((item) => (item.id === group.id ? group : item));
    renderSelectedGroup(group);
  } catch (error) {
    console.error(error);
    setStatus("Não foi possível abrir esse grupo agora. Tente novamente.");
  }
}

function renderGuests(group) {
  elements.guestList.innerHTML = "";

  for (const guest of getGuests(group)) {
    const currentStatus = normalizeAttendanceStatus(guest.attendance_status);
    if (currentStatus === "yes" || currentStatus === "no") {
      state.choices.set(guest.id, currentStatus);
    }

    const row = document.createElement("article");
    row.className = "guest-row";
    row.dataset.guestId = guest.id;
    row.innerHTML = `
      <p class="guest-name">${guest.full_name}</p>
      <div class="choice-group" role="group" aria-label="Presença de ${guest.full_name}">
        <button class="choice-button${currentStatus === "yes" ? " is-active" : ""}" type="button" data-status="yes">Vai</button>
        <button class="choice-button${currentStatus === "no" ? " is-active" : ""}" type="button" data-status="no">Não vai</button>
      </div>
    `;

    row.querySelectorAll(".choice-button").forEach((button) => {
      button.addEventListener("click", () => {
        state.choices.set(guest.id, button.dataset.status);
        row.querySelectorAll(".choice-button").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
      });
    });

    elements.guestList.append(row);
  }
}

async function updateGuestAttendance(guestId, status) {
  let { error } = await supabaseClient
    .from("guests")
    .update({ attendance_status: statusForDatabase(status) })
    .eq("id", guestId);

  if (error && shouldRetryWithLegacyStatus(error)) {
    attendanceWriteMode = "legacy";
    const retry = await supabaseClient
      .from("guests")
      .update({ attendance_status: statusForDatabase(status) })
      .eq("id", guestId);
    error = retry.error;
  }

  if (error) {
    throw error;
  }
}

function validateChoices() {
  const guests = getGuests(state.selectedGroup);
  return guests.length > 0 && guests.every((guest) => state.choices.has(guest.id));
}

async function confirmPresence() {
  if (!state.selectedGroup) {
    return;
  }

  if (!validateChoices()) {
    setStatus("Marque Vai ou Não vai para todos os convidados antes de confirmar.");
    return;
  }

  elements.confirm.disabled = true;
  setStatus("Salvando confirmação...");

  try {
    const guests = getGuests(state.selectedGroup);
    const wasConfirmed = state.selectedGroup.is_confirmed;

    for (const guest of guests) {
      await updateGuestAttendance(guest.id, state.choices.get(guest.id));
    }

    const { data, error } = await supabaseClient
      .from("guest_groups")
      .update({
        is_confirmed: true,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", state.selectedGroup.id)
      .select(groupWithGuestsFields)
      .single();

    if (error) {
      throw error;
    }

    state.selectedGroup = data;
    state.groups = state.groups.map((group) => (group.id === data.id ? data : group));
    elements.success.textContent = wasConfirmed ? updateSuccessMessage : firstSuccessMessage;
    elements.success.classList.add("is-visible");
    elements.locked.textContent = editNoticeMessage;
    elements.locked.classList.toggle("is-visible", wasConfirmed);
    elements.confirm.textContent = "Atualizar presença";
    elements.confirm.disabled = false;
    setStatus("");
    openBlessingModal();
  } catch (error) {
    console.error(error);
    elements.confirm.disabled = false;
    setStatus("Não foi possível salvar agora. Confira a conexão e tente novamente.");
  }
}

async function loadGroups({
  loadingMessage = "Carregando lista...",
  successMessage = "Digite seu nome, sobrenome ou família.",
  errorMessage = "Não foi possível carregar a lista. Tente novamente em instantes.",
} = {}) {
  if (loadingMessage) {
    setStatus(loadingMessage);
  }

  try {
    const { data, error } = await supabaseClient
      .from("guest_groups")
      .select(groupWithGuestsFields)
      .order("display_name", { ascending: true });

    if (error) {
      throw error;
    }

    state.groups = data || [];
    if (successMessage) {
      setStatus(successMessage);
    }
  } catch (error) {
    console.error(error);
    if (errorMessage) {
      setStatus(errorMessage);
    }
  }
}

async function openDirectGroup(groupId) {
  setStatus("Carregando convite...");

  try {
    const group = await fetchGroupById(groupId);

    if (!group) {
      await loadGroups({ successMessage: groupNotFoundMessage });
      return;
    }

    renderSelectedGroup(group);
    const directStatus = elements.status.textContent;
    state.groups = [group, ...state.groups.filter((item) => item.id !== group.id)];
    await loadGroups({
      loadingMessage: "",
      successMessage: "",
      errorMessage: "",
    });
    state.groups = state.groups.map((item) => (item.id === group.id ? group : item));
    if (state.selectedGroup?.id === group.id) {
      setStatus(directStatus);
    }
  } catch (error) {
    const hasInvalidGroupId = isInvalidGroupIdError(error);
    if (!hasInvalidGroupId) {
      console.error(error);
    }

    const successMessage = hasInvalidGroupId
      ? groupNotFoundMessage
      : "Não foi possível abrir este convite agora. Você pode pesquisar seu nome abaixo.";

    await loadGroups({
      successMessage,
    });
  }
}

async function initializePage() {
  const directGroupId = getDirectGroupId();

  if (directGroupId) {
    await openDirectGroup(directGroupId);
    return;
  }

  await loadGroups();
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderResults(searchGroups(elements.search.value));
});

elements.search.addEventListener("input", () => {
  resetSelection();
  renderResults(searchGroups(elements.search.value));
});

elements.changeGroup.addEventListener("click", () => {
  resetSelection();
  renderResults(searchGroups(elements.search.value));
  elements.search.focus();
});

elements.confirm.addEventListener("click", confirmPresence);

elements.blessingCloseButtons.forEach((button) => {
  button.addEventListener("click", closeBlessingModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeBlessingModal();
  }
});

initializePage();
