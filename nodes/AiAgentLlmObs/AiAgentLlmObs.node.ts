import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { jsonParse, NodeOperationError } from 'n8n-workflow';
import { CallbackHandler } from 'langfuse-langchain';
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
		version: [1],
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
				name: 'langfuseObsApi',
				displayName: 'Langfuse Credential',
				required: false,
			},
			{
				name: 'openAiApi',
				displayName: 'LLM Credential',
				required: true,
				displayOptions: { show: { provider: ['openai', 'openaiCompatible'] } },
			},
			{
				name: 'anthropicApi',
				displayName: 'LLM Credential',
				required: true,
				displayOptions: { show: { provider: ['anthropic'] } },
			},
			{
				name: 'azureOpenAiApi',
				displayName: 'LLM Credential',
				required: true,
				displayOptions: { show: { provider: ['azureOpenai'] } },
			},
			{
				name: 'googlePalmApi',
				displayName: 'LLM Credential',
				required: true,
				displayOptions: { show: { provider: ['gemini'] } },
			},
			{
				name: 'awsApi',
				displayName: 'LLM Credential',
				required: true,
				displayOptions: { show: { provider: ['bedrock'] } },
			},
			{
				name: 'groqApi',
				displayName: 'LLM Credential',
				required: true,
				displayOptions: { show: { provider: ['groq'] } },
			},
			{
				name: 'mistralCloudApi',
				displayName: 'LLM Credential',
				required: true,
				displayOptions: { show: { provider: ['mistral'] } },
			},
			{
				name: 'ollamaApi',
				displayName: 'LLM Credential',
				required: true,
				displayOptions: { show: { provider: ['ollama'] } },
			},
			{
				name: 'xAiApi',
				displayName: 'LLM Credential',
				required: true,
				displayOptions: { show: { provider: ['grok'] } },
			},
			{
				name: 'vllmApi',
				displayName: 'LLM Credential',
				required: true,
				displayOptions: { show: { provider: ['vllm'] } },
			},
		],
		properties: [
			// LLM Provider Selection - MUST be first
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
			// Langfuse Options (tracing enabled when credential is configured)
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
			try {
				// Get provider and model configuration
				const provider = this.getNodeParameter('provider', itemIndex) as string;
				const modelName = this.getNodeParameter('model', itemIndex) as string;
				const modelOptions = this.getNodeParameter('modelOptions', itemIndex, {}) as {
					temperature?: number;
					maxTokens?: number;
					topP?: number;
				};

				// Create the model based on provider
				let model: BaseChatModel;

				switch (provider) {
					case 'openai': {
						const credentials = await this.getCredentials('openAiApi');
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
						const credentials = await this.getCredentials('anthropicApi');
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
						const credentials = await this.getCredentials('azureOpenAiApi');
						const { AzureChatOpenAI } = await import('@langchain/openai');
						model = new AzureChatOpenAI({
							azureOpenAIApiKey: credentials.apiKey as string,
							azureOpenAIApiDeploymentName: modelName,
							azureOpenAIApiInstanceName: credentials.resourceName as string,
							azureOpenAIApiVersion: (credentials.apiVersion as string) || '2024-02-15-preview',
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
						});
						break;
					}
					case 'gemini': {
						const credentials = await this.getCredentials('googlePalmApi');
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
						const credentials = await this.getCredentials('awsApi');
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
						const credentials = await this.getCredentials('groqApi');
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
						const credentials = await this.getCredentials('mistralCloudApi');
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
						const credentials = await this.getCredentials('ollamaApi');
						const { ChatOllama } = await import('@langchain/ollama');
						model = new ChatOllama({
							baseUrl: credentials.baseUrl as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
						});
						break;
					}
					case 'grok': {
						const credentials = await this.getCredentials('xAiApi');
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
						const credentials = await this.getCredentials('vllmApi');
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
						const credentials = await this.getCredentials('openAiApi');
						const baseUrl = this.getNodeParameter('baseUrl', itemIndex) as string;
						model = new ChatOpenAI({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
							configuration: { baseURL: baseUrl },
						});
						break;
					}
					default:
						throw new NodeOperationError(this.getNode(), `Unknown provider: ${provider}`, { itemIndex });
				}

				// Get optional connections
				const tools = (await this.getInputConnectionData(
					'ai_tool' as any,
					itemIndex,
				)) as Tool[] | undefined;

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
					maxIterations?: number;
					returnIntermediateSteps?: boolean;
				};

				// Prepare the model with Langfuse if credentials are configured
				let activeModel = model;

				// Try to get Langfuse credentials (optional - tracing enabled when configured)
				let langfuseCredentials: any = null;
				try {
					langfuseCredentials = await this.getCredentials('langfuseObsApi');
				} catch {
					// No Langfuse credentials configured, continue without tracing
				}

				if (langfuseCredentials) {
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

					const langfuseHandler = new CallbackHandler({
						baseUrl: langfuseCredentials.baseUrl as string,
						publicKey: langfuseCredentials.publicKey as string,
						secretKey: langfuseCredentials.secretKey as string,
						sessionId: langfuseOptions.sessionId || undefined,
						userId: langfuseOptions.userId || undefined,
						metadata: customMetadata,
						tags,
					});

					const existingCallbacks = Array.isArray(model.callbacks) ? model.callbacks : [];

					activeModel = model.bind({
						callbacks: [langfuseHandler, ...existingCallbacks],
						metadata: {
							...customMetadata,
							...(langfuseOptions.traceName ? { trace_name: langfuseOptions.traceName } : {}),
						},
					}) as unknown as BaseChatModel;
				}

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

				if (tools && tools.length > 0) {
					const modelWithTools = activeModel.bindTools?.(tools) || activeModel;
					const currentMessages = [...messages];
					let iterations = 0;
					const maxIterations = agentOptions.maxIterations || 10;

					while (iterations < maxIterations) {
						iterations++;
						const aiResponse = await modelWithTools.invoke(currentMessages);
						currentMessages.push(aiResponse);

						const toolCalls = aiResponse.tool_calls || (aiResponse as any).additional_kwargs?.tool_calls;

						if (!toolCalls || toolCalls.length === 0) {
							response = aiResponse;
							break;
						}

						for (const toolCall of toolCalls) {
							const toolName = toolCall.name || toolCall.function?.name;
							const toolArgs = toolCall.args || (toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {});
							const tool = tools.find((t) => t.name === toolName);

							if (tool) {
								try {
									const toolResult = await tool.invoke(toolArgs);
									intermediateSteps.push({
										action: { tool: toolName, toolInput: toolArgs },
										observation: toolResult,
									});

									const { ToolMessage } = await import('@langchain/core/messages');
									currentMessages.push(new ToolMessage({
										content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
										tool_call_id: toolCall.id || toolName,
									}));
								} catch (error: any) {
									intermediateSteps.push({
										action: { tool: toolName, toolInput: toolArgs },
										observation: `Error: ${error.message}`,
									});
								}
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
					response = await activeModel.invoke(messages);
				}

				let outputContent = response.content || response.text || response;

				if (outputParser && typeof outputContent === 'string') {
					try {
						outputContent = await outputParser.parse(outputContent);
					} catch {
						// Keep original
					}
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

				if (agentOptions.returnIntermediateSteps && intermediateSteps.length > 0) {
					outputJson.intermediateSteps = intermediateSteps;
				}

				returnData.push({
					json: outputJson,
					pairedItem: { item: itemIndex },
				});

			} catch (error: any) {
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
