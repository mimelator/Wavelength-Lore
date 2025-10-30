/**
 * Progress Tracker Utility
 * 
 * Tracks episode creation progress through the 10-step pipeline
 */

class ProgressTracker {
    constructor() {
        this.totalSteps = 10;
        this.stepNames = {
            1: 'Episode Metadata',
            2: 'Song Upload',
            3: 'Image Generation',
            4: 'Video Generation', 
            5: 'Radio Player Integration',
            6: 'Asset Extraction',
            7: 'Lore Registration',
            8: 'Game Level Generation',
            9: 'CTA Generation',
            10: 'Social Media'
        };
    }

    /**
     * Calculate progress for an episode
     */
    calculateProgress(episode) {
        if (!episode || !episode.steps) {
            return {
                currentStep: 1,
                totalSteps: this.totalSteps,
                completedSteps: 0,
                percentage: 0,
                currentStepName: this.stepNames[1]
            };
        }

        const steps = episode.steps;
        const completedSteps = Object.values(steps).filter(step => step.completed).length;
        const currentStep = this.findCurrentStep(steps);
        
        return {
            currentStep,
            totalSteps: this.totalSteps,
            completedSteps,
            percentage: Math.round((completedSteps / this.totalSteps) * 100),
            currentStepName: this.stepNames[currentStep],
            isComplete: completedSteps === this.totalSteps
        };
    }

    /**
     * Find the current step (first incomplete step)
     */
    findCurrentStep(steps) {
        for (let i = 1; i <= this.totalSteps; i++) {
            if (!steps[i] || !steps[i].completed) {
                return i;
            }
        }
        return this.totalSteps; // All steps complete
    }

    /**
     * Get progress for display
     */
    getProgress(episode) {
        return this.calculateProgress(episode);
    }

    /**
     * Create progress bar visual
     */
    createProgressBar(episode, width = 20) {
        const progress = this.calculateProgress(episode);
        const filled = Math.round((progress.percentage / 100) * width);
        const empty = width - filled;
        
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        return `[${bar}] ${progress.percentage}% (${progress.completedSteps}/${progress.totalSteps})`;
    }

    /**
     * Get step status emoji
     */
    getStepStatusEmoji(step) {
        if (!step) return '⏸️';
        if (step.completed) return '✅';
        return '⏸️';
    }

    /**
     * Display detailed progress
     */
    displayDetailedProgress(episode) {
        const progress = this.calculateProgress(episode);
        
        console.log(`\n📊 Episode Progress: ${episode.id}`);
        console.log(`${this.createProgressBar(episode)}`);
        console.log(`Current Step: ${progress.currentStep} - ${progress.currentStepName}`);
        console.log('\nStep Details:');
        
        for (let i = 1; i <= this.totalSteps; i++) {
            const step = episode.steps?.[i];
            const emoji = this.getStepStatusEmoji(step);
            const timestamp = step?.completedAt ? new Date(step.completedAt).toLocaleString() : '';
            
            console.log(`  ${emoji} Step ${i}: ${this.stepNames[i]} ${timestamp}`);
        }
        console.log();
    }

    /**
     * Check if episode is ready for publishing
     */
    isReadyForPublishing(episode) {
        const progress = this.calculateProgress(episode);
        return progress.isComplete;
    }

    /**
     * Get next step information
     */
    getNextStep(episode) {
        const progress = this.calculateProgress(episode);
        
        if (progress.isComplete) {
            return {
                step: null,
                name: 'Complete - Ready to Publish',
                description: 'All steps completed. Episode is ready for publishing.'
            };
        }
        
        return {
            step: progress.currentStep,
            name: progress.currentStepName,
            description: this.getStepDescription(progress.currentStep)
        };
    }

    /**
     * Get step description
     */
    getStepDescription(stepNumber) {
        const descriptions = {
            1: 'Collect episode metadata (title, season, episode number, theme)',
            2: 'Upload MP3 file and configure song metadata',
            3: 'Generate episode images using AI (12 images per episode)',
            4: 'Generate video assets for the episode',
            5: 'Register song in Firebase for radio player',
            6: 'Extract navigation icons, badges, and game assets',
            7: 'Register characters, locations, and lore items',
            8: 'Generate game levels for Screen Saver Mode',
            9: 'Generate email CTAs and push notifications',
            10: 'Generate social media announcements'
        };
        
        return descriptions[stepNumber] || 'Unknown step';
    }

    /**
     * Estimate time remaining
     */
    estimateTimeRemaining(episode) {
        const progress = this.calculateProgress(episode);
        const remainingSteps = this.totalSteps - progress.completedSteps;
        
        // Rough time estimates per step (in minutes)
        const stepTimes = {
            1: 5,   // Metadata
            2: 10,  // Song upload
            3: 30,  // Image generation
            4: 45,  // Video generation  
            5: 5,   // Radio integration
            6: 15,  // Asset extraction
            7: 10,  // Lore registration
            8: 20,  // Game levels
            9: 10,  // CTAs
            10: 15  // Social media
        };
        
        let totalMinutes = 0;
        for (let i = progress.currentStep; i <= this.totalSteps; i++) {
            totalMinutes += stepTimes[i] || 15;
        }
        
        if (totalMinutes < 60) {
            return `~${totalMinutes} minutes`;
        } else {
            const hours = Math.round(totalMinutes / 60 * 10) / 10;
            return `~${hours} hours`;
        }
    }
}

module.exports = ProgressTracker;