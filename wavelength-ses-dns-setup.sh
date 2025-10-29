#!/bin/bash
# WAVELENGTH AWS SES DNS Configuration Script
# ==========================================
# 
# This script helps you configure DNS records for AWS SES
# Replace [YOUR-TOKEN] with actual values from AWS Console

echo "🌊 Configuring DNS for Wavelength Lore AWS SES"
echo "=============================================="

# Check if running in dry-run mode
if [ "$1" = "--dry-run" ]; then
    echo "🔍 DRY RUN MODE - No changes will be made"
    DRY_RUN=true
else
    DRY_RUN=false
fi

# Domain verification TXT record
echo "📝 Adding domain verification record..."
if [ "$DRY_RUN" = false ]; then
    # Add your DNS provider's CLI command here, for example:
    # aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch file://verification-record.json
    echo "⚠️  Manual step: Add TXT record _amazonses.wavelengthlore.com with verification token"
else
    echo "Would add: TXT _amazonses.wavelengthlore.com [verification-token]"
fi

# DKIM CNAME records
echo "🔐 Adding DKIM records..."

if [ "$DRY_RUN" = false ]; then
    echo "⚠️  Manual step: Add CNAME ryjihkc2zivzhcnqy2fzhhl65tagjm2p._domainkey → ryjihkc2zivzhcnqy2fzhhl65tagjm2p.dkim.amazonses.com"
else
    echo "Would add: CNAME ryjihkc2zivzhcnqy2fzhhl65tagjm2p._domainkey → ryjihkc2zivzhcnqy2fzhhl65tagjm2p.dkim.amazonses.com"
fi
if [ "$DRY_RUN" = false ]; then
    echo "⚠️  Manual step: Add CNAME z4yx54souylhsx53nz32ryn5lkje2ldx._domainkey → z4yx54souylhsx53nz32ryn5lkje2ldx.dkim.amazonses.com"
else
    echo "Would add: CNAME z4yx54souylhsx53nz32ryn5lkje2ldx._domainkey → z4yx54souylhsx53nz32ryn5lkje2ldx.dkim.amazonses.com"
fi
if [ "$DRY_RUN" = false ]; then
    echo "⚠️  Manual step: Add CNAME yi7oohkzzmkymixfohpsh3pawiv2hxzc._domainkey → yi7oohkzzmkymixfohpsh3pawiv2hxzc.dkim.amazonses.com"
else
    echo "Would add: CNAME yi7oohkzzmkymixfohpsh3pawiv2hxzc._domainkey → yi7oohkzzmkymixfohpsh3pawiv2hxzc.dkim.amazonses.com"
fi

# MAIL FROM MX record
echo "📧 Adding MAIL FROM MX record..."
if [ "$DRY_RUN" = false ]; then
    echo "⚠️  Manual step: Add MX mail.wavelengthlore.com → 10 feedback-smtp.us-east-1.amazonses.com"
else
    echo "Would add: MX mail.wavelengthlore.com → 10 feedback-smtp.us-east-1.amazonses.com"
fi

# SPF TXT record
echo "🛡️  Adding SPF record..."
if [ "$DRY_RUN" = false ]; then
    echo "⚠️  Manual step: Add TXT mail.wavelengthlore.com → 'v=spf1 include:amazonses.com ~all'"
else
    echo "Would add: TXT mail.wavelengthlore.com → 'v=spf1 include:amazonses.com ~all'"
fi

echo "✅ DNS configuration steps completed!"
echo "⏰ DNS propagation can take up to 48 hours"
echo "🧪 Test your setup with: npm run wavelength:test-email"
