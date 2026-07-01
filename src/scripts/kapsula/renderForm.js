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

function renderSectionSummary(section, currentValue, values) {
  if (section.type === "textarea") {
    return `<span class="kapsula-form-section__summary" data-kapsula-section-summary></span>`;
  }

  const selectedLabels = getSelectedOptionLabels(section, currentValue, values);

  return `<span class="kapsula-form-section__summary" data-kapsula-section-summary>${selectedLabels.join(", ")}</span>`;
}

function renderSectionBody(section, currentValue, values) {
  if (section.type === "textarea") {
    return `
      <div class="kapsula-form-section__content">
        ${renderSectionSubtitle(section)}
        <textarea
          class="kapsula-form-textarea"
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
      <div class="kapsula-card-grid kapsula-form-options">
        ${renderOptions(section, currentValue, values)}
      </div>
    </div>
  `;
}

function renderSections(schema, values, expandedState) {
  return schema.sections.map((section, index) => {
    const isExpanded = Boolean(expandedState[section.id]);
    const currentValue = values[section.id];

    return `
      <section class="kapsula-form-section${isExpanded ? " is-expanded" : ""}">
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
          <span class="kapsula-form-section__meta">
            ${renderSectionSummary(section, currentValue, values)}
            <span class="kapsula-form-section__chevron" aria-hidden="true"></span>
          </span>
        </button>
        <div class="kapsula-form-section__panel">
          <div class="kapsula-form-section__panel-inner">
            ${renderSectionBody(section, currentValue, values)}
          </div>
        </div>
      </section>
    `;
  }).join("");
}

export function renderForm(formNode, schema, values, expandedState) {
  formNode.innerHTML = `
    <div class="kapsula-form__sections">
      ${renderSections(schema, values, expandedState)}
    </div>
    <div class="kapsula-form__actions">
      <button class="kapsula-button kapsula-form__submit" type="submit">${schema.submitLabel}</button>
    </div>
  `;
}
