#!/usr/bin/env python3
"""
ESLint Auto-Fix Script

This script automatically fixes common ESLint issues in TypeScript files:
1. @typescript-eslint/no-explicit-any - Replaces 'any' types with more specific types
2. @typescript-eslint/no-unused-vars - Prefixes unused variables with underscore

Usage:
    python fix_eslint_issues.py [directory]
    
Example:
    python fix_eslint_issues.py src/types
    python fix_eslint_issues.py src/__tests__
"""

import json
import os
import re
import sys
import subprocess
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional, Union

# ANSI color codes for terminal output
COLORS = {
    "HEADER": "\033[95m",
    "BLUE": "\033[94m",
    "CYAN": "\033[96m",
    "GREEN": "\033[92m",
    "YELLOW": "\033[93m",
    "RED": "\033[91m",
    "ENDC": "\033[0m",
    "BOLD": "\033[1m",
    "UNDERLINE": "\033[4m"
}

def run_eslint(directory: str) -> List[Dict]:
    """Run ESLint on the specified directory and return the JSON report"""
    print(f"{COLORS['BLUE']}Running ESLint on {directory}...{COLORS['ENDC']}")
    try:
        result = subprocess.run(
            ["npx", "eslint", "--format", "json", directory],
            capture_output=True,
            text=True,
            check=False
        )
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"{COLORS['RED']}Error running ESLint: {e}{COLORS['ENDC']}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"{COLORS['RED']}Error parsing ESLint output{COLORS['ENDC']}")
        sys.exit(1)

