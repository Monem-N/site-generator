#!/usr/bin/env python3
"""
ESLint Report Analyzer

This script analyzes an ESLint report file and outputs folders sorted by error count,
with files in each folder also sorted by error count.
"""

import os
import re
from collections import defaultdict

# Path to the ESLint report file
REPORT_FILE = 'eslint_report.txt'

def parse_eslint_report(file_path):
    """
    Parse the ESLint report file and organize issues by folder and file.
    
    Args:
        file_path: Path to the ESLint report file
        
    Returns:
        A dictionary with folder paths as keys and a dictionary of files and their error counts as values
    """
    # Check if the report file exists
    if not os.path.exists(file_path):
        print(f"Error: Report file '{file_path}' not found.")
        return {}
    
    # Dictionary to store error counts by folder and file
    folder_file_errors = defaultdict(lambda: defaultdict(int))
    
    # Regular expression to match file paths in the report
    file_pattern = re.compile(r'^(.+?):\s+line\s+\d+,\s+col\s+\d+,\s+(Error|Warning)\s+-')
    
    try:
        with open(file_path, 'r') as f:
            for line in f:
                match = file_pattern.match(line.strip())
                if match:
                    file_path = match.group(1)
                    issue_type = match.group(2)
                    
                    # Get the folder path from the file path
                    folder_path = os.path.dirname(file_path)
                    
                    # Increment the error count for this file
                    folder_file_errors[folder_path][file_path] += 1
    except Exception as e:
        print(f"Error reading report file: {e}")
        return {}
    
    return folder_file_errors

def display_sorted_results(folder_file_errors):
    """
    Display folders sorted by error count, with files in each folder also sorted by error count.
    
    Args:
        folder_file_errors: Dictionary with folder paths as keys and dictionaries of files and their error counts as values
    """
    if not folder_file_errors:
        print("No ESLint issues found or could not parse the report.")
        return
    
    # Calculate total errors per folder
    folder_errors = {}
    for folder, files in folder_file_errors.items():
        folder_errors[folder] = sum(files.values())
    
    # Sort folders by error count (descending)
    sorted_folders = sorted(folder_errors.items(), key=lambda x: x[1], reverse=True)
    
    print("\nESLint Issues by Folder (sorted by error count):\n")
    print("-" * 80)
    
    for folder, error_count in sorted_folders:
        # Get a shorter folder name for display
        short_folder = os.path.basename(folder) or folder
        
        print(f"\n{short_folder} ({error_count} issues)")
        print("-" * 40)
        
        # Sort files in this folder by error count (descending)
        sorted_files = sorted(folder_file_errors[folder].items(), key=lambda x: x[1], reverse=True)
        
        for file_path, file_error_count in sorted_files:
            # Get just the filename for display
            filename = os.path.basename(file_path)
            print(f"  {filename}: {file_error_count} issues")

def main():
    """
    Main function to run the ESLint report analysis.
    """
    print("Analyzing ESLint report...")
    folder_file_errors = parse_eslint_report(REPORT_FILE)
    display_sorted_results(folder_file_errors)
    print("\nAnalysis complete.")

if __name__ == "__main__":
    main()