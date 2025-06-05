# Contributing to BeruFoods

Thank you for your interest in contributing to the BeruFoods project! This document provides guidelines and instructions for contributing to the codebase.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Use welcoming and inclusive language
- Be collaborative and constructive
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the Repository**:
   - Click the "Fork" button at the top right of the repository page
   - Clone your fork locally:
     ```bash
     git clone https://github.com/YOUR-USERNAME/BeruFoods.git
     cd BeruFoods
     ```

2. **Set Up Development Environment**:
   - Follow the installation instructions in the [README.md](../README.md)
   - Make sure all tests pass before making changes

3. **Create a Branch**:
   - Create a branch for your feature or bugfix:
     ```bash
     git checkout -b feature/your-feature-name
     # or
     git checkout -b fix/issue-description
     ```

## Development Workflow

1. **Keep Your Fork Updated**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/BeruFoods.git
   git fetch upstream
   git merge upstream/main
   ```

2. **Make Your Changes**:
   - Write your code following the [Coding Standards](#coding-standards)
   - Add or update tests as necessary
   - Add or update documentation as necessary

3. **Commit Your Changes**:
   - Use meaningful commit messages that explain what and why (not how)
   - Format: `[Component] Short description of change`
   - Example: `[Frontend] Add restaurant filter by cuisine type`

4. **Push to Your Fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

## Pull Request Process

1. **Create a Pull Request**:
   - Go to the original repository
   - Click "New Pull Request"
   - Select "compare across forks"
   - Select your fork and branch
   - Click "Create Pull Request"

2. **PR Description**:
   - Use the PR template if available
   - Describe what the PR does and why
   - Reference any related issues
   - Include screenshots or GIFs for UI changes

3. **Code Review**:
   - Address any feedback from reviewers
   - Make requested changes and push to your branch
   - The PR will be updated automatically

4. **Merge Requirements**:
   - PR must be approved by at least one maintainer
   - All CI checks must pass
   - No merge conflicts with the main branch

## Coding Standards

### PHP (Backend)

- Follow PSR-12 coding standards
- Use PHP 8.2+ features where appropriate
- Document classes and methods with PHPDoc comments
- Use type hints for parameters and return types
- Use Symfony best practices for controllers, services, and entities

### JavaScript/React (Frontend)

- Use ES6+ features
- Follow the Airbnb JavaScript Style Guide
- Use functional components with hooks
- Document components with JSDoc comments
- Use PropTypes or TypeScript for component props
- Follow React best practices for state management

### CSS/Styling

- Use TailwindCSS utility classes
- Follow BEM methodology for custom CSS
- Ensure responsive design for all components
- Maintain accessibility standards (WCAG 2.1 AA)

## Testing

### Backend Testing

- Write unit tests for services and repositories
- Write functional tests for controllers
- Run tests before submitting a PR:
  ```bash
  make test-backend
  ```

### Frontend Testing

- Write unit tests for utility functions
- Write component tests for React components
- Ensure tests cover both success and error cases
- Run tests before submitting a PR:
  ```bash
  docker compose exec frontend yarn test
  ```

## Documentation

- Update documentation when adding or changing features
- Document APIs using OpenAPI/Swagger annotations
- Document React components with JSDoc comments
- Update the README.md and other documentation files as needed

## Issue Reporting

1. **Check Existing Issues**:
   - Search for existing issues before creating a new one
   - Check if the issue has already been fixed in a recent PR

2. **Create a New Issue**:
   - Use a clear and descriptive title
   - Provide a detailed description of the issue
   - Include steps to reproduce
   - Include expected and actual behavior
   - Include screenshots or error messages if applicable
   - Specify your environment (OS, browser, etc.)

3. **Issue Labels**:
   - Bug: Something isn't working as expected
   - Enhancement: New feature or improvement
   - Documentation: Documentation improvements
   - Question: Further information is needed
   - Good First Issue: Good for newcomers

Thank you for contributing to BeruFoods!