def fix_no_explicit_any(file_path: str) -> int:
    """Fix @typescript-eslint/no-explicit-any issues in the file
    
    Returns the number of fixes applied
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Define patterns and replacements for common 'any' use cases
    replacements = [
        # Function parameters and return types
        (r'\((\w+)\s*:\s*any\)', r'(\1: unknown)'),
        (r'\((\w+)\s*:\s*any\[\]\)', r'(\1: unknown[])'),
        (r'\)\s*:\s*any\s*\{', r'): unknown {'),
        (r'\)\s*:\s*any\[\]\s*\{', r'): unknown[] {'),
        
        # Variable declarations
        (r'(const|let|var)\s+(\w+)\s*:\s*any\s*=', r'\1 \2: unknown ='),
        (r'(const|let|var)\s+(\w+)\s*:\s*any\[\]\s*=', r'\1 \2: unknown[] ='),
        
        # Interface and type properties
        (r'(\w+)\??:\s*any;', r'\1?: unknown;'),
        (r'(\w+)\??:\s*any\[\];', r'\1?: unknown[];'),
        
        # Generic types
        (r'<any>', r'<unknown>'),
        (r'<any\[\]>', r'<unknown[]>'),
        
        # Record types for objects
        (r'Record<string,\s*any>', r'Record<string, unknown>'),
        (r'Record<number,\s*any>', r'Record<number, unknown>'),
        
        # Special case for handlebars.d.ts and similar definition files
        # For function parameters that accept multiple types
        (r'(\w+\??:\s*)any(\s*,)', r'\1unknown\2'),
        
        # Special case for context objects
        (r'context\??:\s*any', r'context?: Record<string, unknown>'),
        (r'options\??:\s*any', r'options?: Record<string, unknown>'),
        (r'data\??:\s*any', r'data?: Record<string, unknown>'),
        (r'hash\??:\s*any', r'hash?: Record<string, unknown>')
    ]
    
    # Apply all replacements
    fixed_content = content
    fixes = 0
    
    for pattern, replacement in replacements:
        new_content, count = re.subn(pattern, replacement, fixed_content)
        fixes += count
        fixed_content = new_content
    
    # Only write to the file if changes were made
    if fixes > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        print(f"{COLORS['GREEN']}Fixed {fixes} 'no-explicit-any' issues in {file_path}{COLORS['ENDC']}")
    
    return fixes

def fix_unused_vars(file_path: str) -> int:
    """Fix @typescript-eslint/no-unused-vars issues in the file by prefixing with underscore
    
    Returns the number of fixes applied
    """
    # Run ESLint on the specific file to get unused variables
    try:
        result = subprocess.run(
            ["npx", "eslint", "--format", "json", file_path],
            capture_output=True,
            text=True,
            check=False
        )
        report = json.loads(result.stdout)
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        print(f"{COLORS['RED']}Error analyzing {file_path} for unused variables{COLORS['ENDC']}")
        return 0
    
    if not report or len(report) == 0:
        return 0
    
    # Extract unused variable names and their locations
    unused_vars = []
    for file_report in report:
        if not file_report.get('messages'):
            continue
            
        for message in file_report['messages']:
            if message.get('ruleId') == '@typescript-eslint/no-unused-vars':
                # Extract variable name from the message
                var_match = re.search(r"'(\w+)' is defined but never used", message.get('message', ''))
                if var_match:
                    var_name = var_match.group(1)
                    line = message.get('line', 0)
                    column = message.get('column', 0)
                    unused_vars.append((var_name, line, column))
    
    if not unused_vars:
        return 0
    
    # Read the file content
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Process each unused variable
    fixes = 0
    for var_name, line_num, col_num in unused_vars:
        # Skip if the variable already starts with underscore
        if var_name.startswith('_'):
            continue
            
        # Get the line where the variable is defined
        if line_num <= 0 or line_num > len(lines):
            continue
            
        line = lines[line_num - 1]
        
        # Replace the variable name with prefixed version
        # We need to be careful to only replace the exact variable name at the right position
        prefix_pos = col_num - 1  # Convert to 0-based indexing
        
        # Ensure we're at the start of the variable name
        if prefix_pos >= 0 and prefix_pos < len(line):
            # Check if the character at prefix_pos is the start of the variable name
            if line[prefix_pos:prefix_pos + len(var_name)] == var_name:
                # Check if it's a standalone identifier (not part of a larger name)
                is_standalone = True
                if prefix_pos > 0 and line[prefix_pos-1].isalnum() or line[prefix_pos-1] == '_':
                    is_standalone = False
                if prefix_pos + len(var_name) < len(line) and (line[prefix_pos + len(var_name)].isalnum() or line[prefix_pos + len(var_name)] == '_'):
                    is_standalone = False
                    
                if is_standalone:
                    # Replace the variable name with _varName
                    new_line = line[:prefix_pos] + '_' + line[prefix_pos:]
                    lines[line_num - 1] = new_line
                    fixes += 1
    
    # Write the modified content back to the file
    if fixes > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"{COLORS['GREEN']}Fixed {fixes} 'no-unused-vars' issues in {file_path}{COLORS['ENDC']}")
    
    return fixes

def process_directory(directory: str) -> Tuple[int, int]:
    """Process all TypeScript files in the directory recursively
    
    Returns a tuple of (any_fixes, unused_var_fixes)
    """
    any_fixes = 0
    unused_var_fixes = 0
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx') or file.endswith('.d.ts'):
                file_path = os.path.join(root, file)
                any_fixes += fix_no_explicit_any(file_path)
                unused_var_fixes += fix_unused_vars(file_path)
    
    return any_fixes, unused_var_fixes

def main():
    """Main function to run the script"""
    if len(sys.argv) < 2:
        print(f"{COLORS['YELLOW']}Usage: python fix_eslint_issues.py [directory]{COLORS['ENDC']}")
        print(f"{COLORS['YELLOW']}Example: python fix_eslint_issues.py src/types{COLORS['ENDC']}")
        sys.exit(1)
    
    directory = sys.argv[1]
    if not os.path.isdir(directory):
        print(f"{COLORS['RED']}Error: {directory} is not a valid directory{COLORS['ENDC']}")
        sys.exit(1)
    
    print(f"{COLORS['HEADER']}ESLint Auto-Fix Script{COLORS['ENDC']}")
    print(f"{COLORS['BLUE']}Target directory: {directory}{COLORS['ENDC']}")
    
    any_fixes, unused_var_fixes = process_directory(directory)
    
    print(f"\n{COLORS['HEADER']}Summary:{COLORS['ENDC']}")
    print(f"{COLORS['GREEN']}Fixed {any_fixes} 'no-explicit-any' issues{COLORS['ENDC']}")
    print(f"{COLORS['GREEN']}Fixed {unused_var_fixes} 'no-unused-vars' issues{COLORS['ENDC']}")
    print(f"\n{COLORS['YELLOW']}Run ESLint again to check for remaining issues:{COLORS['ENDC']}")
    print(f"{COLORS['YELLOW']}npx eslint --format json {directory} > eslint_report.json{COLORS['ENDC']}")
    print(f"{COLORS['YELLOW']}python analyze_eslint.py{COLORS['ENDC']}")

if __name__ == "__main__":
    main()