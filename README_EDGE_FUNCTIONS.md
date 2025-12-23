# LLM Edge Functions - Complete Guide

## Overview

This project uses Supabase Edge Functions to securely handle LLM-powered meme generation workflows. The edge functions call OpenAI's API with vision capabilities to analyze meme templates and generate/refine captions.

## Architecture

```
┌─────────────────┐
│  React Frontend │
│  (src/services/ │
│     llm.ts)     │
└────────┬────────┘
         │
         │ HTTP POST
         │
         ▼
┌─────────────────────┐
│ Supabase Edge       │
│ Functions (Deno)    │
│ - ai-select-template│
│ - ai-generate-      │
│   captions          │
│ - hf-refine-caption │
└────────┬────────────┘
         │
         │ API Call
         │
         ▼
┌─────────────────┐
│  OpenAI API     │
│  (GPT-4o-mini)  │
└─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** and npm installed
2. **Supabase CLI**: `npm install -g supabase`
3. **Deno VS Code Extension**: Install from VS Code Extensions
4. **OpenAI API Key**: Get from https://platform.openai.com/api-keys
5. **Docker or Rancher Desktop**: For local Supabase testing

### Setup Steps

1. **Configure Environment Variables**

Create/edit `.env.local`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
```

2. **Reload VS Code Window**

After setting up Deno extension:
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- Type "Reload Window"
- Select "Developer: Reload Window"

This enables Deno for the `supabase/functions/` directory.

3. **Start Local Supabase**

```bash
npx supabase start
```

This will output your local credentials (save these!):
```
API URL: http://127.0.0.1:54321
Anon key: eyJ...
```

4. **Serve Edge Functions**

In a new terminal:

```bash
npx supabase functions serve --env-file .env.local
```

5. **Test the Functions**

```bash
node test-supabase-function.cjs
```

---

## Edge Functions API

### 1. ai-select-template

**Purpose**: AI-First workflow - Select the best meme template for a given topic

**Location**: `supabase/functions/ai-select-template/`

**Request**:
```typescript
{
  topic: string;
  templates: Array<{
    templateId: string | number;
    base64: string;
    mimeType: string;
    description?: string;
  }>;
}
```

**Response**:
```typescript
{
  selectedTemplateId: string | number;
}
```

**Example**:
```typescript
import { selectTemplate, prepareTemplatesForSelection } from '@/services/llm';

const templates = await prepareTemplatesForSelection([
  { id: 'doge', path: '/src/assets/templates/doge.jpg' },
  { id: 'drake', path: '/src/assets/templates/choice.jpg' },
]);

const result = await selectTemplate({
  topic: 'Procrastination',
  templates,
});
```

### 2. ai-generate-captions

**Purpose**: AI-First workflow - Generate 3 funny captions for a template

**Location**: `supabase/functions/ai-generate-captions/`

**Request**:
```typescript
{
  topic: string;
  templateBase64: string;
  templateMimeType: string;
  descriptionOfMemeTemplate?: string;
}
```

**Response**:
```typescript
{
  aiCaptions: [string, string, string];
}
```

**Example**:
```typescript
import { generateCaptions, prepareTemplateForCaptions } from '@/services/llm';

const { base64, mimeType } = await prepareTemplateForCaptions(
  '/src/assets/templates/doge.jpg'
);

const result = await generateCaptions({
  topic: 'Monday mornings',
  templateBase64: base64,
  templateMimeType: mimeType,
});
// Returns: { aiCaptions: ["Caption 1", "Caption 2", "Caption 3"] }
```

### 3. hf-refine-caption

**Purpose**: Human-First workflow - AI picks and improves the best of 3 human captions

**Location**: `supabase/functions/hf-refine-caption/`

**Request**:
```typescript
{
  topic: string;
  templateBase64: string;
  templateMimeType: string;
  descriptionOfMemeTemplate?: string;
  humanCaptions: [string, string, string];
}
```

