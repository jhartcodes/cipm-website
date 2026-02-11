interface SendEmailInput {
  subject: string;
  html: string;
  replyTo?: string;
}

function parseAddressList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function sendEmail(input: SendEmailInput) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.CONTACT_FROM;
  const toList = parseAddressList(import.meta.env.CONTACT_TO);
  const bccList = parseAddressList(import.meta.env.CONTACT_BCC);

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!from) {
    throw new Error("CONTACT_FROM is not configured");
  }
  if (!toList.length) {
    throw new Error("CONTACT_TO is not configured");
  }

  const payload: Record<string, unknown> = {
    from,
    to: toList,
    subject: input.subject,
    html: input.html,
  };

  if (input.replyTo) {
    payload.reply_to = input.replyTo;
  }

  if (bccList.length) {
    payload.bcc = bccList;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<{ id: string }>;
}
