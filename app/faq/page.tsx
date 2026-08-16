import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/SiteShell";
import { FaqList } from "@/components/faq/FaqList";

export const metadata: Metadata = { title: "Frequently Asked Questions", description: "Answers about Housora, uploads, plans, billing, and account controls." };
const faqs = [
  ["What is Housora?", "Housora is an AI-assisted visual design tool. Upload a room, exterior, or garden photo, choose the available options, and explore a new design direction while keeping the original image as a reference."],
  ["Is Housora free to use?", "Housora lets you explore the product before choosing a paid plan. Current allowances, prices, limits, and renewal terms are shown on the pricing page and in checkout before you pay."],
  ["What image types can I upload?", "Housora accepts JPEG, PNG, and WebP images. If your phone saves another format, export it to JPEG or PNG first."],
  ["Will the result preserve my room?", "The tool uses your photo as a visual reference, but AI results can change details or proportions. Treat the result as a concept, not a measured plan or professional construction advice."],
  ["Do you sell the furniture shown?", "Housora creates visual concepts. It does not promise a live furniture catalogue, retailer price comparison, or direct purchasing unless those features are explicitly enabled."],
  ["What plans are available?", "Standard includes 100 images, Pro 190, Growth 1,200, Scale 2,250, and Unlimited 5,250. Monthly and annual prices are shown on the pricing page and confirmed at checkout."],
  ["How do I cancel a plan?", "Plans are purchased through Whop. Use the billing controls available from your purchase or contact support@housora.app using the account email."],
  ["How do I request a refund?", "Email support@housora.app with your account email, purchase date, receipt or transaction reference, and reason. Requests are reviewed under the Refund Policy and applicable law."],
  ["How do I delete my account?", "Open Delete Account from the sidebar while signed in and confirm the request. If self-service deletion cannot complete, email support@housora.app."],
  ["Is an uploaded result professional advice?", "No. Check measurements, structure, safety, planning rules, materials, and installation details with a qualified professional before building or buying."],
] as const;

export default function FaqPage() { return <SiteShell><section className="faq-page-section"><div className="faq-page-inner"><h1 className="faq-page-title">Frequently Asked Questions</h1><p className="faq-page-subtitle">Clear answers about Housora, image uploads, plans, and account controls.</p><div className="faq-category"><h2 className="faq-category-title">About Housora</h2><FaqList items={faqs} /></div><div className="faq-still-questions"><h2>Still Have Questions?</h2><p>Contact <a href="mailto:support@housora.app">support@housora.app</a> for account, billing, or privacy help.</p></div></div></section></SiteShell>; }
