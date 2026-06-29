export function formatPrice(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("ru-RU")} ₽`;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    };

    return entities[char] || char;
  });
}
