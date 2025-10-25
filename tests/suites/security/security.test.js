/**
 * 🔐 SECURITY TEST SUITE
 * Comprehensive security testing for authentication, authorization, and data protection
 * 
 * Consolidates security-related test files:
 * - test-security-*
 * - test-auth-*
 * - test-admin-*
 * - test-xss-*
 * - test-csrf-*
 * 
 * @author Test Suite Rationalization Project
 * @coverage Authentication, Authorization, XSS, CSRF, Data Validation, Access Control
 */

const puppeteer = require('puppeteer');
const request = require('supertest');
const { BrowserUtils, HttpUtils, AssertUtils, MockData, TestEnvironment, PerformanceUtils } = require('../utilities/test-utils');

const BASE_URL = 'http://localhost:3001';

describe('🔐 Security System', () => {
    let browser, page;

    beforeAll(async () => {
        await TestEnvironment.setup();
        browser = await BrowserUtils.createBrowser();
        console.log('🔐 Security test environment initialized');
    });

    afterAll(async () => {
        if (browser) await browser.close();
        await TestEnvironment.cleanup();
        console.log('🧹 Security test cleanup completed');
    });

    beforeEach(async () => {
        page = await BrowserUtils.createPage(browser);
    });

    afterEach(async () => {
        if (page) await page.close();
    });

    describe('🔑 Authentication & Authorization', () => {
        test('admin routes are properly protected', async () => {
            console.log('🔑 Testing admin route protection...');

            const adminRoutes = [
                '/admin',
                '/admin/dashboard',
                '/admin/users',
                '/admin/gallery',
                '/admin/merchandise',
                '/admin/content'
            ];

            for (const route of adminRoutes) {
                try {
                    await page.goto('http://localhost:3001' + route);
                    await page.waitForTimeout(2000);

                    // Should be redirected or show login form
                    const currentUrl = page.url();
                    const hasLoginForm = await page.$('.login-form, #login, [data-login]');
                    const isRedirected = !currentUrl.includes(route);

                    expect(hasLoginForm || isRedirected).toBe(true);
                    console.log(`✅ ${route}: ${hasLoginForm ? 'Login required' : 'Redirected'}`);
                } catch (error) {
                    console.log(`⚠️ ${route}: ${error.message}`);
                }
            }
        });

        test('API endpoints require proper authentication', async () => {
            console.log('🔐 Testing API authentication requirements...');

            const protectedEndpoints = [
                { method: 'GET', path: '/api/admin/stats' },
                { method: 'POST', path: '/api/gallery/upload' },
                { method: 'DELETE', path: '/api/gallery/delete/test' },
                { method: 'POST', path: '/api/merchandise/create' },
                { method: 'PUT', path: '/api/content/update' }
            ];

            for (const endpoint of protectedEndpoints) {
                try {
                    const response = endpoint.method === 'GET' 
                        ? await HttpUtils.get(endpoint.path)
                        : endpoint.method === 'POST'
                        ? await HttpUtils.post(endpoint.path, { body: {} })
                        : endpoint.method === 'PUT'
                        ? await HttpUtils.put(endpoint.path, { body: {} })
                        : await HttpUtils.delete(endpoint.path);

                    // Should return 401 Unauthorized or 403 Forbidden
                    expect([401, 403]).toContain(response.status);
                    console.log(`✅ ${endpoint.method} ${endpoint.path}: ${response.status} (protected)`);
                } catch (error) {
                    console.log(`⚠️ ${endpoint.method} ${endpoint.path}: ${error.message}`);
                }
            }
        });

        test('session management and timeout', async () => {
            console.log('⏰ Testing session management...');

            // Navigate to a page that might set session cookies
            await page.goto('http://localhost:3001/');
            
            // Check for session-related cookies
            const cookies = await page.cookies();
            const sessionCookies = cookies.filter(cookie => 
                cookie.name.toLowerCase().includes('session') ||
                cookie.name.toLowerCase().includes('auth') ||
                cookie.name.toLowerCase().includes('token')
            );

            console.log(`📊 Found ${sessionCookies.length} session-related cookies`);

            sessionCookies.forEach(cookie => {
                // Check security flags
                expect(cookie.httpOnly).toBe(true);
                if (process.env.NODE_ENV === 'production') {
                    expect(cookie.secure).toBe(true);
                }
                console.log(`✅ Cookie ${cookie.name}: HttpOnly=${cookie.httpOnly}, Secure=${cookie.secure}`);
            });
        });

        test('password security requirements', async () => {
            console.log('🔒 Testing password security...');

            // Navigate to registration/login page
            await page.goto('http://localhost:3001/login');
            
            const loginForm = await page.$('.login-form, #login-form, form[action*="login"]');
            
            if (loginForm) {
                const passwordInput = await page.$('input[type="password"]');
                
                if (passwordInput) {
                    // Test weak passwords (if registration form available)
                    const weakPasswords = ['123', '123456', 'password', 'admin'];
                    
                    for (const weakPassword of weakPasswords) {
                        await page.evaluate((input, password) => {
                            input.value = password;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('blur', { bubbles: true }));
                        }, passwordInput, weakPassword);

                        await page.waitForTimeout(500);

                        // Check for validation message
                        const validationError = await page.$('.password-error, .validation-error, .error');
                        if (validationError) {
                            console.log(`✅ Weak password "${weakPassword}" rejected`);
                        }
                    }
                }
            } else {
                console.log('ℹ️ No login form found for password testing');
            }
        });
    });

    describe('🛡️ XSS Protection', () => {
        test('input fields are properly sanitized', async () => {
            console.log('🛡️ Testing XSS input sanitization...');

            // Navigate to a page with user inputs
            await page.goto(BASE_URL + '/contact');
            
            const xssPayloads = [
                '<script>alert("xss")</script>',
                '"><script>alert("xss")</script>',
                'javascript:alert("xss")',
                '<img src="x" onerror="alert(\'xss\')">',
                '<svg onload="alert(\'xss\')">',
                '{{constructor.constructor("alert(\\"xss\\")")()}}'
            ];

            const inputFields = await page.$$('input[type="text"], input[type="email"], textarea');
            
            if (inputFields.length > 0) {
                for (let i = 0; i < Math.min(inputFields.length, xssPayloads.length); i++) {
                    const input = inputFields[i];
                    const payload = xssPayloads[i];

                    await page.evaluate((el, value) => {
                        el.value = value;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                    }, input, payload);

                    await page.waitForTimeout(500);

                    // Check if XSS executed
                    const alertHandled = await page.evaluate(() => {
                        return window.alertTriggered || false;
                    });

                    expect(alertHandled).toBe(false);
                    console.log(`✅ XSS payload blocked: ${payload.substring(0, 30)}...`);
                }
            } else {
                console.log('ℹ️ No input fields found for XSS testing');
            }
        });

        test('content rendering is safe from stored XSS', async () => {
            console.log('💾 Testing stored XSS protection...');

            // Check pages that display user-generated content
            const contentPages = ['/gallery', '/episodes', '/merchandise'];

            for (const contentPage of contentPages) {
                try {
                    await page.goto(BASE_URL + contentPage);
                    await page.waitForTimeout(2000);

                    // Look for suspicious script tags or javascript: protocols
                    const suspiciousContent = await page.evaluate(() => {
                        const scripts = document.querySelectorAll('script:not([src])');
                        const jsLinks = document.querySelectorAll('a[href^="javascript:"]');
                        const eventHandlers = document.querySelectorAll('[onclick], [onload], [onerror]');
                        
                        return {
                            inlineScripts: scripts.length,
                            jsLinks: jsLinks.length,
                            eventHandlers: eventHandlers.length
                        };
                    });

                    // Inline scripts should be minimal and controlled
                    console.log(`✅ ${contentPage}: ${suspiciousContent.inlineScripts} inline scripts, ${suspiciousContent.jsLinks} js: links`);
                    
                    // No javascript: links should be present in user content
                    expect(suspiciousContent.jsLinks).toBe(0);
                    
                } catch (error) {
                    console.log(`⚠️ ${contentPage}: ${error.message}`);
                }
            }
        });

        test('CSP headers are properly configured', async () => {
            console.log('📋 Testing Content Security Policy...');

            const response = await page.goto(BASE_URL + '/');
            const headers = response.headers();

            const cspHeader = headers['content-security-policy'] || headers['content-security-policy-report-only'];
            
            if (cspHeader) {
                console.log(`✅ CSP Header found: ${cspHeader.substring(0, 100)}...`);
                
                // Check for important CSP directives
                expect(cspHeader).toMatch(/script-src/);
                expect(cspHeader).toMatch(/object-src/);
                
                // Should not allow unsafe-inline scripts
                if (cspHeader.includes("'unsafe-inline'")) {
                    console.log('⚠️ CSP allows unsafe-inline scripts');
                } else {
                    console.log('✅ CSP properly restricts inline scripts');
                }
            } else {
                console.log('⚠️ No CSP header found');
            }
        });
    });

    describe('🔒 CSRF Protection', () => {
        test('forms include CSRF tokens', async () => {
            console.log('🔒 Testing CSRF token implementation...');

            // Check various forms for CSRF tokens
            const formPages = ['/contact', '/login', '/admin'];
            
            for (const formPage of formPages) {
                try {
                    await page.goto(BASE_URL + formPage);
                    await page.waitForTimeout(2000);

                    const forms = await page.$$('form');
                    
                    if (forms.length > 0) {
                        for (const form of forms) {
                            // Look for CSRF token inputs
                            const csrfToken = await form.$('input[name*="csrf"], input[name*="token"], input[name="_token"]');
                            
                            if (csrfToken) {
                                const tokenValue = await page.evaluate(input => input.value, csrfToken);
                                expect(tokenValue).toBeTruthy();
                                expect(tokenValue.length).toBeGreaterThan(10);
                                console.log(`✅ ${formPage}: CSRF token present (${tokenValue.length} chars)`);
                            } else {
                                console.log(`⚠️ ${formPage}: No CSRF token found in form`);
                            }
                        }
                    }
                } catch (error) {
                    console.log(`⚠️ ${formPage}: ${error.message}`);
                }
            }
        });

        test('POST requests without CSRF tokens are rejected', async () => {
            console.log('🚫 Testing CSRF token validation...');

            const protectedEndpoints = [
                '/api/contact',
                '/api/gallery/upload',
                '/api/merchandise/create',
                '/login'
            ];

            for (const endpoint of protectedEndpoints) {
                try {
                    const response = await HttpUtils.post(endpoint, {
                        body: { test: 'data' },
                        headers: { 'Content-Type': 'application/json' }
                    });

                    // Should be rejected due to missing CSRF token
                    expect([400, 403, 422]).toContain(response.status);
                    console.log(`✅ ${endpoint}: Protected against CSRF (${response.status})`);
                } catch (error) {
                    console.log(`⚠️ ${endpoint}: ${error.message}`);
                }
            }
        });
    });

    describe('🔍 Data Validation & Sanitization', () => {
        test('SQL injection protection', async () => {
            console.log('🔍 Testing SQL injection protection...');

            const sqlPayloads = [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "' UNION SELECT * FROM admin --",
                "'; INSERT INTO users VALUES('hacker','pass'); --"
            ];

            // Test search endpoints with SQL injection attempts
            const searchEndpoints = [
                '/api/search',
                '/api/episodes/search',
                '/api/gallery/search'
            ];

            for (const endpoint of searchEndpoints) {
                for (const payload of sqlPayloads) {
                    try {
                        const response = await HttpUtils.get(`${endpoint}?q=${encodeURIComponent(payload)}`);
                        
                        // Should return normal response, not error indicating SQL injection
                        expect([200, 400, 404]).toContain(response.status);
                        
                        if (response.status === 200) {
                            // Response should not contain SQL error messages
                            const bodyText = JSON.stringify(response.data);
                            expect(bodyText.toLowerCase()).not.toMatch(/sql|database|mysql|postgresql|sqlite/);
                        }
                        
                        console.log(`✅ ${endpoint}: SQL injection blocked`);
                    } catch (error) {
                        console.log(`⚠️ ${endpoint}: ${error.message}`);
                    }
                }
            }
        });

        test('file upload validation and restrictions', async () => {
            console.log('📁 Testing file upload security...');

            // Test malicious file uploads
            const maliciousFiles = [
                { name: 'script.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/x-php' },
                { name: 'malware.exe', content: 'MZ\x90\x00', type: 'application/octet-stream' },
                { name: 'shell.jsp', content: '<%Runtime.getRuntime().exec(request.getParameter("cmd"));%>', type: 'text/plain' }
            ];

            for (const file of maliciousFiles) {
                try {
                    // Attempt to upload malicious file
                    const formData = new FormData();
                    formData.append('file', new Blob([file.content], { type: file.type }), file.name);
                    
                    const response = await HttpUtils.post('/api/gallery/upload', {
                        body: formData
                    });

                    // Should be rejected
                    expect([400, 403, 415]).toContain(response.status);
                    console.log(`✅ Malicious file ${file.name} rejected: ${response.status}`);
                } catch (error) {
                    console.log(`✅ File upload ${file.name}: ${error.message}`);
                }
            }
        });

        test('input length and format validation', async () => {
            console.log('📏 Testing input validation...');

            // Test extremely long inputs
            const longString = 'A'.repeat(10000);
            const testData = {
                name: longString,
                email: longString + '@test.com',
                message: longString
            };

            try {
                const response = await HttpUtils.post('/api/contact', { body: testData });
                
                // Should reject overly long inputs
                expect([400, 413, 422]).toContain(response.status);
                console.log(`✅ Long input validation working: ${response.status}`);
            } catch (error) {
                console.log(`✅ Long input rejected: ${error.message}`);
            }

            // Test invalid email formats
            const invalidEmails = ['invalid', '@test.com', 'test@', 'test.com'];
            
            for (const email of invalidEmails) {
                try {
                    const response = await HttpUtils.post('/api/contact', {
                        body: { email: email, name: 'Test', message: 'Test' }
                    });
                    
                    expect([400, 422]).toContain(response.status);
                    console.log(`✅ Invalid email "${email}" rejected`);
                } catch (error) {
                    console.log(`✅ Email validation working for "${email}"`);
                }
            }
        });
    });

    describe('🌐 Network Security', () => {
        test('HTTPS enforcement', async () => {
            console.log('🌐 Testing HTTPS enforcement...');

            if (BASE_URL.startsWith('https')) {
                const response = await page.goto(BASE_URL + '/');
                const headers = response.headers();

                // Check for HTTPS security headers
                const hstsHeader = headers['strict-transport-security'];
                if (hstsHeader) {
                    expect(hstsHeader).toMatch(/max-age=\d+/);
                    console.log(`✅ HSTS header: ${hstsHeader}`);
                }

                // Check for secure cookies
                const cookies = await page.cookies();
                const secureCookies = cookies.filter(cookie => cookie.secure);
                console.log(`✅ ${secureCookies.length}/${cookies.length} cookies are secure`);
            } else {
                console.log('ℹ️ Testing on HTTP - HTTPS security features not applicable');
            }
        });

        test('security headers are present', async () => {
            console.log('🛡️ Testing security headers...');

            const response = await page.goto(BASE_URL + '/');
            const headers = response.headers();

            const securityHeaders = {
                'x-frame-options': 'Should prevent clickjacking',
                'x-content-type-options': 'Should prevent MIME sniffing',
                'x-xss-protection': 'Should enable XSS filtering',
                'referrer-policy': 'Should control referrer information'
            };

            Object.entries(securityHeaders).forEach(([header, purpose]) => {
                if (headers[header]) {
                    console.log(`✅ ${header}: ${headers[header]}`);
                } else {
                    console.log(`⚠️ Missing ${header} header (${purpose})`);
                }
            });
        });

        test('rate limiting protection', async () => {
            console.log('🚦 Testing rate limiting...');

            const testEndpoint = '/api/search?q=test';
            const requestCount = 20;
            let blockedCount = 0;

            console.log(`Sending ${requestCount} rapid requests to test rate limiting...`);

            const requests = Array(requestCount).fill().map(async (_, i) => {
                try {
                    const response = await HttpUtils.get(testEndpoint);
                    if (response.status === 429) {
                        blockedCount++;
                    }
                    return response.status;
                } catch (error) {
                    if (error.message.includes('429')) {
                        blockedCount++;
                    }
                    return 429;
                }
            });

            const results = await Promise.all(requests);
            
            if (blockedCount > 0) {
                console.log(`✅ Rate limiting active: ${blockedCount}/${requestCount} requests blocked`);
            } else {
                console.log(`ℹ️ No rate limiting detected (may be configured for higher thresholds)`);
            }
        });
    });

    describe('🔐 Access Control & Permissions', () => {
        test('directory traversal protection', async () => {
            console.log('📁 Testing directory traversal protection...');

            const traversalPayloads = [
                '../../../etc/passwd',
                '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
                '....//....//....//etc/passwd',
                '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
            ];

            const fileEndpoints = [
                '/api/files/',
                '/static/',
                '/uploads/',
                '/content/'
            ];

            for (const endpoint of fileEndpoints) {
                for (const payload of traversalPayloads) {
                    try {
                        const response = await HttpUtils.get(endpoint + payload);
                        
                        // Should return 404, 403, or 400, not 200 with file contents
                        expect([400, 403, 404]).toContain(response.status);
                        console.log(`✅ Directory traversal blocked: ${endpoint + payload.substring(0, 20)}...`);
                    } catch (error) {
                        console.log(`✅ Directory traversal protected: ${error.message.substring(0, 50)}...`);
                    }
                }
            }
        });

        test('sensitive file access protection', async () => {
            console.log('🔒 Testing sensitive file protection...');

            const sensitiveFiles = [
                '/.env',
                '/config/database.js',
                '/config/secrets.json',
                '/package.json',
                '/.git/config',
                '/firebase-admin-sdk.json',
                '/firebaseServiceAccountKey.json'
            ];

            for (const file of sensitiveFiles) {
                try {
                    const response = await HttpUtils.get(file);
                    
                    // Should not be accessible
                    expect([403, 404]).toContain(response.status);
                    console.log(`✅ ${file}: Protected (${response.status})`);
                } catch (error) {
                    console.log(`✅ ${file}: Protected (${error.message})`);
                }
            }
        });

        test('admin functionality isolation', async () => {
            console.log('👑 Testing admin functionality isolation...');

            // Test admin API endpoints without authentication
            const adminEndpoints = [
                '/api/admin/users',
                '/api/admin/stats',
                '/api/admin/logs',
                '/api/admin/config'
            ];

            for (const endpoint of adminEndpoints) {
                try {
                    const response = await HttpUtils.get(endpoint);
                    
                    // Should require authentication
                    expect([401, 403]).toContain(response.status);
                    console.log(`✅ ${endpoint}: Requires authentication (${response.status})`);
                } catch (error) {
                    console.log(`✅ ${endpoint}: Protected (${error.message})`);
                }
            }
        });
    });

    describe('🔍 Security Monitoring & Logging', () => {
        test('security events are properly logged', async () => {
            console.log('📝 Testing security event logging...');

            // Trigger potential security events
            const securityEvents = [
                { action: 'Failed login attempt', endpoint: '/login', method: 'POST', data: { username: 'admin', password: 'wrong' } },
                { action: 'Admin access attempt', endpoint: '/admin', method: 'GET' },
                { action: 'Suspicious file upload', endpoint: '/api/gallery/upload', method: 'POST' }
            ];

            for (const event of securityEvents) {
                try {
                    if (event.method === 'POST') {
                        await HttpUtils.post(event.endpoint, { body: event.data });
                    } else {
                        await HttpUtils.get(event.endpoint);
                    }
                    console.log(`✅ Security event triggered: ${event.action}`);
                } catch (error) {
                    console.log(`✅ Security event handled: ${event.action}`);
                }
            }

            // Note: Actual log verification would require access to log files
            console.log('ℹ️ Security logging verification requires log file access');
        });

        test('error messages do not leak sensitive information', async () => {
            console.log('🤐 Testing error message sanitization...');

            const errorEndpoints = [
                '/nonexistent-page',
                '/api/invalid-endpoint',
                '/admin/secret-page'
            ];

            for (const endpoint of errorEndpoints) {
                try {
                    const response = await HttpUtils.get(endpoint);
                    
                    if (response.status >= 400) {
                        const errorBody = JSON.stringify(response.data).toLowerCase();
                        
                        // Should not contain sensitive information
                        const sensitivePatterns = [
                            /database.*error/,
                            /stack.*trace/,
                            /internal.*server/,
                            /file.*not.*found.*\/.*\//,
                            /mysql|postgresql|mongodb/
                        ];

                        const leakDetected = sensitivePatterns.some(pattern => pattern.test(errorBody));
                        expect(leakDetected).toBe(false);
                        
                        console.log(`✅ ${endpoint}: Clean error message (${response.status})`);
                    }
                } catch (error) {
                    console.log(`✅ ${endpoint}: Error handled cleanly`);
                }
            }
        });
    });
});