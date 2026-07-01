import {getVisibleOptions} from "./formConditions.js";

function isSelected(section, currentValue, optionValue) {
  if (section.multiple) {
    return Array.isArray(currentValue) && currentValue.includes(optionValue);
  }

  return currentValue === optionValue;
}

function renderOptions(section, currentValue, values) {
  return getVisibleOptions(section, values).map((option) => `
    <button
      class="kapsula-option-card kapsula-form-option${isSelected(section, currentValue, option.value) ? " is-selected" : ""}"
      type="button"
      data-kapsula-option
      data-section-id="${section.id}"
      data-option-value="${option.value}"
      aria-pressed="${isSelected(section, currentValue, option.value) ? "true" : "false"}"
    >
      <span class="kapsula-option-card__marker" aria-hidden="true"></span>
      <span class="kapsula-option-card__content">
        <span class="kapsula-option-card__title">${option.label}</span>
        ${option.description ? `<span class="kapsula-option-card__text">${option.description}</span>` : ""}
      </span>
    </button>
  `).join("");
}

function createOptionButtonNode(section, option, isOptionSelected) {
  const optionButton = document.createElement("button");
  optionButton.className = `kapsula-option-card kapsula-form-option${isOptionSelected ? " is-selected" : ""}`;
  optionButton.type = "button";
  optionButton.dataset.kapsulaOption = "";
  optionButton.dataset.sectionId = section.id;
  optionButton.dataset.optionValue = option.value;
  optionButton.setAttribute("aria-pressed", isOptionSelected ? "true" : "false");

  optionButton.innerHTML = `
    <span class="kapsula-option-card__marker" aria-hidden="true"></span>
    <span class="kapsula-option-card__content">
      <span class="kapsula-option-card__title">${option.label}</span>
      ${option.description ? `<span class="kapsula-option-card__text">${option.description}</span>` : ""}
    </span>
  `;

  return optionButton;
}

function renderSectionSubtitle(section) {
  if (!section.subtitle) return "";

  return `<p class="kapsula-form-section__subtitle">${section.subtitle}</p>`;
}

function getSelectedOptionLabels(section, currentValue, values) {
  const selectedValues = Array.isArray(currentValue) ? currentValue : [currentValue].filter(Boolean);

  return getVisibleOptions(section, values)
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);
}

function getSectionSummary(section, currentValue, values) {
  if (section.type === "textarea") {
    return "";
  }

  const selectedLabels = getSelectedOptionLabels(section, currentValue, values);

  if (selectedLabels.length > 0) {
    return selectedLabels.join(", ");
  }

  if (Array.isArray(currentValue)) {
    return currentValue.filter(Boolean).join(", ");
  }

  return currentValue ?? "";
}

function renderSectionSummary(section, currentValue, values) {
  const summaryValue = getSectionSummary(section, currentValue, values);

  if (!summaryValue) {
    return "";
  }

  return `<span class="kapsula-form-section__summary" data-kapsula-section-summary>${summaryValue}</span>`;
}

function renderSectionBody(section, currentValue, values) {
  if (section.type === "textarea") {
    return `
      <div class="kapsula-form-section__content">
        ${renderSectionSubtitle(section)}
        <textarea
          class="kapsula-form-textarea"
          id="kapsula-field-${section.id}"
          name="${section.id}"
          data-kapsula-textarea
          data-section-id="${section.id}"
          placeholder="${section.placeholder ?? ""}"
        >${currentValue ?? ""}</textarea>
      </div>
    `;
  }

  return `
    <div class="kapsula-form-section__content">
      ${renderSectionSubtitle(section)}
      <div class="kapsula-card-grid kapsula-form-options" data-kapsula-form-options>
        ${renderOptions(section, currentValue, values)}
      </div>
    </div>
  `;
}

function renderSection(section, currentValue, values, isExpanded, index) {
  return `
    <section
      class="kapsula-form-section${isExpanded ? " is-expanded" : ""}"
      data-kapsula-rendered-section="${section.id}"
    >
      <button
        class="kapsula-form-section__trigger"
        type="button"
        data-kapsula-section-trigger
        data-section-id="${section.id}"
        aria-expanded="${isExpanded ? "true" : "false"}"
      >
        <span class="kapsula-form-section__heading">
          <span class="kapsula-form-section__index">${index + 1}.</span>
          <span class="kapsula-form-section__title">${section.title}</span>
        </span>
        <span class="kapsula-form-section__meta" data-kapsula-section-meta>
          ${renderSectionSummary(section, currentValue, values)}
          <span class="kapsula-form-section__chevron" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="8" viewBox="0 0 13 8" fill="none">
              <path d="M12.4258 6.59961L6.42578 0.599609L0.42578 6.59961" stroke="#262626" stroke-width="1.2" stroke-linejoin="round"/>
            </svg>
          </span>
        </span>
      </button>
      <div class="kapsula-form-section__panel">
        <div class="kapsula-form-section__panel-inner">
          ${renderSectionBody(section, currentValue, values)}
        </div>
      </div>
    </section>
  `;
}

