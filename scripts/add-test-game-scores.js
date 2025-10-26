#!/usr/bin/env node

/**
 * Add Test Game Scores
 * Creates sample leaderboard data for Wavelength Gems
 */

const { updateDataAsAdmin } = require('../helpers/firebase-admin-utils');

async function addTestScores() {
    console.log('🎮 Adding test game scores...');
    
    const testScores = [
        {
            gameId: 'wavelength-gems',
            userId: 'test-user-1',
            userName: 'GemMaster',
            userEmail: 'gemmaster@test.com',
            score: 15420,
            level: 8,
            combo: 12,
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            submittedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            gameId: 'wavelength-gems',
            userId: 'test-user-2', 
            userName: 'CrystalQueen',
            userEmail: 'crystal@test.com',
            score: 12850,
            level: 6,
            combo: 8,
            timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            submittedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
            gameId: 'wavelength-gems',
            userId: 'test-user-3',
            userName: 'PuzzleWiz',
            userEmail: 'puzzle@test.com', 
            score: 9750,
            level: 5,
            combo: 6,
            timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            submittedAt: new Date(Date.now() - 259200000).toISOString()
        },
        {
            gameId: 'wavelength-gems',
            userId: 'test-user-4',
            userName: 'DiamondHunter',
            userEmail: 'diamond@test.com',
            score: 7200,
            level: 4,
            combo: 4,
            timestamp: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
            submittedAt: new Date(Date.now() - 345600000).toISOString()
        },
        {
            gameId: 'wavelength-gems',
            userId: 'test-user-5',
            userName: 'MatchMaker',
            userEmail: 'match@test.com',
            score: 5680,
            level: 3,
            combo: 3,
            timestamp: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
            submittedAt: new Date(Date.now() - 432000000).toISOString()
        }
    ];
    
    try {
        for (let i = 0; i < testScores.length; i++) {
            const score = testScores[i];
            const scoreId = `wavelength-gems_test_${Date.now()}_${i}`;
            
            console.log(`📊 Adding score: ${score.userName} - ${score.score} points`);
            await updateDataAsAdmin(`games/scores/${scoreId}`, score);
            
            // Also add to user's game data
            await updateDataAsAdmin(`forum/users/${score.userId}/games/${score.gameId}`, {
                gameId: score.gameId,
                highScore: score.score,
                lastScore: score.score,
                level: score.level,
                plays: 1,
                lastPlayed: score.timestamp,
                bestCombo: score.combo
            });
        }
        
        console.log('✅ Test scores added successfully!');
        console.log('🎯 Visit http://localhost:3001/forum to see the leaderboard');
        
    } catch (error) {
        console.error('❌ Error adding test scores:', error);
    }
    
    process.exit(0);
}

addTestScores();