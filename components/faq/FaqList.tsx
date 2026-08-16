"use client";

import { useState } from "react";

export function FaqList({ items }: { items: readonly (readonly [string, string])[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return <div className="faq-list">{items.map(([question, answer], index) => { const expanded = open === index; return <div className={`faq-item ${expanded ? "active" : ""}`} key={question}><button className="faq-question" aria-expanded={expanded} aria-controls={`faq-answer-${index}`} onClick={() => setOpen(expanded ? null : index)}><span>{question}</span><span className="faq-toggle" aria-hidden="true">{expanded ? "−" : "+"}</span></button><div className={`faq-answer ${expanded ? "" : "hidden"}`} id={`faq-answer-${index}`}><p>{answer}</p></div></div>; })}</div>;
}
