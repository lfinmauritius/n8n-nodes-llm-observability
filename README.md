# n8n-nodes-llm-observability

> **Developed and maintained by [Ascenzia](https://ascenzia.fr)**
>
> Based on the original work by **Ruby Lo** (Wistron DXLab) - [n8n-nodes-openai-langfuse](https://github.com/rorubyy/n8n-nodes-openai-langfuse)

npm package: [https://www.npmjs.com/package/n8n-nodes-llm-observability](https://www.npmjs.com/package/n8n-nodes-llm-observability)

## Features

This package provides **pure LLM nodes** for all major providers, with **modular observability** support:

### Supported LLM Providers
- OpenAI (GPT-4, GPT-4o, etc.)
- Anthropic (Claude 3, Claude 3.5, etc.)
- Azure OpenAI
- Google Gemini
- AWS Bedrock
- Groq
- Mistral AI
- Ollama
- Cohere
- vLLM

### Modular Architecture
- **Pure LLM nodes**: Use any LLM provider without observability overhead
- **Observability sub-nodes**: Add tracing as a separate layer
  - Langfuse (included)
  - More coming soon (LangSmith, Phoenix, Helicone...)

### Key Benefits
- Automatic tracing for every request and response
- Custom metadata injection: `sessionId`, `userId`, and structured JSON
- Decoupled architecture: choose your LLM and observability independently

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Table of Contents

- [Installation](#installation)
- [Architecture](#architecture)
- [Credentials](#credentials)
- [Usage](#usage)
- [Compatibility](#compatibility)
- [Resources](#resources)
- [Version History](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the official n8n documentation for community nodes.

### Community Nodes (Recommended)
For **n8n v0.187+**, install directly from the UI:
1. Go to Settings → Community Nodes
2. Click **Install**
3. Enter `n8n-nodes-llm-observability` in the package name field
4. Agree to the risks of using community nodes
5. Select Install

### Manual Installation
```bash
cd ~/.n8n
npm install n8n-nodes-llm-observability
n8n start
```

## Architecture

### Pure LLM Nodes
Use LLM nodes directly without any observability:

```
[LLM Node] → [AI Agent]
```

Available nodes:
- LM Chat OpenAI
- LM Chat Anthropic
- LM Chat Azure OpenAI
- LM Chat Google Gemini
- LM Chat AWS Bedrock
- LM Chat Groq
- LM Chat Mistral
- LM Chat Ollama
- LM Chat Cohere
- LM Chat vLLM

### With Observability
Add observability by connecting through the Observability sub-node:

```
[LLM Node] → [Observability Langfuse] → [AI Agent]
```

The observability node intercepts LLM calls and sends traces to your observability platform.

### Legacy Nodes (Backward Compatibility)
The original integrated nodes are still available:
- LM Chat OpenAI Langfuse
- LM Chat Anthropic Langfuse
- etc.

## Credentials

### Pure LLM Credentials
Each provider has its own credential type:

| Provider | Credential Name |
|----------|-----------------|
| OpenAI | OpenAI API |
| Anthropic | Anthropic API |
| Azure OpenAI | Azure OpenAI API |
| Google Gemini | Google Gemini API |
| AWS Bedrock | AWS Bedrock API |
| Groq | Groq API |
| Mistral | Mistral API |
| Ollama | Ollama API |
| Cohere | Cohere API |
| vLLM | vLLM API |

### Langfuse Credential
For the Observability Langfuse node:

| Field | Description | Example |
|-------|-------------|---------|
| Base URL | Langfuse instance URL | `https://cloud.langfuse.com` |
| Public Key | Langfuse public key | `pk-xxx` |
| Secret Key | Langfuse secret key | `sk-xxx` |

> To find your Langfuse keys: Log in to your Langfuse dashboard → Settings → Projects → [Your Project]

## Usage

### Example: OpenAI with Langfuse Observability

1. Add an **LM Chat OpenAI** node
2. Connect it to an **Observability Langfuse** node
3. Connect the observability node to your **AI Agent**

The Langfuse node supports metadata injection:

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | Group related runs |
| `userId` | string | Identify the end user |
| `metadata` | object | Custom JSON context |

### Example Metadata
```json
{
  "project": "my-project",
  "env": "production",
  "workflow": "customer-support"
}
```

## Compatibility

- Requires n8n version 1.0.0 or later
- Node.js >= 20.15
- Compatible with:
  - All listed LLM providers
  - Langfuse Cloud and self-hosted instances

## Resources

- [n8n Community Node Docs](https://docs.n8n.io/integrations/community-nodes/)
- [Langfuse Documentation](https://docs.langfuse.com/)
- [n8n Community Forum](https://community.n8n.io/)
- [Ascenzia](https://ascenzia.fr)

## Version History

- **v0.3.0** – Modular architecture: pure LLM nodes + separate observability layer
- **v0.2.x** – Multi-provider support with integrated Langfuse
- **v0.1.x** – Initial release (OpenAI + Langfuse)

## License

MIT

---

**Original project**: [n8n-nodes-openai-langfuse](https://github.com/rorubyy/n8n-nodes-openai-langfuse) by Ruby Lo (Wistron DXLab)

**Extended and maintained by**: [Ascenzia](https://ascenzia.fr)
