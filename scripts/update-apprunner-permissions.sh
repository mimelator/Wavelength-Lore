#!/bin/bash

echo "🔐 Updating App Runner Permissions for wavelength-lore-app-user"
echo "================================================================"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
fi

# Check for required credentials
if [ -z "$aws_wavelength_dev_access_key_id" ] || [ -z "$aws_wavelength_dev_secret_access_key" ]; then
    echo "❌ Error: wavelength-dev AWS credentials not found in .env"
    echo ""
    echo "Please ensure .env contains:"
    echo "  aws_wavelength_dev_access_key_id=..."
    echo "  aws_wavelength_dev_secret_access_key=..."
    echo ""
    exit 1
fi

USER_NAME="wavelength-lore-app-user"
POLICY_FILE="aws-policies/apprunner-policy.json"

if [ ! -f "$POLICY_FILE" ]; then
    echo "❌ Error: Policy file not found: $POLICY_FILE"
    exit 1
fi

echo "📋 Policy file: $POLICY_FILE"
echo "👤 IAM User: $USER_NAME"
echo ""

# Validate JSON
if ! jq empty "$POLICY_FILE" 2>/dev/null; then
    echo "❌ Error: Invalid JSON in policy file"
    exit 1
fi

echo "✅ Policy file is valid JSON"
echo ""

# Show what will be added
echo "📝 New permissions being added:"
jq -r '.Statement[] | select(.Sid == "AppRunnerServiceAccess") | .Action[] | select(. == "apprunner:StartDeployment")' "$POLICY_FILE" | while read action; do
    echo "  + $action"
done

jq -r '.Statement[] | select(.Sid == "ECRDescribeImages") | .Action[]' "$POLICY_FILE" | while read action; do
    echo "  + $action"
done

echo ""
echo "🔧 Updating IAM policy..."

# List existing inline policies
EXISTING_POLICY=$(AWS_ACCESS_KEY_ID="$aws_wavelength_dev_access_key_id" \
    AWS_SECRET_ACCESS_KEY="$aws_wavelength_dev_secret_access_key" \
    aws iam list-user-policies \
    --user-name "$USER_NAME" \
    --query 'PolicyNames[0]' \
    --output text 2>&1)

if echo "$EXISTING_POLICY" | grep -q "error\|Error"; then
    echo "❌ Error listing policies: $EXISTING_POLICY"
    exit 1
fi

if [ -z "$EXISTING_POLICY" ] || [ "$EXISTING_POLICY" = "None" ]; then
    POLICY_NAME="AppRunnerDeploymentPolicy"
    echo "📌 Creating new inline policy: $POLICY_NAME"
else
    POLICY_NAME="$EXISTING_POLICY"
    echo "📌 Updating existing inline policy: $POLICY_NAME"
fi

# Put the policy
RESULT=$(AWS_ACCESS_KEY_ID="$aws_wavelength_dev_access_key_id" \
    AWS_SECRET_ACCESS_KEY="$aws_wavelength_dev_secret_access_key" \
    aws iam put-user-policy \
    --user-name "$USER_NAME" \
    --policy-name "$POLICY_NAME" \
    --policy-document "file://$POLICY_FILE" 2>&1)

if echo "$RESULT" | grep -q "error\|Error"; then
    echo "❌ Error updating policy: $RESULT"
    exit 1
fi

echo "✅ IAM policy updated successfully!"
echo ""

# Verify the update
echo "🔍 Verifying permissions..."
VERIFY=$(AWS_ACCESS_KEY_ID="$aws_wavelength_dev_access_key_id" \
    AWS_SECRET_ACCESS_KEY="$aws_wavelength_dev_secret_access_key" \
    aws iam get-user-policy \
    --user-name "$USER_NAME" \
    --policy-name "$POLICY_NAME" \
    --query 'PolicyDocument.Statement[?Sid==`AppRunnerServiceAccess`].Action[]' \
    --output text 2>&1)

if echo "$VERIFY" | grep -q "StartDeployment"; then
    echo "✅ apprunner:StartDeployment permission confirmed"
else
    echo "⚠️  Could not verify StartDeployment permission"
fi

if echo "$VERIFY" | grep -q "error\|Error"; then
    echo "⚠️  Verification check failed (but policy was updated)"
fi

echo ""
echo "================================================================"
echo "✅ Permissions updated successfully!"
echo ""
echo "The wavelength-lore-app-user now has:"
echo "  • apprunner:DescribeService"
echo "  • apprunner:UpdateService"
echo "  • apprunner:StartDeployment ← NEW"
echo "  • apprunner:ListServices"
echo "  • ecr:DescribeImages ← NEW"
echo ""
echo "Next steps:"
echo "  1. Push your code to trigger a new deployment"
echo "  2. The deployment should now succeed!"
echo ""