**Response**:
```typescript
{
  finalCaption: string;
}
```

**Example**:
```typescript
import { refineCaption, prepareTemplateForCaptions } from '@/services/llm';

const { base64, mimeType } = await prepareTemplateForCaptions(
  '/src/assets/templates/doge.jpg'
);

const result = await refineCaption({
  topic: 'Debugging',
  templateBase64: base64,
  templateMimeType: mimeType,
  humanCaptions: [
    'When the code works but you don\'t know why',
    'Debugging at 3 AM',
    'Stack Overflow is my friend',
  ],
});
// Returns: { finalCaption: "When your code works but you have no idea why" }
```

---

## 🚀 Deployment to Production

### Deploy to Supabase Cloud

```bash
# 1. Login to Supabase
npx supabase login

# 2. Link to your project (get project-ref from Supabase dashboard)
npx supabase link --project-ref <your-project-ref>

# 3. Deploy all functions
npx supabase functions deploy ai-select-template
npx supabase functions deploy ai-generate-captions
npx supabase functions deploy hf-refine-caption

# 4. Set environment variables in Supabase Dashboard
# Go to: Project Settings > Edge Functions > Add new secret
# Add: OPENAI_API_KEY and OPENAI_MODEL
```

### Environment Variables (Production)

Set in Supabase Dashboard (Project Settings > Edge Functions):

```
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
```

**Supported Models**:
- `gpt-4o` - Most capable with vision
- `gpt-4o-mini` - Faster, cheaper, recommended (default)
- `gpt-4-turbo` - Previous generation with vision

---

## 💻 Frontend Integration

### Service Layer (`src/services/llm.ts`)

The frontend service layer provides TypeScript functions with proper typing:

```typescript
import { 
  selectTemplate, 
  generateCaptions, 
  refineCaption,
  prepareTemplatesForSelection,
  prepareTemplateForCaptions
} from '@/services/llm';
```

### Image Utilities (`src/utils/imageToBase64.ts`)

Helper functions to convert images to base64:

```typescript
import { 
  imageToBase64,           // Convert File to base64
  imagePathToBase64,       // Load and convert image from path
  getMimeTypeFromExtension // Get MIME type from filename
} from '@/utils/imageToBase64';
```

### Error Handling

All edge functions return errors in this format:

```typescript
{
  error: string;
}
```

**HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (validation error)
- `500` - Internal Server Error (OpenAI API failure, etc.)

**Frontend Error Handling Example**:

```typescript
try {
  const result = await generateCaptions({
    topic: 'Test',
    templateBase64: base64,
    templateMimeType: 'image/jpeg',
  });
  console.log(result.aiCaptions);
} catch (error) {
  if (error instanceof Error) {
    console.error('Caption generation failed:', error.message);
  }
}
```

---

## 🧪 Testing

### Local Testing

```bash
# 1. Start Supabase
npx supabase start

# 2. Serve functions (in new terminal)
npx supabase functions serve --env-file .env.local

# 3. Run test script
node test-supabase-function.cjs
```

### Manual Testing with curl

```bash
# Get anon key from `npx supabase status`
curl -i --location --request POST \
  'http://127.0.0.1:54321/functions/v1/ai-generate-captions' \
  --header 'apikey: YOUR_ANON_KEY' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "topic": "Monday mornings",
    "templateBase64": "base64_string_here",
    "templateMimeType": "image/jpeg"
  }'
```

---

## 🔧 Troubleshooting

### TypeScript Errors in VS Code

**Symptom**: "Cannot find name Deno" or import errors

**Solution**:
1. Install Deno VS Code extension
2. Reload VS Code window (`Ctrl+Shift+P` → "Reload Window")
3. Verify `.vscode/settings.json` exists with Deno config
4. Check bottom-right of VS Code shows "Deno" when editing edge functions

### Function Returns 500 Error

