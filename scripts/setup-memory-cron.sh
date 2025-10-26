#!/bin/bash

# WAVELENGTH Memory System Cron Setup
# Sets up automatic memory updates

echo "🔄 Setting up WAVELENGTH Memory System Auto-Updates"

# Create cron job for daily memory updates
CRON_JOB="0 2 * * * cd $(pwd) && node scripts/auto-update-memory.js >> logs/memory-updates.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "auto-update-memory.js"; then
    echo "✅ Memory auto-update cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Added daily memory auto-update at 2 AM"
fi

# Create logs directory
mkdir -p logs

# Create manual update script
cat > update-memory-now.sh << 'EOF'
#!/bin/bash
echo "🚀 Manual Memory System Update"
node scripts/auto-update-memory.js
EOF

chmod +x update-memory-now.sh

echo ""
echo "🎉 Memory System Auto-Updates Configured!"
echo ""
echo "📋 What's Set Up:"
echo "   ✅ Daily auto-updates at 2 AM"
echo "   ✅ Weekly comprehensive updates"
echo "   ✅ Incremental GitHub history updates"
echo "   ✅ Tool documentation updates"
echo ""
echo "🚀 Manual Commands:"
echo "   ./update-memory-now.sh     # Update now"
echo "   node scripts/auto-update-memory.js  # Direct update"
echo ""
echo "📊 Logs:"
echo "   tail -f logs/memory-updates.log  # View update logs"