// =============================================================================
// Shared Terms & Conditions content.
// Plain data module (no "use client") so it can be imported by both the
// server-rendered /terms-and-conditions page and the client-side
// TermsConditionsModal — the modal and the standalone page always show the
// same copy.
// =============================================================================

export interface TermsSection {
  heading: string;
  body: string;
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    heading: "1. Acceptance of Terms",
    body: "By accessing or using the Trionda Wears website and placing an order, you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree with any part of these terms, please do not use our website or services.",
  },
  {
    heading: "2. Eligibility",
    body: "You must be at least 18 years old, or have the consent of a parent or guardian, to place an order on Trionda Wears. By placing an order you confirm that the information you provide is accurate, current, and complete.",
  },
  {
    heading: "3. Orders & Pricing",
    body: "All prices are listed in Pakistani Rupees (PKR) and are subject to change without notice. We reserve the right to refuse or cancel any order, including orders placed at an incorrect price due to an error. Once an order is confirmed you will receive an order confirmation with your order number.",
  },
  {
    heading: "4. Payments",
    body: "We accept Cash on Delivery (COD) and card payments processed securely via Safepay. All card transactions are encrypted. Payment is collected at the time of order for card payments, or on delivery for COD orders.",
  },
  {
    heading: "5. Shipping & Delivery",
    body: "Orders are shipped to the address you provide at checkout. Standard shipping within Pakistan typically takes 3–5 business days, and remote areas may take up to 7 business days. Made-to-order items require 10–15 business days for production before dispatch. Please refer to our Shipping policy for full details.",
  },
  {
    heading: "6. Returns & Exchanges",
    body: "We offer exchanges within 7 days of delivery for unworn, unwashed items with original tags intact. Custom-measured and made-to-order garments are not eligible for return unless there is a manufacturing defect. Please refer to our Returns policy for full details.",
  },
  {
    heading: "7. Custom & Made-to-Order Items",
    body: "Garments crafted to your custom measurements or made-to-order are produced specifically for you and are non-refundable except in cases of manufacturing defects. Please ensure your measurements are accurate before confirming your order.",
  },
  {
    heading: "8. Intellectual Property",
    body: "All content on this website, including text, graphics, logos, images, and product designs, is the property of Trionda Wears and is protected by applicable intellectual property laws. You may not reproduce, distribute, or use any content without our prior written permission.",
  },
  {
    heading: "9. Limitation of Liability",
    body: "To the maximum extent permitted by law, Trionda Wears shall not be liable for any indirect, incidental, or consequential damages arising out of your use of the website or any products purchased from us. Our total liability shall not exceed the amount paid for the product in question.",
  },
  {
    heading: "10. Changes to These Terms",
    body: "We may update these Terms & Conditions from time to time. The latest version will always be available on this page, and continued use of the website after changes are posted constitutes acceptance of the revised terms.",
  },
  {
    heading: "11. Contact",
    body: "If you have any questions about these Terms & Conditions, please contact us through our Contact page or via the support email provided on our website.",
  },
];