function renderSections(schema, values, expandedState) {
  return schema.sections.map((section, index) => {
    const isExpanded = Boolean(expandedState[section.id]);
    const currentValue = values[section.id];

    return renderSection(section, currentValue, values, isExpanded, index);
  }).join("");
}

function ensureSectionSummary(sectionNode, section, currentValue, values) {
  const metaNode = sectionNode.querySelector("[data-kapsula-section-meta]");

  if (!metaNode) return;

  const summaryValue = getSectionSummary(section, currentValue, values);
  let summaryNode = metaNode.querySelector("[data-kapsula-section-summary]");

  if (!summaryValue) {
    summaryNode?.remove();
    return;
  }

  if (!summaryNode) {
    metaNode.insertAdjacentHTML("afterbegin", renderSectionSummary(section, currentValue, values));
    return;
  }

  if (summaryNode.textContent !== summaryValue) {
    summaryNode.textContent = summaryValue;
  }
}

function syncOptionButtonNode(optionButton, section, option, isOptionSelected) {
  optionButton.dataset.sectionId = section.id;
  optionButton.dataset.optionValue = option.value;
  optionButton.setAttribute("aria-pressed", isOptionSelected ? "true" : "false");
  optionButton.classList.toggle("is-selected", isOptionSelected);
}

function syncOptionsNode(optionsNode, section, currentValue, values) {
  const visibleOptions = getVisibleOptions(section, values);
  const existingOptionButtons = new Map(
    Array.from(optionsNode.querySelectorAll("[data-kapsula-option]"))
      .map((node) => [node.dataset.optionValue, node]),
  );

  visibleOptions.forEach((option) => {
    const isOptionSelected = isSelected(section, currentValue, option.value);
    const existingOptionButton = existingOptionButtons.get(option.value);

    if (existingOptionButton) {
      syncOptionButtonNode(existingOptionButton, section, option, isOptionSelected);
      optionsNode.append(existingOptionButton);
      existingOptionButtons.delete(option.value);
      return;
    }

    optionsNode.append(createOptionButtonNode(section, option, isOptionSelected));
  });

  existingOptionButtons.forEach((node) => {
    node.remove();
  });
}

function syncSectionNode(sectionNode, section, currentValue, values, isExpanded) {
  sectionNode.classList.toggle("is-expanded", isExpanded);

  const triggerNode = sectionNode.querySelector("[data-kapsula-section-trigger]");

  if (triggerNode) {
    triggerNode.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  }

  ensureSectionSummary(sectionNode, section, currentValue, values);

  if (section.type === "textarea") {
    const textareaNode = sectionNode.querySelector("[data-kapsula-textarea]");

    if (textareaNode && textareaNode.value !== (currentValue ?? "")) {
      textareaNode.value = currentValue ?? "";
    }

    return;
  }

  const optionsNode = sectionNode.querySelector("[data-kapsula-form-options]");

  if (optionsNode) {
    syncOptionsNode(optionsNode, section, currentValue, values);
  }
}

function renderFormShell(formNode, schema, values, expandedState) {
  formNode.innerHTML = `
    <div class="kapsula-form__sections" data-kapsula-form-sections>
      ${renderSections(schema, values, expandedState)}
    </div>
    <div class="kapsula-form__actions">
      <button class="kapsula-button kapsula-form__submit" type="submit">${schema.submitLabel}</button>
    </div>
  `;
}

export function renderForm(formNode, schema, values, expandedState, {forceFull = false} = {}) {
  const sectionsNode = formNode.querySelector("[data-kapsula-form-sections]");

  if (forceFull || !sectionsNode) {
    renderFormShell(formNode, schema, values, expandedState);
    return;
  }

  schema.sections.forEach((section) => {
    const currentValue = values[section.id];
    const isExpanded = Boolean(expandedState[section.id]);
    const sectionNode = sectionsNode.querySelector(`[data-kapsula-rendered-section="${section.id}"]`);

    if (!sectionNode) return;

    syncSectionNode(sectionNode, section, currentValue, values, isExpanded);
  });

  const submitButton = formNode.querySelector(".kapsula-form__submit");

  if (submitButton && submitButton.textContent !== schema.submitLabel) {
    submitButton.textContent = schema.submitLabel;
  }
}
