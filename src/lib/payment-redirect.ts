export interface PaymentRedirectPayload {
  paymentUrl?: string;
  redirectMethod?: string;
  formFields?: Record<string, unknown>;
}

export function redirectToPaymentGateway(payload: PaymentRedirectPayload) {
  const paymentUrl =
    typeof payload.paymentUrl === "string" ? payload.paymentUrl.trim() : "";

  if (!paymentUrl) {
    throw new Error("No payment URL received");
  }

  const redirectMethod =
    typeof payload.redirectMethod === "string"
      ? payload.redirectMethod.trim().toUpperCase()
      : "GET";

  if (redirectMethod !== "POST") {
    window.location.assign(paymentUrl);
    return;
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;
  form.style.display = "none";

  const rawFields =
    payload.formFields && typeof payload.formFields === "object"
      ? payload.formFields
      : {};

  for (const [key, value] of Object.entries(rawFields)) {
    if (value === undefined || value === null) continue;

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
