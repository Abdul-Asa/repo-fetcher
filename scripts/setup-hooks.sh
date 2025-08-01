#!/bin/bash

# Setup script to install Git hooks for automatic README updates

echo "🔧 Setting up Git hooks for automatic README updates..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy the post-commit hook
if [ -f ".githooks/post-commit" ]; then
    cp .githooks/post-commit .git/hooks/post-commit
    chmod +x .git/hooks/post-commit
    echo "✅ Post-commit hook installed successfully"
else
    echo "❌ Post-commit hook file not found at .githooks/post-commit"
    exit 1
fi

# Make sure the README updater script is executable
if [ -f "scripts/update-readme.js" ]; then
    chmod +x scripts/update-readme.js
    echo "✅ README updater script permissions set"
else
    echo "❌ README updater script not found at scripts/update-readme.js"
    exit 1
fi

echo "🎉 Git hooks setup completed!"
echo ""
echo "📋 What this does:"
echo "  • After each commit, the README.md will be automatically analyzed"
echo "  • A 'Recent Changes' section will be added/updated with commit information"
echo "  • Feature additions, bug fixes, and other changes will be categorized"
echo "  • The last 5 changes will be kept in the changelog"
echo ""
echo "💡 To manually update the README for the current commit:"
echo "   node scripts/update-readme.js"
echo ""
echo "⚠️ Note: After the hook runs, you may want to commit README changes with:"
echo "   git add README.md && git commit --amend --no-edit"