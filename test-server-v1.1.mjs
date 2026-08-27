import http from 'http';
import https from 'https';

/**
 * AUTOMATED SERVER API TEST SUITE v1.1
 * Digital Signage System (WOD - Agung Toyota)
 */

const BASE_URL = (process.env.TEST_URL || 'http://localhost:8000/api').trim();

console.log('\n===========================================================');
console.log(`🚀 RUNNING AUTOMATION SERVER TEST SUITE v1.1`);
console.log(`📍 Target Server Endpoint: ${BASE_URL}`);
console.log('===========================================================\n');

const request = (url, options = {}, data = null) => {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const lib = isHttps ? https : http;

    const req = lib.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: null, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
};

const runTests = async () => {
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, name, details = '') => {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passedCount++;
    } else {
      console.log(`  ❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      failedCount++;
    }
  };

  try {
    // TEST 1: Public Display Settings Endpoint & ETag Header
    console.log('🔹 TEST 1: GET /v1/display/settings (Cache & ETag)');
    const res1 = await request(`${BASE_URL}/v1/display/settings`);
    assert(res1.status === 200, 'HTTP Status 200 OK');
    assert(Boolean(res1.headers['etag']), 'Header ETag Present', `ETag: ${res1.headers['etag']}`);
    assert(res1.data?.status === 'success', 'Response status "success"');
    assert(Boolean(res1.data?.data?.running_text_ticker), 'Setting "running_text_ticker" present');
    assert(Boolean(res1.data?.data?.promo_playlist), 'Setting "promo_playlist" present');
    assert(Boolean(res1.data?.data?.enable_tts), 'Setting "enable_tts" present');

    // TEST 2: Public Display Queues Endpoint
    console.log('\n🔹 TEST 2: GET /v1/display/queues (Live Queue Data)');
    const res2 = await request(`${BASE_URL}/v1/display/queues`);
    assert(res2.status === 200, 'HTTP Status 200 OK');
    assert(res2.data?.status === 'success', 'Response status "success"');
    assert(Array.isArray(res2.data?.data), 'Queue data is Array');

    // TEST 3: Admin CMS Settings Endpoint
    console.log('\n🔹 TEST 3: GET /v1/admin/settings (Admin CMS Data)');
    const res3 = await request(`${BASE_URL}/v1/admin/settings`);
    assert(res3.status === 200, 'HTTP Status 200 OK');
    assert(res3.data?.status === 'success', 'Response status "success"');
    assert(Boolean(res3.data?.data?.running_text_ticker?.value), 'CMS ticker value loaded');

    // TEST 4: Admin CMS Update Batch Settings
    console.log('\n🔹 TEST 4: PUT /v1/admin/settings (CMS Update & Cache Invalidation)');
    const updatePayload = {
      running_text_ticker: res3.data?.data?.running_text_ticker?.value || 'Selamat datang di Agung Toyota.',
      duration_media_sec: '60',
      duration_table_sec: '30',
      enable_tts: '1',
      duration_popup_sec: '12',
    };
    const res4 = await request(`${BASE_URL}/v1/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, updatePayload);
    assert(res4.status === 200, 'HTTP Status 200 OK');
    assert(res4.data?.status === 'success', 'Response status "success"');

    // TEST 5: Admin WA Notification Logs
    console.log('\n🔹 TEST 5: GET /v1/admin/wa-logs (WA Notification Logs)');
    const res5 = await request(`${BASE_URL}/v1/admin/wa-logs`);
    assert(res5.status === 200, 'HTTP Status 200 OK');
    assert(res5.data?.status === 'success', 'Response status "success"');
    assert(Array.isArray(res5.data?.data), 'WA Logs is Array');

  } catch (err) {
    console.error('❌ ERROR RUNNING TEST SUITE:', err.message);
    failedCount++;
  }

  console.log('\n===========================================================');
  console.log(`📊 TEST SUITE SUMMARY v1.1`);
  console.log(`  PASSED : ${passedCount}`);
  console.log(`  FAILED : ${failedCount}`);
  console.log(`  RESULT : ${failedCount === 0 ? '🎉 ALL TESTS PASSED SUCCESSFULLY!' : '⚠️ SOME TESTS FAILED'}`);
  console.log('===========================================================\n');

  process.exit(failedCount === 0 ? 0 : 1);
};

runTests();
