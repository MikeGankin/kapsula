import {getVisibleOptions} from "./formConditions.js";
import {sanitizeRichText} from "./sanitizeRichText.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

/**
 * `text` подставляется как есть через `textContent` — это безопасный путь
 * по умолчанию. `richText` предназначен для строк из `formConfig.json`,
 * где разрешены `<br>` и HTML-сущности: их разбирает `sanitizeRichText`,
 * возвращая готовые узлы. `innerHTML` не используется нигде.
 */
function createNode(tagName, {
  attributes = {},
  children = [],
  className = "",
  dataset = {},
  richText,
  text,
} = {}) {
  const node = document.createElement(tagName);

  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  if (richText !== undefined) node.append(...sanitizeRichText(richText));

  Object.entries(attributes).forEach(([name, value]) => {
    if (value !== null && value !== undefined && value !== false) {
      node.setAttribute(name, value === true ? "" : String(value));
    }
  });
  Object.assign(node.dataset, dataset);
  node.append(...children.filter(Boolean));

  return node;
}

function isSelected(section, currentValue, optionValue) {
  if (section.multiple) {
    return Array.isArray(currentValue) && currentValue.includes(optionValue);
  }

  return currentValue === optionValue;
}

function getOptionInputType(section) {
  return section.multiple ? "checkbox" : "radio";
}

function createOptionNode(section, option, selected) {
  const inputNode = createNode("input", {
    className: "kapsula-form-option__input",
    attributes: {
      type: getOptionInputType(section),
      name: section.id,
      value: option.value,
    },
    dataset: {
      kapsulaChoice: "",
      sectionId: section.id,
    },
  });
  inputNode.checked = selected;

  const contentNode = createNode("span", {
    className: "kapsula-option-card__content",
    children: [
      createNode("span", {
        className: "kapsula-option-card__title",
        text: option.label,
      }),
      option.description
        ? createNode("span", {
          className: "kapsula-option-card__text",
          text: option.description,
        })
        : null,
    ],
  });

  return createNode("label", {
    className: `kapsula-option-card kapsula-form-option${selected ? " is-selected" : ""}`,
    dataset: {
      kapsulaOption: "",
      sectionId: section.id,
      optionValue: option.value,
    },
    children: [
      inputNode,
      createNode("span", {
        className: "kapsula-option-card__marker",
        attributes: {"aria-hidden": "true"},
      }),
      contentNode,
    ],
  });
}

function createSectionSubtitle(section) {
  if (!section.subtitle) return null;

  // Единственное поле конфига, где контент-менеджеру нужны переносы
  // и неразрывные пробелы, — остальные тексты идут обычным `text`.
  return createNode("p", {
    className: "kapsula-form-section__subtitle",
    attributes: {id: `kapsula-section-subtitle-${section.id}`},
    richText: section.subtitle,
  });
}

function getSelectedOptionLabels(section, currentValue, values) {
  const selectedValues = Array.isArray(currentValue)
    ? currentValue
    : [currentValue].filter(Boolean);

  return getVisibleOptions(section, values)
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);
}

function getSectionSummary(section, currentValue, values) {
  if (section.type === "textarea") return "";

  const selectedLabels = getSelectedOptionLabels(section, currentValue, values);

  if (selectedLabels.length > 0) return selectedLabels.join(", ");
  if (Array.isArray(currentValue)) return currentValue.filter(Boolean).join(", ");
  return currentValue ?? "";
}

function createSectionSummary(summaryValue) {
  if (!summaryValue) return null;

  return createNode("span", {
    className: "kapsula-form-section__summary",
    dataset: {kapsulaSectionSummary: ""},
    text: summaryValue,
  });
}

/**
 * Отдельный узел под сообщение об ошибке.
 *
 * Раньше ошибка и summary делили один элемент: ре-рендер стирал ошибку,
 * а исправление ошибки не возвращало summary до следующего изменения значений.
 */
function createSectionError() {
  return createNode("span", {
    className: "kapsula-form-section__error",
    dataset: {kapsulaSectionError: ""},
    attributes: {role: "alert", hidden: true},
  });
}

function setSectionError(sectionNode, message = "") {
  const metaNode = sectionNode?.querySelector("[data-kapsula-section-meta]");
  if (!metaNode) return;

  let errorNode = metaNode.querySelector("[data-kapsula-section-error]");

  if (!message) {
    errorNode?.setAttribute("hidden", "");
    if (errorNode) errorNode.textContent = "";
    return;
  }

  if (!errorNode) {
    errorNode = createSectionError();
    metaNode.append(errorNode);
  }

  if (errorNode.textContent !== message) {
    errorNode.textContent = message;
  }

  errorNode.removeAttribute("hidden");
}

