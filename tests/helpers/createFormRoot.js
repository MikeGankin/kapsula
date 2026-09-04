/* global document */

/** @param {{omit?: string | null}} [options] */
export function createFormRoot({omit = null} = {}) {
  const root = document.createElement("main");
  const nodes = [
    ["h1", "data-kapsula-form-title"],
    ["p", "data-kapsula-form-subtitle"],
    ["img", "data-kapsula-form-image"],
    ["div", "data-kapsula-form-overlay-images"],
    ["form", "data-kapsula-form"],
  ];

  nodes.forEach(([tagName, attribute]) => {
    if (attribute === omit) return;
    const node = document.createElement(tagName);
    node.setAttribute(attribute, "");
    root.append(node);
  });

  const form = root.querySelector("[data-kapsula-form]");
  if (form && omit !== "submit") {
    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "kapsula-form__trigger";
    root.append(submit);
  }

  document.body.append(root);
  return root;
}
