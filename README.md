# Yukime - Local AI Client

A sophisticated, private, and high-performance frontend for local LLM engines like **LM Studio** or **Ollama**.

## 🚀 Run Locally

### Prerequisites
- **Node.js** (v18 or higher)
- **LM Studio** (or any OpenAI-compatible local server)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure LM Studio
1. Open **LM Studio**.
2. Go to the **Local Server** tab (↔️ icon).
3. Select and load your desired model.
4. Click **Start Server**.
5. Ensure **CORS** is enabled in the server settings (usually on by default in recent versions).

### 3. Run the app
```bash
npm run dev
```

### 4. Connect
- Open the app in your browser.
- Go to **System Config** (Settings icon).
- Enter your local server URL (Default: `http://localhost:1234`).
- Select your loaded model from the dropdown.
- Click **Apply Config** and start chatting!

---
**Note:** This application runs 100% locally in your browser. It does not require a Gemini API key or any cloud-based services. Your data never leaves your machine.
