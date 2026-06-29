import {BehaviorSubject, combineLatest, distinctUntilChanged, fromEvent, map} from "rxjs";
import {z} from "zod";
import formConfig from "./formConfig.json";

function buildCountryMap(config) {
  return new Map(config.countries.map((country) => [country.id, country]));
}

function getSchema(countryMap, countryId, capsuleId) {
  const country = countryMap.get(countryId);
  const capsule = country?.capsules?.[capsuleId];

  if (!country || !capsule) {
    throw new Error(`Missing form schema for country "${countryId}" and capsule "${capsuleId}"`);
  }

  return {country, capsule};
}

function buildInitialValues(sections, currentValues = {}) {
  return sections.reduce((accumulator, section) => {
    if (section.type === "textarea") {
      accumulator[section.id] = currentValues[section.id] ?? "";
      return accumulator;
    }

    accumulator[section.id] = currentValues[section.id] ?? (section.multiple ? [] : "");
    return accumulator;
  }, {});
}

function buildExpandedState(sections, currentExpanded = {}) {
  return sections.reduce((accumulator, section, index) => {
    const fallbackExpanded = section.expanded ?? index === 0;
    accumulator[section.id] = currentExpanded[section.id] ?? fallbackExpanded;
    return accumulator;
  }, {});
}

function isSelected(section, currentValue, optionValue) {
  if (section.multiple) {
    return Array.isArray(currentValue) && currentValue.includes(optionValue);
  }

  return currentValue === optionValue;
}

function renderOptions(section, currentValue) {
  return section.options.map((option) => `
    <button
      class="kapsula-form-option${isSelected(section, currentValue, option.value) ? " is-selected" : ""}"
      type="button"
      data-kapsula-option
      data-section-id="${section.id}"
      data-option-value="${option.value}"
      aria-pressed="${isSelected(section, currentValue, option.value) ? "true" : "false"}"
    >
      <span class="kapsula-form-option__marker" aria-hidden="true"></span>
      <span class="kapsula-form-option__label">${option.label}</span>
    </button>
  `).join("");
}

