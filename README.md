# n8n-nodes-llm-observability

> **Developed and maintained by [Ascenzia](https://ascenzia.fr)**
>
> Based on the original work by **Ruby Lo** (Wistron DXLab) - [n8n-nodes-openai-langfuse](https://github.com/rorubyy/n8n-nodes-openai-langfuse)

npm package: [https://www.npmjs.com/package/n8n-nodes-llm-observability](https://www.npmjs.com/package/n8n-nodes-llm-observability)

## Overview

A standalone AI Agent node for n8n with **multi-provider LLM support** and **integrated Langfuse observability**.

## Why This Package?

The native n8n AI Agent requires connecting separate LLM nodes and doesn't have built-in Langfuse observability. This package provides:

- **All-in-one AI Agent**: Select your LLM provider directly in the node (no separate LLM node needed)
- **Multi-provider support**: OpenAI, Anthropic, Azure OpenAI, Google Gemini, AWS Bedrock, Groq, Mistral, Ollama, xAI Grok, vLLM, and OpenAI-compatible APIs
- **Integrated Langfuse tracing**: Optional observability built into the agent
- **Clean architecture**: One node that doesn't interfere with n8n's native AI components

## Architecture

```
[AI Agent via LLM Observability] --> Output
         |
         ├── Provider: OpenAI / Anthropic / Azure / Gemini / Bedrock / Groq / Mistral / Ollama / Grok / vLLM
         ├── Memory (optional)
         ├── Tools (optional)
         ├── Output Parser (optional)
         └── Langfuse (optional)
```

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

## Node: AI Agent via LLM Observability

A standalone AI Agent with built-in LLM provider selection and optional Langfuse tracing.

### Supported Providers

| Provider | Description |
|----------|-------------|
| OpenAI | GPT-4, GPT-4o, GPT-3.5-turbo, etc. |
| Anthropic | Claude 3.5, Claude 3, etc. |
| Azure OpenAI | Azure-hosted OpenAI models |
| Google Gemini | Gemini Pro, Gemini Ultra, etc. |
| AWS Bedrock | Amazon Bedrock models |
| Groq | Ultra-fast inference (Llama, Mixtral) |
| Mistral | Mistral AI models |
| Ollama | Local models via Ollama |
| xAI Grok | Grok models |
| vLLM | High-throughput self-hosted LLM serving |
| OpenAI Compatible | Any OpenAI-compatible API |

### Inputs

| Input | Required | Description |
|-------|----------|-------------|
| Memory | No | Standard n8n memory nodes for conversation history |
| Tool | No | Standard n8n tool nodes for agent capabilities |
| Output Parser | No | Standard n8n output parsers |

### Configuration

**Provider Settings:**

| Field | Description |
|-------|-------------|
| Provider | Select your LLM provider |
| Model | Model name (e.g., `gpt-4o`, `claude-3-5-sonnet-20241022`) |
| Temperature | Creativity (0-2, default: 0.7) |
| Max Tokens | Maximum response length |

**Prompt Settings:**

| Field | Description |
|-------|-------------|
| Prompt Type | "Define Below" or "Take From Previous Node" |
| System Message | Instructions for the AI agent |
| User Message | The user's input/question |

**Observability Options:**

| Field | Type | Description |
|-------|------|-------------|
| Enable Langfuse | boolean | Turn on/off Langfuse tracing |
| Session ID | string | Group related traces together |
| User ID | string | Identify the end user |
| Trace Name | string | Custom name for the trace |
| Tags | string | Comma-separated tags for filtering |
| Custom Metadata | JSON | Additional context as JSON |

**Agent Options:**

| Field | Description |
|-------|-------------|
| Max Iterations | Maximum tool calling iterations (default: 10) |
| Return Intermediate Steps | Include tool call details in output |

## Credentials

### Provider Credentials

Each provider requires its own credentials:

- **OpenAI**: API Key
- **Anthropic**: API Key
- **Azure OpenAI**: Endpoint, API Key, Deployment Name, API Version
- **Google Gemini**: API Key
- **AWS Bedrock**: Access Key, Secret Key, Region
- **Groq**: API Key
- **Mistral**: API Key
- **Ollama**: Base URL (default: http://localhost:11434)
- **xAI Grok**: API Key
- **vLLM**: Base URL, optional API Key
- **OpenAI Compatible**: Base URL, API Key

### Langfuse API (Optional)

- **Base URL**: Langfuse instance URL (e.g., `https://cloud.langfuse.com`)
- **Public Key**: Langfuse public key
- **Secret Key**: Langfuse secret key

## Usage Examples

### Basic AI Agent

1. Add **AI Agent via LLM Observability**
2. Select your **Provider** (e.g., OpenAI)
3. Configure credentials
4. Enter the **Model** name (e.g., `gpt-4o`)
5. Configure the prompt

### AI Agent with Langfuse Tracing

1. Set up as above
2. Expand **Observability**
3. Enable **Enable Langfuse**
4. Configure Langfuse credentials
5. Optionally add Session ID, User ID, Tags

### AI Agent with Tools

1. Set up the AI Agent
2. Add n8n tool nodes (Calculator, HTTP Request, Code, etc.)
3. Connect tools to the **Tool** input

### Using Self-hosted vLLM

1. Select **vLLM** as provider
2. Configure vLLM credentials (Base URL of your vLLM server)
3. Enter the model name (e.g., `meta-llama/Llama-3.1-8B-Instruct`)

## Compatibility

- **n8n**: Version 1.0.0 or later
- **Node.js**: Version 20.15 or later
- **Langfuse**: Cloud and self-hosted instances

## Resources

- [n8n Community Node Docs](https://docs.n8n.io/integrations/community-nodes/)
- [Langfuse Documentation](https://docs.langfuse.com/)
- [vLLM Documentation](https://docs.vllm.ai/)
- [n8n Community Forum](https://community.n8n.io/)
- [Ascenzia](https://ascenzia.fr)

## Version History

- **v0.8.0** - Standalone AI Agent with integrated multi-provider LLM support (no separate LLM node needed)
- **v0.7.0** - Simplified package: AI Agent with Langfuse + vLLM only
- **v0.6.0** - AI Agent with integrated observability, custom LLM connection type
- **v0.5.0** - Added Grok (xAI) support
- **v0.4.0** - Simplified architecture: removed legacy integrated nodes
- **v0.3.0** - Modular architecture: pure LLM nodes + separate observability layer
- **v0.2.x** - Multi-provider support with integrated Langfuse
- **v0.1.x** - Initial release (OpenAI + Langfuse)

## License

MIT

---

**Original project**: [n8n-nodes-openai-langfuse](https://github.com/rorubyy/n8n-nodes-openai-langfuse) by Ruby Lo (Wistron DXLab)

**Extended and maintained by**: [Ascenzia](https://ascenzia.fr)
