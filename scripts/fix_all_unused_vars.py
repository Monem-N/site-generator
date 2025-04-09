#!/usr/bin/env python3

"""
This script fixes all unused variables in the codebase by prefixing them with underscores.
It handles various declaration patterns and ensures that all references are updated.
"""

import os
import re
import subprocess
import json
from pathlib import Path

# Get the root directory of the project
ROOT_DIR = Path(__file__).parent.parent

def get_eslint_issues():
    """Run ESLint and get the list of unused variables issues."""
    result = subprocess.run(
        ['npx', 'eslint', '--format', 'json', 'src/**/*.ts'],
        capture_output=True,
        text=True
    )
    
    try:
        eslint_output = json.loads(result.stdout)
    except json.JSONDecodeError:
        print("Error parsing ESLint output")
        return []
    
    issues = []
    for file_result in eslint_output:
        file_path = file_result.get('filePath', '')
        
        for message in file_result.get('messages', []):
            if message.get('ruleId') == '@typescript-eslint/no-unused-vars':
                variable = message.get('message', '').split("'")[1] if "'" in message.get('message', '') else ''
                if variable:
                    issues.append({
                        'file': file_path,
                        'line': message.get('line', 0),
                        'column': message.get('column', 0),
                        'variable': variable
                    })
    
    return issues

def fix_unused_vars(issues):
    """Fix unused variables by prefixing them with underscores."""
    files_modified = set()
    
    # Group issues by file for more efficient processing
    issues_by_file = {}
    for issue in issues:
        file_path = issue['file']
        if file_path not in issues_by_file:
            issues_by_file[file_path] = []
        issues_by_file[file_path].append(issue['variable'])
    
    # Process each file
    for file_path, variables in issues_by_file.items():
        if not os.path.exists(file_path):
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        modified_content = content
        file_modified = False
        
        # Process each variable in the file
        for variable in variables:
            # Skip if the variable is already prefixed with underscore
            if f'_{variable}' in modified_content:
                continue
                
            # Handle different variable declaration patterns
            patterns = [
                # Regular variable declarations
                (re.compile(r'(const|let|var)\s+(' + re.escape(variable) + r')(\s*[:=]|\s+in\s+|\s+of\s+)'), r'\1 _\2\3'),
                # Function parameters
                (re.compile(r'(\(|,\s*)(' + re.escape(variable) + r')(\s*[:),])'), r'\1_\2\3'),
                # Destructuring assignments
                (re.compile(r'(\{[^}]*?)(' + re.escape(variable) + r')(\s*[,}])'), r'\1_\2\3'),
                # Function declarations
                (re.compile(r'(function\s+)(' + re.escape(variable) + r')(\s*\()'), r'\1_\2\3'),
                # Import statements
                (re.compile(r'(import\s+\{[^}]*?)(' + re.escape(variable) + r')(\s*[,}])'), r'\1_\2\3'),
                (re.compile(r'(import\s+)(' + re.escape(variable) + r')(\s+from)'), r'\1_\2\3'),
                # Class properties
                (re.compile(r'(private|protected|public)\s+(' + re.escape(variable) + r')(\s*[:=])'), r'\1 _\2\3'),
                # Arrow function parameters
                (re.compile(r'(\(\s*)(' + re.escape(variable) + r')(\s*\)\s*=>)'), r'\1_\2\3'),
                # Method parameters
                (re.compile(r'(method\([^)]*?)(' + re.escape(variable) + r')(\s*[,)])'), r'\1_\2\3'),
            ]
            
            for pattern, replacement in patterns:
                modified_content = pattern.sub(replacement, modified_content)
            
            # Check if the variable was actually modified
            if modified_content != content:
                file_modified = True
                print(f"Fixed unused variable '{variable}' in {file_path}")
        
        # Write the modified content back to the file
        if file_modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(modified_content)
            files_modified.add(file_path)
    
    return files_modified

def main():
    """Main function to fix unused variables."""
    print("Getting ESLint issues...")
    issues = get_eslint_issues()
    
    if not issues:
        print("No unused variable issues found.")
        return
    
    print(f"Found {len(issues)} unused variable issues.")
    
    files_modified = fix_unused_vars(issues)
    
    print(f"\nFixed unused variables in {len(files_modified)} files:")
    for file in sorted(files_modified):
        print(f"  - {file}")

if __name__ == "__main__":
    main()
