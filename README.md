# Study Panel

A Tampermonkey panel for selected or pasted questions. Includes Hint, Explain + answer, and Check my work; visible, discreet, and hidden display modes; text size, opacity, corner position, and saved settings. DeltaMath is enabled initially. Add other domains in Settings.

## Set up the online backend once

1. Create a private GitHub repository and upload this folder's files. Never upload a real `.env` file or API key.
2. Sign into Render at https://dashboard.render.com and create a Blueprint from that repository. It will read `render.yaml`. Review the hosting plan and price before creating the service.
3. Enter your NEW OpenAI API key privately into Render's `OPENAI_API_KEY` secret field. Delete the old key you posted in chat if you have not already.
4. Deploy. Copy the service's HTTPS address, such as `https://your-service.onrender.com`. Its `/health` page should show `{"ok":true}`.
5. In Render's service Environment settings, copy the generated `PANEL_ACCESS_TOKEN`. This is the panel password, separate from your OpenAI key. Keep it private too.

OpenAI API usage is billed separately from ChatGPT. A working API project with sufficient quota is required. The backend defaults to `gpt-5-mini` and 100 requests per day, with six per minute and two concurrent requests. Counters are in memory and reset on restart; this is not a hard spending cap. Use one service instance. You can lower `MAX_DAILY_REQUESTS` in hosting settings.

## Install on your PC or Mac

1. Install Tampermonkey from https://www.tampermonkey.net in a supported browser. Follow any browser prompt to enable userscripts.
2. Open Tampermonkey's dashboard, create a new script, replace its contents with `Study-Panel.user.js`, and save.
3. Visit DeltaMath. Click the small **?** button, then **Settings**.
4. Paste the backend HTTPS address and the **panel access token**. Do not paste the OpenAI key into the userscript.
5. Choose the display mode and click **Save settings**.
6. Highlight a question, click **Use selection**, review the text, and click **Ask**. You can also type or paste a question.

Repeat the browser installation on the Mac using the same backend URL and panel token. Settings are saved separately on each browser, not automatically synced. A managed school browser may prevent extension installation.

**Shortcut:** Alt+Shift+A on Windows, Option+Shift+A on Mac. Escape closes the panel. Tampermonkey's menu also has **Study Panel: Settings**, including when the panel is hidden. Discreet means a small corner button; it does not conceal activity from browser administrators or monitoring software.

## Privacy and limitations

- Only the question you explicitly send and the selected answer mode go to your backend and OpenAI. The script does not upload the page or submit answers to DeltaMath.
- The all-HTTPS match and unrestricted connection metadata allow you to configure more domains and your own backend. The domain allowlist controls where the main panel and selection capture operate.
- The OpenAI key stays on the backend. The separate panel token is stored in Tampermonkey. Anyone with that token can use your backend, so do not share it.
- Questions and answers are not saved by this application. The backend requests `store:false`; that is not a guarantee of zero provider retention.
- Images, graphs, and canvas questions are not interpreted. Copy readable text or describe the problem. Answers use plain text, not rendered LaTeX. Each question is independent; include context for follow-ups. AI answers can be incorrect.
- Closing the panel does not cancel a pending request; use **Cancel**. A hosted service may need time to wake up.

## Optional local backend

Install Node.js 22 or later. Copy `.env.example` to `.env`, enter your new API key and a separate random panel token of at least 32 characters, then run `npm start` from this folder. Generate a token with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Use `http://127.0.0.1:8787` in panel settings. This local address works only on the computer running the backend; use hosting for both computers.

## Verification

Run `npm test`. Tests use a simulated provider, so they do not spend API credits. The real API, browser extension, and online hosting still need an end-to-end check after you supply your private configuration.

References: https://developers.openai.com/api/docs/quickstart · https://render.com/docs/infrastructure-as-code · https://www.tampermonkey.net/documentation.php
