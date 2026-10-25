const assert = require('assert');
const path = require('path');
const mongoose = require('mongoose');
const app = require('../../frontend/netlify/functions/api.js');

async function testApiRoute() {
  console.log('Testing /api/generate-paper endpoint...');

  // Mock call or supertest-like simulation
  // Since app is an Express instance, we can start it on an ephemeral port or use a test client
  const server = app.listen(0);
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  const testPayload = {
    provider: 'gemini',
    apiKey: 'dummy_key_for_extraction_test',
    degree: 'MCA',
    department: 'MCA',
    semester: 3,
    subjectName: 'Natural Language Processing',
    examType: 'MST1',
    syllabus: 'Introduction to Natural Language Processing. Tokenization, Stemming, Lemmatization, Stop words removal, Part-of-speech tagging, Named Entity Recognition. TextBlob, NLTK, spaCy.',
  };

  try {
    const res = await fetch(`http://localhost:${port}/api/papers/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    console.log(`Response status: ${res.status}`);
    const data = await res.json();
    console.log('Response body:', JSON.stringify(data, null, 2));

    // Note: Since dummy_key was provided, the AI provider call may fail with 422 or auth error,
    // BUT notice the extraction and analysis info in the error or success response!
    console.log('Analysis info returned:', data.analysis || { paperCount: data.paperCount, analysisMode: data.analysisMode });

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('API route test error:', err);
    server.close();
    process.exit(1);
  }
}

testApiRoute();
