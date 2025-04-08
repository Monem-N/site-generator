#!/bin/bash

# Make the script exit on any error
set -e

# Function to convert default imports to namespace imports
fix_imports() {
  local file=$1
  echo "Fixing imports in $file"
  
  # Fix path imports
  sed -i '' 's/import path from '\''path'\'';/import * as path from '\''path'\'';/g' "$file"
  
  # Fix fs imports
  sed -i '' 's/import fs from '\''fs'\'';/import * as fs from '\''fs'\'';/g' "$file"
  sed -i '' 's/import fs from '\''fs\/promises'\'';/import * as fs from '\''fs\/promises'\'';/g' "$file"
  
  # Fix chalk imports
  sed -i '' 's/import chalk from '\''chalk'\'';/import * as chalk from '\''chalk'\'';/g' "$file"
  
  # Fix express imports
  sed -i '' 's/import express from '\''express'\'';/import * as express from '\''express'\'';/g' "$file"
  
  # Fix http imports
  sed -i '' 's/import http from '\''http'\'';/import * as http from '\''http'\'';/g' "$file"
  
  # Fix WebSocket imports
  sed -i '' 's/import WebSocket from '\''ws'\'';/import * as WebSocket from '\''ws'\'';/g' "$file"
  
  # Fix chokidar imports
  sed -i '' 's/import chokidar from '\''chokidar'\'';/import * as chokidar from '\''chokidar'\'';/g' "$file"
  
  # Fix crypto imports
  sed -i '' 's/import crypto from '\''crypto'\'';/import * as crypto from '\''crypto'\'';/g' "$file"
  
  # Fix autoprefixer imports
  sed -i '' 's/import autoprefixer from '\''autoprefixer'\'';/import * as autoprefixer from '\''autoprefixer'\'';/g' "$file"
  
  # Fix cssnano imports
  sed -i '' 's/import cssnano from '\''cssnano'\'';/import * as cssnano from '\''cssnano'\'';/g' "$file"
}

# Find all TypeScript files in the src directory
find src -name "*.ts" | while read -r file; do
  fix_imports "$file"
done

echo "Import fixes completed!"