function createChevronNode() {
  const pathNode = document.createElementNS(SVG_NAMESPACE, "path");
  pathNode.setAttribute("d", "M12.4258 6.59961L6.42578 0.599609L0.42578 6.59961");
  pathNode.setAttribute("stroke", "#262626");
  pathNode.setAttribute("stroke-width", "1.2");
  pathNode.setAttribute("stroke-linejoin", "round");

  const svgNode = document.createElementNS(SVG_NAMESPACE, "svg");
  svgNode.setAttribute("width", "13");
  svgNode.setAttribute("height", "8");
  svgNode.setAttribute("viewBox", "0 0 13 8");
  svgNode.setAttribute("fill", "none");
  svgNode.append(pathNode);

  return createNode("span", {
    className: "kapsula-form-section__chevron",
    attributes: {"aria-hidden": "true"},
    children: [svgNode],
  });
}

function createTextareaContent(section, currentValue) {
  const textareaId = `kapsula-field-${section.id}`;
  const subtitleId = section.subtitle ? `kapsula-section-subtitle-${section.id}` : null;
  const textareaNode = createNode("textarea", {
    className: "kapsula-form-textarea",
    attributes: {
      id: textareaId,
      name: section.id,
      placeholder: section.placeholder ?? "",
      "aria-describedby": subtitleId,
    },
    dataset: {
      kapsulaTextarea: "",
      sectionId: section.id,
    },
  });
  textareaNode.value = currentValue ?? "";

  return createNode("div", {
    className: "kapsula-form-section__content",
    children: [
      createSectionSubtitle(section),
      createNode("label", {
        className: "kapsula-form-section__label sr-only",
        attributes: {for: textareaId},
        text: section.title,
      }),
      textareaNode,
    ],
  });
}

function createOptionsContent(section, currentValue, values) {
  const optionsNode = createNode("div", {
    className: "kapsula-card-grid kapsula-form-options",
    dataset: {kapsulaFormOptions: ""},
  });

  getVisibleOptions(section, values).forEach((option) => {
    optionsNode.append(createOptionNode(
      section,
      option,
      isSelected(section, currentValue, option.value),
    ));
  });

  return createNode("fieldset", {
    className: "kapsula-form-section__content kapsula-form-section__fieldset",
    children: [
      createNode("legend", {
        className: "kapsula-form-section__legend",
        text: section.title,
      }),
      createSectionSubtitle(section),
      optionsNode,
    ],
  });
}

function createSectionNode(section, currentValue, values, isExpanded, index) {
  const triggerId = `kapsula-section-trigger-${section.id}`;
  const panelId = `kapsula-section-panel-${section.id}`;
  const summaryValue = getSectionSummary(section, currentValue, values);

  const triggerNode = createNode("button", {
    className: "kapsula-form-section__trigger",
    attributes: {
      id: triggerId,
      type: "button",
      "aria-expanded": String(isExpanded),
      "aria-controls": panelId,
    },
    dataset: {
      kapsulaSectionTrigger: "",
      sectionId: section.id,
    },
    children: [
      createNode("span", {
        className: "kapsula-form-section__heading",
        children: [
          createNode("span", {
            className: "kapsula-form-section__index",
            text: `${index + 1}.`,
          }),
          createNode("span", {
            className: "kapsula-form-section__title",
            text: section.title,
          }),
          section.required
            ? createNode("span", {
              className: "kapsula-form-section__required-marker",
              attributes: {"aria-hidden": "true"},
              text: "*",
            })
            : null,
        ],
      }),
      createNode("span", {
        className: "kapsula-form-section__meta",
        dataset: {kapsulaSectionMeta: ""},
        children: [
          createSectionSummary(summaryValue),
          createChevronNode(),
          createSectionError(),
        ],
      }),
    ],
  });

  const contentNode = section.type === "textarea"
    ? createTextareaContent(section, currentValue)
    : createOptionsContent(section, currentValue, values);

  const panelNode = createNode("div", {
    className: "kapsula-form-section__panel",
    attributes: {
      id: panelId,
      role: "region",
      "aria-labelledby": triggerId,
    },
    children: [
      createNode("div", {
        className: "kapsula-form-section__panel-inner",
        children: [contentNode],
      }),
    ],
  });

  return createNode("section", {
    className: `kapsula-form-section${isExpanded ? " is-expanded" : ""}`,
    dataset: {kapsulaRenderedSection: section.id},
    children: [triggerNode, panelNode],
  });
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
    summaryNode = createSectionSummary(summaryValue);
    metaNode.prepend(summaryNode);
    return;
  }

  if (summaryNode.textContent !== summaryValue) {
    summaryNode.textContent = summaryValue;
  }
}

