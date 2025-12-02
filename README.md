# n8n-nodes-llm-observability

> **Developed and maintained by [Ascenzia](https://ascenzia.fr)**
>
> Based on the original work by **Ruby Lo** (Wistron DXLab) - [n8n-nodes-openai-langfuse](https://github.com/rorubyy/n8n-nodes-openai-langfuse)

npm package: [https://www.npmjs.com/package/n8n-nodes-llm-observability](https://www.npmjs.com/package/n8n-nodes-llm-observability)

## Overview

Standalone AI Agent nodes for n8n with **multi-provider LLM support** and **integrated observability** (Langfuse, Arize Phoenix, or Helicone).

## Why This Package?

The native n8n AI Agent requires connecting separate LLM nodes and doesn't have built-in observability. This package provides:

- **All-in-one AI Agent**: Select your LLM provider directly in the node (no separate LLM node needed)
- **Multi-provider support**: OpenAI, Anthropic, Azure OpenAI, Google Gemini, AWS Bedrock, Groq, Mistral, Ollama, xAI Grok, vLLM, and OpenAI-compatible APIs
- **Integrated observability**: Choose between Langfuse, Arize Phoenix, or Helicone for tracing
- **Token usage tracking**: Token consumption displayed in n8n logs and available in workflow output
- **Clean architecture**: Nodes that don't interfere with n8n's native AI components

## Nodes

| Node | Description |
|------|-------------|
| **AI Agent Langfuse** | AI Agent with integrated Langfuse tracing |
| **AI Agent Phoenix** | AI Agent with integrated Arize Phoenix tracing (OpenTelemetry) |
| **AI Agent Helicone** | AI Agent with integrated Helicone observability (proxy-based) |
| **Qdrant Search Tool (Langfuse)** | Vector search tool with Langfuse observability |
| **Qdrant Search Tool (Phoenix)** | Vector search tool with Phoenix observability |
| **Qdrant Search Tool (Helicone)** | Vector search tool with Helicone observability |

## Architecture

```
[AI Agent Langfuse / Phoenix / Helicone] --> Output (with token usage)
         |
         ├── Provider: OpenAI / Anthropic / Azure / Gemini / Bedrock / Groq / Mistral / Ollama / Grok / vLLM / OpenAI Compatible
         ├── Memory (optional)
         ├── Tools (optional)
         ├── Output Parser (optional)
         └── Observability: Langfuse, Phoenix, or Helicone
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

## Supported Providers

| Provider | Description |
|----------|-------------|
| OpenAI | GPT-4, GPT-4o, GPT-3.5-turbo, o1, etc. |
| Anthropic | Claude 3.5, Claude 3, etc. |
| Azure OpenAI | Azure-hosted OpenAI models |
| Google Gemini | Gemini Pro, Gemini Flash, etc. |
| AWS Bedrock | Amazon Bedrock models (Claude, Llama, etc.) |
| Groq | Ultra-fast inference (Llama, Mixtral) |
| Mistral | Mistral AI models |
| Ollama | Local models via Ollama |
| xAI Grok | Grok models |
| vLLM | High-throughput self-hosted LLM serving |
| OpenAI Compatible | Any OpenAI-compatible API |

## Credentials

### Langfuse Credentials

Each provider has a combined credential that includes both the LLM provider settings and Langfuse configuration:

- **OpenAI + Langfuse API**
- **Anthropic + Langfuse API**
- **Azure OpenAI + Langfuse API**
- **Google Gemini + Langfuse API**
- **AWS Bedrock + Langfuse API**
- **Groq + Langfuse API**
- **Mistral + Langfuse API**
- **Ollama + Langfuse API**
- **xAI Grok + Langfuse API**
- **vLLM + Langfuse API**
- **OpenAI Compatible + Langfuse API**
- **Qdrant + OpenAI + Langfuse API** (for Qdrant Search Tool)

### Phoenix Credentials

Each provider has a combined credential that includes both the LLM provider settings and Phoenix configuration:

- **OpenAI + Phoenix API**
- **Anthropic + Phoenix API**
- **Azure OpenAI + Phoenix API**
- **Google Gemini + Phoenix API**
- **AWS Bedrock + Phoenix API**
- **Groq + Phoenix API**
- **Mistral + Phoenix API**
- **Ollama + Phoenix API**
- **xAI Grok + Phoenix API**
- **vLLM + Phoenix API**
- **OpenAI Compatible + Phoenix API**
- **Qdrant + Phoenix API** (for Qdrant Search Tool)

### Helicone Credentials

Each provider has a combined credential that includes both the LLM provider settings and Helicone configuration:

- **OpenAI + Helicone API**
- **Anthropic + Helicone API**
- **Azure OpenAI + Helicone API**
- **Google Gemini + Helicone API**
- **Groq + Helicone API**
- **Mistral + Helicone API**
- **OpenAI Compatible + Helicone API**
- **Qdrant + Helicone API** (for Qdrant Search Tool)

> **Note**: Helicone works as a proxy - requests are routed through Helicone's servers for observability without requiring SDK changes.

## Configuration

### Provider Settings

| Field | Description |
|-------|-------------|
| Provider | Select your LLM provider |
| Model | Model name (e.g., `gpt-4o`, `claude-3-5-sonnet-20241022`) |
| Temperature | Creativity (0-2, default: 0.7) |
| Max Tokens | Maximum response length |

### Prompt Settings

| Field | Description |
|-------|-------------|
| Prompt Type | "Define Below" or "Take From Previous Node" |
| System Message | Instructions for the AI agent |
| User Message | The user's input/question |

### Langfuse Options

| Field | Type | Description |
|-------|------|-------------|
| Session ID | string | Group related traces together |
| User ID | string | Identify the end user |
| Trace Name | string | Custom name for the trace |
| Tags | string | Comma-separated tags for filtering |
| Custom Metadata | JSON | Additional context as JSON |

### Phoenix Options

| Field | Type | Description |
|-------|------|-------------|
| Session ID | string | Group related traces together |
| User ID | string | Identify the end user |
| Tags | string | Comma-separated tags for filtering |

### Helicone Options

| Field | Type | Description |
|-------|------|-------------|
| Session ID | string | Group related requests into a session |
| User ID | string | Identify the end user |
| Custom Properties | key-value | Add custom properties to requests (e.g., environment, app version) |

### Agent Options

| Field | Description |
|-------|-------------|
| Max Iterations | Maximum tool calling iterations (default: 10) |
| Return Intermediate Steps | Include tool call details in output |

### Inputs

| Input | Required | Description |
|-------|----------|-------------|
| Memory | No | Standard n8n memory nodes for conversation history |
| Tool | No | Standard n8n tool nodes for agent capabilities |
| Output Parser | No | Standard n8n output parsers |

## Output

The node outputs:

```json
{
  "output": "The AI response...",
  "tokenUsage": {
    "promptTokens": 150,
    "completionTokens": 250,
    "totalTokens": 400
  },
  "intermediateSteps": [...]
}
```

- **output**: The AI agent's response
- **tokenUsage**: Token consumption (accumulated across all LLM calls when using tools)
- **intermediateSteps**: Tool call details (when enabled)

> **Note**: Token usage availability depends on the LLM provider. Some providers (like Ollama) may not return token information.

## Usage Examples

### Basic AI Agent with Langfuse

1. Add **AI Agent Langfuse** node
2. Select your **Provider** (e.g., OpenAI)
3. Configure credentials (includes Langfuse settings)
4. Enter the **Model** name (e.g., `gpt-4o`)
5. Configure the prompt

### AI Agent with Phoenix Tracing

1. Add **AI Agent Phoenix** node
2. Select your **Provider**
3. Configure credentials (includes Phoenix collector URL)
4. Enter the **Model** name
5. Configure the prompt

### AI Agent with Helicone

1. Add **AI Agent Helicone** node
2. Select your **Provider** (OpenAI, Anthropic, Azure, Gemini, Groq, Mistral)
3. Configure credentials (includes Helicone API key)
4. Enter the **Model** name
5. Configure the prompt
6. Optionally add Session ID, User ID, or Custom Properties

### AI Agent with Tools

1. Set up the AI Agent (Langfuse, Phoenix, or Helicone)
2. Add n8n tool nodes (Calculator, HTTP Request, Code, Qdrant Search, etc.)
3. Connect tools to the **Tool** input

### Using Qdrant Vector Search

1. Add **Qdrant Search Tool (Langfuse)**, **Qdrant Search Tool (Phoenix)**, or **Qdrant Search Tool (Helicone)**
2. Configure Qdrant credentials
3. Connect to the AI Agent's Tool input

### Using Self-hosted vLLM

1. Select **vLLM** as provider
2. Configure vLLM credentials (Base URL of your vLLM server)
3. Enter the model name (e.g., `meta-llama/Llama-3.1-8B-Instruct`)

## Compatibility

- **n8n**: Version 1.117.0 or later (tested on 1.117+)
- **Node.js**: Version 20.15 or later
- **Langfuse**: Cloud and self-hosted instances
- **Arize Phoenix**: Cloud and self-hosted instances
- **Helicone**: Cloud instance (helicone.ai)

## Resources

- [n8n Community Node Docs](https://docs.n8n.io/integrations/community-nodes/)
- [Langfuse Documentation](https://langfuse.com/docs)
- [Arize Phoenix Documentation](https://docs.arize.com/phoenix)
- [Helicone Documentation](https://docs.helicone.ai)
- [vLLM Documentation](https://docs.vllm.ai/)
- [n8n Community Forum](https://community.n8n.io/)
- [Ascenzia](https://ascenzia.fr)

## Version History

- **v0.10.40** - Add Qdrant Search Tool for Helicone
- **v0.10.39** - Add Helicone observability support (AI Agent Helicone node)
- **v0.10.38** - Fix: accumulate token usage across all LLM calls (when using tools)
- **v0.10.37** - Add token usage to output and n8n AI logs panel
- **v0.10.36** - Update Phoenix logos to official Arize branding
- **v0.10.35** - Add all LLM providers to Phoenix node (Gemini, Bedrock, Groq, Mistral, Ollama, Grok, vLLM, OpenAI Compatible)
- **v0.10.34** - Show provider name in Phoenix span (agent_openai, agent_anthropic, etc.)
- **v0.10.33** - Implement OpenInference semantic conventions for Phoenix tracing
- **v0.10.32** - Fix Azure OpenAI max_tokens error (use max_completion_tokens)
- **v0.10.30** - Add Azure OpenAI support for Phoenix nodes
- **v0.10.29** - Add Arize Phoenix support: AI Agent Phoenix node with OpenTelemetry tracing
- **v0.10.x** - Bug fixes: trace tool calls as separate spans, handle nested JSON from vector stores
- **v0.9.x** - Enhanced Langfuse tracing and stability improvements
- **v0.8.0** - Standalone AI Agent with integrated multi-provider LLM support
- **v0.7.0** - Simplified package: AI Agent with Langfuse + vLLM only
- **v0.6.0** - AI Agent with integrated observability
- **v0.5.0** - Added Grok (xAI) support
- **v0.4.0** - Simplified architecture
- **v0.3.0** - Modular architecture
- **v0.2.x** - Multi-provider support with integrated Langfuse
- **v0.1.x** - Initial release (OpenAI + Langfuse)

## License

MIT

---

**Original project**: [n8n-nodes-openai-langfuse](https://github.com/rorubyy/n8n-nodes-openai-langfuse) by Ruby Lo (Wistron DXLab)

**Extended and maintained by**: [Ascenzia](https://ascenzia.fr)
