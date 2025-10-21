/**
 * Game API Routes
 * Handles game score submission, retrieval, and leaderboard data
 */

const express = require('express');
const router = express.Router();
const { fetchDataAsAdmin, updateDataAsAdmin } = require('../helpers/firebase-admin-utils');

/**
 * Submit a game score
 * POST /api/games/scores/submit
 * Body: { gameId, score, level, combo, timestamp }
 */
router.post('/scores/submit', async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const { gameId, score, level, combo, timestamp } = req.body;

        if (!gameId || score === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: gameId, score'
            });
        }

        // Get user data
        const userData = await fetchDataAsAdmin(`forum/users/${user.uid}`);
        const userName = userData?.username || userData?.email || user.uid;

        // Create score entry
        const scoreId = `${gameId}_${Date.now()}`;
        const scoreData = {
            gameId,
            userId: user.uid,
            userName,
            userEmail: user.email,
            score: parseInt(score),
            level: parseInt(level) || 1,
            combo: parseInt(combo) || 0,
            timestamp: timestamp || new Date().toISOString(),
            submittedAt: new Date().toISOString()
        };

        // Save to Firebase under games/scores
        await updateDataAsAdmin(`games/scores/${scoreId}`, scoreData);

        // Update user's game progress
        const userGamePath = `forum/users/${user.uid}/games/${gameId}`;
        const userGameData = await fetchDataAsAdmin(userGamePath);

        const newHighScore = !userGameData || score > (userGameData.highScore || 0);

        await updateDataAsAdmin(userGamePath, {
            gameId,
            highScore: newHighScore ? score : (userGameData?.highScore || 0),
            lastScore: score,
            level: parseInt(level) || 1,
            plays: (userGameData?.plays || 0) + 1,
            lastPlayed: new Date().toISOString(),
            bestCombo: Math.max(userGameData?.bestCombo || 0, combo || 0)
        });

        res.json({
            success: true,
            message: 'Score submitted successfully',
            newHighScore,
            scoreId
        });
    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit score',
            details: error.message
        });
    }
});

/**
 * Get user's game stats
 * GET /api/games/:gameId/user-stats
 */
router.get('/:gameId/user-stats', async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const { gameId } = req.params;
        const userGameData = await fetchDataAsAdmin(`forum/users/${user.uid}/games/${gameId}`);

        res.json({
            success: true,
            stats: userGameData || {
                gameId,
                highScore: 0,
                lastScore: 0,
                level: 1,
                plays: 0,
                lastPlayed: null,
                bestCombo: 0
            }
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stats'
        });
    }
});

/**
 * Get global leaderboard for a game
 * GET /api/games/:gameId/leaderboard?limit=10&offset=0
 */
router.get('/:gameId/leaderboard', async (req, res) => {
    try {
        const { gameId } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const offset = parseInt(req.query.offset) || 0;

        // Fetch all scores for this game
        const allScores = await fetchDataAsAdmin('games/scores');

        if (!allScores) {
            return res.json({
                success: true,
                leaderboard: [],
                total: 0,
                limit,
                offset
            });
        }

        // Filter and sort scores for this game
        const gameScores = Object.values(allScores)
            .filter(score => score.gameId === gameId)
            .sort((a, b) => b.score - a.score);

        // Get total count
        const total = gameScores.length;

        // Get user's rank if authenticated
        let userRank = null;
        let userScore = null;
        if (req.user) {
            const userIndex = gameScores.findIndex(s => s.userId === req.user.uid);
            if (userIndex !== -1) {
                userRank = userIndex + 1;
                userScore = gameScores[userIndex];
            }
        }

        // Apply pagination
        const paginatedScores = gameScores.slice(offset, offset + limit);

        // Add rank to each score
        const leaderboard = paginatedScores.map((score, index) => ({
            ...score,
            rank: offset + index + 1
        }));

        res.json({
            success: true,
            leaderboard,
            userRank,
            userScore,
            total,
            limit,
            offset
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leaderboard'
        });
    }
});

/**
 * Get top scores across all games
 * GET /api/games/leaderboard/global?limit=10
 */
router.get('/leaderboard/global', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);

        // Fetch all scores
        const allScores = await fetchDataAsAdmin('games/scores');

        if (!allScores) {
            return res.json({
                success: true,
                leaderboard: []
            });
        }

        // Get unique users with their highest scores across all games
        const userScores = {};

        Object.values(allScores).forEach(score => {
            if (!userScores[score.userId]) {
                userScores[score.userId] = {
                    userId: score.userId,
                    userName: score.userName,
                    userEmail: score.userEmail,
                    totalScore: 0,
                    gamesPlayed: new Set(),
                    scores: []
                };
            }
            userScores[score.userId].totalScore += score.score;
            userScores[score.userId].gamesPlayed.add(score.gameId);
            userScores[score.userId].scores.push(score);
        });

        // Sort by total score
        const leaderboard = Object.values(userScores)
            .map(user => ({
                userId: user.userId,
                userName: user.userName,
                userEmail: user.userEmail,
                totalScore: user.totalScore,
                gamesPlayed: user.gamesPlayed.size,
                scores: user.scores.length
            }))
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, limit)
            .map((user, index) => ({
                ...user,
                rank: index + 1
            }));

        res.json({
            success: true,
            leaderboard
        });
    } catch (error) {
        console.error('Error fetching global leaderboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch global leaderboard'
        });
    }
});

/**
 * Get game-specific leaderboard for display (public)
 * GET /api/games/:gameId/top-scores?limit=10
 */
router.get('/:gameId/top-scores', async (req, res) => {
    try {
        const { gameId } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);

        const allScores = await fetchDataAsAdmin('games/scores');

        if (!allScores) {
            return res.json({
                success: true,
                topScores: []
            });
        }

        // Filter for this game and get highest score per user
        const userTopScores = {};

        Object.values(allScores)
            .filter(score => score.gameId === gameId)
            .forEach(score => {
                if (!userTopScores[score.userId] || score.score > userTopScores[score.userId].score) {
                    userTopScores[score.userId] = score;
                }
            });

        const topScores = Object.values(userTopScores)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((score, index) => ({
                rank: index + 1,
                userId: score.userId,
                userName: score.userName,
                score: score.score,
                level: score.level,
                combo: score.bestCombo || 0,
                timestamp: score.timestamp
            }));

        res.json({
            success: true,
            topScores
        });
    } catch (error) {
        console.error('Error fetching top scores:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top scores'
        });
    }
});

module.exports = router;
