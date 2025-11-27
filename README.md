# n8n-nodes-llm-observability

> **Developed and maintained by [Ascenzia](https://ascenzia.fr)**
>
> Based on the original work by **Ruby Lo** (Wistron DXLab) - [n8n-nodes-openai-langfuse](https://github.com/rorubyy/n8n-nodes-openai-langfuse)

npm package: [https://www.npmjs.com/package/n8n-nodes-llm-observability](https://www.npmjs.com/package/n8n-nodes-llm-observability)

## Overview

This package provides **pure LLM nodes** for all major providers, with **modular observability** support. The key innovation is the separation of LLM functionality from observability - you can use any LLM provider independently, and optionally add tracing by connecting through an observability node.

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

## Observability

| Provider | Node Name | Credential |
|----------|-----------|------------|
| Langfuse | Langfuse Observability | Langfuse API |

More observability providers coming soon (LangSmith, Phoenix, Helicone...)

## Architecture

### Without Observability

Use LLM nodes directly connected to your AI Agent:

```
[LLM Node] --> [AI Agent]
```

### With Observability

Add observability by connecting through the Observability node:

```
[LLM Node] --> [Langfuse Observability] --> [AI Agent]
```

The observability node intercepts LLM calls and sends traces to your observability platform without modifying the LLM behavior.

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

### Basic Usage (No Observability)

1. Add an LLM node (e.g., **LM Chat OpenAI**)
2. Configure the credentials
3. Connect directly to your **AI Agent**

### With Langfuse Observability

1. Add an LLM node (e.g., **LM Chat OpenAI**)
2. Add a **Langfuse Observability** node
3. Connect: `LLM Node --> Langfuse Observability --> AI Agent`
4. Configure both credentials

### Langfuse Metadata

The Langfuse Observability node supports metadata injection:

| Field | Type | Description |
|-------|------|-------------|
| Session ID | string | Group related traces together |
| User ID | string | Identify the end user |
| Trace Name | string | Custom name for the trace |
| Tags | string | Comma-separated tags for filtering |
| Custom Metadata | JSON | Additional context as JSON |

Example metadata:
```json
{
  "project": "customer-support",
  "env": "production",
  "workflow": "ticket-classification"
}
```

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
