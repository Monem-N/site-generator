#!/usr/bin/env python3

"""
This script fixes 'no-explicit-any' ESLint issues by replacing 'any' with 'unknown'
or 'Record<string, unknown>' as appropriate.
"""

import os
import re
import subprocess
import json
from pathlib import Path

# Get the root directory of the project
ROOT_DIR = Path(__file__).parent.parent

def get_eslint_issues():
    """Run ESLint and get the list of 'no-explicit-any' issues."""
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
            if message.get('ruleId') == '@typescript-eslint/no-explicit-any':
                issues.append({
                    'file': file_path,
                    'line': message.get('line', 0),
                    'column': message.get('column', 0)
                })
    
    return issues

def fix_any_types():
    """Fix 'any' types by replacing them with 'unknown' or 'Record<string, unknown>'."""
    files_modified = set()
    
    # Process each file in the src directory
    for root, _, files in os.walk(os.path.join(ROOT_DIR, 'src')):
        for file in files:
            if not file.endswith('.ts'):
                continue
                
            file_path = os.path.join(root, file)
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            modified_content = content
            file_modified = False
            
            # Replace 'Record<string, any>' with 'Record<string, unknown>'
            pattern = re.compile(r'Record<string,\s*any>')
            if pattern.search(modified_content):
                modified_content = pattern.sub('Record<string, unknown>', modified_content)
                file_modified = True
            
            # Replace 'Record<string, any[]>' with 'Record<string, unknown[]>'
            pattern = re.compile(r'Record<string,\s*any\[\]>')
            if pattern.search(modified_content):
                modified_content = pattern.sub('Record<string, unknown[]>', modified_content)
                file_modified = True
            
            # Replace 'any[]' with 'unknown[]'
            pattern = re.compile(r'any\[\]')
            if pattern.search(modified_content):
                modified_content = pattern.sub('unknown[]', modified_content)
                file_modified = True
            
            # Replace 'Array<any>' with 'Array<unknown>'
            pattern = re.compile(r'Array<any>')
            if pattern.search(modified_content):
                modified_content = pattern.sub('Array<unknown>', modified_content)
                file_modified = True
            
            # Replace 'Promise<any>' with 'Promise<unknown>'
            pattern = re.compile(r'Promise<any>')
            if pattern.search(modified_content):
                modified_content = pattern.sub('Promise<unknown>', modified_content)
                file_modified = True
            
            # Replace ': any' with ': unknown'
            pattern = re.compile(r':\s*any\b')
            if pattern.search(modified_content):
                modified_content = pattern.sub(': unknown', modified_content)
                file_modified = True
            
            # Replace '<any>' with '<unknown>'
            pattern = re.compile(r'<any>')
            if pattern.search(modified_content):
                modified_content = pattern.sub('<unknown>', modified_content)
                file_modified = True
            
            # Replace 'as any' with 'as unknown'
            pattern = re.compile(r'as\s+any\b')
            if pattern.search(modified_content):
                modified_content = pattern.sub('as unknown', modified_content)
                file_modified = True
            
            # Write the modified content back to the file
            if file_modified:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(modified_content)
                files_modified.add(file_path)
                print(f"Fixed 'any' types in {file_path}")
    
    return files_modified

def main():
    """Main function to fix 'any' types."""
    print("Fixing 'any' types...")
    
    files_modified = fix_any_types()
    
    print(f"\nFixed 'any' types in {len(files_modified)} files:")
    for file in sorted(files_modified):
        print(f"  - {file}")

if __name__ == "__main__":
    main()