**Check**:
1. Edge function logs: `npx supabase functions logs`
2. Verify `OPENAI_API_KEY` is set correctly in Supabase Dashboard
3. Ensure OpenAI account has available credits
4. Check OpenAI API status: https://status.openai.com

### CORS Errors

The functions include CORS headers by default. If you still get errors:
1. Verify allowed origins in Supabase project settings
2. Ensure you're using correct Supabase URL
3. Check that you're including both `apikey` and `Authorization` headers

### Image Too Large

If base64 payload is too large:
1. Resize images before converting to base64
2. Use JPEG instead of PNG (smaller file size)
3. Compress images (80% quality is usually fine)

### Test Script Fails

**Common issues**:
1. Supabase not running: `npx supabase start`
2. Functions not served: `npx supabase functions serve --env-file .env.local`
3. Wrong URL: Use `http://127.0.0.1:54321` not `http://localhost:54321`
4. Missing API key in `.env.local`

---

## 💰 Cost Optimization

**Estimated Costs** (using gpt-4o-mini):

- Template Selection: ~$0.001-0.002 per request (3-5 images)
- Caption Generation: ~$0.0005 per request (1 image)
- Caption Refinement: ~$0.0005 per request (1 image)

**Tips to Reduce Costs**:

1. Use `gpt-4o-mini` instead of `gpt-4o` (10x cheaper)
2. Compress images before sending (reduce base64 size)
3. Cache results when possible
4. Implement rate limiting on frontend
5. Use template descriptions to reduce image size when possible

---

## 📊 Monitoring

### View Logs

```bash
# View logs for all functions
npx supabase functions logs

# View logs for specific function
npx supabase functions logs ai-generate-captions

# Follow logs in real-time
npx supabase functions logs --follow
```

### Supabase Dashboard

Monitor usage in Project Dashboard:
- Edge Functions → Function name → Logs
- Project Settings → Usage (for billing)

---

## 🔒 Security Features

✅ **API Keys Protected**: OpenAI API key stored server-side only  
✅ **CORS Enabled**: Configured for browser requests  
✅ **Input Validation**: All inputs validated before processing  
✅ **Strict JSON**: Uses OpenAI's structured output (JSON Schema)  
✅ **Error Handling**: Clear error messages without exposing internals

---

## 📁 File Structure

```
llm-meme-collab/
├── supabase/
│   ├── config.toml              # Supabase configuration
│   └── functions/
│       ├── ai-select-template/
│       │   ├── index.ts         # Edge function code
│       │   └── deno.json        # Deno configuration
│       ├── ai-generate-captions/
│       │   ├── index.ts         # Edge function code
│       │   └── deno.json        # Deno configuration
│       └── hf-refine-caption/
│           ├── index.ts         # Edge function code
│           └── deno.json        # Deno configuration
├── src/
│   ├── services/
│   │   └── llm.ts               # Frontend service layer
│   └── utils/
│       └── imageToBase64.ts     # Image conversion utilities
├── .vscode/
│   └── settings.json            # VS Code Deno configuration
├── .env.local                   # Environment variables (API keys)
├── test-supabase-function.cjs   # End-to-end test script
└── README_EDGE_FUNCTIONS.md     # This file
```

---

## 🎯 What's Configured

All edge functions have:
- ✅ Proper Deno type imports (`jsr:@supabase/functions-js/edge-runtime.d.ts`)
- ✅ Updated `deno.json` configuration files
- ✅ VS Code settings to enable Deno for `supabase/functions/` directory
- ✅ OpenAI Vision API integration with structured JSON output
- ✅ CORS headers for browser compatibility
- ✅ Input validation and error handling
- ✅ Environment variable configuration

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)

---

## 🤝 Contributing

When adding new LLM workflows:

1. Create new edge function in `supabase/functions/`
2. Add corresponding TypeScript types and function in `src/services/llm.ts`
3. Update this README with usage examples
4. Test locally before deploying
5. Deploy and monitor logs

---

## License

Part of the LLM Meme Collaboration project.
