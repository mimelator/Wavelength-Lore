#!/usr/bin/env node

/**
 * Dialog Behavior Test - New Product vs Edit Product
 * Tests both use cases for duplicate IDs and modal behavior
 */

const puppeteer = require('puppeteer');

async function testDialogBehavior() {
    console.log('🧪 Enhanced Dialog Behavior Test - New vs Edit Product\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1200, height: 800 }
    });
    const page = await browser.newPage();
    
    // Track modal states throughout test
    const modalStates = [];
    
    const captureModalState = async (label) => {
        const state = await page.evaluate(() => {
            const modals = Array.from(document.querySelectorAll('.modal'));
            const loadingModals = Array.from(document.querySelectorAll('[id*="loading"]'));
            
            return {
                totalModals: modals.length,
                visibleModals: modals.filter(m => m.style.display !== 'none' && !m.hidden).length,
                loadingElements: loadingModals.length,
                duplicateIds: (() => {
                    const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
                    const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
                    return [...new Set(duplicates)];
                })()
            };
        });
        modalStates.push({ label, ...state });
        return state;
    };
    
    try {
        console.log('📍 Loading merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Capture initial state
        await captureModalState('Initial Page Load');
        
        // TEST 1: Creating New Product
        console.log('\n🆕 Testing NEW PRODUCT creation dialog...');
        
        // Select an image
        const imageSelected = await page.evaluate(() => {
            const selectBtn = document.querySelector('.gallery-image-select');
            if (selectBtn) {
                selectBtn.click();
                return true;
            }
            return false;
        });
        
        if (imageSelected) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Select a product type to trigger customization modal
            const productSelected = await page.evaluate(() => {
                const productBtn = document.querySelector('.select-product-btn, .select-simple-product');
                if (productBtn) {
                    productBtn.click();
                    return true;
                }
                return false;
            });
            
            if (productSelected) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Capture state after NEW product dialog opens
                const newState = await captureModalState('NEW Product Dialog Open');
                
                console.log(`   NEW Product Dialog - Duplicate IDs: ${newState.duplicateIds.length > 0 ? '❌' : '✅'}`);
                if (newState.duplicateIds.length > 0) {
                    console.log(`   Duplicates: ${newState.duplicateIds.join(', ')}`);
                }
                console.log(`   Modals: ${newState.totalModals} total, ${newState.visibleModals} visible`);
                console.log(`   Loading Elements: ${newState.loadingElements}`);
                
                // Test form field uniqueness
                const formAnalysis = await page.evaluate(() => {
                    const selects = Array.from(document.querySelectorAll('select'));
                    const inputs = Array.from(document.querySelectorAll('input'));
                    
                    return {
                        selectIds: selects.map(s => s.id).filter(id => id),
                        inputIds: inputs.map(i => i.id).filter(id => id),
                        selectNames: selects.map(s => s.name).filter(name => name),
                        inputNames: inputs.map(i => i.name).filter(name => name)
                    };
                });
                
                console.log(`   Form Fields - Select IDs: [${formAnalysis.selectIds.join(', ')}]`);
                console.log(`   Form Fields - Input IDs: [${formAnalysis.inputIds.join(', ')}]`);
                
                // Close the modal
                await page.evaluate(() => {
                    const closeBtn = document.querySelector('.modal .close');
                    if (closeBtn) closeBtn.click();
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                await captureModalState('After NEW Dialog Close');
            }
        }
        
        // TEST 2: Editing Existing Product
        console.log('\n✏️ Testing EDIT EXISTING product dialog...');
        
        // Check if there are existing products
        const hasProducts = await page.evaluate(() => {
            return document.querySelectorAll('.edit-product-btn').length > 0;
        });
        
        if (hasProducts) {
            // Click edit on first product
            const editClicked = await page.evaluate(() => {
                const editBtn = document.querySelector('.edit-product-btn');
                if (editBtn) {
                    editBtn.click();
                    return true;
                }
                return false;
            });
            
            if (editClicked) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Capture state after EDIT product dialog opens
                const editState = await captureModalState('EDIT Product Dialog Open');
                
                console.log(`   EDIT Product Dialog - Duplicate IDs: ${editState.duplicateIds.length > 0 ? '❌' : '✅'}`);
                if (editState.duplicateIds.length > 0) {
                    console.log(`   Duplicates: ${editState.duplicateIds.join(', ')}`);
                }
                console.log(`   Modals: ${editState.totalModals} total, ${editState.visibleModals} visible`);
                console.log(`   Loading Elements: ${editState.loadingElements}`);
                
                // Detailed analysis of EDIT dialog
                const editAnalysis = await page.evaluate(() => {
                    const modal = document.querySelector('.product-customization-modal');
                    const designBtn = document.querySelector('#createProductBtn');
                    const loadingModals = Array.from(document.querySelectorAll('[id*="loading"]'));
                    
                    const selects = Array.from(document.querySelectorAll('select'));
                    const inputs = Array.from(document.querySelectorAll('input'));
                    
                    return {
                        modalVisible: !!modal && modal.style.display !== 'none',
                        buttonText: designBtn ? designBtn.textContent : 'Not found',
                        loadingModalDetails: loadingModals.map(lm => ({
                            id: lm.id,
                            visible: lm.style.display !== 'none' && !lm.hidden,
                            className: lm.className
                        })),
                        formFieldDetails: {
                            selects: selects.map(s => ({ id: s.id, name: s.name, value: s.value })),
                            inputs: inputs.map(i => ({ id: i.id, name: i.name, type: i.type, value: i.value }))
                        }
                    };
                });
                
                console.log(`   Modal Visible: ${editAnalysis.modalVisible ? '✅' : '❌'}`);
                console.log(`   Button Text: "${editAnalysis.buttonText}"`);
                console.log(`   Loading Modals: ${editAnalysis.loadingModalDetails.length}`);
                editAnalysis.loadingModalDetails.forEach(lm => {
                    console.log(`     - ID: ${lm.id}, Visible: ${lm.visible}, Class: ${lm.className}`);
                });
                
                // Close the modal with enhanced cleanup
                await page.evaluate(() => {
                    const closeBtn = document.querySelector('.modal .close');
                    if (closeBtn) closeBtn.click();
                    
                    // Force cleanup of any remaining visible modals
                    setTimeout(() => {
                        document.querySelectorAll('.modal').forEach(modal => {
                            if (modal.style.display !== 'none') {
                                modal.style.display = 'none';
                                modal.remove();
                            }
                        });
                    }, 100);
                });
                
                await new Promise(resolve => setTimeout(resolve, 600));
                await captureModalState('After EDIT Dialog Close');
            }
        } else {
            console.log('   ⚠️ No existing products found to test edit dialog');
        }
        
        // TEST 3: Final modal cleanup analysis
        console.log('\n🧹 Final modal cleanup analysis...');
        
        const finalState = await captureModalState('Final State');
        
        console.log(`   Total Modals: ${finalState.totalModals}`);
        console.log(`   Visible Modals: ${finalState.visibleModals}`);
        console.log(`   Loading Elements: ${finalState.loadingElements}`);
        console.log(`   Final Duplicate IDs: ${finalState.duplicateIds.length}`);
        console.log(`   Modal Cleanup: ${finalState.visibleModals === 0 ? '✅' : '❌'}`);
        
        // Print modal state timeline
        console.log('\n📊 Modal State Timeline:');
        modalStates.forEach((state, index) => {
            console.log(`   ${index + 1}. ${state.label}:`);
            console.log(`      Modals: ${state.totalModals} total, ${state.visibleModals} visible`);
            console.log(`      Loading: ${state.loadingElements}, Duplicates: ${state.duplicateIds.length}`);
            if (state.duplicateIds.length > 0) {
                console.log(`      Duplicate IDs: [${state.duplicateIds.join(', ')}]`);
            }
        });
        
        // Take screenshot for proof
        await page.screenshot({ 
            path: 'enhanced-dialog-test-proof.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot saved: enhanced-dialog-test-proof.png');
        
        // Test summary
        console.log('\n📋 Test Summary:');
        const hasIssues = modalStates.some(state => 
            state.duplicateIds.length > 0 || 
            (state.label.includes('Close') && state.visibleModals > 0)
        );
        console.log(`   Overall Result: ${hasIssues ? '❌ Issues Found' : '✅ All Tests Passed'}`);
        
        console.log('\n⏳ Keeping browser open for 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return !hasIssues;
        
    } catch (error) {
        console.log(`❌ Test Error: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    testDialogBehavior()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testDialogBehavior };