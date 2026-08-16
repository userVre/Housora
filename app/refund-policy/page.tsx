import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
export const metadata: Metadata = { title: "Refund Policy", robots: { index: false } };
const sections = [
  { heading: "Requesting a refund", paragraphs: ["Email support@housora.app with the account email, purchase date, Whop receipt or transaction reference, plan, and reason for the request. Do not send card details."] },
  { heading: "Review", paragraphs: ["Requests are assessed under the purchase terms, service usage, applicable consumer law, and any mandatory withdrawal or conformity rights. Approval is not automatic unless required by law."] },
  { heading: "Renewals and cancellation", paragraphs: ["Cancel future renewals through the billing controls associated with your Whop purchase. Cancellation normally stops future billing and does not automatically refund an earlier charge."] },
  { heading: "Processing", paragraphs: ["When a refund is approved, it is returned through the original payment method where possible. Bank and payment-provider processing times are outside Housora's control."] },
];
export default function RefundPage() { return <LegalPage title="Refund Policy" sections={sections} />; }
