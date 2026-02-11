import type { APIRoute } from "astro";
import { ZodError } from "zod";
import {
  contactFormSchema,
  requestProposalFormSchema,
  type ContactFormInput,
  type RequestProposalFormInput,
} from "../../lib/forms/schemas";
import { verifyTurnstileToken } from "../../lib/forms/turnstile";
import { sendEmail } from "../../lib/email/sendEmail";

export const prerender = false;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function row(label: string, value?: string) {
  if (!value) return "";
  return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

function buildContactEmailHtml(payload: ContactFormInput) {
  return [
    "<h2>New Contact Form Submission</h2>",
    row("Name", payload.name),
    row("Email", payload.email),
    row("Phone", payload.phone || ""),
    row("Message", payload.message),
    row("Source", payload.sourcePage),
  ].join("");
}

function buildProposalEmailHtml(payload: RequestProposalFormInput) {
  return [
    "<h2>New Request Proposal Submission</h2>",
    row("Name", payload.name),
    row("Email", payload.email),
    row("Phone", payload.phone),
    row("Property Type", payload.propertyType),
    row("Best Time To Call", payload.bestTimeToCall || ""),
    row("Building Size", payload.buildingSize || ""),
    row("Building Address", payload.buildingAddress || ""),
    row("Heard About Us", payload.heardAboutUs || ""),
    row("Additional Info", payload.additionalInfo || ""),
    row("Source", payload.sourcePage),
  ].join("");
}

function badRequest(message: string, details?: unknown) {
  return new Response(JSON.stringify({ ok: false, message, details }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

function ok(message: string) {
  return new Response(JSON.stringify({ ok: true, message }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = await request.json();
    const formId = body?.formId;
    const honeypot = typeof body?.honeypot === "string" ? body.honeypot.trim() : "";
    const turnstileToken =
      typeof body?.turnstileToken === "string"
        ? body.turnstileToken.trim()
        : "";

    if (!formId || (formId !== "contact" && formId !== "request_proposal")) {
      return badRequest("Invalid formId");
    }

    if (honeypot) {
      return ok("Thanks for your message.");
    }

    if (!turnstileToken) {
      return badRequest("Missing Turnstile token");
    }

    const turnstile = await verifyTurnstileToken(turnstileToken, clientAddress);
    if (!turnstile.success) {
      return badRequest("Turnstile verification failed", turnstile.errors);
    }

    if (formId === "contact") {
      const payload = contactFormSchema.parse(body);
      const subject =
        import.meta.env.CONTACT_SUBJECT_CONTACT || `[Website] Contact Form - ${payload.name}`;

      await sendEmail({
        subject,
        html: buildContactEmailHtml(payload),
        replyTo: payload.email,
      });

      return ok("Thanks for your message. We'll be in touch soon.");
    }

    const payload = requestProposalFormSchema.parse(body);
    const subject =
      import.meta.env.CONTACT_SUBJECT_PROPOSAL ||
      `[Website] Request Proposal - ${payload.name}`;

    await sendEmail({
      subject,
      html: buildProposalEmailHtml(payload),
      replyTo: payload.email,
    });

    return ok("Thanks for your proposal request. We'll be in touch soon.");
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest("Invalid form data", error.flatten().fieldErrors);
    }

    console.error("Form submit failed:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        message: "Unable to submit form right now. Please try again.",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
};
