# Blueprint Vision - Product Requirements Document

**Version:** 0.1.0 (PoC)  
**Date:** December 13, 2024  
**Author:** Paumalu Innovations  

---

## Executive Summary

**Blueprint Vision** is a consumer-facing application that transforms natural language descriptions into stunning, AI-generated technical blueprints. Users describe abstract concepts, systems, metaphors, or ideas—and receive beautiful, professional blueprint-style visualizations.

*"What blueprint can you envision?"*

---

## The Core Insight

The **Blueprint MCP** (by Blueprint Draw) wraps a powerful generative image model (Gemini) that produces stunning technical blueprint imagery. The heavy lifting is in the image generation. The key value-add of this application is the **prompt engineering layer**—an LLM middleware that transforms casual human descriptions into rich, detailed prompts that unlock the full potential of the generative model.

### The Magic Formula
```
User's Simple Idea → LLM Prompt Enrichment → Blueprint MCP → Stunning Visual
```

**Example Transformation:**
- **User Input:** "the complexity of a project, like an iceberg"
- **Enriched Prompt:** 800+ word detailed prompt describing underwater node networks, waterline transitions, observer positioning, annotation styling, blueprint aesthetics, revision blocks, cross-section callouts...
- **Output:** The spectacular iceberg diagram with "Approved by: Morpheus, Checked by: Freud"

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BLUEPRINT VISION                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐  │
│   │   Frontend   │────▶│   LLM Middleware │────▶│  Blueprint MCP │  │
│   │  (Expo/Web)  │     │  (Prompt Enrich) │     │   (via Arcade) │  │
│   └──────────────┘     └──────────────────┘     └────────────────┘  │
│         │                      │                        │            │
│         ▼                      ▼                        ▼            │
│   • Text input           • Claude/GPT-4          • Gemini Image Gen │
│   • Gallery view         • OR Llama 4 Scout      • Job management   │
│   • Share/export         • OR DeepSeek-R1        • Status polling   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend: Expo Router (React Native + Web)
- **Why:** Cross-platform from single codebase (iOS, Android, Web)
- **Framework:** Expo Router v4 with file-based routing

### LLM Middleware Options

| Option | Pros | Cons |
|--------|------|------|
| **Vercel AI SDK + Claude/GPT-4** | Best prompt quality, native MCP support | Higher cost |
| **Cloudflare Workers AI + Llama 4** | Fast edge inference, low cost | May need tuning |
| **Anthropic API Direct** | Claude excels at prompt crafting | API management |

### MCP Hosting
- **Service:** Arcade.dev persistent MCP hosting
- **Transport:** SSE (Server-Sent Events)

---

## User Flow

```
1. USER lands on app → "What blueprint can you envision?"
2. USER describes their vision
3. APP enriches the prompt (LLM middleware)
4. APP calls Blueprint MCP → StartDiagramJob
5. APP polls for completion (30-60 seconds)
6. APP displays result with download/share options
```

---

## Blueprint MCP Tools

- `StartDiagramJob(description, diagram_type, aspect_ratio, resolution)`
- `CheckJobStatus(job_id)`  
- `DownloadDiagram(job_id)`

**Diagram types:** architecture, flowchart, data_flow, sequence, infographic, generic

**Aspect ratios:** 1:1, 16:9, 9:16, 4:3, 3:4, 21:9

**Resolutions:** 1K, 2K

---

## System Prompt for LLM Middleware

```
You are a Blueprint Architect - you transform abstract human concepts into 
detailed technical blueprint specifications for AI image generation.

When a user describes a concept, you must:

1. UNDERSTAND the core metaphor or idea
2. EXPAND it into visual components (structures, connections, layers, annotations)
3. ADD blueprint authenticity (title blocks, revision history, measurements)
4. INCLUDE style guidance (white lines on deep blue, technical precision)
5. OUTPUT a 500-1000 word description for the image generator

Remember: You are translating CONCEPTS into VISUAL ENGINEERING SPECIFICATIONS.
```

---

## MVP Checklist

- [ ] Single-screen text input interface
- [ ] LLM prompt enrichment
- [ ] Blueprint MCP integration
- [ ] Progress polling and result display
- [ ] Image download functionality
- [ ] Error handling

---

*Ma ka hana ka ʻike - In working, one learns.*
