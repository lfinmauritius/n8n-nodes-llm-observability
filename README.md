# n8n-nodes-llm-observability

> **Developed and maintained by [Ascenzia](https://ascenzia.fr)**
>
> Based on the original work by **Ruby Lo** (Wistron DXLab) - [n8n-nodes-openai-langfuse](https://github.com/rorubyy/n8n-nodes-openai-langfuse)

npm package: [https://www.npmjs.com/package/n8n-nodes-llm-observability](https://www.npmjs.com/package/n8n-nodes-llm-observability)

## Overview

This package provides a custom **AI Agent with integrated LLM Observability** for n8n. The LLM nodes in this package are designed to work exclusively with the provided AI Agent, which includes built-in Langfuse observability support.

**Key Features:**
- Custom AI Agent with integrated Langfuse observability
- 11 LLM providers supported
- LLM nodes work only with the provided AI Agent (not with n8n's default AI Agent)
- Optional Langfuse tracing - enable it when you need observability

## Architecture

```
[LLM Node] --> [AI Agent via LLM Observability] --> Output
                    |
                    v
              [Langfuse] (optional)
```

The AI Agent accepts:
- **Model** (required): One of the LLM nodes from this package
- **Memory** (optional): Standard n8n memory nodes
- **Tools** (optional): Standard n8n tool nodes
- **Output Parser** (optional): Standard n8n output parsers

## Supported LLM Providers

| Provider | Node Name | Credential |
|----------|-----------|------------|
| OpenAI | LM Chat OpenAI | OpenAI API |
| Anthropic | LM Chat Anthropic | Anthropic API |
| Azure OpenAI | LM Chat Azure OpenAI | Azure OpenAI API |
| Google Gemini | LM Chat Google Gemini | Google Gemini API |
| AWS Bedrock | LM Chat AWS Bedrock | AWS Bedrock API |
| Groq | LM Chat Groq | Groq API |
| Grok (xAI) | LM Chat Grok | Grok API |
| Mistral AI | LM Chat Mistral | Mistral API |
| Ollama | LM Chat Ollama | Ollama API |
| Cohere | LM Chat Cohere | Cohere API |
| vLLM | LM Chat vLLM | vLLM API |

## Installation

### Community Nodes (Recommended)

For **n8n v0.187+**, install directly from the UI:

1. Go to **Settings** > **Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-llm-observability`
4. Agree to the risks of using community nodes
5. Click **Install**

### Manual Installation

```bash
cd ~/.n8n
npm install n8n-nodes-llm-observability
n8n start
```

## Usage

### Basic Usage (Without Observability)

1. Add an LLM node (e.g., **LM Chat OpenAI**)
2. Add the **AI Agent via LLM Observability** node
3. Connect the LLM node to the Agent's Model input
4. Configure the agent prompt and options

### With Langfuse Observability

1. Set up your workflow as above
2. In the AI Agent node, expand **Observability**
3. Enable **Enable Langfuse**
4. Configure your Langfuse credentials
5. Optionally add Session ID, User ID, Tags, and custom metadata

### Agent Configuration

| Field | Description |
|-------|-------------|
| Prompt Type | Choose between "Define Below" or "Take from Previous Node" |
| System Message | Instructions for the AI agent behavior |
| User Message | The user's input/question |

### Observability Options

| Field | Type | Description |
|-------|------|-------------|
| Enable Langfuse | boolean | Turn on/off Langfuse tracing |
| Session ID | string | Group related traces together |
| User ID | string | Identify the end user |
| Trace Name | string | Custom name for the trace |
| Tags | string | Comma-separated tags for filtering |
| Custom Metadata | JSON | Additional context as JSON |

### Agent Options

| Field | Description |
|-------|-------------|
| Max Iterations | Maximum tool calling iterations (default: 10) |
| Return Intermediate Steps | Include tool call details in output |

## Credentials Setup

### OpenAI
- **API Key**: Your OpenAI API key
- **Organization ID** (optional): Your OpenAI organization
- **Base URL** (optional): Custom endpoint for OpenAI-compatible APIs

### Anthropic
- **API Key**: Your Anthropic API key
- **Base URL** (optional): Custom endpoint

### Azure OpenAI
- **API Key**: Your Azure OpenAI API key
- **Resource Name**: Your Azure resource name
- **API Version**: API version (e.g., `2024-02-15-preview`)
- **Endpoint** (optional): Full endpoint URL

### Google Gemini
- **API Key**: Your Google AI Studio API key

### AWS Bedrock
- **Access Key ID**: AWS access key
- **Secret Access Key**: AWS secret key
- **Region**: AWS region (e.g., `us-east-1`)

### Groq
- **API Key**: Your Groq API key

### Grok (xAI)
- **API Key**: Your xAI API key from [console.x.ai](https://console.x.ai)

### Mistral
- **API Key**: Your Mistral API key

### Ollama
- **Base URL**: Ollama server URL (e.g., `http://localhost:11434`)
- **API Key** (optional): If authentication is enabled

### Cohere
- **API Key**: Your Cohere API key

### vLLM
- **Base URL**: vLLM server URL
- **API Key** (optional): If authentication is enabled

### Langfuse
- **Base URL**: Langfuse instance URL (e.g., `https://cloud.langfuse.com`)
- **Public Key**: Langfuse public key
- **Secret Key**: Langfuse secret key

## Important Notes

- **LLM nodes from this package are NOT compatible with n8n's default AI Agent**
- The custom connection type ensures proper integration with observability features
- Use the **AI Agent via LLM Observability** node for all AI agent workflows
- Langfuse is optional - you can use the agent without observability

## Compatibility

- **n8n**: Version 1.0.0 or later
- **Node.js**: Version 20.15 or later
- **Langfuse**: Cloud and self-hosted instances

## Resources

- [n8n Community Node Docs](https://docs.n8n.io/integrations/community-nodes/)
- [Langfuse Documentation](https://docs.langfuse.com/)
- [n8n Community Forum](https://community.n8n.io/)
- [Ascenzia](https://ascenzia.fr)

## Version History

- **v0.6.0** - New architecture: AI Agent with integrated observability, custom LLM connection type
- **v0.5.0** - Added Grok (xAI) support
- **v0.4.0** - Simplified architecture: removed legacy integrated nodes, pure modular design
- **v0.3.0** - Modular architecture: pure LLM nodes + separate observability layer
- **v0.2.x** - Multi-provider support with integrated Langfuse
- **v0.1.x** - Initial release (OpenAI + Langfuse)

## License

MIT

---

**Original project**: [n8n-nodes-openai-langfuse](https://github.com/rorubyy/n8n-nodes-openai-langfuse) by Ruby Lo (Wistron DXLab)

**Extended and maintained by**: [Ascenzia](https://ascenzia.fr)
