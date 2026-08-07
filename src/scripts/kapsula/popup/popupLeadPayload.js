function formatSubmittedAt(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function buildManagerLeadPayload({snapshot, submittedAt, contact}) {
  return {
    format: "html",
    plaintext: "КАПСУЛА",
    lead: {
      capsule: snapshot.capsuleId,
      segment: "Elite",
      submittedAt: formatSubmittedAt(submittedAt),
      name: contact.name,
      phone: `+7 ${contact.phone}`,
      contactMethod: contact.contactMethod,
      ...snapshot.values,
    },
  };
}
