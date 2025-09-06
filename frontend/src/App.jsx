import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [minutes, setMinutes] = useState(1);
  const [message, setMessage] = useState("Time is up!");

  useEffect(() => {
    // ask notification permission + subscribe
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then(async (reg) => {
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
             process.env.REACT_APP_VAPID_PUBLIC_KEY
          ),
        });
        await axios.post("https://send-message-hrni.vercel.app/subscribe", subscription);
      });
    }
  }, []);

  const setTimer = async () => {
    // Register email
    await axios.post("https://send-message-hrni.vercel.app/register-email", {
      email: "ayanmanna858@gmail.com",
    });

    // Tell backend to start timer
    await axios.post("https://send-message-hrni.vercel.app/set-timer", {
      minutes,
      message,
    });

    alert(`⏳ Timer set for ${minutes} minute(s)!`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>⏳ Set a Timer with Web Push + Email</h2>

      <input
        type="number"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
      />{" "}
      minutes
      <br />

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message"
      />
      <br />

      <button onClick={setTimer}>Start Timer</button>
    </div>
  );
}

// helper
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default App;