export function renderFormValidationErrors(formNode, schema, issues = []) {
  const invalidSectionIds = new Set(
    issues
      .map((issue) => issue.path?.[0])
      .filter((sectionId) => typeof sectionId === "string"),
  );

  schema.sections.forEach((section) => {
    const sectionNode = formNode.querySelector(`[data-kapsula-rendered-section="${section.id}"]`);

    if (!sectionNode) return;

    setSectionError(
      sectionNode,
      invalidSectionIds.has(section.id)
        ? `Заполните раздел «${section.title}» — без него мы не сможем сформировать капсулу.`
        : "",
    );
  });
}

function syncOptionNode(optionNode, section, option, selected) {
  optionNode.dataset.sectionId = section.id;
  optionNode.dataset.optionValue = option.value;
  optionNode.classList.toggle("is-selected", selected);

  const inputNode = optionNode.querySelector("[data-kapsula-choice]");
  if (!(inputNode instanceof HTMLInputElement)) return;

  inputNode.name = section.id;
  inputNode.value = option.value;
  inputNode.checked = selected;
}

function syncOptionsNode(optionsNode, section, currentValue, values) {
  const existingOptions = new Map(
    Array.from(optionsNode.querySelectorAll("[data-kapsula-option]"))
      .map((node) => [node.dataset.optionValue, node]),
  );

  // `append` существующего узла — это всегда перемещение в DOM: лишний reflow,
  // потеря фокуса и сброс CSS-переходов. Поэтому вставляем узел только там,
  // где порядок действительно разошёлся с нужным.
  getVisibleOptions(section, values).forEach((option, index) => {
    const selected = isSelected(section, currentValue, option.value);
    const optionNode = existingOptions.get(option.value)
      ?? createOptionNode(section, option, selected);

    syncOptionNode(optionNode, section, option, selected);

    if (optionsNode.children[index] !== optionNode) {
      optionsNode.insertBefore(optionNode, optionsNode.children[index] ?? null);
    }

    existingOptions.delete(option.value);
  });

  existingOptions.forEach((node) => node.remove());
}

function syncSectionNode(sectionNode, section, currentValue, values, isExpanded) {
  sectionNode.classList.toggle("is-expanded", isExpanded);
  sectionNode.querySelector("[data-kapsula-section-trigger]")
    ?.setAttribute("aria-expanded", String(isExpanded));
  ensureSectionSummary(sectionNode, section, currentValue, values);

  if (section.type === "textarea") {
    const textareaNode = sectionNode.querySelector("[data-kapsula-textarea]");

    if (textareaNode instanceof HTMLTextAreaElement && textareaNode.value !== (currentValue ?? "")) {
      textareaNode.value = currentValue ?? "";
    }
    return;
  }

  const optionsNode = sectionNode.querySelector("[data-kapsula-form-options]");
  if (optionsNode) syncOptionsNode(optionsNode, section, currentValue, values);
}

function renderFormShell(formNode, schema, values, expandedState) {
  const sectionsNode = createNode("div", {
    className: "kapsula-form__sections",
    dataset: {kapsulaFormSections: ""},
  });
  const fragment = document.createDocumentFragment();

  schema.sections.forEach((section, index) => {
    fragment.append(createSectionNode(
      section,
      values[section.id],
      values,
      Boolean(expandedState[section.id]),
      index,
    ));
  });

  sectionsNode.append(fragment);
  formNode.replaceChildren(sectionsNode);
}

export function renderForm(formNode, schema, values, expandedState, {forceFull = false} = {}) {
  const sectionsNode = formNode.querySelector("[data-kapsula-form-sections]");

  if (forceFull || !sectionsNode) {
    renderFormShell(formNode, schema, values, expandedState);
    return;
  }

  const sectionNodes = new Map(
    Array.from(sectionsNode.children)
      .map((node) => [node.dataset.kapsulaRenderedSection, node]),
  );

  schema.sections.forEach((section) => {
    const sectionNode = sectionNodes.get(section.id);
    if (!sectionNode) return;

    syncSectionNode(
      sectionNode,
      section,
      values[section.id],
      values,
      Boolean(expandedState[section.id]),
    );
  });
}
