# VoiceOwl Developer Evaluation Task - Video Demo Script
**Duration: 2-3 minutes**

## 🎬 Video Recording Script

### Introduction (15 seconds)
**"Hello! I'm presenting my implementation of the VoiceOwl Developer Evaluation Task - a complete audio transcription API service with workflow engine, built using Node.js, TypeScript, and MongoDB."**

**Screen**: Show README.md with the complete features checklist

---

### Part 1 - Project Structure & Tech Stack (20 seconds)
**"Let me quickly show you the clean code architecture I've implemented."**

**Screen Actions**:
1. Open file explorer showing `src/` folder structure
2. Briefly highlight:
   - `controllers/` - HTTP request handling
   - `services/` - Business logic
   - `models/` - MongoDB schemas
   - `routes/` - API endpoints
   - `tests/` - Comprehensive test suite

**Narration**: *"I've organized the code into a clean, scalable architecture with proper separation of concerns."*

---

### Part 2 - Core API Functionality (30 seconds)
**"The API includes all required endpoints. Let me demonstrate them working."**

**Screen Actions**:
1. Show terminal with `npm run dev` running
2. Open browser or Postman
3. Demonstrate these API calls:

```bash
# 1. Mock Transcription (5 seconds)
POST http://localhost:3001/transcription
{
  "audioUrl": "https://example.com/sample.mp3",
  "language": "en-US"
}
```

```bash
# 2. Azure Transcription (5 seconds)  
POST http://localhost:3001/azure-transcription
{
  "audioUrl": "https://example.com/sample.wav",
  "language": "fr-FR"
}
```

```bash
# 3. Get Recent Transcriptions (5 seconds)
GET http://localhost:3001/transcriptions?page=1&limit=5
```

**Narration**: *"Here you can see the core transcription endpoints working - mock transcription, Azure integration with multi-language support, and the 30-day query with pagination."*

---

### Part 3 - Workflow Engine (45 seconds)
**"Now let me demonstrate the workflow engine - the key feature for Part 5 Option B."**

**Screen Actions**:

1. **Create Workflow** (10 seconds):
```bash
POST http://localhost:3001/workflow
{
  "audioUrl": "https://example.com/demo.mp3",
  "language": "en-US"
}
```
*Show the response with initial "transcription" status*

2. **Show Auto-progression** (15 seconds):
```bash
GET http://localhost:3001/workflow/{workflow-id}
```
*Wait 3-4 seconds and call again to show it auto-progressed to "review" status*

**Narration**: *"The workflow starts in transcription state and automatically progresses through review, approval, and completed states. Each transition is tracked with timestamps."*

3. **Manual Transition** (10 seconds):
```bash
PUT http://localhost:3001/workflow/{workflow-id}/transition
{
  "newStatus": "approval",
  "comment": "Manual approval",
  "reviewedBy": "demo-user"
}
```

4. **Workflow Statistics** (10 seconds):
```bash
GET http://localhost:3001/workflow/stats
```
*Show the statistics breakdown by status*

**Narration**: *"I can also manually control transitions and get real-time statistics across all workflow states."*

---

### Part 4 - MongoDB & Scalability (15 seconds)
**"The solution is built for production scale."**

**Screen Actions**:
1. Open `src/models/Transcription.model.ts` 
2. Highlight the indexing strategy:
```javascript
transcriptionSchema.index({ createdAt: -1 });
transcriptionSchema.index({ source: 1, createdAt: -1 });
```

3. Briefly show README.md scalability section

**Narration**: *"I've implemented proper MongoDB indexing for 100M+ records and documented a scalability strategy for 10k+ concurrent requests using clustering, caching, and message queues."*

---

### Part 5 - Testing & Quality (15 seconds)
**"The code includes comprehensive testing."**

**Screen Actions**:
1. Run in terminal:
```bash
npm test -- --testPathPatterns=transcription.test.ts
```
*Show passing tests briefly*

2. Show `tests/workflow.test.ts` file structure

**Narration**: *"I've written comprehensive tests covering all endpoints, edge cases, and the workflow engine functionality using Jest and MongoDB Memory Server."*

---

### Part 6 - Frontend Demo (15 seconds)
**"There's also a simple frontend for testing."**

**Screen Actions**:
1. Open browser to `http://localhost:3001/client/`
2. Quickly show the HTML interface
3. Test one workflow creation via the UI

**Narration**: *"I've included a clean frontend interface that allows testing all the API functionality directly from the browser."*

---

### Conclusion (10 seconds)
**"This implementation covers all 6 parts of the evaluation task with production-ready code, proper architecture, and comprehensive testing."**

**Screen**: Show the final README.md with all checkmarks ✅

**Final Statement**: *"The complete codebase demonstrates scalable Node.js development, MongoDB optimization, workflow engine implementation, and full-stack capabilities. Thank you!"*

---

## 🎥 Recording Tips

### Before Recording:
1. **Start the server**: `npm run dev`
2. **Prepare API client**: Have Postman/Insomnia/curl ready
3. **Clear terminal**: Clean output for recording
4. **Open files**: Have key files ready in VS Code tabs

### During Recording:
1. **Speak clearly**: Explain what you're showing
2. **Move deliberately**: Don't rush through the demos
3. **Show results**: Always show the API responses
4. **Highlight key features**: Point out important code sections

### Demo Data to Use:
```json
{
  "audioUrl": "https://example.com/sample.mp3",
  "language": "en-US"
}
```

```json
{
  "audioUrl": "https://demo-audio.com/speech.wav", 
  "language": "fr-FR"
}
```

### Key Points to Emphasize:
1. ✅ **All 6 parts completed**
2. ✅ **Clean TypeScript architecture**
3. ✅ **Workflow engine with async progression**
4. ✅ **MongoDB optimization strategy**
5. ✅ **Comprehensive testing**
6. ✅ **Production-ready scalability**

### Backup Commands (if needed):
```bash
# If server needs restart
npm run dev

# If you need to see all endpoints
curl http://localhost:3001/workflow/stats

# Quick workflow creation
curl -X POST http://localhost:3001/workflow -H "Content-Type: application/json" -d '{"audioUrl": "https://example.com/test.mp3"}'
```

This script ensures you hit all the evaluation criteria while keeping the video concise and professional!
