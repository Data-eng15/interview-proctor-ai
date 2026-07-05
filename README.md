# 👁 ProctorAI — AI Interview Proctoring System

> Real-time, in-browser AI proctoring for remote interviews — face, gaze, object and voice monitoring, with a live integrity score. **No video ever leaves the browser.**

**ProctorAI** is a working MVP that realizes the system proposed in the peer-reviewed paper
**“AI-Based Proctoring System with Advanced Features for Interview Proctoring”**
(M. V. Thorwat, A. M. Yadav, **S. N. Dharne**, R. S. Patil, S. S. Laykar — *ISTE Journal, Vol. 47, Special Issue No. 1, August 2024*).

The paper proposes lip-sync detection, voice recognition, face detection and environment scanning to secure remote interviews. This app implements those ideas as a **fully client-side web app**: every model runs in the browser via WebGL/WASM, so the candidate's camera and microphone feed never touch a server.

🔗 **Live demo:** https://data-eng15.github.io/interview-proctor-ai/

> ⚠️ Requires camera + microphone access and a modern browser (Chrome/Edge recommended). All processing is local.

---

## ✨ What it does

| Signal | How | Paper feature |
| ------ | --- | ------------- |
| **Face presence & identity** | MediaPipe Face Landmarker (478-point mesh), face-count | Face detection |
| **Impersonation / help** | Flags multiple faces or a second person (COCO-SSD) | Face detection |
| **Gaze / looking away** | Eye-look blendshapes → direction estimate | Advanced monitoring |
| **Environment scan** | TensorFlow.js COCO-SSD detects phones, books, people | Environment scanning |
| **Voice activity** | Web Audio API RMS voice-activity detection | Voice recognition |
| **Lip-sync mismatch** | Speech heard while lips are static → flag | Lip-sync detection |
| **Focus loss** | Tab switch, window blur, fullscreen exit | Integrity monitoring |

All signals feed a **debounced rules engine** that logs timestamped flags, drives a **live integrity score** (100 → down as flags fire), and produces a **downloadable end-of-session report** with a verdict.

---

## 🏗️ Architecture

```
getUserMedia (camera + mic)
        │
        ├─► MediaPipe Face Landmarker ──► face count · jaw-open · gaze
        ├─► TensorFlow.js COCO-SSD ─────► phone · book · person boxes
        └─► Web Audio AnalyserNode ─────► voice activity
                        │
                        ▼
             Debounced rules engine (violations.ts)
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                 ▼
  live overlay     event log +      integrity score +
  (face mesh)      timestamps        session report
```

Everything is client-side — no backend, no API keys, no data collection.

---

## 🧰 Tech stack

- **React + TypeScript + Vite**
- **Tailwind CSS**
- **@mediapipe/tasks-vision** — Face Landmarker (mesh, blendshapes, head pose)
- **@tensorflow-models/coco-ssd** on **TensorFlow.js** — object detection
- **Web Audio API** — voice-activity detection
- **GitHub Pages** — static hosting (auto-deploy via GitHub Actions)

---

## 🚀 Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build && npm run preview
```

---

## ☁️ Deploy (GitHub Pages)

This repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys on every push to `main`.

1. Push to GitHub.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The next push deploys to `https://<user>.github.io/interview-proctor-ai/`.

The Vite `base` path is already set to `/interview-proctor-ai/` for production.

---

## ⚖️ Limitations (by design)

No webcam-only system can be a perfect anti-cheat, and ProctorAI is honest about that:

- **A phone fully out of frame** can only be inferred behaviorally — via sustained
  **looking-down** (head tilt *or* eyes-down, both calibrated per session). A device
  used with essentially no eye/head movement is undetectable by any single webcam.
- Real deployments layer additional controls this demo intentionally omits:
  lockdown browser, a second (phone) camera, ID/liveness verification, and human
  review. Automated flags here are **signals, not verdicts.**

## 🔒 Privacy

ProctorAI is a **technical demonstration**. All inference happens on-device; no
audio or video is uploaded, recorded or stored. Real proctoring deployments
should add explicit consent, accessibility accommodations, and human review —
automated flags are signals, not verdicts.

---

## 📄 Research paper

> **AI-Based Proctoring System with Advanced Features for Interview Proctoring.**
> Madhuri V. Thorwat, Anjali M. Yadav, Soham N. Dharne, Ritesh S. Patil, Supriya S. Laykar.
> ISTE Journal, Vol. 47, Special Issue No. 1, August 2024.

---

## 📝 License

MIT © Soham Dharne
