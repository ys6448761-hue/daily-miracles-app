#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# C7A: Staging S3 Bucket Setup for RAMADA Storybook
# ═══════════════════════════════════════════════════════════════════════════
#
# Purpose: Create private staging S3 bucket with minimal IAM permissions
# Environment: AWS staging account
# Credentials: Use AWS CLI with staging IAM user
#
# Usage:
#   aws configure  # Set credentials for staging account
#   bash infrastructure/staging/s3-bucket-setup.sh
#
# Result: Ready for C7A lifecycle testing
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

BUCKET_NAME="storybook-assets-staging"
AWS_REGION="us-east-1"
APP_ROLE_ARN="arn:aws:iam::STAGING_ACCOUNT_ID:role/daily-miracles-app"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "C7A: Creating Staging S3 Bucket for RAMADA Storybook"
echo "═══════════════════════════════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Create S3 Bucket (Private)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "Step 1/5: Creating S3 bucket..."

aws s3api create-bucket \
  --bucket "$BUCKET_NAME" \
  --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION" 2>/dev/null || echo "Bucket already exists"

echo "✅ Bucket created: $BUCKET_NAME"

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Block Public Access (CRITICAL for privacy)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "Step 2/5: Blocking all public access..."

aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "✅ Public access blocked"

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Bucket Policy (IAM role only)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "Step 3/5: Setting bucket policy (least privilege)..."

POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppRoleReadWrite",
      "Effect": "Allow",
      "Principal": {
        "AWS": "$APP_ROLE_ARN"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    },
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::$BUCKET_NAME",
        "arn:aws:s3:::$BUCKET_NAME/*"
      ],
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalArn": "$APP_ROLE_ARN"
        }
      }
    }
  ]
}
EOF
)

echo "$POLICY" > /tmp/bucket-policy.json

aws s3api put-bucket-policy \
  --bucket "$BUCKET_NAME" \
  --policy file:///tmp/bucket-policy.json

rm /tmp/bucket-policy.json

echo "✅ Bucket policy applied (IAM role only)"

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Enable Versioning (safe replacement)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "Step 4/5: Enabling versioning..."

aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled

echo "✅ Versioning enabled (safe rollback)"

# ─────────────────────────────────────────────────────────────────────────────
# Step 5: Server-side Encryption
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "Step 5/5: Enabling server-side encryption..."

aws s3api put-bucket-encryption \
  --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

echo "✅ Server-side encryption enabled (AES256)"

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "✅ Staging Bucket Setup Complete"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "Bucket:           $BUCKET_NAME"
echo "Region:           $AWS_REGION"
echo "Public Access:    BLOCKED ✅"
echo "IAM Role:         $APP_ROLE_ARN"
echo "Versioning:       ENABLED ✅"
echo "Encryption:       AES256 ✅"
echo ""
echo "Next Steps:"
echo "1. Set environment variables in .env.staging:"
echo "   STORAGE_TYPE=s3"
echo "   AWS_REGION=$AWS_REGION"
echo "   AWS_S3_BUCKET=$BUCKET_NAME"
echo "   (Credentials: Use Render IAM role, not hardcoded keys)"
echo ""
echo "2. Deploy to staging with STORAGE_TYPE=s3"
echo ""
echo "3. Run C7A lifecycle tests:"
echo "   - POST /api/storybook/start"
echo "   - REAL photo upload × 6"
echo "   - Story Art upload × 3"
echo "   - GET /api/storybook/my-journey (verify signed URLs)"
echo "   - POST /api/storybook/:id/plant-star"
echo "   - Verify Golden 9 rendering"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
