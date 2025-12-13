# 🔷 Blueprint Vision

**Transform ideas into stunning AI-generated blueprints**

An Expo Router React Native app (iOS, Android, Web) that takes natural language descriptions and generates beautiful technical blueprint visualizations.

---

## 🏁 LLM Challenge: Build the MVP!

This is a scaffold for a competitive LLM challenge. Your mission:

### The Goal
Build a working MVP that:
1. Takes user text input describing a concept/metaphor/system
2. Enriches that prompt using an LLM (make it detailed and blueprint-worthy)
3. Calls the Blueprint MCP to generate the image
4. Displays the result to the user

### The Blueprint MCP
The heavy lifting is done by the Blueprint MCP (uses Gemini image generation under the hood).

**Tools available:**
- `StartDiagramJob` - Start generation with description, diagram_type, aspect_ratio, resolution
- `CheckJobStatus` - Poll for completion (typically 30-60s)
- `DownloadDiagram` - Get the image URL

**Diagram types:** `architecture`, `flowchart`, `data_flow`, `sequence`, `infographic`, `generic`

**Aspect ratios:** `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `21:9`

**Resolutions:** `1K`, `2K`

### Your Tasks

1. **Prompt Enrichment Layer**
   - Transform casual user input into detailed blueprint specifications
   - Add visual elements, annotations, technical styling
   - Think: "iceberg metaphor" → 800-word detailed prompt with underwater nodes, observer figure, revision blocks, etc.

2. **API Integration**
   - Create an API route or service to handle Blueprint MCP calls
   - Implement job polling with appropriate intervals
   - Handle errors gracefully

3. **UI Polish**
   - Loading states with progress indication
   - Image display (zoomable, shareable)
   - Error handling with retry option
   - Maybe: aspect ratio picker, diagram type selector

4. **Bonus Points**
   - Save to gallery
   - Share functionality
   - "Remix" - iterate on existing blueprints
   - Smooth animations

### Tech Constraints
- Keep it Expo Router compatible (no ejecting)
- Works on web AND mobile
- Can use any LLM provider for prompt enrichment
- Can mock the MCP if needed, but real integration preferred

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development
npx expo start

# Run on specific platform
npx expo start --web
npx expo start --ios
npx expo start --android
```

---

## 📁 Project Structure

```
blueprint_mvp_main/
├── app/
│   ├── _layout.tsx      # Root layout with navigation
│   └── index.tsx        # Main screen (start here!)
├── assets/              # App icons and images
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

---

## 🎨 Design System

| Element | Color |
|---------|-------|
| Background | `#0d1b2a` |
| Card/Surface | `#1a365d` |
| Primary Text | `#e2e8f0` |
| Secondary Text | `#8ba3be` |
| Accent | `#4fd1c5` |
| Muted | `#3a5a7a` |

---

## 📋 Judging Criteria

1. **Functionality** - Does it actually generate blueprints?
2. **Code Quality** - Clean, readable, maintainable
3. **UX Polish** - Smooth, delightful experience
4. **Creativity** - Innovative solutions, nice touches
5. **Error Handling** - Graceful failures, good feedback

---

## 🌺 Ma ka hana ka ʻike
*In working, one learns.*

Good luck, and may the best LLM win!
