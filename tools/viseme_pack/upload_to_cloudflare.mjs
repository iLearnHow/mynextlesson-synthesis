#!/usr/bin/env node
// Upload a viseme pack directory to Cloudflare R2 and rewrite manifest URLs.
// Requires: CF_R2_ACCOUNT_ID, CF_R2_ACCESS_KEY_ID, CF_R2_SECRET_ACCESS_KEY, CF_R2_BUCKET, CF_CDN_BASE
// Usage: node upload_to_cloudflare.mjs /path/to/ken_visemes avatars/ken/full

import fs from 'fs';
import path from 'path';
import mime from 'mime';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const [,, localDir, remotePrefix] = process.argv;
if (!localDir || !remotePrefix) {
  console.error('Usage: node upload_to_cloudflare.mjs <localDir> <remotePrefix>');
  process.exit(1);
}

const {
  CF_R2_ACCOUNT_ID,
  CF_R2_ACCESS_KEY_ID,
  CF_R2_SECRET_ACCESS_KEY,
  CF_R2_BUCKET,
  CF_CDN_BASE
} = process.env;

if (!CF_R2_ACCOUNT_ID || !CF_R2_ACCESS_KEY_ID || !CF_R2_SECRET_ACCESS_KEY || !CF_R2_BUCKET || !CF_CDN_BASE) {
  console.error('Missing environment vars: CF_R2_ACCOUNT_ID, CF_R2_ACCESS_KEY_ID, CF_R2_SECRET_ACCESS_KEY, CF_R2_BUCKET, CF_CDN_BASE');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CF_R2_ACCESS_KEY_ID,
    secretAccessKey: CF_R2_SECRET_ACCESS_KEY,
  }
});

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}

function relToRemote(p) {
  const rel = path.relative(localDir, p).replace(/\\/g, '/');
  return `${remotePrefix.replace(/\/$/,'')}/${rel}`;
}

async function uploadFile(filePath) {
  const key = relToRemote(filePath);
  const contentType = mime.getType(filePath) || 'application/octet-stream';
  const Body = fs.readFileSync(filePath);
  await s3.send(new PutObjectCommand({ Bucket: CF_R2_BUCKET, Key: key, Body, ContentType: contentType, ACL: 'private' }));
  return { key, url: `${CF_CDN_BASE.replace(/\/$/,'')}/${key}` };
}

async function main(){
  const all = walk(localDir);
  // Upload non-manifest files first
  const manifestPath = all.find(f => path.basename(f) === 'manifest.json');
  const others = all.filter(f => f !== manifestPath);
  console.log(`Uploading ${others.length} files…`);
  const urlMap = new Map();
  for (const f of others){
    const { key, url } = await uploadFile(f);
    urlMap.set(path.relative(localDir, f).replace(/\\/g,'/'), url);
  }
  // Rewrite manifest URLs
  if (manifestPath) {
    const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const rewritten = {};
    for (const [viseme, arr] of Object.entries(raw)){
      rewritten[viseme] = (arr||[]).map(u => {
        // If original is a string URL, map by filename; if object, rewrite url field
        if (typeof u === 'string'){
          const name = u.split('/').slice(-2).join('/'); // e.g., A/frame_01.webp
          const mapped = Array.from(urlMap.entries()).find(([rel, full]) => rel.endsWith(name));
          return mapped ? mapped[1] : u;
        } else if (u && typeof u === 'object' && u.url) {
          const name = u.url.split('/').slice(-2).join('/');
          const mapped = Array.from(urlMap.entries()).find(([rel, full]) => rel.endsWith(name));
          return { ...u, url: mapped ? mapped[1] : u.url };
        }
        return u;
      });
    }
    const tmp = path.join(localDir, '.manifest.rewritten.json');
    fs.writeFileSync(tmp, JSON.stringify(rewritten, null, 2));
    const { key } = await uploadFile(tmp);
    console.log(`Manifest uploaded as ${key}`);
  }
  console.log('✅ Done');
}

main().catch(e=>{ console.error(e); process.exit(1); });


