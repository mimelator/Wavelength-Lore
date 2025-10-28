// Debug script to check loading status
console.log('🔍 DEBUGGING: Checking MerchandiseProductCardRenderer availability');
console.log('window.MerchandiseProductCardRenderer:', typeof window.MerchandiseProductCardRenderer);
console.log('All Merchandise classes:', Object.keys(window).filter(k => k.includes('Merchandise')));

// Wait a bit and check again
setTimeout(() => {
    console.log('🔍 DEBUGGING (after 100ms): Checking MerchandiseProductCardRenderer availability');
    console.log('window.MerchandiseProductCardRenderer:', typeof window.MerchandiseProductCardRenderer);
    console.log('All Merchandise classes:', Object.keys(window).filter(k => k.includes('Merchandise')));
}, 100);

// And once more
setTimeout(() => {
    console.log('🔍 DEBUGGING (after 500ms): Checking MerchandiseProductCardRenderer availability');
    console.log('window.MerchandiseProductCardRenderer:', typeof window.MerchandiseProductCardRenderer);
    console.log('All Merchandise classes:', Object.keys(window).filter(k => k.includes('Merchandise')));
}, 500);