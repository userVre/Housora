import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
export const metadata: Metadata = { title: "Terms & Conditions", robots: { index: false } };
const sections = [
  { heading: "The service", paragraphs: ["Housora provides AI-assisted visual design concepts. Outputs are inspiration and may contain inaccuracies. They are not architectural, structural, safety, planning, legal, financial, or professional construction advice."] },
  { heading: "Your account and content", paragraphs: ["Keep your account secure and provide lawful content that you have the right to use. You retain rights in your uploads and grant Housora and its processors the limited permission needed to store, transmit, and process them for the feature you request."] },
  { heading: "Plans and billing", paragraphs: ["Prices, allowances, taxes, renewal periods, and final transaction terms are presented before purchase through Whop. Allowances reset according to the purchased billing cycle and do not represent stored monetary value."] },
  { heading: "Acceptable use", paragraphs: ["Do not use the service to violate law or third-party rights, bypass controls, interfere with the service, distribute malware, generate abusive content, or submit highly sensitive information that is unnecessary for a design request."] },
  { heading: "Availability and liability", paragraphs: ["We aim to provide a reliable service but do not guarantee uninterrupted availability or that an AI output will meet every purpose. Mandatory consumer rights are not excluded. Other liability is limited only to the extent permitted by applicable law."] },
];
export default function TermsPage() { return <LegalPage title="Terms & Conditions" sections={sections} />; }
