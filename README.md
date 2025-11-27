# n8n-nodes-llm-observability

> **Developed and maintained by [Ascenzia](https://ascenzia.fr)**
>
> Based on the original work by **Ruby Lo** (Wistron DXLab) - [n8n-nodes-openai-langfuse](https://github.com/rorubyy/n8n-nodes-openai-langfuse)

npm package: [https://www.npmjs.com/package/n8n-nodes-llm-observability](https://www.npmjs.com/package/n8n-nodes-llm-observability)

## Overview

This package provides two key components for n8n:

1. **AI Agent via LLM Observability** - A custom AI Agent with integrated Langfuse observability
2. **vLLM Chat Model** - Support for vLLM (high-throughput LLM serving) - not available in n8n natively

## Why This Package?

### AI Agent with Langfuse
The native n8n AI Agent doesn't have built-in Langfuse observability. This package provides an AI Agent that works with **any n8n LLM node** and adds optional Langfuse tracing.

### vLLM Support
n8n doesn't natively support vLLM. This package adds a vLLM Chat Model node for self-hosted high-throughput LLM inference.

## Architecture

```
[Any LLM Node] --> [AI Agent via LLM Observability] --> Output
                              |
                              v
                        [Langfuse] (optional)
```

Compatible with:
- All native n8n LLM nodes (OpenAI, Anthropic, Azure, Gemini, Bedrock, Groq, Mistral, Ollama, Cohere, xAI Grok...)
- The included vLLM Chat Model node

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

## Nodes

### AI Agent via LLM Observability

A custom AI Agent that accepts any LLM node and provides optional Langfuse tracing.

**Inputs:**
- **Model** (required): Any n8n LLM chat model node
- **Memory** (optional): Standard n8n memory nodes
- **Tool** (optional): Standard n8n tool nodes
- **Output Parser** (optional): Standard n8n output parsers

**Configuration:**

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

### vLLM Chat Model

High-throughput LLM serving via vLLM's OpenAI-compatible API.

**Configuration:**
- **Model**: Model name (e.g., `meta-llama/Llama-3.1-8B-Instruct`)
- **Options**: Temperature, Max Tokens, Top P, Stop Sequences, etc.

## Credentials

### Langfuse API
- **Base URL**: Langfuse instance URL (e.g., `https://cloud.langfuse.com`)
- **Public Key**: Langfuse public key
- **Secret Key**: Langfuse secret key

### vLLM API
- **Base URL**: vLLM server URL (e.g., `http://localhost:8000/v1`)
- **API Key** (optional): If authentication is enabled

## Usage Examples

### Basic AI Agent (No Observability)

1. Add any LLM node (e.g., n8n's **OpenAI Chat Model**)
2. Add **AI Agent via LLM Observability**
3. Connect the LLM to the Agent's Model input
4. Configure the prompt

### AI Agent with Langfuse Tracing

1. Set up as above
2. In the AI Agent, expand **Observability**
3. Enable **Enable Langfuse**
4. Configure Langfuse credentials
5. Optionally add Session ID, User ID, Tags

### Using vLLM

1. Add **vLLM Chat Model**
2. Configure vLLM credentials (Base URL of your vLLM server)
3. Enter the model name
4. Connect to **AI Agent via LLM Observability** or n8n's **AI Agent**

## Compatibility

- **n8n**: Version 1.0.0 or later
- **Node.js**: Version 20.15 or later
- **Langfuse**: Cloud and self-hosted instances
- **vLLM**: Any vLLM server with OpenAI-compatible API

## Resources

- [n8n Community Node Docs](https://docs.n8n.io/integrations/community-nodes/)
- [Langfuse Documentation](https://docs.langfuse.com/)
- [vLLM Documentation](https://docs.vllm.ai/)
- [n8n Community Forum](https://community.n8n.io/)
- [Ascenzia](https://ascenzia.fr)

## Version History

- **v0.7.0** - Simplified package: AI Agent with Langfuse + vLLM only (removed redundant LLM nodes)
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
