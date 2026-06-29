export function createLogo(params) {
  const logo = document.createElement('img');
  logo.src = params.src;
  logo.width = params.width;
  logo.height = params.height;
  logo.setAttribute('alt', params.alt);
  logo.setAttribute('loading', params.loading);
  return logo;
}
