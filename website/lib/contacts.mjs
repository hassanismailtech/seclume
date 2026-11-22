function mailbox(value, fallback, setting) {
  const address = value || fallback;
  if (!/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(address)) {
    throw new Error(`${setting} must be a plain email address`);
  }
  return address;
}

// Resolve on the server; these settings are not NEXT_PUBLIC browser variables.
export function contacts() {
  return {
    security: mailbox(process.env.SECURITY_CONTACT_EMAIL, "security@seclume.tech", "SECURITY_CONTACT_EMAIL"),
    general: mailbox(process.env.CONTACT_EMAIL, "hello@seclume.tech", "CONTACT_EMAIL"),
    privacy: mailbox(process.env.PRIVACY_CONTACT_EMAIL, "privacy@seclume.tech", "PRIVACY_CONTACT_EMAIL"),
  };
}
