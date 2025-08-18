#!/bin/bash

echo "🚀 Uploading Viseme Frames to Cloudflare R2"
echo "=========================================="

# Check if credentials are provided
if [ -z "$R2_ACCOUNT_ID" ] || [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ]; then
    echo "❌ R2 credentials not set. Please set these environment variables:"
    echo ""
    echo "export R2_ACCOUNT_ID=\"your_account_id\""
    echo "export R2_ACCESS_KEY_ID=\"your_access_key\""
    echo "export R2_SECRET_ACCESS_KEY=\"your_secret_key\""
    echo ""
    echo "To get these credentials:"
    echo "1. Log into Cloudflare Dashboard"
    echo "2. Go to R2 > Overview"
    echo "3. Click 'Manage R2 API Tokens'"
    echo "4. Create a new API token with Object Read & Write permissions"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ R2 credentials found"
echo "Account ID: $R2_ACCOUNT_ID"
echo "Access Key: ${R2_ACCESS_KEY_ID:0:8}..."

# Configure AWS CLI for R2
echo -e "\n🔧 Configuring AWS CLI for R2..."
aws configure set aws_access_key_id "$R2_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$R2_SECRET_ACCESS_KEY"
aws configure set region auto
aws configure set output json

# Test R2 connection
echo -e "\n🧪 Testing R2 connection..."
if aws s3 ls --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" 2>/dev/null; then
    echo "✅ R2 connection successful"
else
    echo "❌ R2 connection failed. Check your credentials."
    exit 1
fi

# Upload viseme frames
echo -e "\n📤 Uploading viseme frames..."
BUCKET_NAME="avatars"

# Upload Kelly frames
echo "Uploading Kelly viseme frames..."
aws s3 sync r2-upload-ready/kelly/ s3://$BUCKET_NAME/kelly/ \
    --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" \
    --acl public-read \
    --exclude "*.DS_Store" \
    --exclude "Thumbs.db"

# Upload Ken frames
echo "Uploading Ken viseme frames..."
aws s3 sync r2-upload-ready/ken/ s3://$BUCKET_NAME/ken/ \
    --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" \
    --acl public-read \
    --exclude "*.DS_Store" \
    --exclude "Thumbs.db"

echo -e "\n✅ Upload complete!"
echo ""
echo "🌐 Test URLs:"
echo "  Kelly REST: https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/kelly/full/REST.png"
echo "  Ken MBP: https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/ken/full/MBP.png"
echo ""
echo "🎭 Avatar sync should now work on ilearnhow.com!"
