const RESEND_FROM = process.env.RESEND_FROM || "TechMNHub <noreply@techmnhub.com>";

const toBase64 = (content) => {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (content instanceof Uint8Array) {
    return Buffer.from(content).toString("base64");
  }
  if (content instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(content)).toString("base64");
  }
  return Buffer.from(String(content)).toString("base64");
};

const normalizeAttachments = (attachments = []) => {
  return attachments.map((file) => {
    const item = {
      filename: file.filename,
      content: toBase64(file.content),
      content_type: file.contentType,
    };

    if (file.contentId) {
      item.content_id = file.contentId;
    }

    return item;
  });
};

const sendWithResend = async ({ to, subject, html, attachments = [] }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY missing");
  }

  const payload = {
    from: RESEND_FROM,
    to,
    subject,
    html,
    attachments: attachments.length ? normalizeAttachments(attachments) : undefined,
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Resend email request failed");
  }

  return data;
};

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  console.log(`📤 Sending email to ${to} with subject: ${subject}`);

  const result = await sendWithResend({ to, subject, html, attachments });
  console.log("✅ Email sent via RESEND:", result);

  return {
    provider: "resend",
    data: result,
  };
};

module.exports = sendEmail;
