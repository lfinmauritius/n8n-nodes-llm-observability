import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { jsonParse, NodeOperationError } from 'n8n-workflow';
import { CallbackHandler } from 'langfuse-langchain';
import { Langfuse } from 'langfuse';
import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Tool } from '@langchain/core/tools';
import type { BaseOutputParser } from '@langchain/core/output_parsers';
import type { BaseMessage } from '@langchain/core/messages';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const LLM_PROVIDERS = [
	{ name: 'OpenAI', value: 'openai' },
	{ name: 'Anthropic', value: 'anthropic' },
	{ name: 'Azure OpenAI', value: 'azureOpenai' },
	{ name: 'Google Gemini', value: 'gemini' },
	{ name: 'AWS Bedrock', value: 'bedrock' },
	{ name: 'Groq', value: 'groq' },
	{ name: 'Mistral', value: 'mistral' },
	{ name: 'Ollama', value: 'ollama' },
	{ name: 'xAI Grok', value: 'grok' },
	{ name: 'vLLM', value: 'vllm' },
	{ name: 'OpenAI Compatible', value: 'openaiCompatible' },
];

export class AiAgentLlmObs implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AI Agent Langfuse',
		name: 'aiAgentLlmObs',
		icon: { light: 'file:AiAgentLlmObsLight.icon.svg', dark: 'file:AiAgentLlmObsDark.icon.svg' },
		group: ['transform'],
		version: [1, 2],
		defaultVersion: 2,
		description: 'AI Agent with integrated LLM provider and Langfuse observability',
		defaults: {
			name: 'AI Agent Langfuse',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Agents', 'Root Nodes'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://langfuse.com/docs',
					},
				],
			},
		},

		inputs: [
			{ displayName: '', type: 'main' as any },
			{
				displayName: 'Memory',
				maxConnections: 1,
				type: 'ai_memory' as any,
				required: false,
			},
			{
				displayName: 'Tool',
				type: 'ai_tool' as any,
				required: false,
			},
			{
				displayName: 'Output Parser',
				maxConnections: 1,
				type: 'ai_outputParser' as any,
				required: false,
			},
		],
		outputs: ['main' as any],
		credentials: [
			{
				name: 'openAiLangfuseApi',
				displayName: 'OpenAI + Langfuse API',
				required: true,
				displayOptions: { show: { provider: ['openai'] } },
			},
			{
				name: 'anthropicLangfuseApi',
				displayName: 'Anthropic + Langfuse API',
				required: true,
				displayOptions: { show: { provider: ['anthropic'] } },
			},
			{
				name: 'azureOpenAiLangfuseApi',
				displayName: 'Azure OpenAI + Langfuse API',
				required: true,
				displayOptions: { show: { provider: ['azureOpenai'] } },
			},
			{
				name: 'geminiLangfuseApi',
				displayName: 'Google Gemini + Langfuse API',
				required: true,
				displayOptions: { show: { provider: ['gemini'] } },
			},
			{
				name: 'bedrockLangfuseApi',
				displayName: 'AWS Bedrock + Langfuse API',
				required: true,
				displayOptions: { show: { provider: ['bedrock'] } },
			},
			{
				name: 'groqLangfuseApi',
				displayName: 'Groq + Langfuse API',
				required: true,
				displayOptions: { show: { provider: ['groq'] } },
			},
			{
				name: 'mistralLangfuseApi',
				displayName: 'Mistral + Langfuse API',
				required: true,
				displayOptions: { show: { provider: ['mistral'] } },
			},
			{
				name: 'ollamaLangfuseApi',
				displayName: 'Ollama + Langfuse API',
				required: true,
				displayOptions: { show: { provider: ['ollama'] } },
			},
			{
				name: 'grokLangfuseApi',
				displayName: 'xAI Grok + Langfuse API',
				required: true,
				displayOptions: { show: { provider: ['grok'] } },
			},
			{
				name: 'vllmLangfuseApi',
				displayName: 'vLLM + Langfuse API',
				required: true,
				displayOptions: { show: { provider: ['vllm'] } },
			},
			{
				name: 'openAiCompatibleLangfuseApi',
				displayName: 'OpenAI Compatible + Langfuse API',
				required: true,
				displayOptions: { show: { provider: ['openaiCompatible'] } },
			},
		],
		properties: [
			// LLM Provider Selection
			{
				displayName: 'LLM Provider',
				name: 'provider',
				type: 'options',
				noDataExpression: true,
				required: true,
				options: LLM_PROVIDERS,
				default: 'openai',
				description: 'The LLM provider to use',
			},
			// Model Configuration
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'gpt-4o-mini',
				description: 'The model to use',
				displayOptions: {
					show: {
						provider: ['openai'],
					},
				},
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'claude-3-5-sonnet-latest',
				description: 'The model to use',
				displayOptions: {
					show: {
						provider: ['anthropic'],
					},
				},
			},
			{
				displayName: 'Deployment Name',
				name: 'model',
				type: 'string',
				default: '',
				description: 'The Azure deployment name',
				displayOptions: {
					show: {
						provider: ['azureOpenai'],
					},
				},
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'gemini-2.0-flash',
				description: 'The model to use',
				displayOptions: {
					show: {
						provider: ['gemini'],
					},
				},
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
				description: 'The Bedrock model ID',
				displayOptions: {
					show: {
						provider: ['bedrock'],
					},
				},
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'llama-3.3-70b-versatile',
				description: 'The model to use',
				displayOptions: {
					show: {
						provider: ['groq'],
					},
				},
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'mistral-small-latest',
				description: 'The model to use',
				displayOptions: {
					show: {
						provider: ['mistral'],
					},
				},
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'llama3.2',
				description: 'The model to use',
				displayOptions: {
					show: {
						provider: ['ollama'],
					},
				},
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'grok-2-1212',
				description: 'The model to use',
				displayOptions: {
					show: {
						provider: ['grok'],
					},
				},
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: '',
				placeholder: 'meta-llama/Llama-3.1-8B-Instruct',
				description: 'The model to use',
				displayOptions: {
					show: {
						provider: ['vllm'],
					},
				},
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: '',
				description: 'The model to use',
				displayOptions: {
					show: {
						provider: ['openaiCompatible'],
					},
				},
			},
			{
				displayName: 'Base URL',
				name: 'baseUrl',
				type: 'string',
				default: '',
				placeholder: 'http://localhost:8000/v1',
				description: 'The base URL of the API',
				displayOptions: {
					show: {
						provider: ['openaiCompatible'],
					},
				},
			},
			// Model Options - placed right after model config, before prompt
			{
				displayName: 'Model Options',
				name: 'modelOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Max Tokens',
						name: 'maxTokens',
						type: 'number',
						default: 4096,
						description: 'Maximum number of tokens to generate',
					},
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						default: 0.7,
						typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
						description: 'Controls randomness in the output',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						type: 'number',
						default: 1,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 2 },
						description: 'Controls diversity via nucleus sampling',
					},
				],
			},
			// Prompt Configuration
			{
				displayName: 'Prompt',
				name: 'promptType',
				type: 'options',
				options: [
					{
						name: 'Define Below',
						value: 'define',
						description: 'Define the prompt in the fields below',
					},
					{
						name: 'Take From Previous Node',
						value: 'auto',
						description: 'Use the output from the previous node as the prompt',
					},
				],
				default: 'define',
			},
			{
				displayName: 'System Message',
				name: 'systemMessage',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: 'You are a helpful assistant.',
				description: 'The system message to set the behavior of the AI agent',
				displayOptions: {
					show: {
						promptType: ['define'],
					},
				},
			},
			{
				displayName: 'User Message',
				name: 'text',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '={{ $json.chatInput }}',
				description: 'The user message or question to send to the AI agent',
				displayOptions: {
					show: {
						promptType: ['define'],
					},
				},
			},
			// Langfuse Options
			{
				displayName: 'Langfuse Options',
				name: 'langfuseOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Custom Metadata (JSON)',
						name: 'customMetadata',
						type: 'json',
						default: '{}',
						description: 'Additional metadata to attach to traces',
					},
					{
						displayName: 'Session ID',
						name: 'sessionId',
						type: 'string',
						default: '',
						description: 'Group related traces together in Langfuse',
					},
					{
						displayName: 'Tags',
						name: 'tags',
						type: 'string',
						default: '',
						description: 'Comma-separated tags for filtering traces',
					},
					{
						displayName: 'Trace Name',
						name: 'traceName',
						type: 'string',
						default: '',
						description: 'Custom name for the trace in Langfuse',
					},
					{
						displayName: 'User ID',
						name: 'userId',
						type: 'string',
						default: '',
						description: 'User identifier for trace attribution',
					},
				],
			},
			// Agent Options
			{
				displayName: 'Agent Options',
				name: 'agentOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add Agent Option',
				options: [
					{
						displayName: 'Hierarchical Spans Observability',
						name: 'hierarchicalSpans',
						type: 'boolean',
						default: true,
						description: 'Whether to enable hierarchical tracing with parent-child span relationships in Langfuse for better observability',
					},
					{
						displayName: 'Max Iterations',
						name: 'maxIterations',
						type: 'number',
						default: 10,
						description: 'Maximum number of iterations the agent can take',
					},
					{
						displayName: 'Return Intermediate Steps',
						name: 'returnIntermediateSteps',
						type: 'boolean',
						default: false,
						description: 'Whether to return the intermediate steps taken by the agent',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			// Declare langfuseHandlerRef outside try block so it's accessible in catch
			let langfuseHandlerRef: CallbackHandler | null = null;

			try {
				// Get provider and model configuration
				const provider = this.getNodeParameter('provider', itemIndex) as string;
				const modelName = this.getNodeParameter('model', itemIndex) as string;
				const modelOptions = this.getNodeParameter('modelOptions', itemIndex, {}) as {
					temperature?: number;
					maxTokens?: number;
					topP?: number;
				};

				// Map provider to credential name
				const providerToCredential: Record<string, string> = {
					openai: 'openAiLangfuseApi',
					anthropic: 'anthropicLangfuseApi',
					azureOpenai: 'azureOpenAiLangfuseApi',
					gemini: 'geminiLangfuseApi',
					bedrock: 'bedrockLangfuseApi',
					groq: 'groqLangfuseApi',
					mistral: 'mistralLangfuseApi',
					ollama: 'ollamaLangfuseApi',
					grok: 'grokLangfuseApi',
					vllm: 'vllmLangfuseApi',
					openaiCompatible: 'openAiCompatibleLangfuseApi',
				};

				const credentialName = providerToCredential[provider];
				if (!credentialName) {
					throw new NodeOperationError(this.getNode(), `Unknown provider: ${provider}`, { itemIndex });
				}

				// Get combined credentials (LLM + Langfuse)
				const credentials = await this.getCredentials(credentialName);

				// Create the model based on provider
				let model: BaseChatModel;

				switch (provider) {
					case 'openai': {
						model = new ChatOpenAI({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
							configuration: credentials.url ? { baseURL: credentials.url as string } : undefined,
						});
						break;
					}
					case 'anthropic': {
						const { ChatAnthropic } = await import('@langchain/anthropic');
						model = new ChatAnthropic({
							anthropicApiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
						});
						break;
					}
					case 'azureOpenai': {
						const { AzureChatOpenAI } = await import('@langchain/openai');
						const endpoint = credentials.endpoint as string;
						const isFullUrl = endpoint?.startsWith('http');
						model = new AzureChatOpenAI({
							azureOpenAIApiKey: credentials.apiKey as string,
							azureOpenAIApiDeploymentName: modelName,
							modelName: modelName,
							...(isFullUrl
								? { azureOpenAIEndpoint: endpoint }
								: { azureOpenAIApiInstanceName: endpoint }),
							azureOpenAIApiVersion: (credentials.apiVersion as string) || '2024-02-15-preview',
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
						});
						break;
					}
					case 'gemini': {
						const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
						model = new ChatGoogleGenerativeAI({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxOutputTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
						});
						break;
					}
					case 'bedrock': {
						const { ChatBedrockConverse } = await import('@langchain/aws');
						model = new ChatBedrockConverse({
							model: modelName,
							region: credentials.region as string,
							credentials: {
								accessKeyId: credentials.accessKeyId as string,
								secretAccessKey: credentials.secretAccessKey as string,
							},
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
						});
						break;
					}
					case 'groq': {
						const { ChatGroq } = await import('@langchain/groq');
						model = new ChatGroq({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
						});
						break;
					}
					case 'mistral': {
						const { ChatMistralAI } = await import('@langchain/mistralai');
						model = new ChatMistralAI({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
						});
						break;
					}
					case 'ollama': {
						const { ChatOllama } = await import('@langchain/ollama');
						model = new ChatOllama({
							baseUrl: credentials.baseUrl as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
						});
						break;
					}
					case 'grok': {
						model = new ChatOpenAI({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
							configuration: { baseURL: 'https://api.x.ai/v1' },
						});
						break;
					}
					case 'vllm': {
						model = new ChatOpenAI({
							apiKey: (credentials.apiKey as string) || 'dummy-key',
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
							configuration: { baseURL: credentials.baseUrl as string },
						});
						break;
					}
					case 'openaiCompatible': {
						model = new ChatOpenAI({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
							configuration: { baseURL: credentials.baseUrl as string },
						});
						break;
					}
					default:
						throw new NodeOperationError(this.getNode(), `Unknown provider: ${provider}`, { itemIndex });
				}

				// Get optional connections
				const rawTools = await this.getInputConnectionData(
					'ai_tool' as any,
					itemIndex,
				);
				// Normalize tools - they can come as array, single tool, or wrapped in { response: Tool }
				let tools: Tool[] | undefined;
				const toolsDebugInfo: any[] = [];
				if (rawTools) {
					const toolArray = Array.isArray(rawTools) ? rawTools : [rawTools];
					tools = toolArray.flatMap((t: any) => {
						// Handle { response: Tool } format from supplyData
						if (t && typeof t === 'object' && 'response' in t) {
							return t.response;
						}
						return t;
					}).filter((t): t is Tool => t != null);
					// Collect debug info about detected tools
					for (const tool of tools) {
						toolsDebugInfo.push({
							name: tool.name,
							description: tool.description?.substring(0, 100),
							hasInvoke: typeof tool.invoke === 'function',
						});
					}
				}

				const memory = (await this.getInputConnectionData(
					'ai_memory' as any,
					itemIndex,
				)) as any | undefined;

				const outputParser = (await this.getInputConnectionData(
					'ai_outputParser' as any,
					itemIndex,
				)) as BaseOutputParser | undefined;

				// Get prompt configuration
				const promptType = this.getNodeParameter('promptType', itemIndex) as string;
				let userMessage: string;
				let systemMessage: string;

				if (promptType === 'define') {
					systemMessage = this.getNodeParameter('systemMessage', itemIndex, '') as string;
					userMessage = this.getNodeParameter('text', itemIndex, '') as string;
				} else {
					const inputData = items[itemIndex].json;
					userMessage = (inputData.chatInput || inputData.text || inputData.input || JSON.stringify(inputData)) as string;
					systemMessage = (inputData.systemMessage || 'You are a helpful assistant.') as string;
				}

				// Get Langfuse options
				const langfuseOptions = this.getNodeParameter('langfuseOptions', itemIndex, {}) as {
					sessionId?: string;
					userId?: string;
					customMetadata?: string | Record<string, any>;
					traceName?: string;
					tags?: string;
				};


				// Get agent options
				const agentOptions = this.getNodeParameter('agentOptions', itemIndex, {}) as {
					hierarchicalSpans?: boolean;
					maxIterations?: number;
					returnIntermediateSteps?: boolean;
				};

				// Map provider to LangChain class name for Langfuse
				const providerToClassName: Record<string, string> = {
					openai: 'ChatOpenAI',
					anthropic: 'ChatAnthropic',
					azureOpenai: 'AzureChatOpenAI',
					gemini: 'ChatGoogleGenerativeAI',
					bedrock: 'ChatBedrockConverse',
					groq: 'ChatGroq',
					mistral: 'ChatMistralAI',
					ollama: 'ChatOllama',
					grok: 'ChatOpenAI (xAI)',
					vllm: 'ChatOpenAI (vLLM)',
					openaiCompatible: 'ChatOpenAI (Compatible)',
				};
				const llmClassName = providerToClassName[provider] || provider;

				// Initialize Langfuse handler (using credentials from combined credential)
				let customMetadata: Record<string, any> = {};
				if (typeof langfuseOptions.customMetadata === 'string') {
					try {
						customMetadata = langfuseOptions.customMetadata.trim()
							? jsonParse<Record<string, any>>(langfuseOptions.customMetadata)
							: {};
					} catch {
						customMetadata = { _raw: langfuseOptions.customMetadata };
					}
				} else if (langfuseOptions.customMetadata && typeof langfuseOptions.customMetadata === 'object') {
					customMetadata = langfuseOptions.customMetadata;
				}

				const tags = langfuseOptions.tags
					? langfuseOptions.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
					: undefined;

				// Check if hierarchical spans are enabled (default: true)
				const useHierarchicalSpans = agentOptions.hierarchicalSpans !== false;

				// Initialize Langfuse based on hierarchical spans setting
				let langfuseClient: Langfuse | undefined;
				let parentTrace: any;

				if (useHierarchicalSpans) {
					// Hierarchical tracing - create root trace and manual child spans
					langfuseClient = new Langfuse({
						baseUrl: credentials.langfuseBaseUrl as string,
						publicKey: credentials.langfusePublicKey as string,
						secretKey: credentials.langfuseSecretKey as string,
					});

					// Create parent trace for the agent execution
					const traceName = langfuseOptions.traceName || `AI Agent - ${llmClassName}`;
					parentTrace = langfuseClient.trace({
						name: traceName,
						sessionId: langfuseOptions.sessionId || undefined,
						userId: langfuseOptions.userId || undefined,
						metadata: {
							...customMetadata,
							model: modelName,
							provider: provider,
							llmClass: llmClassName,
							systemMessage: systemMessage?.substring(0, 200),
							userMessage: userMessage?.substring(0, 200),
						},
						tags,
						input: {
							systemMessage,
							userMessage,
						},
					});

					// Create CallbackHandler with parent trace context
					langfuseHandlerRef = new CallbackHandler({
						root: parentTrace,
					});
				} else {
					// Flat tracing - original behavior (multiple traces)
					langfuseHandlerRef = new CallbackHandler({
						baseUrl: credentials.langfuseBaseUrl as string,
						publicKey: credentials.langfusePublicKey as string,
						secretKey: credentials.langfuseSecretKey as string,
						sessionId: langfuseOptions.sessionId || undefined,
						userId: langfuseOptions.userId || undefined,
						metadata: {
							...customMetadata,
							model: modelName,
							provider: provider,
							llmClass: llmClassName,
						},
						tags,
					});
				}

				const langfuseCallbacks = [langfuseHandlerRef];

				// Build messages
				const messages: BaseMessage[] = [];

				if (memory) {
					try {
						const memoryVariables = await memory.loadMemoryVariables({});
						const chatHistory = memoryVariables.chat_history || memoryVariables.history || [];
						if (Array.isArray(chatHistory)) {
							messages.push(...chatHistory);
						}
					} catch {
						// Memory load failed
					}
				}

				if (systemMessage) {
					messages.push(new SystemMessage(systemMessage));
				}

				messages.push(new HumanMessage(userMessage));

				// Execute
				let response: any;
				const intermediateSteps: any[] = [];

				// Debug info for tool binding
				let toolBindingDebug: any = {};

				// Accumulate token usage across all LLM calls
				const totalTokenUsage = {
					promptTokens: 0,
					completionTokens: 0,
					totalTokens: 0,
				};

				// Helper to extract and accumulate token usage from a response
				const accumulateTokenUsage = (aiResponse: any) => {
					let usage: any;
					if (aiResponse.usage_metadata) {
						usage = {
							promptTokens: aiResponse.usage_metadata.input_tokens,
							completionTokens: aiResponse.usage_metadata.output_tokens,
							totalTokens: aiResponse.usage_metadata.total_tokens,
						};
					} else if (aiResponse.response_metadata?.usage) {
						const u = aiResponse.response_metadata.usage;
						usage = {
							promptTokens: u.prompt_tokens || u.input_tokens,
							completionTokens: u.completion_tokens || u.output_tokens,
							totalTokens: u.total_tokens,
						};
					} else if (aiResponse.response_metadata?.tokenUsage) {
						usage = aiResponse.response_metadata.tokenUsage;
					}

					if (usage) {
						totalTokenUsage.promptTokens += usage.promptTokens || 0;
						totalTokenUsage.completionTokens += usage.completionTokens || 0;
						totalTokenUsage.totalTokens += usage.totalTokens || 0;
					}
				};

				// Track iteration count for output
				let iterationCount = 0;

				if (tools && tools.length > 0) {
					const hasBindTools = typeof model.bindTools === 'function';
					toolBindingDebug.hasBindTools = hasBindTools;

					const modelWithTools = hasBindTools ? model.bindTools!(tools) : model;
					toolBindingDebug.boundTools = hasBindTools;

					const currentMessages = [...messages];
					let iterations = 0;
					const maxIterations = agentOptions.maxIterations || 10;

					while (iterations < maxIterations) {
						iterations++;
						iterationCount = iterations;

						let aiResponse: any;

						if (useHierarchicalSpans) {
							// Create a span for this LLM iteration
							const llmSpan = parentTrace.span({
								name: `${llmClassName} - Iteration ${iterations}`,
								input: currentMessages.map(m => ({
									role: m._getType(),
									content: typeof m.content === 'string' ? m.content.substring(0, 500) : m.content,
								})),
								metadata: {
									iteration: iterations,
									maxIterations,
									model: modelName,
								},
							});

							// Create handler for this specific LLM call
							const llmHandler = new CallbackHandler({ root: llmSpan });
							aiResponse = await modelWithTools.invoke(currentMessages, {
								callbacks: [llmHandler],
								runName: `${llmClassName} Call`,
							});

							const toolCalls = aiResponse.tool_calls || (aiResponse as any).additional_kwargs?.tool_calls;

							// Update span with LLM output
							llmSpan.update({
								output: {
									content: aiResponse.content,
									toolCalls: toolCalls?.map((tc: any) => ({
										name: tc.name || tc.function?.name,
										args: tc.args || tc.function?.arguments,
									})),
								},
							});
							llmSpan.end();
						} else {
							// Flat tracing - use callbacks directly
							aiResponse = await modelWithTools.invoke(currentMessages, {
								callbacks: langfuseCallbacks,
								runName: `${llmClassName} Call`,
							});
						}
						currentMessages.push(aiResponse);

						// Accumulate tokens from this LLM call
						accumulateTokenUsage(aiResponse);

						const toolCalls = aiResponse.tool_calls || (aiResponse as any).additional_kwargs?.tool_calls;

						// Debug: capture tool_calls info
						toolBindingDebug.iteration = iterations;
						toolBindingDebug.hasToolCalls = !!toolCalls;
						toolBindingDebug.toolCallsCount = toolCalls?.length || 0;
						toolBindingDebug.rawToolCalls = toolCalls;

						if (!toolCalls || toolCalls.length === 0) {
							response = aiResponse;
							break;
						}

						const { ToolMessage } = await import('@langchain/core/messages');

						for (const toolCall of toolCalls) {
							const toolName = toolCall.name || toolCall.function?.name;
							const toolCallId = toolCall.id || toolName;
							const toolArgs = toolCall.args || (toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {});
							const tool = tools.find((t) => t.name === toolName);

							if (tool) {
								try {
									let toolResult: any;

									if (useHierarchicalSpans) {
										// Create a span for this tool execution
										const toolSpan = parentTrace.span({
											name: `Tool: ${toolName}`,
											input: toolArgs,
											metadata: {
												toolName,
												iteration: iterations,
												toolCallId: toolCallId,
											},
										});

										// Create handler for this tool call
										const toolHandler = new CallbackHandler({ root: toolSpan });
										toolResult = await tool.invoke(toolArgs, {
											callbacks: [toolHandler],
											runName: toolName,
										});

										// Helper to extract pageContent from various formats
										const extractContent = (data: any): string => {
											// If it's a string, try to parse as JSON
											if (typeof data === 'string') {
												try {
													const parsed = JSON.parse(data);
													return extractContent(parsed);
												} catch {
													// Not JSON, return as-is
													return data;
												}
											}

											// If it's an array, extract from each item
											if (Array.isArray(data)) {
												return data.map((item: any) => extractContent(item)).join('\n\n---\n\n');
											}

											// If it has pageContent directly
											if (data?.pageContent) {
												return data.pageContent;
											}

											// If it has text property (content block format)
											if (data?.text) {
												return extractContent(data.text);
											}

											// If it has content array
											if (data?.content && Array.isArray(data.content)) {
												return data.content.map((item: any) => extractContent(item)).join('\n\n---\n\n');
											}

											// Fallback: stringify if object
											return typeof data === 'object' ? JSON.stringify(data) : String(data);
										};

										const formattedResult = extractContent(toolResult);

										// Update tool span with result
										toolSpan.update({
											output: formattedResult,
										});
										toolSpan.end();
									} else {
										// Flat tracing - pass Langfuse callbacks to trace tool as separate span
										toolResult = await tool.invoke(toolArgs, {
											callbacks: langfuseCallbacks,
											runName: toolName,
										});
									}

									// Helper to extract pageContent from various formats (for flat tracing)
									const extractContent = (data: any): string => {
										// If it's a string, try to parse as JSON
										if (typeof data === 'string') {
											try {
												const parsed = JSON.parse(data);
												return extractContent(parsed);
											} catch {
												// Not JSON, return as-is
												return data;
											}
										}

										// If it's an array, extract from each item
										if (Array.isArray(data)) {
											return data.map((item: any) => extractContent(item)).join('\n\n---\n\n');
										}

										// If it has pageContent directly
										if (data?.pageContent) {
											return data.pageContent;
										}

										// If it has text property (content block format)
										if (data?.text) {
											return extractContent(data.text);
										}

										// If it has content array
										if (data?.content && Array.isArray(data.content)) {
											return data.content.map((item: any) => extractContent(item)).join('\n\n---\n\n');
										}

										// Fallback: stringify if object
										return typeof data === 'object' ? JSON.stringify(data) : String(data);
									};

									const formattedResult = extractContent(toolResult);

									intermediateSteps.push({
										action: { tool: toolName, toolInput: toolArgs },
										observation: formattedResult,
									});

									currentMessages.push(new ToolMessage({
										content: formattedResult,
										tool_call_id: toolCallId,
									}));
								} catch (error: any) {
									const errorMessage = `Error: ${error.message}`;

									intermediateSteps.push({
										action: { tool: toolName, toolInput: toolArgs },
										observation: errorMessage,
									});
									// Must still push a ToolMessage even on error
									currentMessages.push(new ToolMessage({
										content: errorMessage,
										tool_call_id: toolCallId,
									}));
								}
							} else {
								// Tool not found - still need to respond to the tool_call
								const errorMessage = `Tool "${toolName}" not found`;

								if (useHierarchicalSpans) {
									// Create a span for the missing tool
									const errorSpan = parentTrace.span({
										name: `Tool: ${toolName} (Not Found)`,
										input: toolArgs,
										output: errorMessage,
										level: 'WARNING' as any,
										metadata: {
											toolName,
											iteration: iterations,
											error: 'Tool not found',
										},
									});
									errorSpan.end();
								}

								intermediateSteps.push({
									action: { tool: toolName, toolInput: toolArgs },
									observation: errorMessage,
								});
								currentMessages.push(new ToolMessage({
									content: errorMessage,
									tool_call_id: toolCallId,
								}));
							}
						}

						if (iterations >= maxIterations) {
							response = currentMessages[currentMessages.length - 1];
							break;
						}
					}

					if (!response) {
						response = currentMessages[currentMessages.length - 1];
					}
				} else {
					// No tools - single LLM call
					if (useHierarchicalSpans) {
						const llmSpan = parentTrace.span({
							name: `${llmClassName} - Single Call`,
							input: messages.map(m => ({
								role: m._getType(),
								content: typeof m.content === 'string' ? m.content.substring(0, 500) : m.content,
							})),
							metadata: {
								model: modelName,
								hasTools: false,
							},
						});

						const llmHandler = new CallbackHandler({ root: llmSpan });
						response = await model.invoke(messages, {
							callbacks: [llmHandler],
							runName: `${llmClassName} Call`,
						});

						// Update span with output
						llmSpan.update({
							output: {
								content: response.content,
							},
						});
						llmSpan.end();
					} else {
						// Flat tracing
						response = await model.invoke(messages, {
							callbacks: langfuseCallbacks,
							runName: `${llmClassName} Call`,
						});
					}

					// Accumulate tokens from single LLM call
					accumulateTokenUsage(response);
				}

				let outputContent = response.content || response.text || response;

				if (outputParser && typeof outputContent === 'string') {
					try {
						outputContent = await outputParser.parse(outputContent);
					} catch {
						// Keep original
					}
				}

				// Use accumulated token usage (includes all LLM calls when using tools)
				const tokenUsage = totalTokenUsage.totalTokens > 0 ? totalTokenUsage : undefined;

				// Log AI event for n8n UI logs panel
				if (tokenUsage) {
					const tokenMessage = JSON.stringify({
						model: modelName,
						provider: provider,
						promptTokens: tokenUsage.promptTokens,
						completionTokens: tokenUsage.completionTokens,
						totalTokens: tokenUsage.totalTokens,
					});
					this.logAiEvent('ai-llm-generated-output', tokenMessage);
				}

				if (memory) {
					try {
						await memory.saveContext(
							{ input: userMessage },
							{ output: typeof outputContent === 'string' ? outputContent : JSON.stringify(outputContent) },
						);
					} catch {
						// Memory save failed
					}
				}

				const outputJson: Record<string, any> = {
					output: outputContent,
				};

				// Always include intermediate steps for debugging tool results
				if (intermediateSteps.length > 0) {
					outputJson.intermediateSteps = intermediateSteps;
				}

				// Include token usage in output for workflow access
				if (tokenUsage) {
					outputJson.tokenUsage = tokenUsage;
				}

				// Update parent trace with final output and token usage (only for hierarchical spans)
				if (useHierarchicalSpans) {
					parentTrace.update({
						output: {
							response: outputContent,
							intermediateStepsCount: intermediateSteps.length,
							iterations: iterationCount,
							tokenUsage,
						},
					});
				}

				// Flush Langfuse to ensure traces are sent
				if (langfuseHandlerRef) {
					try {
						await langfuseHandlerRef.flushAsync();
					} catch {
						// Ignore flush errors - traces may still be sent
					}
				}

				// Flush Langfuse client (only for hierarchical spans)
				if (useHierarchicalSpans && langfuseClient) {
					try {
						await langfuseClient.flushAsync();
					} catch {
						// Ignore flush errors
					}
				}

				returnData.push({
					json: outputJson,
					pairedItem: { item: itemIndex },
				});

			} catch (error: any) {
				// Try to flush Langfuse even on error
				if (langfuseHandlerRef) {
					try {
						await langfuseHandlerRef.flushAsync();
					} catch {
						// Ignore flush errors
					}
				}
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
