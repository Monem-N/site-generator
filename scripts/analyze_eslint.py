#!/usr/bin/env python3
"""
ESLint Analysis Script

This script analyzes ESLint error reports and organizes them by directory and file.
It helps prioritize which areas of the codebase need the most attention when fixing ESLint errors.

Usage:
    1. Generate an ESLint report: npx eslint --format json src/ > eslint_report.json
    2. Run this script: python analyze_eslint.py
"""

import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

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

def generate_eslint_report():
    """Generate a fresh ESLint report if one doesn't exist"""
    if not os.path.exists('eslint_report.json'):
        print(f"{COLORS['YELLOW']}No ESLint report found. Generating a new one...{COLORS['ENDC']}")
        os.system('npx eslint --format json src/ > eslint_report.json')
        print(f"{COLORS['GREEN']}ESLint report generated.{COLORS['ENDC']}")

def parse_eslint_report():
    """Parse the ESLint report and organize issues by directory and file"""
    try:
        with open('eslint_report.json', 'r') as f:
            report = json.load(f)
    except FileNotFoundError:
        print(f"{COLORS['RED']}Error: eslint_report.json not found.{COLORS['ENDC']}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"{COLORS['RED']}Error: eslint_report.json is not valid JSON.{COLORS['ENDC']}")
        sys.exit(1)

    # Organize issues by directory and file
    issues_by_dir = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    rule_counts = defaultdict(int)
    total_issues = 0

    for file_report in report:
        if not file_report.get('messages'):
            continue

        filepath = file_report['filePath']
        rel_path = os.path.relpath(filepath)
        directory = os.path.dirname(rel_path)
        filename = os.path.basename(rel_path)

        # Count issues by rule for this file
        file_issues = defaultdict(int)
        for message in file_report['messages']:
            rule_id = message.get('ruleId', 'unknown')
            file_issues[rule_id] += 1
            rule_counts[rule_id] += 1
            total_issues += 1

        # Store file issues in the directory structure
        for rule_id, count in file_issues.items():
            issues_by_dir[directory][filename][rule_id] = count

    return issues_by_dir, rule_counts, total_issues

def display_analysis(issues_by_dir, rule_counts, total_issues):
    """Display the analysis results in a clear, hierarchical format"""
    print(f"\n{COLORS['HEADER']}{COLORS['BOLD']}ESLint Issues Analysis{COLORS['ENDC']}")
    print(f"{COLORS['BOLD']}Total Issues: {total_issues}{COLORS['ENDC']}\n")

    # Sort directories by total issue count
    dir_totals = {}
    for directory, files in issues_by_dir.items():
        dir_total = sum(sum(rules.values()) for rules in files.values())
        dir_totals[directory] = dir_total

    sorted_dirs = sorted(dir_totals.items(), key=lambda x: x[1], reverse=True)

    # Display issues by directory and file
    for directory, dir_total in sorted_dirs:
        dir_percent = (dir_total / total_issues) * 100
        print(f"{COLORS['BOLD']}{COLORS['BLUE']}Directory: {directory} - {dir_total} issues ({dir_percent:.1f}%){COLORS['ENDC']}")

        # Sort files by issue count
        files = issues_by_dir[directory]
        file_totals = {filename: sum(rules.values()) for filename, rules in files.items()}
        sorted_files = sorted(file_totals.items(), key=lambda x: x[1], reverse=True)

        for filename, file_total in sorted_files:
            file_percent = (file_total / dir_total) * 100
            print(f"  {COLORS['CYAN']}{filename} - {file_total} issues ({file_percent:.1f}%){COLORS['ENDC']}")

            # Show top rules for this file
            rules = issues_by_dir[directory][filename]
            sorted_rules = sorted(rules.items(), key=lambda x: x[1], reverse=True)
            for rule_id, count in sorted_rules[:5]:  # Show top 5 rules
                print(f"    {COLORS['YELLOW']}{rule_id}: {count} issues{COLORS['ENDC']}")
            
            if len(sorted_rules) > 5:
                print(f"    {COLORS['YELLOW']}...and {len(sorted_rules) - 5} more rule types{COLORS['ENDC']}")
        
        print()  # Add a blank line between directories

    # Display top rules overall
    print(f"{COLORS['BOLD']}Top ESLint Rules:{COLORS['ENDC']}")
    sorted_rules = sorted(rule_counts.items(), key=lambda x: x[1], reverse=True)
    for rule_id, count in sorted_rules[:10]:  # Show top 10 rules
        rule_percent = (count / total_issues) * 100
        print(f"  {COLORS['YELLOW']}{rule_id}: {count} issues ({rule_percent:.1f}%){COLORS['ENDC']}")

def main():
    """Main function to run the analysis"""
    generate_eslint_report()
    issues_by_dir, rule_counts, total_issues = parse_eslint_report()
    display_analysis(issues_by_dir, rule_counts, total_issues)
    
    print(f"\n{COLORS['GREEN']}Analysis complete. Use this information to prioritize which directories to fix first.{COLORS['ENDC']}")
    print(f"{COLORS['GREEN']}Recommended next step: ./scripts/fix-directory.sh {list(issues_by_dir.keys())[0]}{COLORS['ENDC']}")

if __name__ == "__main__":
    main()
