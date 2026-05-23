import JSZip from "jszip";
import PDFDocument from "pdfkit";

const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:5174";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@zawadi.app";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || "zawadi-admin-2026";

function makeJar() {
  return { cookie: "" };
}

function updateCookies(jar, response) {
  const setCookies = response.headers.getSetCookie?.() || [];
  const fallback = response.headers.get("set-cookie");
  const cookies = setCookies.length ? setCookies : fallback ? [fallback] : [];
  if (!cookies.length) return;
  const next = new Map(
    jar.cookie
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.split("="))
      .map(([key, ...value]) => [key, value.join("=")])
  );
  cookies.forEach((cookie) => {
    const [pair] = cookie.split(";");
    const [key, ...value] = pair.split("=");
    next.set(key, value.join("="));
  });
  jar.cookie = [...next.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function request(jar, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(jar.cookie ? { Cookie: jar.cookie } : {}),
      ...(options.headers || {})
    }
  });
  updateCookies(jar, response);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${payload.error || response.statusText}`);
  }
  return payload;
}

function dataUrl(buffer, mimeType) {
  return `data:${mimeType};base64,${Buffer.from(buffer).toString("base64")}`;
}

async function makeDocx(text) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  const body = text
    .split(/\n+/)
    .map((paragraph) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(paragraph)}</w:t></w:r></w:p>`)
    .join("");
  zip.folder("word").file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}<w:sectPr/></w:body>
</w:document>`);
  return zip.generateAsync({ type: "nodebuffer" });
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function makePdf(text) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 54 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.fontSize(12).text(text, { width: 480 });
    doc.end();
  });
}

async function main() {
  const essayText = `My journey toward scholarship study began in my community, where I saw how education can change the choices available to young people.
I am applying because my academic goals are connected to service, leadership, and practical impact. Through my studies, I have learned to turn obstacles into discipline and curiosity.
This essay reflects my personal voice, my motivation for graduate study, and my commitment to use knowledge responsibly. I want my future work to open doors for others and strengthen institutions that serve African students.`;

  const adminJar = makeJar();
  const userJar = makeJar();
  const timestamp = Date.now();
  const email = `smoke-${timestamp}@zawadi.test`;

  await request(adminJar, "/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  });

  const registration = await request(userJar, "/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Smoke Essay User",
      email,
      password: "smoke-test-password",
      country: "Kenya"
    })
  });

  const docxBuffer = await makeDocx(essayText);
  const docxUpload = await request(userJar, "/api/essays/samples/upload", {
    method: "POST",
    body: JSON.stringify({
      fileName: "statement-of-purpose.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      title: "Statement of Purpose DOCX",
      data: dataUrl(docxBuffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    })
  });

  const pdfBuffer = await makePdf(essayText);
  const pdfUpload = await request(userJar, "/api/essays/samples/upload", {
    method: "POST",
    body: JSON.stringify({
      fileName: "scholarship-essay.pdf",
      mimeType: "application/pdf",
      title: "Scholarship Essay PDF",
      data: dataUrl(pdfBuffer, "application/pdf")
    })
  });

  let rejectedUnsupportedText = false;
  try {
    await request(userJar, "/api/essays/samples/upload", {
      method: "POST",
      body: JSON.stringify({
        fileName: "personal-statement.txt",
        mimeType: "text/plain",
        title: "Personal Statement TXT",
        data: dataUrl(Buffer.from(essayText, "utf8"), "text/plain")
      })
    });
  } catch {
    rejectedUnsupportedText = true;
  }

  let rejectedNonEssay = false;
  try {
    const transcriptDocx = await makeDocx(
      "Academic transcript GPA semester course code grade registrar university credit hours examination result slip mark sheet certified true copy."
    );
    await request(userJar, "/api/essays/samples/upload", {
      method: "POST",
      body: JSON.stringify({
        fileName: "academic-transcript.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        title: "Transcript",
        data: dataUrl(transcriptDocx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      })
    });
  } catch {
    rejectedNonEssay = true;
  }

  const samples = await request(userJar, "/api/essays/samples");
  if (samples.count < 2) throw new Error(`Expected at least 2 samples, got ${samples.count}`);
  if (!rejectedUnsupportedText) throw new Error("Unsupported plain-text upload was not rejected");
  if (!rejectedNonEssay) throw new Error("Non-essay document was not rejected");

  await request(adminJar, `/api/admin/subscriptions/${registration.user.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      action: "activate",
      plan: "plus",
      planStatus: "active",
      is_paid: true,
      subscriptionAmount: 399,
      subscriptionCurrency: "KES",
      subscriptionReference: `smoke-sub-${timestamp}`
    })
  });

  const dashboard = await request(adminJar, "/api/admin/dashboard");
  const subscription = dashboard.subscriptions.find((item) => item.userId === registration.user.id);
  if (!subscription?.is_paid || subscription.plan !== "plus") {
    throw new Error("Subscription update did not persist");
  }

  await request(adminJar, `/api/admin/users/${registration.user.id}`, { method: "DELETE" });

  console.log(JSON.stringify({
    ok: true,
    uploads: {
      docxWords: docxUpload.sample.wordCount,
      pdfWords: pdfUpload.sample.wordCount
    },
    rejectedUnsupportedText,
    rejectedNonEssay,
    subscriptionManaged: true
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
