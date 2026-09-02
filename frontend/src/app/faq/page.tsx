import type { Metadata } from "next";
import Link from "next/link";
import FaqAccordion from "./FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ — Trionda Wears",
  description:
    "Frequently asked questions about shipping, returns, custom measurements, payments, and more.",
};

// ---------------------------------------------------------------------------
// FAQ data — genuine, editable copy for a Pakistani clothing e-commerce brand
// ---------------------------------------------------------------------------

export interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How long does shipping take?",
    answer:
      "Standard shipping within Pakistan typically takes 3–5 business days. Orders to major cities like Lahore, Karachi, and Islamabad may arrive sooner. Remote areas may take up to 7 business days. You will receive a tracking number once your order has been dispatched.",
  },
  {
    question: "Do you offer international shipping?",
    answer:
      "Currently, we ship within Pakistan. We are working on expanding our delivery network. If you are located outside Pakistan and interested in our products, please contact us at our support email for potential arrangements.",
  },
  {
    question: "What is your return and exchange policy?",
    answer:
      "We offer exchanges within 7 days of delivery for unworn, unwashed items with original tags intact. Custom-measured and made-to-order garments are not eligible for return unless there is a manufacturing defect. To initiate an exchange, contact our support team with your order number.",
  },
  {
    question: "How do custom measurements work?",
    answer:
      "When you select a customisable product, you can enter your body measurements during checkout. Our tailors use these to craft a garment tailored to your exact fit. We recommend following our measurement guide closely. If you need assistance, our team can help you take accurate measurements over a video call.",
  },
  {
    question: "What is made-to-order?",
    answer:
      "Made-to-order means your garment is crafted specifically for you after you place your order. This allows us to use premium fabrics and precise tailoring without overproduction. Made-to-order items typically require 10–15 business days for production before shipping.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept Cash on Delivery (COD) and card payments via Safepay. Safepay supports Visa, Mastercard, and other major card networks. All card transactions are encrypted and processed securely. You do not need a Safepay account to pay — the checkout is fully hosted.",
  },
  {
    question: "How does Cash on Delivery work?",
    answer:
      "Select 'Cash on Delivery' at checkout. Your order will be confirmed and shipped. Payment is collected in cash by the delivery rider at your doorstep. Please have the exact amount ready where possible, as riders may have limited change.",
  },
  {
    question: "How do I choose the right size?",
    answer:
      "Each product page includes a size guide with measurements for chest, waist, and length. If you fall between sizes, we recommend sizing up for a relaxed fit or choosing our custom measurement option for a precision fit. Our support team can also help you decide.",
  },
  {
    question: "Can I cancel or modify my order?",
    answer:
      "You can request a cancellation or modification within 2 hours of placing your order by contacting our support team. Once an order has entered production or has been dispatched, changes are no longer possible. Made-to-order items begin production immediately.",
  },
  {
    question: "How do I care for my Trionda garments?",
    answer:
      "We recommend dry cleaning for sherwanis and formal wear. Shirts and trousers can be hand-washed in cold water with mild detergent. Avoid tumble drying. Iron on a medium setting with a cloth barrier for embellished fabrics. Each product page includes specific care instructions.",
  },
];

// ---------------------------------------------------------------------------
// FAQ Page (Server Component)
// ---------------------------------------------------------------------------

export default function FaqPage() {
  return (
    <main className="page-main">
      <div className="page-container--narrow">
        <h1 className="shop-page-heading">
          Frequently Asked Questions
        </h1>
        <div className="section-divider" />

        <p className="faq-description">
          Find answers to common questions about ordering, shipping, payments,
          and our tailoring process. If you need further help,{" "}
          <Link href="/#contact">
            get in touch
          </Link>
          .
        </p>

        <div className="faq-accordion">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </div>
    </main>
  );
}
