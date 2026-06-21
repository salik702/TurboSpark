<div align="center">

# ⚡ TURBO SPARK CLI

**An open-source, terminal-first AI coding agent that understands your entire codebase.**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![Status](https://img.shields.io/badge/status-active%20development-orange)](#project-status)
[![Multi--Provider](https://img.shields.io/badge/AI-Multi--Provider-purple)](#multi-model-support)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

*Generate, debug, refactor, and understand code — all from natural language, right in your terminal.*

</div>

<div align="center">

<!-- 📸 Add your CLI screenshot below — replace the path with your actual image -->
<img width="947" height="487" alt="image" src="https://github.com/user-attachments/assets/f1696bce-3446-439c-96a2-f747c63d8c66" />


</div>

---

## ✨ Overview

**TURBO SPARK** is an AI-powered coding CLI agent designed to work directly in your terminal. It helps developers **understand, modify, generate, debug, and refactor** codebases using natural language commands.

It's built as a **multi-provider AI system**, connecting to both cloud and local models while maintaining full awareness of your project's context — frameworks, structure, dependencies, and Git state.

## 🎯 Core Purpose

TURBO SPARK acts as a terminal-first AI coding assistant that:

- 🧠 Understands the entire project structure
- 🛠️ Generates and modifies code automatically
- 🐞 Debugs errors and suggests fixes
- 🔧 Refactors code safely
- 🔌 Works across multiple AI providers

## 🚀 Key Features

### 1. Project-Aware Intelligence
Automatically scans the codebase and builds context about:
- Frameworks used
- Project structure
- Dependencies
- Git state

### 2. AI Code Generation
Generate code from natural language prompts:
```bash
turbospark "create login API"
turbospark "fix navbar responsiveness"
turbospark "add authentication system"
```

### 3. Debugging & Repair Mode
Detects errors, analyzes stack traces, and suggests or applies fixes.

### 4. Multi-Model Support
Supports multiple AI backends:
- 🌐 OpenRouter API
- 🖥️ Local Ollama models
- ⚡ Grok API

### 5. Refactoring Engine
Safely refactors and improves code structure while preserving functionality.

### 6. Memory System
Stores project-specific context, decisions, and preferences across sessions.

### 7. Self-Healing CLI
Includes a `doctor` mode — diagnostic tools to fix configuration and environment issues.

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/turbospark-cli.git
cd turbospark-cli

# Install dependencies
npm install
# or
pip install -r requirements.txt

# Run the doctor command to verify your setup
turbospark doctor
```

> Replace the install steps above with your actual packaging method (npm/pip/pipx) once published.

## ⚙️ Configuration

Set up your preferred AI provider via environment variables or a config file:

```bash
# OpenRouter
export OPENROUTER_API_KEY="your_api_key_here"

# Grok
export GROK_API_KEY="your_api_key_here"

# Ollama (local)
export OLLAMA_HOST="http://localhost:11434"
```

## 🧪 Usage

```bash
# Generate code from a natural language prompt
turbospark "create REST API for todo app"

# Debug the current project
turbospark debug

# Explain a specific file
turbospark explain src/app.py

# Refactor with a target architecture in mind
turbospark refactor "clean architecture"

# Run diagnostics on your environment
turbospark doctor
```

## 🏗️ Tech Stack

| Layer            | Technology                              |
|-------------------|------------------------------------------|
| Language          | Python / Node.js (implementation-dependent) |
| CLI Framework     | Typer (Python) / Commander.js (Node.js) |
| AI Providers      | OpenRouter, Grok, Ollama                |
| Automation        | File system automation tools            |

## 🗺️ Project Status

🚧 **Actively under development.** TURBO SPARK is evolving into a production-grade AI coding assistant CLI, in the same spirit as modern agent-based developer tools like Gemini CLI and Qwen Code.

Contributions, feedback, and issue reports are welcome as the project matures.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the **Apache License 2.0**.

- ✅ Free to use, modify, and distribute
- 📝 Must include attribution to the original authors
- 📋 Must state changes made to the original code
- 🚫 Cannot use trademarks of the original project
- ⚠️ Provided "as-is" without warranty

Full license text: [apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

---

<div align="center">

**Built for developers who live in the terminal.** ⚡

</div>