function renderSectionBody(section, currentValue) {
  if (section.type === "textarea") {
    return `
      <div class="kapsula-form-section__content">
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
      <div class="kapsula-form-options">
        ${renderOptions(section, currentValue)}
      </div>
    </div>
  `;
}

function renderSections(schema, values, expandedState) {
  return schema.sections.map((section) => {
    const isExpanded = Boolean(expandedState[section.id]);

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
            <span class="kapsula-form-section__index">${section.index}</span>
            <span class="kapsula-form-section__title">${section.title}</span>
          </span>
          <span class="kapsula-form-section__chevron" aria-hidden="true"></span>
        </button>
        ${isExpanded ? renderSectionBody(section, values[section.id]) : ""}
      </section>
    `;
  }).join("");
}

function renderForm(formNode, schema, values, expandedState) {
  formNode.innerHTML = `
    <div class="kapsula-form__sections">
      ${renderSections(schema, values, expandedState)}
    </div>
    <div class="kapsula-form__actions">
      <button class="kapsula-button kapsula-form__submit" type="submit">${schema.submitLabel}</button>
    </div>
  `;
}

function buildSectionSchema(section) {
  if (section.multiple) {
    const schema = z.array(z.string());
    return section.required ? schema.min(1) : schema;
  }

  if (section.type === "textarea") {
    const schema = z.string().trim();
    return section.required ? schema.min(1) : schema;
  }

  const schema = z.string().trim();
  return section.required ? schema.min(1) : schema;
}

function buildCapsuleSchema(schema) {
  return z.object(
    schema.sections.reduce((shape, section) => {
      shape[section.id] = buildSectionSchema(section);
      return shape;
    }, {}),
  );
}

function validateSchema(schema, values) {
  return buildCapsuleSchema(schema).safeParse(values);
}

function toggleOptionValue(section, currentValue, optionValue) {
  if (section.multiple) {
    const nextValue = Array.isArray(currentValue) ? [...currentValue] : [];
    const existingIndex = nextValue.indexOf(optionValue);

    if (existingIndex >= 0) {
      nextValue.splice(existingIndex, 1);
      return nextValue;
    }

    nextValue.push(optionValue);
    return nextValue;
  }

  return currentValue === optionValue ? "" : optionValue;
}

export function createReactiveForm(rootNode) {
  const titleNode = rootNode.querySelector("[data-kapsula-form-title]");
  const subtitleNode = rootNode.querySelector("[data-kapsula-form-subtitle]");
  const imageNode = rootNode.querySelector("[data-kapsula-form-image]");
  const formNode = rootNode.querySelector("[data-kapsula-form]");

  if (!titleNode || !subtitleNode || !imageNode || !formNode) {
    throw new Error("Kapsula form screen is missing required nodes");
  }

  const countryMap = buildCountryMap(formConfig);
  const selectedCountry$ = new BehaviorSubject(formConfig.defaultCountry);
  const selectedCapsule$ = new BehaviorSubject(formConfig.defaultCapsule);
  const values$ = new BehaviorSubject({});
  const expandedState$ = new BehaviorSubject({});

  const schema$ = combineLatest([selectedCountry$, selectedCapsule$]).pipe(
    map(([countryId, capsuleId]) => getSchema(countryMap, countryId, capsuleId)),
  );

  const validity$ = combineLatest([schema$, values$]).pipe(
    map(([{capsule}, values]) => validateSchema(capsule, values).success),
    distinctUntilChanged(),
  );

  combineLatest([schema$, values$, expandedState$]).subscribe(([{capsule}, values, expandedState]) => {
    titleNode.textContent = capsule.title;
    subtitleNode.textContent = capsule.subtitle;
    imageNode.src = capsule.imageSrc;
    imageNode.alt = capsule.imageAlt;

    const nextValues = buildInitialValues(capsule.sections, values);
    const nextExpandedState = buildExpandedState(capsule.sections, expandedState);

    if (JSON.stringify(nextValues) !== JSON.stringify(values)) {
      values$.next(nextValues);
      return;
    }

    if (JSON.stringify(nextExpandedState) !== JSON.stringify(expandedState)) {
      expandedState$.next(nextExpandedState);
      return;
    }

    renderForm(formNode, capsule, nextValues, nextExpandedState);
  });

  validity$.subscribe((isValid) => {
    const submitButton = formNode.querySelector(".kapsula-form__submit");

    if (submitButton) {
      submitButton.disabled = !isValid;
    }
  });

  fromEvent(formNode, "click").subscribe((event) => {
    const sectionTrigger = event.target.closest("[data-kapsula-section-trigger]");

    if (sectionTrigger) {
      const sectionId = sectionTrigger.dataset.sectionId;
      expandedState$.next({
        ...expandedState$.value,
        [sectionId]: !expandedState$.value[sectionId],
      });
      return;
    }

    const optionButton = event.target.closest("[data-kapsula-option]");

    if (!optionButton) return;

    const sectionId = optionButton.dataset.sectionId;
    const optionValue = optionButton.dataset.optionValue;
    const {capsule} = getSchema(countryMap, selectedCountry$.value, selectedCapsule$.value);
    const section = capsule.sections.find((item) => item.id === sectionId);

    if (!section) return;

    values$.next({
      ...values$.value,
      [section.id]: toggleOptionValue(section, values$.value[section.id], optionValue),
    });
  });

  fromEvent(formNode, "input").subscribe((event) => {
    const textarea = event.target.closest("[data-kapsula-textarea]");

    if (!textarea) return;

    const sectionId = textarea.dataset.sectionId;

    values$.next({
      ...values$.value,
      [sectionId]: textarea.value,
    });
  });

  fromEvent(formNode, "submit").subscribe((event) => {
    event.preventDefault();
  });

  return {
    setCapsule(capsuleId) {
      selectedCapsule$.next(capsuleId);
    },
    setCountry(countryId) {
      selectedCountry$.next(countryId);
    },
  };
}
