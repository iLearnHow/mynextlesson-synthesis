#!/usr/bin/env node

/**
 * Upload viseme frames to Cloudflare R2
 * This script uploads the Kelly and Ken viseme frames to the R2 bucket
 * 
 * Prerequisites:
 * 1. Install AWS SDK: npm install @aws-sdk/client-s3
 * 2. Set environment variables for R2 credentials
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'avatars';

// Check if credentials are set
if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID) {
    console.error(`
❌ R2 credentials not found. Please set these environment variables:
   export R2_ACCOUNT_ID="your_account_id"
   export R2_ACCESS_KEY_ID="your_access_key"
   export R2_SECRET_ACCESS_KEY="your_secret_key"
   export R2_BUCKET_NAME="your_bucket_name" (optional, defaults to 'avatars')

To get these credentials:
1. Log into Cloudflare Dashboard
2. Go to R2 > Overview
3. Click "Manage R2 API Tokens"
4. Create a new API token with Object Read & Write permissions
`);
    process.exit(1);
}

// Create S3 client configured for R2
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

// Viseme names
const VISEME_NAMES = ['REST', 'MBP', 'FV', 'TH', 'DNTL', 'KG', 'S', 'WQ', 'R', 'A', 'E', 'I'];

async function uploadFile(localPath, r2Key) {
    try {
        const fileContent = await fs.readFile(localPath);
        const contentType = 'image/png';
        
        // Calculate MD5 for integrity check
        const md5 = crypto.createHash('md5').update(fileContent).digest('base64');
        
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: r2Key,
            Body: fileContent,
            ContentType: contentType,
            ContentMD5: md5,
            // Make files publicly accessible
            ACL: 'public-read',
        });
        
        await s3Client.send(command);
        console.log(`✅ Uploaded: ${r2Key}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to upload ${localPath}: ${error.message}`);
        return false;
    }
}

async function uploadVisemeFrames() {
    console.log('🚀 Starting viseme frame upload to R2...\n');
    
    const avatars = ['kelly', 'ken'];
    let totalUploaded = 0;
    let totalFailed = 0;
    
    for (const avatar of avatars) {
        console.log(`\n📦 Uploading ${avatar} viseme frames...`);
        
        // Upload full-frame visemes
        for (const viseme of VISEME_NAMES) {
            const localPath = path.join(
                __dirname,
                'production-deploy/assets/avatars',
                avatar,
                '2d/full',
                `${avatar}_${viseme}.png`
            );
            
            // Check if file exists
            try {
                await fs.access(localPath);
            } catch {
                console.log(`⚠️  Skipping ${localPath} (file not found)`);
                continue;
            }
            
            // R2 key structure matches expected CDN path
            const r2Key = `${avatar}/full/${viseme}.png`;
            
            const success = await uploadFile(localPath, r2Key);
            if (success) {
                totalUploaded++;
            } else {
                totalFailed++;
            }
        }
        
        // Also upload mouth sprites for patch mode
        console.log(`\n📦 Uploading ${avatar} mouth sprites...`);
        for (const viseme of VISEME_NAMES) {
            const localPath = path.join(
                __dirname,
                'production-deploy/assets/avatars',
                avatar,
                '2d',
                `mouth_${viseme}.png`
            );
            
            try {
                await fs.access(localPath);
                const r2Key = `${avatar}/mouths/${viseme}.png`;
                const success = await uploadFile(localPath, r2Key);
                if (success) totalUploaded++;
                else totalFailed++;
            } catch {
                // Mouth sprites might not exist, that's okay
            }
        }
        
        // Upload rig.json if it exists
        const rigPath = path.join(
            __dirname,
            'production-deploy/assets/avatars',
            avatar,
            '2d/rig.json'
        );
        
        try {
            await fs.access(rigPath);
            const rigContent = await fs.readFile(rigPath);
            const r2Key = `${avatar}/rig.json`;
            
            const command = new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: r2Key,
                Body: rigContent,
                ContentType: 'application/json',
                ACL: 'public-read',
            });
            
            await s3Client.send(command);
            console.log(`✅ Uploaded: ${r2Key}`);
            totalUploaded++;
        } catch {
            console.log(`⚠️  No rig.json found for ${avatar}`);
        }
        
        // Create and upload manifest
        const manifest = {
            version: '1.0',
            avatar: avatar,
            visemes: VISEME_NAMES,
            frame: { w: 1920, h: 1080 }, // Adjust based on actual dimensions
            base_url: `https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/${avatar}/full`,
            created: new Date().toISOString()
        };
        
        const manifestKey = `${avatar}/full/.manifest.rewritten.json`;
        const manifestCommand = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: manifestKey,
            Body: JSON.stringify(manifest, null, 2),
            ContentType: 'application/json',
            ACL: 'public-read',
        });
        
        try {
            await s3Client.send(manifestCommand);
            console.log(`✅ Created manifest: ${manifestKey}`);
            totalUploaded++;
        } catch (error) {
            console.error(`❌ Failed to upload manifest: ${error.message}`);
            totalFailed++;
        }
    }
    
    console.log(`
📊 Upload Summary:
   ✅ Successfully uploaded: ${totalUploaded} files
   ❌ Failed: ${totalFailed} files
   
🌐 Files are now available at:
   https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/{avatar}/full/{viseme}.png
   
📝 Example URLs:
   - https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/kelly/full/REST.png
   - https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/ken/full/MBP.png
`);
}

// Run the upload
uploadVisemeFrames().catch(console.error);
