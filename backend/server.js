const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const webpush = require("web-push");
const cron = require("node-cron");
const nodemailer = require("nodemailer");

const app = express();
app.use(bodyParser.json());
app.use(cors());
require("dotenv").config();

// 👉 VAPID keys (generated once)
const vapidKeys = {
   publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  "mailto:you@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Temporary storage (replace with MongoDB for production)
let subscriptions = [];
let userEmails = [];

// 👉 Email transporter (using Gmail SMTP as example)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

// 👉 Subscribe user for push notifications
app.post("/subscribe", (req, res) => {
  const subscription = req.body;

  if (!subscriptions.find((s) => s.endpoint === subscription.endpoint)) {
    subscriptions.push(subscription);
    console.log("New subscription added:", subscription.endpoint);
  }

  res.status(201).json({ message: "Subscribed successfully!" });
});

// 👉 Save user email for notifications
app.post("/register-email", (req, res) => {
  const { email } = req.body;
  if (email && !userEmails.includes(email)) {
    userEmails.push(email);
    console.log("New email registered:", email);
  }
  res.json({ message: "Email registered successfully!" });
});

// 👉 Set timer
app.post("/set-timer", (req, res) => {
  const { minutes, message } = req.body;

  if (!minutes || isNaN(minutes)) {
    return res.status(400).json({ error: "Invalid minutes" });
  }

  const date = new Date();
  date.setMinutes(date.getMinutes() + parseInt(minutes));

  console.log(`Timer set for ${minutes} minute(s). Will fire at: ${date}`);

  cron.schedule(
    `${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${
      date.getMonth() + 1
    } *`,
    () => {
      console.log("⏰ Timer triggered! Sending notifications...");

      // --- Send Web Push ---
      subscriptions.forEach((sub, i) => {
        webpush
          .sendNotification(
            sub,
            JSON.stringify({
              title: "Timer Completed ⏰",
              body: message || "Your timer is up!",
            })
          )
          .catch((err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              console.log("Removing expired subscription:", sub.endpoint);
              subscriptions.splice(i, 1);
            } else {
              console.error("Push error:", err);
            }
          });
      });

      // --- Send Emails ---
      userEmails.forEach((email) => {
        transporter.sendMail(
          {
            from: "mannaayan777@gmail.com",
            to: email,
            subject: "⏰ Timer Completed",
            text: message || "Your timer is up!",
          },
          (err, info) => {
            if (err) {
              console.error("Email error:", err);
            } else {
              console.log("Email sent:", info.response);
            }
          }
        );
      });
    },
    { scheduled: true, timezone: "Asia/Kolkata" }
  );

  res.json({ message: `Timer set for ${minutes} minutes` });
});
app.get("/test-email", (req, res) => {
  transporter.sendMail(
    {
      from: "mannaayan777@gmail.com",
      to: "ayanmanna858@gmail.com",
      subject: "🚀 Test Email",
      text: "Hello Ayan, this is a test email from Nodemailer!",
    },
    (err, info) => {
      if (err) {
        console.error("❌ Email error:", err);
        return res.status(500).json({ error: err.toString() });
      } else {
        console.log("✅ Email sent:", info.response);
        return res.json({ message: "Test email sent!" });
      }
    }
  );
});

// 👉 Start server
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
