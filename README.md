# SimpleChat

A tiny realtime chat website designed for GitHub Pages.

## Firebase setup

1. Go to https://console.firebase.google.com/
2. Create a Firebase project.
3. In the project, choose **Build → Realtime Database**.
4. Create the database.
5. For a simple personal/test chat, choose a development/test setup when Firebase offers it.
6. Open **Project settings** → **Your apps**.
7. Click the **Web** icon (`</>`).
8. Register the web app.
9. Copy the Firebase configuration object.
10. Open `app.js`.
11. Replace the placeholder values inside `firebaseConfig` with your Firebase config.
12. In Realtime Database → Rules, use rules appropriate for your project. For a simple non-sensitive test chat, Firebase's temporary test rules can be used only during their allowed period. Do not leave an open database permanently for a public site.
13. Upload `index.html`, `style.css`, and `app.js` to a GitHub repository.
14. Open the repository's **Settings → Pages**.
15. Select **Deploy from a branch**, choose your main branch and `/root` folder, then save.
16. GitHub will give you a Pages URL.

## Important

This project intentionally has no password/account system. Anyone who can reach the chat can choose a username.

For a public chat, add Firebase Authentication and stricter Realtime Database security rules before sharing it widely.

## Files

- `index.html` — page layout
- `style.css` — design
- `app.js` — Firebase realtime chat logic
