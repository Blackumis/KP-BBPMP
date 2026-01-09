#!/bin/bash

echo "========================================"
echo "KP BBPMP Backend Setup"
echo "========================================"
echo ""

# Check Node.js
echo "[1/5] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
node --version
echo ""

# Install dependencies
echo "[2/5] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo ""

# Setup .env
echo "[3/5] Setting up environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env file created. Please edit it with your database credentials."
    echo ""
    read -p "Do you want to edit .env now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
else
    echo ".env file already exists, skipping..."
fi
echo ""

# Run migration
echo "[4/5] Do you want to run database migration now? (y/n)"
read -p "Enter choice: " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running database migration..."
    npm run migrate
    if [ $? -ne 0 ]; then
        echo "WARNING: Migration failed. Please check your database configuration in .env"
    else
        echo "Migration completed successfully!"
    fi
else
    echo "Skipping migration. Run 'npm run migrate' manually when ready."
fi
echo ""

# Complete
echo "[5/5] Setup Complete!"
echo ""
echo "========================================"
echo "Next Steps:"
echo "========================================"
echo "1. Edit .env file with your configuration"
echo "2. Run 'npm run migrate' to setup database"
echo "3. Run 'npm run dev' to start the server"
echo "4. Default login: admin / admin123"
echo ""
echo "Documentation:"
echo "- QUICKSTART.md for quick setup guide"
echo "- README.md for full documentation"
echo "- DEPLOYMENT.md for production deployment"
echo "========================================"
echo ""
