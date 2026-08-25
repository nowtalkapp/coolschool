// ============================================================
// SIMPLECHAT - Firebase Realtime Chat
// Paste your Firebase web-app configuration below.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  query,
  limitToLast,
  onChildAdded,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://PASTE_YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "PASTE_YOUR_PROJECT",
  storageBucket: "PASTE_YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// ---------- UI ----------
const nameScreen = document.getElementById("nameScreen");
const chatScreen = document.getElementById("chatScreen");
const nameInput = document.getElementById("nameInput");
const joinBtn = document.getElementById("joinBtn");
const changeNameBtn = document.getElementById("changeNameBtn");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messagesEl = document.getElementById("messages");
const statusEl = document.getElementById("status");

let username = localStorage.getItem("simplechat_username") || "";

function setStatus(text) {
  statusEl.textContent = text;
}

function enterChat() {
  username = nameInput.value.trim().slice(0, 24);
  if (!username) return;
  localStorage.setItem("simplechat_username", username);
  nameScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  messageInput.focus();
}

joinBtn.addEventListener("click", enterChat);
nameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") enterChat();
});

changeNameBtn.addEventListener("click", () => {
  chatScreen.classList.add("hidden");
  nameScreen.classList.remove("hidden");
  nameInput.value = username;
  nameInput.focus();
});

// ---------- Firebase ----------
let db;

try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  setStatus("Online");
} catch (error) {
  console.error(error);
  setStatus("Firebase setup needed");
}

function escapeText(value) {
  return String(value);
}

function addMessage(data) {
  const wrapper = document.createElement("div");
  wrapper.className = "message" + (data.name === username ? " mine" : "");

  const meta = document.createElement("div");
  meta.className = "meta";

  const date = data.timestamp
    ? new Date(data.timestamp)
    : new Date();

  meta.textContent = `${escapeText(data.name || "Unknown")} • ${date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  })}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = data.text || "";

  wrapper.append(meta, bubble);
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

if (db) {
  const messagesRef = ref(db, "messages");
  const messagesQuery = query(messagesRef, limitToLast(100));

  onChildAdded(messagesQuery, snapshot => {
    addMessage(snapshot.val());
  });
}

messageForm.addEventListener("submit", async e => {
  e.preventDefault();

  const text = messageInput.value.trim();
  if (!text || !username || !db) return;

  try {
    await push(ref(db, "messages"), {
      name: username,
      text: text.slice(0, 500),
      timestamp: serverTimestamp()
    });

    messageInput.value = "";
    messageInput.focus();
  } catch (error) {
    console.error(error);
    setStatus("Couldn't send message");
  }
});

if (username) {
  nameInput.value = username;
  nameScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
}
