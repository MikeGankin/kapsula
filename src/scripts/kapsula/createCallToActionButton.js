export function createCallToActionButton(string) {
  const el = document.createElement('button');
  el.className = 'kapsula-button kapsula-button--header';
  el.textContent = string;
  return el;
}
