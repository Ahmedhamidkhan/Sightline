<div align="center">
  <br />
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/sparkles.svg" width="60" alt="Sightline Logo" />
  <h1>SIGHTLINE</h1>
  <p>
    <strong>A live web application that allows users to upload an image and ask natural language questions about its contents.</strong><br>
    <em>Built in under seven days to prove that vibe coding is leverage.</em>
  </p>
  <br />
</div>

---

## ✨ Features

- **📸 Instant Uploads:** Drag-and-drop or select images up to 5MB, or just paste a URL!
- **⚡ Lightning Fast AI:** Powered by the cutting-edge **Gemini 2.5 Flash** vision model for sub-second responses.
- **💬 Persistent Chat:** Ask unlimited follow-up questions without re-uploading your image.
- **🗂️ History Sidebar:** A slick, collapsible sidebar that saves all your past interactions securely.
- **🎨 Premium Dark Mode:** Beautiful glassmorphism UI built with Tailwind CSS and Framer Motion.

## 🏗️ Architecture & Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend/Inference:** Next.js Route Handlers securely proxying requests to the Gemini 2.5 API
- **Database & Auth:** Supabase

### 🧐 Why Supabase?

The brief required a choice between Supabase and Neon. I chose **Supabase** because it provides a cohesive, all-in-one backend-as-a-service. While Neon is fantastic for pure serverless Postgres, Sightline required three distinct backend primitives:
1. **Authentication** (Magic Links & Google Auth)
2. **Database** (storing query history)
3. **Object Storage** (storing uploaded images so they render in the history sidebar)

Supabase handles all three out of the box with an integrated SDK and unified Row Level Security (RLS) policies, allowing me to ship faster without stitching together multiple third-party services!

## 🚀 Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ahmedhamidkhan/Sightline.git
   cd Sightline
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Environment Variables:**
   Copy `.env.example` to `.env.local` and add your Supabase and Gemini API keys.
4. **Database Setup:**
   Run the SQL schema provided in the Supabase SQL editor to create the `queries` table and storage bucket.
5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

## 🔮 Future Improvements (With Another Week)

If I had another week to work on Sightline, I would implement real-time streaming for the AI responses using the Vercel AI SDK (`ai` package). Currently, the user waits a few seconds for the entire response block to generate. Streaming the text token-by-token would drastically improve the perceived latency and make the interface feel much more conversational and alive. I would also add image cropping and compression on the client side before uploading to save storage bandwidth and speed up the API transit time.
