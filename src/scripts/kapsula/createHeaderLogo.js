import {createLogo} from "./createLogo.js";

function joinClasses(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

export function createHeaderLogo({
                                   href = "/",
                                   containerClassName,
                                   linkClassName,
                                   imageClassName,
                                   image,
                                 }) {
  const container = document.createElement("div");
  container.className = joinClasses(containerClassName, 'kapsula-header-logo');

  const link = document.createElement("a");
  link.href = href;
  link.setAttribute("data-testid", "header-logo");
  link.className = joinClasses("kapsula-header-logo__link", linkClassName);

  const logo = createLogo(image);
  logo.className = joinClasses("kapsula-header-logo__image", imageClassName);

  link.append(logo);
  container.append(link);

  return container;
}
