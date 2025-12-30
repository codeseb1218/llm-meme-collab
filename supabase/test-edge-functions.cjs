/**
 * Comprehensive Test Suite for Supabase Edge Functions
 * Tests all three edge functions with proper error handling and clear output
 */

const fs = require('fs');
const path = require('path');

// Supabase local credentials from `npx supabase start`
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// Helper function to read and encode image
function loadImageAsBase64(relativePath) {
  const imagePath = path.join(__dirname, relativePath);
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  return base64Image;
}

// Helper function to call edge function
async function callEdgeFunction(functionName, requestBody) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${functionName}`,
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

// Test 1: ai-select-template
async function testSelectTemplate() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 1: ai-select-template');
  console.log('='.repeat(70));
  console.log('📋 Task: AI selects the best meme template for "Student Life"');
  console.log('📦 Testing with 4 templates\n');

  try {
    // Load the first 4 templates
    const templates = [
      {
        templateId: '00',
        name: 'Absolute_Cinema.jpg',
        path: '../src/assets/templates/Absolute_Cinema.jpg',
      },
      {
        templateId: '01',
        name: 'Change_My_Mind.jpg',
        path: '../src/assets/templates/Change_My_Mind.jpg',
      },
      {
        templateId: '02',
        name: 'Disaster_Girl.jpg',
        path: '../src/assets/templates/Disaster_Girl.jpg',
      },
      {
        templateId: '03',
        name: 'Laughing_Leo.jpg',
        path: '../src/assets/templates/Laughing_Leo.jpg',
      },
    ];

    console.log('📥 Loading templates...');
    const templatesWithBase64 = templates.map(t => {
      const base64 = loadImageAsBase64(t.path);
      console.log(`   ✓ ${t.templateId}: ${t.name} (${(base64.length / 1024).toFixed(1)} KB)`);
      return {
        templateId: t.templateId,
        base64: base64,
        mimeType: 'image/jpeg',
      };
    });

    const requestBody = {
      topic: 'Student Life',
      templates: templatesWithBase64,
    };

    console.log('\n📤 Calling ai-select-template...');
    const startTime = Date.now();
    const data = await callEdgeFunction('ai-select-template', requestBody);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Success! Completed in ${duration}ms\n`);
    console.log('📊 Response:');
    console.log(`   Selected Template ID: ${data.selectedTemplateId}`);
    
    const selectedTemplate = templates.find(t => t.templateId === data.selectedTemplateId);
    if (selectedTemplate) {
      console.log(`   Template Name: ${selectedTemplate.name}`);
    }

    console.log('\n🎉 TEST 1 PASSED: Template selection successful!\n');
    return true;

  } catch (error) {
    console.error('\n❌ TEST 1 FAILED:');
    console.error('   Error:', error.message);
    return false;
  }
}

// Test 2: ai-generate-captions
async function testGenerateCaptions() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 2: ai-generate-captions');
  console.log('='.repeat(70));
  console.log('📋 Task: AI generates 3 funny captions for "Student Life"');
  console.log('📦 Using template: Absolute_Cinema.jpg\n');

  try {
    const templatePath = '../src/assets/templates/Absolute_Cinema.jpg';
    const base64Image = loadImageAsBase64(templatePath);
    
    console.log('✅ Loaded template image');
    console.log(`📦 Size: ${(base64Image.length / 1024).toFixed(2)} KB\n`);

    const requestBody = {
      topic: 'Student Life',
      templateBase64: base64Image,
      templateMimeType: 'image/jpeg',
      descriptionOfMemeTemplate: 'Person in cinema saying "kino" (meaning cinema/perfection)',
    };

    console.log('📤 Calling ai-generate-captions...');
    const startTime = Date.now();
    const data = await callEdgeFunction('ai-generate-captions', requestBody);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Success! Completed in ${duration}ms\n`);
    console.log('📊 Response:\n');
    console.log('✨ Generated Captions:\n');
    
    if (data.aiCaptions && Array.isArray(data.aiCaptions)) {
      data.aiCaptions.forEach((caption, i) => {
        console.log(`   ${i + 1}. "${caption}"`);
      });
      console.log('\n🎉 TEST 2 PASSED: Caption generation successful!\n');
      return true;
    } else {
      console.error('❌ Unexpected response format:', data);
      return false;
    }

  } catch (error) {
    console.error('\n❌ TEST 2 FAILED:');
    console.error('   Error:', error.message);
    return false;
  }
}

// Test 3: hf-refine-caption
async function testRefineCaption() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 3: hf-refine-caption');
  console.log('='.repeat(70));
  console.log('📋 Task: AI picks and refines the best of 3 human captions');
  console.log('📦 Using template: Change_My_Mind.jpg\n');

  try {
    const templatePath = '../src/assets/templates/Change_My_Mind.jpg';
    const base64Image = loadImageAsBase64(templatePath);
    
    console.log('✅ Loaded template image');
    console.log(`📦 Size: ${(base64Image.length / 1024).toFixed(2)} KB\n`);

    // Three human-generated captions for "Student Life"
    const humanCaptions = [
      'Finals week is just a myth invented by professors',
      'Student life: 99% stress, 1% actually learning',
      'Sleep, study, social life - pick two',
    ];

    console.log('📝 Human Captions:');
    humanCaptions.forEach((caption, i) => {
      console.log(`   ${i + 1}. "${caption}"`);
    });

    const requestBody = {
      topic: 'Student Life',
      templateBase64: base64Image,
      templateMimeType: 'image/jpeg',
      descriptionOfMemeTemplate: 'Person sitting at table with sign "Change My Mind"',
      humanCaptions: humanCaptions,
    };

    console.log('\n📤 Calling hf-refine-caption...');
    const startTime = Date.now();
    const data = await callEdgeFunction('hf-refine-caption', requestBody);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Success! Completed in ${duration}ms\n`);
    console.log('📊 Response:\n');
    console.log('✨ Final Refined Caption:\n');
    console.log(`   "${data.finalCaption}"\n`);
    
    console.log('🎉 TEST 3 PASSED: Caption refinement successful!\n');
    return true;

  } catch (error) {
    console.error('\n❌ TEST 3 FAILED:');
    console.error('   Error:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '█'.repeat(70));
  console.log('🚀 SUPABASE EDGE FUNCTIONS - COMPREHENSIVE TEST SUITE');
  console.log('█'.repeat(70));
  console.log('\nConfiguration:');
  console.log(`  Supabase URL: ${SUPABASE_URL}`);
  console.log('  Testing Functions:');
  console.log('    1. ai-select-template');
  console.log('    2. ai-generate-captions');
  console.log('    3. hf-refine-caption');

  const results = {
    selectTemplate: false,
    generateCaptions: false,
    refineCaption: false,
  };

  // Run tests sequentially
  results.selectTemplate = await testSelectTemplate();
  results.generateCaptions = await testGenerateCaptions();
  results.refineCaption = await testRefineCaption();

  // Summary
  console.log('\n' + '█'.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('█'.repeat(70));
  console.log(`\n  ai-select-template:     ${results.selectTemplate ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  ai-generate-captions:   ${results.generateCaptions ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  hf-refine-caption:      ${results.refineCaption ? '✅ PASSED' : '❌ FAILED'}`);

  const allPassed = results.selectTemplate && results.generateCaptions && results.refineCaption;
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! All edge functions are working correctly!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Please check the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});
