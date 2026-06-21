<div align="center">

[![npm version](https://img.shields.io/npm/v/turbospark.svg)](https://www.npmjs.com/package/turbospark)
[![License](https://img.shields.io/github/license/turbospark/turbospark.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)

**The open-source AI coding agent that lives in your terminal.**

</div>

TurboSpark is an open-source AI coding agent that brings the power of multiple
AI providers directly into your terminal. It provides a unified, agentic
experience with Auto-Memory, SubAgents, MCP integrations, and a smart provider
selector that picks the best model for you — automatically.

## 🚀 Why TurboSpark?

- **🤖 Agentic out of the box** — Auto-Memory, Auto-Skills, SubAgents, Agent
  Teams, and MCP. Dynamic workflows, zero setup.
- **🔌 Multi-protocol** — Supports OpenRouter, Ollama, Grok, OpenAI, Anthropic,
  Gemini APIs. Any third-party provider or local model. Switch at runtime.
- **🧠 Smart Auto Provider** — Automatically selects the best available provider
  (local Ollama → OpenRouter → Grok). No manual config needed.
- **⚡ Turbo Mode** — Faster responses, reduced token usage, compact output with
  `--turbo` flag.
- **🔍 Project Context Scanner** — Automatically detects language, framework,
  package manager, and Git repository.
- **🩺 Doctor Command** — Verify API keys, network connectivity, and
  configuration with `turbospark doctor`.
- **🌐 Beyond the terminal** — IDE plugins (VS Code, Zed), Desktop app, daemon
  mode, SDKs (TypeScript, Python, Java), and IM bots.
- **🛡️ Open source** — Apache 2.0 licensed.

## 📦 Installation

### Quick Install

#### Run instantly with npx

```bash
# Using npx (no installation required)
npx turbospark
```

#### Install globally with npm

```bash
npm install -g turbospark@latest
```

> **Note:** Requires [Node.js 22+](https://nodejs.org/).

#### Install with Anaconda (for restricted environments)

```bash
# Create and activate a new environment
conda create -y -n turbospark_env -c conda-forge nodejs
conda activate turbospark_env

# Install TurboSpark globally via npm (inside the environment)
npm install -g turbospark@latest
```

## Release Channels

### Preview

New preview releases are published for early testing. These releases may contain
regressions or outstanding issues. Help us test with the `preview` tag.

```bash
npm install -g turbospark@preview
```

### Stable

Stable releases are the fully validated versions with bug fixes and
improvements. Use the `latest` tag.

```bash
npm install -g turbospark@latest
```

## 📋 Key Features

### Code Understanding & Generation

- Query and edit large codebases with rich terminal UI
- Generate new apps and boilerplate from natural language prompts
- Debug issues and troubleshoot with contextual assistance

### Automation & Integration

- Automate operational tasks like querying pull requests or handling complex
  rebases
- Use MCP servers to connect custom tools and external services
- Run non-interactively in scripts and CI/CD pipelines for workflow automation

### Advanced Capabilities

- **AI Project Memory** — Stores user preferences, previous prompts, and
  frequently used models for a personalized experience
- **Custom context files** (AGENTS.md) to tailor behavior for your projects
- Conversation checkpointing to save and resume complex sessions

### Multi-Provider Support

TurboSpark supports multiple AI providers:

| Provider       | Description                          | Environment Variable     |
| -------------- | ------------------------------------ | ------------------------ |
| **OpenRouter** | Access hundreds of models            | `OPENROUTER_API_KEY`     |
| **Ollama**     | Run models locally on your machine   | —                        |
| **Grok**       | Access xAI's Grok models            | `GROK_API_KEY`           |
| **OpenAI**     | GPT models                           | `OPENAI_API_KEY`         |
| **Anthropic**  | Claude models                        | `ANTHROPIC_API_KEY`      |
| **Gemini**     | Google's models                      | `GEMINI_API_KEY`         |
| **Custom**     | Any OpenAI-compatible endpoint       | —                        |

## 🔐 Authentication Options

Choose the authentication method that best fits your needs:

### Option 1: Smart Auto Provider (Recommended)

**✨ Best for:** Getting started quickly with zero configuration

**Benefits:**

- **Automatic selection** — picks the best available provider
- **Priority order**: Local Ollama → OpenRouter → Grok
- **No manual setup** — just set your API keys and go

```bash
# Set any API key and TurboSpark handles the rest
export OPENROUTER_API_KEY="YOUR_API_KEY"
turbospark
```

### Option 2: Specific Provider API Key

**✨ Best for:** Developers who need specific model control

```bash
# Use a specific provider
export ANTHROPIC_API_KEY="YOUR_API_KEY"
turbospark
```

### Option 3: Local Models with Ollama

**✨ Best for:** Fully offline, private, and free usage

```bash
# Install Ollama and pull a model
ollama pull llama3

# TurboSpark auto-detects local Ollama
turbospark
```

## 🚀 Getting Started

### Basic Usage

#### Start interactive terminal UI

```bash
turbospark
```

#### Non-interactive mode for scripts

```bash
turbospark -p "Explain the architecture of this codebase"
```

#### Use Turbo Mode for faster responses

```bash
turbospark --turbo
```

#### Verify your configuration

```bash
turbospark doctor
```

### How to Use TurboSpark

| Mode            | Command               | Use Case                                           |
| --------------- | --------------------- | -------------------------------------------------- |
| **Interactive** | `turbospark`          | Terminal UI with rich rendering, `@file` references, slash commands |
| **Headless**    | `turbospark -p "..."` | Scripts, CI/CD, batch processing — no UI           |
| **Turbo**       | `turbospark --turbo`  | Faster responses, reduced token usage              |
| **Doctor**      | `turbospark doctor`   | Verify API keys, connectivity, configuration       |
| **IDE**         | —                     | VS Code, Zed, JetBrains plugins                    |
| **Desktop**     | —                     | GUI for macOS, Windows, Linux                      |
| **Daemon**      | `turbospark serve`    | Shared agent session over HTTP+SSE (experimental)  |
| **IM Bot**      | `turbospark channel`  | Connect to Telegram, DingTalk, WeChat, or Feishu   |

### Quick Examples

#### Start a new project

```bash
cd new-project/
turbospark
> Write me a Discord bot that answers questions using a FAQ.md file I will provide
```

#### Analyze existing code

```bash
git clone https://github.com/your-org/your-repo
cd your-repo
turbospark
> Give me a summary of all of the changes that went in this week
```

## 📚 Documentation

### Getting Started

- **Quickstart Guide** — Install and configure TurboSpark
- **Authentication Setup** — Configure API keys and providers
- **Configuration Guide** — Settings and customization

### Core Features

- **Slash Commands** — All available commands (`/auth`, `/help`, etc.)
- **Custom Commands** — Create your own reusable commands
- **Context Files (AGENTS.md)** — Provide persistent context to TurboSpark
- **Turbo Mode** — Optimize token usage and response speed
- **Doctor Command** — Diagnose configuration issues

### Tools & Extensions

- **Built-in Tools** — File system operations, shell commands, web fetch
- **MCP Server Integration** — Extend with custom tools
- **IM Bot Channels** — Connect to Telegram, DingTalk, WeChat, Feishu, QQ

### Advanced Topics

- **Headless Mode (Scripting)** — Use TurboSpark in automated workflows
- **IDE Integration** — VS Code and Zed companions
- **Sandboxing & Security** — Safe execution environments with Docker/Podman
- **Daemon Mode** — Shared agent sessions over HTTP+SSE
- **SDKs** — TypeScript, Python, and Java SDKs for programmatic access

### Using MCP Servers

Configure MCP servers to extend TurboSpark with custom tools:

```text
> @github List my open pull requests
> @slack Send a summary of today's commits to #dev channel
> @database Run a query to find inactive users
```

## 🤝 Contributing

We welcome contributions! TurboSpark is fully open source (Apache 2.0), and we
encourage the community to:

- Report bugs and suggest features.
- Improve documentation.
- Submit code improvements.
- Share your MCP servers and extensions.

See our [Contributing Guide](./CONTRIBUTING.md) for development setup, coding
standards, and how to submit pull requests.

## 📖 Resources

- **[GitHub Repository](https://github.com/turbospark/turbospark)** — Source
  code and issue tracker
- **[npm Package](https://www.npmjs.com/package/turbospark)** — Latest releases
- **[Node.js 22+](https://nodejs.org/)** — Required runtime

## Acknowledgments

This project was originally based on [Google Gemini CLI](https://github.com/google-gemini/gemini-cli)
v0.8.2. We gratefully acknowledge the excellent work of the Google Gemini CLI
team.

## License

Apache License 2.0 — see [LICENSE](./LICENSE) for details.
