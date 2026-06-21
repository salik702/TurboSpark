# TURBO SPARK Agent Server Extension for Zed

A [Zed](https://zed.dev) extension that integrates [TURBO SPARK](https://github.com/turbospark/turbospark) as an AI agent server using the [Agent Client Protocol (ACP)](https://agentclientprotocol.com).

## Features

- **Native Agent Experience**: Integrated AI assistant panel within Zed's interface
- **Agent Client Protocol**: Full support for ACP enabling advanced IDE interactions
- **File Management**: @-mention files to add them to the conversation context
- **Conversation History**: Access to past conversations within Zed
- **Multi-platform Support**: Works on macOS (ARM64 & Intel), Linux, and Windows

## Installation

1. Open Zed Editor
2. Open the Extensions panel (`cmd-shift-x` on macOS or `ctrl-shift-x` on Linux/Windows)
3. Search for "TURBO SPARK"
4. Click "Install"
5. Switch to the **Agent Server** tab and ensure TURBO SPARK is enabled

Alternatively, you can install from the command line:

```bash
zed --install-extension turbospark
```

## Usage

1. Open the Agent Panel in Zed (`cmd-shift-a` on macOS or `ctrl-shift-a` on Linux/Windows)
2. Select "TURBO SPARK" from the agent list
3. Start chatting with the AI assistant

### Tips

- Use `@filename` to mention files in your conversation
- The agent can read, write, and edit files in your workspace
- Ask the agent to explain code, suggest improvements, or help with debugging
- Use natural language to describe what you want to accomplish

## Requirements

- Zed Editor (latest version recommended)
- Internet connection for AI model access
- Node.js >= 22 (for running TURBO SPARK agent server)

## Configuration

### Environment Variables

When running as an agent server, TURBO SPARK will:

- Inherit environment variables from Zed
- Read/create `~/.turbospark` directory for runtime settings
- Use existing model and authentication settings in `~/.turbospark/settings.json` (except for initial login)

For additional environment variables, configure them in your Zed settings:

```json
{
  "agent_servers": {
    "turbospark": {
      "env": {
        "TURBOSPARK_LOG_LEVEL": "info",
        "YOUR_CUSTOM_VAR": "value"
      }
    }
  }
}
```

## Troubleshooting

### Server shutdown unexpectedly

If you encounter errors like "server shut down unexpectedly" or similar issues:

1. Collect logs by pressing `cmd+shift+p` (macOS) or `ctrl+shift+p` (Linux/Windows)
2. Select **Zed: Open Log**
3. Check logs related to agent server or Node.js
4. Include the relevant log information when creating an issue

### Agent server starts but encounters issues

If the agent server starts successfully but you experience problems during use:

1. Press `cmd+shift+p` (macOS) or `ctrl+shift+p` (Linux/Windows)
2. Select **Dev: Open ACP Logs**
3. Review ACP logs for error messages
4. Include the relevant log information when creating an issue

### Where to report issues

You can report issues at either:

- [TURBO SPARK Issues](https://github.com/turbospark/turbospark/issues)
- [TURBO SPARK Zed Extension Issues](https://github.com/turbospark/turbospark-zed-extension/issues)

## Documentation

- [TURBO SPARK Documentation](https://turbospark.github.io/turbospark-docs/)
- [Zed Agent Panel Guide](https://zed.dev/docs/ai/agent-panel)
- [Agent Client Protocol](https://agentclientprotocol.com)

## Support

- [Report Issues](https://github.com/turbospark/turbospark/issues)
- [TURBO SPARK Discussions](https://github.com/turbospark/turbospark/discussions)
- [Zed Community](https://zed.dev/community)

## License

See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## About TURBO SPARK

TURBO SPARK is an AI-powered coding assistant that helps developers write better code faster. It provides intelligent code completion, refactoring suggestions, bug detection, and natural language code generation.

Learn more at [turbospark.github.io/turbospark-docs](https://turbospark.github.io/turbospark-docs/)

## Stay Tuned

The current version still requires Node.js to run. A single-file executable version is in development - stay tuned for updates!
