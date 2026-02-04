import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

let points = []; // масив для точок

app.get("/api/get-marks", (req, res) => {
  res.json(points);
});

app.post("/api/create-checkout", async (req, res) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return res.status(500).json({ error: "Stripe не налаштований" });

  try {
    const { nickname, message, lat, lng, visibility } = req.body;
    if (!nickname || !lat || !lng) return res.status(400).json({ error: "Відсутні необхідні поля" });

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("payment_method_types[0]", "card");
    params.append("line_items[0][price_data][currency]", "eur");
    params.append("line_items[0][price_data][product_data][name]", "LeaveMyMark - Мітка на карті");
    params.append("line_items[0][price_data][product_data][description]", `Мітка від ${nickname}`);
    params.append("line_items[0][price_data][unit_amount]", "100"); 
    params.append("line_items[0][quantity]", "1");
    const origin = req.headers.origin || "https://твій-frontend.github.io";
    params.append("success_url", `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${origin}/?payment=cancelled`);
    params.append("metadata[nickname]", nickname);
    params.append("metadata[message]", message || "");
    params.append("metadata[lat]", lat);
    params.append("metadata[lng]", lng);
    params.append("metadata[visibility]", visibility || "public");

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await response.json();
    if (!response.ok) return res.status(500).json({ error: "Помилка створення Stripe сесії" });

    points.push({ nickname, message, lat, lng, visibility: visibility || "public" });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
