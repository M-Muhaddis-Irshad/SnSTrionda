"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/newsletter/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        }
      );
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Subscribed successfully!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-col">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={status === "loading"}
        />
        <Button type="submit" variant="filled" size="sm" disabled={status === "loading"}>
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </Button>
      </form>
      {message && (
        <p className={`font-body text-xs mt-2 ${status === "success" ? "text-emerald-500" : "text-red-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
