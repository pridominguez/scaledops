import { formatCurrency, formatDate } from "@/lib/utils";

interface LineItem {
  key: string;
  label: string;
  amount: number;
  type: string;
  multiplierValue?: number;
}

interface Package {
  id: string;
  type: string;
  name: string;
  description: string;
  features: string;
  breakdown: string;
  subtotal: number;
  total: number;
  timeline?: string | null;
}

interface AddOnItem {
  addOnId: string;
  selected: boolean;
  addOn: { id: string; name: string; description?: string | null; price: number };
}

interface PdfProposal {
  id: string;
  clientDescription: string;
  budget?: number | null;
  timeline?: string | null;
  createdAt: string;
  category: { name: string; slug: string };
}

export async function generateProposalPdf(options: {
  proposal: PdfProposal;
  standardPackage?: Package;
  premiumPackage?: Package;
  addOns?: AddOnItem[];
}) {
  const { proposal, standardPackage, premiumPackage, addOns = [] } = options;

  // Build HTML
  const html = buildProposalHtml({ proposal, standardPackage, premiumPackage, addOns });

  // Create a hidden iframe to render HTML
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = "800px";
  iframe.style.height = "1000px";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();

  await new Promise((r) => setTimeout(r, 500));

  const { default: html2canvas } = await import("html2canvas");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { jsPDF } = require("jspdf");

  const canvas = await html2canvas(doc.body, {
    scale: 2,
    useCORS: true,
    windowWidth: 800,
    width: 800,
  });

  document.body.removeChild(iframe);

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let posY = 0;
  let heightLeft = imgHeight;

  pdf.addImage(imgData, "PNG", 0, posY, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    posY -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, posY, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const fileName = `ScaledOps-Proposal-${proposal.id.substring(0, 8)}.pdf`;
  pdf.save(fileName);
}

function buildProposalHtml(options: {
  proposal: PdfProposal;
  standardPackage?: Package;
  premiumPackage?: Package;
  addOns: AddOnItem[];
}): string {
  const { proposal, standardPackage, premiumPackage, addOns } = options;
  const addOnsTotal = addOns.reduce((s, a) => s + a.addOn.price, 0);

  const renderPackage = (pkg: Package) => {
    const features = JSON.parse(pkg.features) as string[];
    const breakdown = JSON.parse(pkg.breakdown) as { lineItems: LineItem[]; multipliers: LineItem[] };
    return `
      <div class="package ${pkg.type === 'premium' ? 'premium' : ''}">
        <div class="package-header">
          <div>
            <h3>${pkg.name}</h3>
            <p class="pkg-desc">${pkg.description}</p>
            ${pkg.timeline ? `<p class="timeline">Delivery: ${pkg.timeline}</p>` : ""}
          </div>
          <div class="pkg-price">${formatCurrency(pkg.total)}</div>
        </div>
        <div class="features">
          ${features.map((f) => `<div class="feature">✓ ${f}</div>`).join("")}
        </div>
        <div class="breakdown">
          <p class="breakdown-title">Pricing Breakdown</p>
          ${breakdown.lineItems.map((item) => `
            <div class="line-item">
              <span>${item.label}</span>
              <span class="amount">${formatCurrency(item.amount)}</span>
            </div>
          `).join("")}
          ${breakdown.multipliers.map((m) => `
            <div class="line-item multiplier">
              <span>↑ ${m.label} (${m.multiplierValue?.toFixed(2)}×)</span>
              <span class="amount">+${formatCurrency(m.amount)}</span>
            </div>
          `).join("")}
          <div class="line-item total">
            <span><strong>Total</strong></span>
            <span class="amount"><strong>${formatCurrency(pkg.total)}</strong></span>
          </div>
        </div>
      </div>
    `;
  };

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: #111; background: white; padding: 40px; line-height: 1.5; }
  h1 { font-size: 22px; font-weight: 700; }
  h2 { font-size: 16px; font-weight: 600; margin-bottom: 10px; }
  h3 { font-size: 14px; font-weight: 600; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 2px; }
  .desc-box { background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
  .desc-text { font-size: 11px; color: #374151; line-height: 1.6; }
  .meta { display: flex; gap: 20px; margin-bottom: 20px; }
  .meta-item { }
  .section-title { font-size: 13px; font-weight: 600; margin-bottom: 12px; }
  .packages { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .package { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
  .package.premium { border-color: #111; }
  .package-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .pkg-price { font-size: 18px; font-weight: 700; font-family: monospace; }
  .pkg-desc { font-size: 10px; color: #6b7280; margin-top: 3px; }
  .timeline { font-size: 10px; color: #6b7280; margin-top: 2px; }
  .features { margin-bottom: 10px; }
  .feature { font-size: 10px; color: #374151; padding: 2px 0; }
  .breakdown { border-top: 1px solid #f3f4f6; padding-top: 8px; }
  .breakdown-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 5px; }
  .line-item { display: flex; justify-content: space-between; padding: 1.5px 0; font-size: 10px; color: #6b7280; }
  .line-item.multiplier { color: #b45309; }
  .line-item.total { border-top: 1px solid #e5e7eb; margin-top: 4px; padding-top: 4px; color: #111; }
  .amount { font-family: monospace; }
  .addons-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .addons-table th { font-size: 10px; font-weight: 600; text-align: left; padding: 4px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; }
  .addons-table td { font-size: 11px; padding: 5px 0; border-bottom: 1px solid #f9fafb; }
  .summary-box { background: #111; border-radius: 10px; padding: 16px; color: white; }
  .summary-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; color: #d1d5db; }
  .summary-total { display: flex; justify-content: space-between; padding: 6px 0 0; border-top: 1px solid #374151; font-weight: 700; font-size: 13px; color: white; margin-top: 4px; }
  .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #9ca3af; }
</style>
</head>
<body>
<div class="header">
  <div>
    <p class="label">Project Proposal</p>
    <div class="brand">ScaledOps</div>
  </div>
  <div style="text-align:right">
    <p class="label">Date</p>
    <p>${formatDate(proposal.createdAt)}</p>
    <p class="label" style="margin-top:6px">Category</p>
    <p>${proposal.category.name}</p>
  </div>
</div>

<div>
  <p class="label">Project Description</p>
  <div class="desc-box">
    <p class="desc-text">${proposal.clientDescription}</p>
  </div>
</div>

${proposal.budget || proposal.timeline ? `
<div class="meta">
  ${proposal.budget ? `<div class="meta-item"><p class="label">Budget</p><p>${formatCurrency(proposal.budget)}</p></div>` : ""}
  ${proposal.timeline ? `<div class="meta-item"><p class="label">Timeline Target</p><p>${proposal.timeline}</p></div>` : ""}
</div>` : ""}

${standardPackage || premiumPackage ? `
<h2>Pricing Options</h2>
<div class="packages">
  ${standardPackage ? renderPackage(standardPackage) : ""}
  ${premiumPackage ? renderPackage(premiumPackage) : ""}
</div>` : ""}

${addOns.length > 0 ? `
<h2>Selected Add-ons</h2>
<table class="addons-table">
  <thead><tr><th>Add-on</th><th>Description</th><th style="text-align:right">Price</th></tr></thead>
  <tbody>
    ${addOns.map((a) => `
      <tr>
        <td>${a.addOn.name}</td>
        <td style="color:#6b7280">${a.addOn.description ?? ""}</td>
        <td style="text-align:right;font-family:monospace">${formatCurrency(a.addOn.price)}</td>
      </tr>
    `).join("")}
    <tr>
      <td colspan="2" style="font-weight:600">Add-ons Total</td>
      <td style="text-align:right;font-family:monospace;font-weight:600">${formatCurrency(addOnsTotal)}</td>
    </tr>
  </tbody>
</table>` : ""}

${standardPackage && premiumPackage ? `
<div class="summary-box">
  <p class="section-title" style="color:white;margin-bottom:10px">Investment Summary</p>
  <div class="summary-row"><span>Standard Package</span><span style="font-family:monospace">${formatCurrency(standardPackage.total)}</span></div>
  <div class="summary-row"><span>Premium Package</span><span style="font-family:monospace">${formatCurrency(premiumPackage.total)}</span></div>
  ${addOnsTotal > 0 ? `<div class="summary-row"><span>Add-ons</span><span style="font-family:monospace">+${formatCurrency(addOnsTotal)}</span></div>` : ""}
  <div class="summary-total"><span>Premium + Add-ons</span><span style="font-family:monospace">${formatCurrency(premiumPackage.total + addOnsTotal)}</span></div>
</div>` : ""}

<p class="footer">This proposal is valid for 30 days. All prices in USD. Generated by ScaledOps.</p>
</body>
</html>`;
}
