#!/usr/bin/env node
/**
 * 🌊 WAVELENGTH CLI ADMIN - PRISTINE DEPLOYMENT STATUS 
 * ====================================================
 * Clean, isolated deployment monitoring tool for CLI admin mode
 * Completely separate from existing scripts to ensure reliability
 */

const { AppRunnerClient, DescribeServiceCommand, ListServicesCommand } = require('@aws-sdk/client-apprunner');
const { ECRClient, DescribeRepositoriesCommand, DescribeImagesCommand } = require('@aws-sdk/client-ecr');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { CloudWatchLogsClient, FilterLogEventsCommand, DescribeLogGroupsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

class WavelengthDeploymentStatus {
    constructor() {
        this.region = 'us-east-1';
        
        // Initialize AWS clients with wavelength-dev user credentials
        this.validateAndInitializeAWS();
        
        this.serviceName = process.env.APPRUNNER_SERVICE_NAME || 'wavelength-lore';
        this.ecrRepository = process.env.ECR_REPOSITORY_NAME || 'wavelength-lore';
        this.s3Bucket = process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket';
        this.logGroupName = process.env.CLOUDWATCH_LOG_GROUP || '/aws/apprunner/wavelength-lore-service/829c542fc95c419090494817f7046eaa/application';
        this.rootDir = process.cwd();
    }

    /**
     * 🛡️ Validate credentials and initialize AWS clients
     */
    validateAndInitializeAWS() {
        // Use specific wavelength-dev user credentials
        const requiredVars = ['aws_wavelength_dev_access_key_id', 'aws_wavelength_dev_secret_access_key'];
        const missing = requiredVars.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            console.log(chalk.yellow(`⚠️ Missing wavelength-dev AWS credentials: ${missing.join(', ')}`));
            console.log(chalk.gray('   Falling back to default AWS credentials...'));
            
            // Fallback to default credentials
            const clientConfig = { region: this.region };
            this.appRunner = new AppRunnerClient(clientConfig);
            this.ecr = new ECRClient(clientConfig);
            this.s3 = new S3Client(clientConfig);
            this.cloudWatchLogs = new CloudWatchLogsClient(clientConfig);
        } else {
            // Initialize AWS clients with wavelength-dev user credentials
            const clientConfig = { 
                region: this.region,
                credentials: {
                    accessKeyId: process.env.aws_wavelength_dev_access_key_id,
                    secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
                }
            };
            
            this.appRunner = new AppRunnerClient(clientConfig);
            this.ecr = new ECRClient(clientConfig);
            this.s3 = new S3Client(clientConfig);
            this.cloudWatchLogs = new CloudWatchLogsClient(clientConfig);
            
            console.log(chalk.gray('ℹ️  Using wavelength-dev user: arn:aws:iam::170023515523:user/wavelength-dev'));
        }
    }

    /**
     * 🚀 Get comprehensive deployment status
     */
    async getStatus() {
        console.log(chalk.cyan('🌊 WAVELENGTH ADMIN: Deployment Status'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

        try {
            const status = {};

            // Get App Runner status
            status.appRunner = await this.getAppRunnerStatus();

            // Get ECR status
            status.ecr = await this.getECRStatus();

            // Get local build info
            status.local = await this.getLocalStatus();

            // Get S3 asset status
            status.s3Assets = await this.getS3AssetStatus();

            // Get runtime version validation (NEW)
            status.runtimeVersion = await this.validateRuntimeVersion();

            // Display comprehensive status
            await this.displayStatus(status);

            return status;

        } catch (error) {
            console.error(chalk.red('❌ Status check failed:'), error.message);
            return null;
        }
    }

    /**
     * 🏃 Get App Runner service status
     */
    async getAppRunnerStatus() {
        console.log(chalk.yellow('🏃 Checking App Runner status...'));
        
        try {
            // Use the full ARN from environment if available
            const serviceArn = process.env.APPRUNNER_SERVICE_ARN || 
                `arn:aws:apprunner:us-east-1:${process.env.AWS_ACCOUNT_ID || '123456789012'}:service/${this.serviceName}`;
            
            if (!process.env.APPRUNNER_SERVICE_ARN) {
                return {
                    status: 'Unknown',
                    message: 'Service ARN required for detailed status',
                    serviceName: this.serviceName
                };
            }
            
            const command = new DescribeServiceCommand({
                ServiceArn: serviceArn
            });
            
            const result = await this.appRunner.send(command);
            const service = result.Service;
            
            // Calculate uptime if service is running
            let uptime = null;
            let uptimeDisplay = 'Unknown';
            if (service.Status === 'RUNNING' && service.UpdatedAt) {
                const now = new Date();
                const serviceStart = new Date(service.UpdatedAt);
                const uptimeMs = now - serviceStart;
                uptime = {
                    milliseconds: uptimeMs,
                    seconds: Math.floor(uptimeMs / 1000),
                    minutes: Math.floor(uptimeMs / (1000 * 60)),
                    hours: Math.floor(uptimeMs / (1000 * 60 * 60)),
                    days: Math.floor(uptimeMs / (1000 * 60 * 60 * 24))
                };
                
                // Format uptime display
                if (uptime.days > 0) {
                    uptimeDisplay = `${uptime.days}d ${uptime.hours % 24}h ${uptime.minutes % 60}m`;
                } else if (uptime.hours > 0) {
                    uptimeDisplay = `${uptime.hours}h ${uptime.minutes % 60}m`;
                } else if (uptime.minutes > 0) {
                    uptimeDisplay = `${uptime.minutes}m ${uptime.seconds % 60}s`;
                } else {
                    uptimeDisplay = `${uptime.seconds}s`;
                }
            }

            // Try to get application uptime from health endpoint
            let applicationUptime = null;
            let applicationStatus = 'Unknown';
            if (service.Status === 'RUNNING' && service.ServiceUrl) {
                try {
                    const https = require('https');
                    const healthUrl = `https://${service.ServiceUrl}/health`;
                    
                    const healthResponse = await new Promise((resolve, reject) => {
                        const req = https.get(healthUrl, { timeout: 5000 }, (res) => {
                            let data = '';
                            res.on('data', chunk => data += chunk);
                            res.on('end', () => {
                                try {
                                    resolve(JSON.parse(data));
                                } catch (e) {
                                    reject(new Error('Invalid JSON response'));
                                }
                            });
                        });
                        req.on('error', reject);
                        req.on('timeout', () => {
                            req.destroy();
                            reject(new Error('Health check timeout'));
                        });
                    });
                    
                    if (healthResponse.status === 'healthy') {
                        applicationStatus = 'Healthy';
                        applicationUptime = healthResponse.applicationUptime || 'Unknown';
                    }
                } catch (error) {
                    console.log(chalk.gray(`   Note: Could not fetch application health (${error.message})`));
                    applicationStatus = 'Health check failed';
                }
            }

            return {
                status: service.Status,
                message: `Service is ${service.Status.toLowerCase()}`,
                serviceName: service.ServiceName,
                serviceUrl: service.ServiceUrl,
                createdAt: service.CreatedAt,
                updatedAt: service.UpdatedAt,
                uptime: uptime,
                uptimeDisplay: uptimeDisplay,
                applicationUptime: applicationUptime,
                applicationStatus: applicationStatus,
                source: service.SourceConfiguration?.ImageRepository?.ImageIdentifier || 'Not available'
            };
            
        } catch (error) {
            return {
                status: 'Error',
                message: error.message,
                serviceName: this.serviceName
            };
        }
    }

    /**
     * 🐳 Get ECR repository status
     */
    async getECRStatus() {
        console.log(chalk.yellow('🐳 Checking ECR repository status...'));
        
        try {
            // Check if repository exists
            const repoCommand = new DescribeRepositoriesCommand({
                repositoryNames: [this.ecrRepository]
            });
            
            const repoResult = await this.ecr.send(repoCommand);
            const repository = repoResult.repositories[0];
            
            // Get recent images
            const imagesCommand = new DescribeImagesCommand({
                repositoryName: this.ecrRepository,
                maxResults: 5
            });
            
            const imagesResult = await this.ecr.send(imagesCommand);
            
            return {
                status: 'Active',
                repository: repository.repositoryName,
                uri: repository.repositoryUri,
                imageCount: imagesResult.imageDetails.length,
                recentImages: imagesResult.imageDetails
                    .sort((a, b) => new Date(b.imagePushedAt) - new Date(a.imagePushedAt))
                    .slice(0, 3)
                    .map(img => ({
                        tag: img.imageTags?.[0] || 'untagged',
                        pushedAt: img.imagePushedAt,
                        size: Math.round(img.imageSizeInBytes / 1024 / 1024) + 'MB'
                    }))
            };
            
        } catch (error) {
            return {
                status: 'Error',
                message: error.message,
                repository: this.ecrRepository
            };
        }
    }

    /**
     * 📦 Get S3 asset status - Verify critical assets are synced
     */
    async getS3AssetStatus() {
        console.log(chalk.yellow('📦 Checking S3 asset status...'));

        const status = {
            checks: [],
            errors: [],
            warnings: [],
            healthy: true
        };

        try {
            // Count local files
            const localCounts = await this.countLocalAssets();

            // Count S3 files for each critical directory
            const s3Counts = await this.countS3Assets();

            // Check JavaScript files
            const jsCheck = {
                name: 'JavaScript Files',
                local: localCounts.js,
                s3: s3Counts.js,
                healthy: s3Counts.js > 0,
                critical: true
            };
            if (s3Counts.js === 0) {
                jsCheck.error = 'No JS files found in S3/CDN';
                status.errors.push('Critical: JavaScript files missing from CDN');
                status.healthy = false;
            } else if (s3Counts.js < localCounts.js * 0.5) {
                jsCheck.warning = `Only ${s3Counts.js}/${localCounts.js} JS files synced`;
                status.warnings.push('Warning: Many JS files missing from CDN');
                status.healthy = false;
            }
            status.checks.push(jsCheck);

            // Check CSS files
            const cssCheck = {
                name: 'CSS Files',
                local: localCounts.css,
                s3: s3Counts.css,
                healthy: s3Counts.css > 0,
                critical: true
            };
            if (s3Counts.css === 0) {
                cssCheck.error = 'No CSS files found in S3/CDN';
                status.errors.push('Critical: CSS files missing from CDN');
                status.healthy = false;
            } else if (s3Counts.css < localCounts.css * 0.5) {
                cssCheck.warning = `Only ${s3Counts.css}/${localCounts.css} CSS files synced`;
                status.warnings.push('Warning: Many CSS files missing from CDN');
                status.healthy = false;
            }
            status.checks.push(cssCheck);

            // Check MP3 audio files - Enhanced reporting
            const mp3Check = {
                name: 'Audio Files (MP3)',
                local: localCounts.mp3,
                s3: s3Counts.mp3,
                healthy: s3Counts.mp3 > 0,
                critical: true,
                details: localCounts.mp3Details || null,
                s3Details: s3Counts.mp3Details || null
            };
            if (s3Counts.mp3 === 0) {
                mp3Check.error = 'No MP3 files found in S3/CDN';
                status.errors.push('Critical: Audio files missing from CDN - Radio will not work');
                status.healthy = false;
            } else if (s3Counts.mp3 < localCounts.mp3) {
                mp3Check.warning = `Only ${s3Counts.mp3}/${localCounts.mp3} audio files synced`;
                status.warnings.push('Warning: Some audio files missing from CDN');
            } else if (s3Counts.mp3 === localCounts.mp3 && s3Counts.mp3 > 0) {
                mp3Check.success = `All ${s3Counts.mp3} audio files synced successfully`;
            }
            status.checks.push(mp3Check);

            // Check critical Firebase config
            const firebaseCheck = {
                name: 'Firebase Config',
                local: localCounts.firebaseConfig ? 1 : 0,
                s3: s3Counts.firebaseConfig ? 1 : 0,
                healthy: s3Counts.firebaseConfig,
                critical: true
            };
            if (!s3Counts.firebaseConfig) {
                firebaseCheck.error = 'firebase-config.js missing from CDN';
                status.errors.push('Critical: Firebase config missing - Authentication will fail');
                status.healthy = false;
            }
            status.checks.push(firebaseCheck);

            // Check image assets
            const imageCheck = {
                name: 'Season Images',
                local: localCounts.seasonImages,
                s3: s3Counts.seasonImages,
                healthy: s3Counts.seasonImages > 0,
                critical: false
            };
            if (s3Counts.seasonImages === 0 && localCounts.seasonImages > 0) {
                imageCheck.warning = 'Season images not synced';
                status.warnings.push('Warning: Season images missing from CDN');
            }
            status.checks.push(imageCheck);

            return status;

        } catch (error) {
            status.errors.push(`S3 check failed: ${error.message}`);
            status.healthy = false;
            return status;
        }
    }

    /**
     * 📊 Count local asset files
     */
    async countLocalAssets() {
        const counts = {
            js: 0,
            css: 0,
            mp3: 0,
            firebaseConfig: false,
            seasonImages: 0
        };

        try {
            // Count JS files
            const jsDir = path.join(this.rootDir, 'static', 'js');
            if (fs.existsSync(jsDir)) {
                counts.js = this.countFilesRecursive(jsDir, '.js');
                const firebaseConfigPath = path.join(jsDir, 'firebase-config.js');
                counts.firebaseConfig = fs.existsSync(firebaseConfigPath);
            }

            // Count CSS files
            const cssDir = path.join(this.rootDir, 'static', 'css');
            if (fs.existsSync(cssDir)) {
                counts.css = this.countFilesRecursive(cssDir, '.css');
            }

            // Count MP3 files with detailed breakdown
            const seasonsDir = path.join(this.rootDir, 'static', 'images', 'seasons');
            if (fs.existsSync(seasonsDir)) {
                const mp3Details = this.getMP3Details(seasonsDir);
                counts.mp3 = mp3Details.total;
                counts.mp3Details = mp3Details;
                counts.seasonImages = this.countFilesRecursive(seasonsDir, '.webp');
            }

        } catch (error) {
            console.log(chalk.gray(`   Note: Could not count local files (${error.message})`));
        }

        return counts;
    }

    /**
     * 🗂️ Count files recursively with extension filter
     */
    countFilesRecursive(dir, extension) {
        let count = 0;
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    count += this.countFilesRecursive(filePath, extension);
                } else if (file.endsWith(extension)) {
                    count++;
                }
            }
        } catch (error) {
            // Silently skip directories that can't be read
        }
        return count;
    }

    /**
     * 🎵 Get detailed MP3 file breakdown by season
     */
    getMP3Details(seasonsDir) {
        const details = {
            total: 0,
            bySeason: {},
            files: []
        };

        try {
            const seasons = fs.readdirSync(seasonsDir).filter(item => {
                const seasonPath = path.join(seasonsDir, item);
                return fs.statSync(seasonPath).isDirectory() && item.startsWith('season');
            });

            for (const season of seasons) {
                const seasonPath = path.join(seasonsDir, season);
                const seasonMP3s = this.findMP3FilesInSeason(seasonPath, season);
                
                if (seasonMP3s.length > 0) {
                    details.bySeason[season] = {
                        count: seasonMP3s.length,
                        files: seasonMP3s.map(f => f.name)
                    };
                    details.files.push(...seasonMP3s);
                    details.total += seasonMP3s.length;
                }
            }
        } catch (error) {
            console.log(chalk.gray(`   Note: Could not analyze MP3 details (${error.message})`));
        }

        return details;
    }

    /**
     * 🔍 Find MP3 files in a season directory
     */
    findMP3FilesInSeason(seasonPath, seasonName) {
        const mp3Files = [];
        
        try {
            const episodes = fs.readdirSync(seasonPath).filter(item => {
                const episodePath = path.join(seasonPath, item);
                return fs.statSync(episodePath).isDirectory() && item.startsWith('episode');
            });

            for (const episode of episodes) {
                const episodePath = path.join(seasonPath, episode);
                const files = fs.readdirSync(episodePath);
                
                for (const file of files) {
                    if (file.endsWith('.mp3')) {
                        const filePath = path.join(episodePath, file);
                        const stat = fs.statSync(filePath);
                        mp3Files.push({
                            name: file,
                            season: seasonName,
                            episode: episode,
                            size: Math.round(stat.size / 1024 / 1024 * 100) / 100, // MB
                            path: path.relative(this.rootDir, filePath)
                        });
                    }
                }
            }
        } catch (error) {
            // Silently skip directories that can't be read
        }

        return mp3Files;
    }

    /**
     * ☁️ Count S3 asset files
     */
    async countS3Assets() {
        const counts = {
            js: 0,
            css: 0,
            mp3: 0,
            firebaseConfig: false,
            seasonImages: 0
        };

        try {
            // Count JS files in S3
            counts.js = await this.countS3Files('js/', '.js');

            // Check for firebase-config.js specifically
            const firebaseObjects = await this.listS3Objects('js/firebase-config.js', 1);
            counts.firebaseConfig = firebaseObjects.length > 0;

            // Count CSS files in S3
            counts.css = await this.countS3Files('css/', '.css');

            // Count MP3 files in S3 with details
            const s3MP3Details = await this.getS3MP3Details();
            counts.mp3 = s3MP3Details.total;
            counts.mp3Details = s3MP3Details;

            // Count season images
            counts.seasonImages = await this.countS3Files('images/seasons/', '.webp');

        } catch (error) {
            console.log(chalk.gray(`   Note: Could not count S3 files (${error.message})`));
        }

        return counts;
    }

    /**
     * 🔢 Count files in S3 with prefix and extension
     */
    async countS3Files(prefix, extension) {
        const objects = await this.listS3Objects(prefix);
        return objects.filter(obj => obj.Key.endsWith(extension)).length;
    }

    /**
     * 📋 List S3 objects with prefix
     */
    async listS3Objects(prefix, maxKeys = 1000) {
        const command = new ListObjectsV2Command({
            Bucket: this.s3Bucket,
            Prefix: prefix,
            MaxKeys: maxKeys
        });

        const response = await this.s3.send(command);
        return response.Contents || [];
    }

    /**
     * 🎵 Get detailed MP3 file breakdown from S3
     */
    async getS3MP3Details() {
        const details = {
            total: 0,
            bySeason: {},
            files: [],
            lastSyncTime: null
        };

        try {
            const objects = await this.listS3Objects('images/seasons/');
            const mp3Objects = objects.filter(obj => obj.Key.endsWith('.mp3'));

            // Find the most recent sync time
            if (mp3Objects.length > 0) {
                details.lastSyncTime = mp3Objects.reduce((latest, obj) => {
                    return new Date(obj.LastModified) > new Date(latest) ? obj.LastModified : latest;
                }, mp3Objects[0].LastModified);
            }

            for (const obj of mp3Objects) {
                const keyParts = obj.Key.split('/');
                const fileName = keyParts[keyParts.length - 1];
                
                // Extract season info from path
                const seasonMatch = obj.Key.match(/images\/seasons\/(season\d+)\/episodes\/(episode\d+)\//);
                if (seasonMatch) {
                    const season = seasonMatch[1];
                    const episode = seasonMatch[2];
                    
                    if (!details.bySeason[season]) {
                        details.bySeason[season] = {
                            count: 0,
                            files: []
                        };
                    }
                    
                    details.bySeason[season].count++;
                    details.bySeason[season].files.push(fileName);
                    
                    details.files.push({
                        name: fileName,
                        season: season,
                        episode: episode,
                        size: Math.round(obj.Size / 1024 / 1024 * 100) / 100, // MB
                        lastModified: obj.LastModified,
                        key: obj.Key
                    });
                    
                    details.total++;
                }
            }
        } catch (error) {
            console.log(chalk.gray(`   Note: Could not analyze S3 MP3 details (${error.message})`));
        }

        return details;
    }

    /**
     * 📁 Get local build status
     */
    async getLocalStatus() {
        console.log(chalk.yellow('📁 Checking local build status...'));
        
        const status = {
            dockerfileExists: fs.existsSync(path.join(this.rootDir, 'Dockerfile')),
            packageJsonExists: fs.existsSync(path.join(this.rootDir, 'package.json')),
            nodeModulesExists: fs.existsSync(path.join(this.rootDir, 'node_modules')),
            gitStatus: 'Unknown'
        };
        
        // Get git status if available
        try {
            const { execSync } = require('child_process');
            const gitOutput = execSync('git status --porcelain', { cwd: this.rootDir, encoding: 'utf8' });
            status.gitStatus = gitOutput.trim().length === 0 ? 'Clean' : 'Modified';
            
            // Get current branch and commit
            const branch = execSync('git branch --show-current', { cwd: this.rootDir, encoding: 'utf8' }).trim();
            const commit = execSync('git rev-parse --short HEAD', { cwd: this.rootDir, encoding: 'utf8' }).trim();
            
            status.branch = branch;
            status.commit = commit;
            
        } catch (error) {
            status.gitStatus = 'Error';
        }
        
        // Get package.json version
        if (status.packageJsonExists) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf8'));
                status.version = packageJson.version;
            } catch (error) {
                status.version = 'Unknown';
            }
        }
        
        return status;
    }

    /**
     * 📋 Validate runtime version from CloudWatch logs
     */
    async validateRuntimeVersion() {
        console.log(chalk.yellow('📋 Validating runtime version from logs...'));
        
        const validation = {
            status: 'Unknown',
            deployedVersion: null,
            localVersion: null,
            lastStartupLog: null,
            versionMatch: false,
            error: null
        };

        try {
            // Get local version for comparison
            const packageJsonPath = path.join(this.rootDir, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                validation.localVersion = packageJson.version;
            }

            // Search for version logs in the past hour
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - (60 * 60 * 1000)); // 1 hour ago

            const filterCommand = new FilterLogEventsCommand({
                logGroupName: this.logGroupName,
                startTime: startTime.getTime(),
                endTime: endTime.getTime(),
                filterPattern: '"Wavelength Lore v"',
                limit: 50
            });

            const logResponse = await this.cloudWatchLogs.send(filterCommand);
            
            if (logResponse.events && logResponse.events.length > 0) {
                // Get the most recent version log
                const mostRecentLog = logResponse.events[logResponse.events.length - 1];
                validation.lastStartupLog = {
                    timestamp: new Date(mostRecentLog.timestamp),
                    message: mostRecentLog.message
                };

                // Extract version from log message
                const versionMatch = mostRecentLog.message.match(/Wavelength Lore v([\d.]+)/);
                if (versionMatch) {
                    validation.deployedVersion = versionMatch[1];
                    validation.status = 'Found';
                    
                    // Compare with local version
                    if (validation.localVersion && validation.deployedVersion === validation.localVersion) {
                        validation.versionMatch = true;
                    }
                }

                // Additional startup details
                validation.totalVersionLogs = logResponse.events.length;
                validation.allVersionLogs = logResponse.events.map(event => ({
                    timestamp: new Date(event.timestamp),
                    message: event.message
                }));

            } else {
                validation.status = 'No version logs found';
                validation.error = 'No "Wavelength Lore v" logs found in the past hour';
            }

        } catch (error) {
            validation.status = 'Error';
            validation.error = error.message;
            
            // Check if it's a log group access issue
            if (error.name === 'ResourceNotFoundException') {
                validation.error = `Log group not found: ${this.logGroupName}`;
            } else if (error.name === 'AccessDenied') {
                validation.error = 'Access denied to CloudWatch Logs - check AWS credentials';
            }
        }

        return validation;
    }

    /**
     * 📊 Display comprehensive status
     */
    async displayStatus(status) {
        console.log(chalk.green('✓ Status check completed\n'));
        
        // Local Status
        console.log(chalk.cyan('📁 LOCAL STATUS:'));
        console.log(chalk.white(`   Version: ${status.local.version || 'Unknown'}`));
        console.log(chalk.white(`   Branch: ${status.local.branch || 'Unknown'}`));
        console.log(chalk.white(`   Commit: ${status.local.commit || 'Unknown'}`));
        console.log(chalk.white(`   Git Status: ${status.local.gitStatus}`));
        console.log(chalk.white(`   Docker: ${status.local.dockerfileExists ? '✓' : '❌'}`));
        console.log(chalk.white(`   Dependencies: ${status.local.nodeModulesExists ? '✓' : '❌'}`));
        console.log('');

        // Runtime Version Validation (NEW)
        console.log(chalk.cyan('📋 RUNTIME VERSION VALIDATION:'));
        if (status.runtimeVersion) {
            const rv = status.runtimeVersion;
            
            if (rv.status === 'Found') {
                console.log(chalk.white(`   Local Version: ${rv.localVersion || 'Unknown'}`));
                console.log(chalk.white(`   Deployed Version: ${rv.deployedVersion}`));
                
                if (rv.versionMatch) {
                    console.log(chalk.green(`   ✅ Version Match: Deployment synchronized`));
                } else {
                    console.log(chalk.yellow(`   ⚠️  Version Mismatch: Deployment may be outdated`));
                }
                
                if (rv.lastStartupLog) {
                    const timeAgo = this.getTimeAgo(rv.lastStartupLog.timestamp);
                    console.log(chalk.white(`   Last Startup: ${timeAgo}`));
                    console.log(chalk.gray(`   Startup Time: ${rv.lastStartupLog.timestamp.toLocaleString()}`));
                }
                
                if (rv.totalVersionLogs > 1) {
                    console.log(chalk.gray(`   Recent Restarts: ${rv.totalVersionLogs} startup logs in past hour`));
                }
                
            } else if (rv.status === 'No version logs found') {
                console.log(chalk.yellow(`   ⚠️  No version logs found in past hour`));
                console.log(chalk.gray(`   This may indicate the application hasn't started recently`));
                console.log(chalk.gray(`   💡 Try: Check if App Runner service is running`));
                
            } else if (rv.status === 'Error') {
                console.log(chalk.red(`   ❌ Version check failed: ${rv.error}`));
                if (rv.error.includes('Log group not found')) {
                    console.log(chalk.gray(`   💡 Tip: Verify CLOUDWATCH_LOG_GROUP environment variable`));
                } else if (rv.error.includes('Access denied')) {
                    console.log(chalk.gray(`   💡 Tip: Check AWS credentials and CloudWatch Logs permissions`));
                }
            }
        } else {
            console.log(chalk.red(`   ❌ Runtime version validation unavailable`));
        }
        console.log('');

        // S3 Asset Status (ENHANCED)
        console.log(chalk.cyan('📦 S3/CDN ASSET STATUS:'));
        if (status.s3Assets && status.s3Assets.checks) {
            status.s3Assets.checks.forEach(check => {
                const icon = check.healthy ? '✅' : (check.critical ? '❌' : '⚠️');
                const syncStatus = check.s3 === check.local ?
                    chalk.green(`${check.s3}/${check.local}`) :
                    chalk.yellow(`${check.s3}/${check.local}`);
                console.log(chalk.white(`   ${icon} ${check.name}: ${syncStatus}`));
                
                // Special detailed display for MP3 files
                if (check.name === 'Audio Files (MP3)' && check.details && check.s3Details) {
                    if (check.s3 > 0) {
                        console.log(chalk.gray(`      └─ Seasons with audio:`));
                        Object.keys(check.s3Details.bySeason).sort().forEach(season => {
                            const seasonData = check.s3Details.bySeason[season];
                            const localSeasonData = check.details.bySeason[season];
                            const localCount = localSeasonData ? localSeasonData.count : 0;
                            const syncIcon = seasonData.count === localCount ? '✅' : '⚠️';
                            console.log(chalk.gray(`         ${syncIcon} ${season}: ${seasonData.count}/${localCount} files`));
                        });
                        
                        if (check.s3Details.lastSyncTime) {
                            const syncAgo = this.getTimeAgo(check.s3Details.lastSyncTime);
                            console.log(chalk.gray(`      └─ Last sync: ${syncAgo}`));
                        }
                        
                        // Calculate total audio size
                        const totalSize = check.s3Details.files.reduce((sum, file) => sum + file.size, 0);
                        console.log(chalk.gray(`      └─ Total size: ${Math.round(totalSize * 100) / 100} MB`));
                    }
                }
                
                if (check.error) {
                    console.log(chalk.red(`      └─ ${check.error}`));
                }
                if (check.warning) {
                    console.log(chalk.yellow(`      └─ ${check.warning}`));
                }
                if (check.success) {
                    console.log(chalk.green(`      └─ ${check.success}`));
                }
            });

            // Display errors and warnings summary
            if (status.s3Assets.errors.length > 0) {
                console.log('');
                console.log(chalk.red('   ⚠️  CRITICAL ISSUES:'));
                status.s3Assets.errors.forEach(error => {
                    console.log(chalk.red(`      • ${error}`));
                });
            }
            if (status.s3Assets.warnings.length > 0 && status.s3Assets.errors.length === 0) {
                console.log('');
                console.log(chalk.yellow('   ⚠️  WARNINGS:'));
                status.s3Assets.warnings.forEach(warning => {
                    console.log(chalk.yellow(`      • ${warning}`));
                });
            }

            // Provide fix suggestion
            if (!status.s3Assets.healthy) {
                console.log('');
                console.log(chalk.cyan('   💡 FIX: Run npm run cli:admin sync to upload missing assets'));
            }
        } else {
            console.log(chalk.red('   ❌ Could not check S3 asset status'));
        }
        console.log('');
        
        // ECR Status
        console.log(chalk.cyan('🐳 ECR CONFIGURATION:'));
        if (status.ecr.status === 'Active') {
            console.log(chalk.white(`   Repository: ${status.ecr.repository}`));
            console.log(chalk.white(`   URI: ${status.ecr.uri}`));
            console.log(chalk.white(`   Images: ${status.ecr.imageCount} total`));
            console.log(chalk.white(`   Recent Images:`));
            status.ecr.recentImages.forEach((img, index) => {
                const isLatest = img.tag === 'latest';
                const tagDisplay = isLatest ? chalk.yellow(img.tag) : chalk.green(img.tag);
                const timeAgo = this.getTimeAgo(img.pushedAt);
                console.log(chalk.gray(`     ${index === 0 ? '→' : '•'} ${tagDisplay} (${img.size}) - ${timeAgo}`));
                if (index === 0) {
                    console.log(chalk.gray(`       Latest push: ${new Date(img.pushedAt).toLocaleString()}`));
                }
            });
            
            // Show ECR connection info
            console.log(chalk.white(`   Region: us-east-1`));
            console.log(chalk.white(`   Registry: ${status.ecr.uri.split('/')[0]}`));
        } else {
            console.log(chalk.red(`   Status: ${status.ecr.status}`));
            console.log(chalk.red(`   Message: ${status.ecr.message}`));
        }
        console.log('');
        
        // App Runner Status
        console.log(chalk.cyan('🏃 APP RUNNER STATUS:'));
        console.log(chalk.white(`   Service: ${status.appRunner.serviceName || 'wavelength-lore-service'}`));
        console.log(chalk.white(`   Status: ${status.appRunner.status}`));
        if (status.appRunner.serviceUrl) {
            console.log(chalk.white(`   URL: https://${status.appRunner.serviceUrl}`));
        }
        
        // Display service uptime if available
        if (status.appRunner.status === 'RUNNING' && status.appRunner.uptimeDisplay !== 'Unknown') {
            console.log(chalk.green(`   ⏰ Service Uptime: ${status.appRunner.uptimeDisplay}`));
            if (status.appRunner.uptime.days >= 7) {
                console.log(chalk.blue(`   🎯 Excellent service stability - Running for over a week!`));
            } else if (status.appRunner.uptime.days >= 1) {
                console.log(chalk.green(`   ✅ Good service stability - Running for ${status.appRunner.uptime.days} day(s)`));
            } else if (status.appRunner.uptime.hours >= 1) {
                console.log(chalk.yellow(`   📊 Recent service deployment - Running for ${status.appRunner.uptime.hours} hour(s)`));
            } else {
                console.log(chalk.cyan(`   🚀 Fresh service deployment - Just started`));
            }
        } else if (status.appRunner.status !== 'RUNNING') {
            console.log(chalk.red(`   ⏰ Service Uptime: Service not running`));
        }

        // Display application uptime if available
        if (status.appRunner.applicationUptime && 
            status.appRunner.applicationUptime !== 'Unknown' && 
            status.appRunner.applicationUptime !== 'unavailable') {
            console.log(chalk.cyan(`   🚀 Application Uptime: ${status.appRunner.applicationUptime}`));
            console.log(chalk.green(`   ✅ Application Status: ${status.appRunner.applicationStatus}`));
        } else if (status.appRunner.status === 'RUNNING') {
            const statusMsg = status.appRunner.applicationStatus || 'Could not determine';
            if (statusMsg === 'Health check failed') {
                console.log(chalk.yellow(`   🚀 Application Uptime: Health endpoint not accessible`));
            } else {
                console.log(chalk.gray(`   🚀 Application Uptime: ${statusMsg}`));
            }
        }
        if (status.appRunner.source && status.appRunner.source !== 'Not available') {
            console.log(chalk.white(`   Current Image: ${status.appRunner.source}`));
            
            // Parse ECR image details from source
            const imageMatch = status.appRunner.source.match(/wavelength-lore:(.+)$/);
            if (imageMatch) {
                const imageTag = imageMatch[1];
                console.log(chalk.gray(`   Image Tag: ${imageTag}`));
                
                // Check if it's using latest (rollback indicator)
                if (imageTag === 'latest') {
                    console.log(chalk.red('   ⚠️  WARNING: Using :latest tag (possible rollback)'));
                } else {
                    console.log(chalk.green('   ✅ Using specific version tag'));
                }
            }
        }
        if (status.appRunner.updatedAt) {
            console.log(chalk.gray(`   Last Updated: ${new Date(status.appRunner.updatedAt).toLocaleString()}`));
        }
        if (status.appRunner.message) {
            console.log(chalk.gray(`   Message: ${status.appRunner.message}`));
        }
        console.log('');
        
        // Overall Health - Check critical components
        const localHealthy = status.local.dockerfileExists && status.local.nodeModulesExists;
        const ecrHealthy = status.ecr.status !== 'Error';
        const appRunnerHealthy = status.appRunner.status === 'RUNNING';
        const s3AssetsHealthy = status.s3Assets ? status.s3Assets.healthy : false;
        const runtimeVersionHealthy = status.runtimeVersion && status.runtimeVersion.versionMatch;

        // Enhanced deployment synchronization check with runtime version
        let deploymentSync = 'Unknown';
        if (status.runtimeVersion && status.runtimeVersion.status === 'Found') {
            // Use runtime version validation as primary sync check
            if (status.runtimeVersion.versionMatch) {
                deploymentSync = 'Synchronized (Runtime Verified)';
            } else {
                deploymentSync = 'Version Mismatch (Runtime)';
            }
        } else if (status.local.commit && status.appRunner.source) {
            // Fallback to ECR image tag matching
            const imageMatch = status.appRunner.source.match(/wavelength-lore:(.+)$/);
            if (imageMatch) {
                const imageTag = imageMatch[1];
                // Check if App Runner is using latest commit or version
                if (imageTag.includes(status.local.commit) || imageTag.startsWith('v')) {
                    deploymentSync = 'Synchronized (ECR)';
                } else if (imageTag === 'latest') {
                    deploymentSync = 'Rollback detected';
                } else {
                    deploymentSync = 'Out of sync';
                }
            }
        } else if (status.runtimeVersion && status.runtimeVersion.status === 'No version logs found') {
            deploymentSync = 'Runtime not started recently';
        }
        
        const isHealthy = localHealthy && ecrHealthy && appRunnerHealthy && s3AssetsHealthy;

        console.log(chalk.cyan('🌊 DEPLOYMENT STATUS SUMMARY:'));
        console.log(chalk.white(`   Local Environment: ${localHealthy ? '✅' : '❌'}`));
        console.log(chalk.white(`   S3/CDN Assets: ${s3AssetsHealthy ? '✅' : '❌'}`));
        console.log(chalk.white(`   ECR Repository: ${ecrHealthy ? '✅' : '❌'}`));
        console.log(chalk.white(`   App Runner Service: ${appRunnerHealthy ? '✅' : '❌'}`));
        console.log(chalk.white(`   Runtime Version: ${runtimeVersionHealthy ? '✅' : (status.runtimeVersion?.status === 'Found' ? '⚠️' : '❓')}`));
        
        // Add uptime to summary if service is running
        if (appRunnerHealthy && status.appRunner.uptimeDisplay !== 'Unknown') {
            console.log(chalk.white(`   Service Uptime: ⏰ ${status.appRunner.uptimeDisplay}`));
        }
        if (status.appRunner.applicationUptime && 
            status.appRunner.applicationUptime !== 'Unknown' && 
            status.appRunner.applicationUptime !== 'unavailable') {
            console.log(chalk.white(`   App Uptime: 🚀 ${status.appRunner.applicationUptime}`));
        }
        
        console.log(chalk.white(`   Deployment Sync: ${deploymentSync.includes('Synchronized') ? '✅' : 
                                                      deploymentSync === 'Rollback detected' ? '🔄' : 
                                                      deploymentSync.includes('Mismatch') || deploymentSync.includes('Out of sync') ? '⚠️' : '❓'} ${deploymentSync}`));
        console.log('');
        
        if (isHealthy && deploymentSync.includes('Synchronized')) {
            console.log(chalk.green('   🚀 OPTIMAL - All systems operational and synchronized'));
        } else if (isHealthy) {
            console.log(chalk.yellow('   ⚠️ HEALTHY - Systems running but may need sync'));
        } else {
            console.log(chalk.red('   🔧 ATTENTION NEEDED - Critical issues detected'));
            if (!localHealthy) console.log(chalk.red('      • Local environment issues detected'));
            if (!s3AssetsHealthy) console.log(chalk.red('      • S3/CDN assets missing or incomplete'));
            if (!ecrHealthy) console.log(chalk.red('      • ECR repository issues detected'));
            if (!appRunnerHealthy) console.log(chalk.red('      • App Runner service not running'));
            if (!runtimeVersionHealthy && status.runtimeVersion?.status === 'Found') {
                console.log(chalk.red('      • Runtime version mismatch detected'));
            }
        }
        
        if (deploymentSync === 'Rollback detected') {
            console.log(chalk.yellow('   💡 TIP: App Runner may have rolled back due to health check failures'));
        } else if (deploymentSync === 'Out of sync') {
            console.log(chalk.yellow('   💡 TIP: Consider deploying latest changes to synchronize'));
        }
    }

    /**
     * ⏰ Get human-readable time ago
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'just now';
    }

    /**
     * 🎯 Quick health check
     */
    async quickCheck() {
        const status = await this.getLocalStatus();
        
        console.log(chalk.cyan('🌊 WAVELENGTH QUICK CHECK:'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        const checks = [
            { name: 'Dockerfile', status: status.dockerfileExists },
            { name: 'Dependencies', status: status.nodeModulesExists },
            { name: 'Git Clean', status: status.gitStatus === 'Clean' },
            { name: 'Package.json', status: status.packageJsonExists }
        ];
        
        checks.forEach(check => {
            const icon = check.status ? '✅' : '❌';
            console.log(`   ${icon} ${check.name}`);
        });
        
        const allGood = checks.every(check => check.status);
        console.log('');
        console.log(allGood ? chalk.green('🚀 Ready to deploy!') : 
                             chalk.yellow('⚠️ Issues need attention'));
        
        return allGood;
    }
}

// CLI execution
if (require.main === module) {
    const deploymentStatus = new WavelengthDeploymentStatus();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--quick') || args.includes('-q')) {
        deploymentStatus.quickCheck().then(healthy => {
            process.exit(healthy ? 0 : 1);
        });
    } else {
        deploymentStatus.getStatus().then(status => {
            process.exit(status ? 0 : 1);
        });
    }
}

module.exports = WavelengthDeploymentStatus;