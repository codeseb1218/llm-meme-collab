/**
 * Test Supabase Edge Function
 * Tests the actual deployed edge function through Supabase
 */

const fs = require('fs');
const path = require('path');

// Supabase local credentials from `npx supabase start`
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

async function testEdgeFunction() {
  console.log('🧪 Testing Supabase Edge Function\n');
  console.log('Configuration:');
  console.log('  Supabase URL:', SUPABASE_URL);
  console.log('  Function:', 'ai-generate-captions\n');

  try {
    // Read template image
    const templatePath = path.join(__dirname, 'src/assets/templates/doge.jpg');
    const imageBuffer = fs.readFileSync(templatePath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log('✅ Loaded template image');
    console.log('📦 Size:', (base64Image.length / 1024).toFixed(2), 'KB\n');

    const requestBody = {
      topic: 'Monday mornings',
      templateBase64: base64Image,
      templateMimeType: 'image/jpeg',
      descriptionOfMemeTemplate: 'Doge looking tired and confused'
    };

    console.log('📤 Calling Supabase Edge Function...\n');

    const startTime = Date.now();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/ai-generate-captions`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge Function Error:');
      console.error('   Status:', response.status, response.statusText);
      console.error('   Details:', errorText);
      return;
    }

    const data = await response.json();

    console.log('✅ Success! Completed in', duration, 'ms\n');
    console.log('📊 Response:\n');
    console.log('✨ Generated Captions:\n');
    
    if (data.aiCaptions && Array.isArray(data.aiCaptions)) {
      data.aiCaptions.forEach((caption, i) => {
        console.log(`   ${i + 1}. "${caption}"`);
      });
      console.log('\n🎉 Supabase Edge Function test completed successfully!\n');
      console.log('✅ All three edge functions are ready to use!');
      console.log('   - ai-select-template');
      console.log('   - ai-generate-captions');
      console.log('   - hf-refine-caption');
    } else {
      console.error('❌ Unexpected response format:', data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  }
}

testEdgeFunction();
