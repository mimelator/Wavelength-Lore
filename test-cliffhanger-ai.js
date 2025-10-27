#!/usr/bin/env node

const { WavelengthChatCLI } = require('./wavelength-chat-cli.js');

async function testCliffhangerAI() {
    console.log('🤖 Testing AI cliffhanger generation...');
    
    const chat = new WavelengthChatCLI();
    
    const prompt = `Create cliffhanger elements for Wavelength episode "Keep On".

Episode Context: Marcus performs his first song at an open mic night, but his performance takes an unexpected magical turn.

Generate:
1. CLIFFHANGER_HOOK: Dramatic "But when..." tension (1-2 sentences)
2. NEXT_EPISODE_TEASE: Preview sentence 
3. CTA_TAGLINE: Compelling question (5-8 words)

Format:
CLIFFHANGER_HOOK: [hook]
NEXT_EPISODE_TEASE: [tease] 
CTA_TAGLINE: [tagline]`;

    try {
        console.log('📝 Prompt length:', prompt.length, 'characters');
        const result = await chat.askChatbot(prompt);
        
        if (result.success) {
            console.log('✅ AI Response successful!');
            console.log('📝 Response:', result.response);
            
            // Test parsing - handle both line-by-line and inline formats
            const response = result.response;
            const parsed = {};
            
            // Try to extract fields using regex patterns
            const hookMatch = response.match(/CLIFFHANGER_HOOK:\s*([^.]*\.(?:[^.]*\.)?)/);
            const teaseMatch = response.match(/NEXT_EPISODE_TEASE:\s*([^.]*\.)/);
            const taglineMatch = response.match(/CTA_TAGLINE:\s*([^?]*\?)/);
            
            if (hookMatch) parsed.cliffhanger_hook = hookMatch[1].trim();
            if (teaseMatch) parsed.next_episode_tease = teaseMatch[1].trim();
            if (taglineMatch) parsed.cta_tagline = taglineMatch[1].trim();
            
            console.log('\n🎬 Parsed cliffhangers:');
            console.log('Hook:', parsed.cliffhanger_hook || 'NOT FOUND');
            console.log('Tease:', parsed.next_episode_tease || 'NOT FOUND');
            console.log('Tagline:', parsed.cta_tagline || 'NOT FOUND');
            
        } else {
            console.log('❌ AI Error:', result.error);
        }
        
    } catch (error) {
        console.error('Fatal error:', error.message);
    }
}

testCliffhangerAI();