import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ChatOpenAI, AzureChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Tool } from '@langchain/core/tools';
import type { BaseOutputParser } from '@langchain/core/output_parsers';
import type { BaseMessage } from '@langchain/core/messages';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// Helicone proxy URLs
const HELICONE_URLS = {
	openai: 'https://oai.helicone.ai/v1',
	anthropic: 'https://anthropic.helicone.ai',
	azure: 'https://oai.helicone.ai/openai/deployments',
	groq: 'https://groq.helicone.ai/openai/v1',
	gateway: 'https://gateway.helicone.ai',
};

const LLM_PROVIDERS = [
	{ name: 'OpenAI', value: 'openai' },
	{ name: 'Anthropic', value: 'anthropic' },
	{ name: 'Azure OpenAI', value: 'azureOpenai' },
	{ name: 'Google Gemini', value: 'gemini' },
	{ name: 'Groq', value: 'groq' },
	{ name: 'Mistral', value: 'mistral' },
	{ name: 'OpenAI Compatible', value: 'openaiCompatible' },
];

export class AiAgentHelicone implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AI Agent Helicone',
		name: 'aiAgentHelicone',
		icon: { light: 'file:AiAgentHeliconLight.icon.svg', dark: 'file:AiAgentHeliconeDark.icon.svg' },
		group: ['transform'],
		version: 1,
		description: 'AI Agent with integrated LLM provider and Helicone observability',
		defaults: {
			name: 'AI Agent Helicone',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Agents', 'Root Nodes'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.helicone.ai',
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
				name: 'openAiHeliconeApi',
				displayName: 'OpenAI + Helicone API',
				required: true,
				displayOptions: { show: { provider: ['openai'] } },
			},
			{
				name: 'anthropicHeliconeApi',
				displayName: 'Anthropic + Helicone API',
				required: true,
				displayOptions: { show: { provider: ['anthropic'] } },
			},
			{
				name: 'azureOpenAiHeliconeApi',
				displayName: 'Azure OpenAI + Helicone API',
				required: true,
				displayOptions: { show: { provider: ['azureOpenai'] } },
			},
			{
				name: 'geminiHeliconeApi',
				displayName: 'Google Gemini + Helicone API',
				required: true,
				displayOptions: { show: { provider: ['gemini'] } },
			},
			{
				name: 'groqHeliconeApi',
				displayName: 'Groq + Helicone API',
				required: true,
				displayOptions: { show: { provider: ['groq'] } },
			},
			{
				name: 'mistralHeliconeApi',
				displayName: 'Mistral + Helicone API',
				required: true,
				displayOptions: { show: { provider: ['mistral'] } },
			},
			{
				name: 'openAiCompatibleHeliconeApi',
				displayName: 'OpenAI Compatible + Helicone API',
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
				options: LLM_PROVIDERS,
				default: 'openai',
				description: 'The LLM provider to use',
			},
			// Model name
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'gpt-4o',
				required: true,
				description: 'The model to use (e.g., gpt-4o, claude-3-5-sonnet-20241022, gemini-1.5-pro)',
			},
			// Model options
			{
				displayName: 'Model Options',
				name: 'modelOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 1 },
						default: 0.7,
						description: 'Controls randomness (0 = deterministic, 2 = creative)',
					},
					{
						displayName: 'Max Tokens',
						name: 'maxTokens',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 4096,
						description: 'Maximum number of tokens to generate',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
						default: 1,
						description: 'Nucleus sampling parameter',
					},
				],
			},
			// Prompt Type
			{
				displayName: 'Prompt Type',
				name: 'promptType',
				type: 'options',
				options: [
					{ name: 'Define Below', value: 'define' },
					{ name: 'Take From Previous Node', value: 'auto' },
				],
				default: 'define',
			},
			// System Message
			{
				displayName: 'System Message',
				name: 'systemMessage',
				type: 'string',
				typeOptions: { rows: 4 },
				default: 'You are a helpful assistant.',
				displayOptions: { show: { promptType: ['define'] } },
			},
			// User Message
			{
				displayName: 'User Message',
				name: 'text',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				required: true,
				displayOptions: { show: { promptType: ['define'] } },
			},
			// Helicone Options
			{
				displayName: 'Helicone Options',
				name: 'heliconeOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Session ID',
						name: 'sessionId',
						type: 'string',
						default: '',
						description: 'Group related requests into a session',
					},
					{
						displayName: 'User ID',
						name: 'userId',
						type: 'string',
						default: '',
						description: 'Identify the end user',
					},
					{
						displayName: 'Custom Properties',
						name: 'customProperties',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true },
						default: {},
						options: [
							{
								name: 'property',
								displayName: 'Property',
								values: [
									{
										displayName: 'Name',
										name: 'name',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
									},
								],
							},
						],
						description: 'Custom properties to add to the request',
					},
				],
			},
			// Agent Options
			{
				displayName: 'Agent Options',
				name: 'agentOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Max Iterations',
						name: 'maxIterations',
						type: 'number',
						default: 10,
						description: 'Maximum number of tool calling iterations',
					},
					{
						displayName: 'Return Intermediate Steps',
						name: 'returnIntermediateSteps',
						type: 'boolean',
						default: false,
						description: 'Whether to include tool call details in the output',
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
				const provider = this.getNodeParameter('provider', itemIndex) as string;
				const modelName = this.getNodeParameter('model', itemIndex) as string;
				const modelOptions = this.getNodeParameter('modelOptions', itemIndex, {}) as {
					temperature?: number;
					maxTokens?: number;
					topP?: number;
				};

				// Get credentials based on provider
				const credentialMap: Record<string, string> = {
					openai: 'openAiHeliconeApi',
					anthropic: 'anthropicHeliconeApi',
					azureOpenai: 'azureOpenAiHeliconeApi',
					gemini: 'geminiHeliconeApi',
					groq: 'groqHeliconeApi',
					mistral: 'mistralHeliconeApi',
					openaiCompatible: 'openAiCompatibleHeliconeApi',
				};
				const credentialName = credentialMap[provider] || 'openAiHeliconeApi';
				const credentials = await this.getCredentials(credentialName);

				// Get Helicone options
				const heliconeOptions = this.getNodeParameter('heliconeOptions', itemIndex, {}) as {
					sessionId?: string;
					userId?: string;
					customProperties?: { property: Array<{ name: string; value: string }> };
				};

				// Build Helicone headers
				const heliconeHeaders: Record<string, string> = {
					'Helicone-Auth': `Bearer ${credentials.heliconeApiKey}`,
				};

				if (heliconeOptions.sessionId) {
					heliconeHeaders['Helicone-Session-Id'] = heliconeOptions.sessionId;
				}
				if (heliconeOptions.userId) {
					heliconeHeaders['Helicone-User-Id'] = heliconeOptions.userId;
				}
				if (heliconeOptions.customProperties?.property) {
					for (const prop of heliconeOptions.customProperties.property) {
						if (prop.name && prop.value) {
							heliconeHeaders[`Helicone-Property-${prop.name}`] = prop.value;
						}
					}
				}

				// Accumulate token usage across all LLM calls
				const totalTokenUsage = {
					promptTokens: 0,
					completionTokens: 0,
					totalTokens: 0,
				};

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

				// Create the model based on provider with Helicone proxy
				let model: BaseChatModel;

				switch (provider) {
					case 'openai': {
						model = new ChatOpenAI({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
							configuration: {
								baseURL: HELICONE_URLS.openai,
								defaultHeaders: heliconeHeaders,
							},
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
							clientOptions: {
								baseURL: HELICONE_URLS.anthropic,
								defaultHeaders: heliconeHeaders,
							},
						});
						break;
					}
					case 'azureOpenai': {
						model = new AzureChatOpenAI({
							azureOpenAIApiKey: credentials.apiKey as string,
							azureOpenAIApiDeploymentName: modelName,
							azureOpenAIApiVersion: credentials.apiVersion as string,
							azureOpenAIBasePath: HELICONE_URLS.azure,
							temperature: modelOptions.temperature ?? 0.7,
							modelKwargs: {
								max_completion_tokens: modelOptions.maxTokens ?? 4096,
							},
							configuration: {
								defaultHeaders: {
									...heliconeHeaders,
									'Helicone-OpenAI-API-Base': `https://${credentials.resourceName}.openai.azure.com`,
								},
							},
						});
						break;
					}
					case 'gemini': {
						const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
						// Gemini uses gateway with target URL
						model = new ChatGoogleGenerativeAI({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxOutputTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
						});
						// Note: Gemini doesn't support custom baseURL in LangChain, using direct API
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
						// Note: ChatGroq doesn't support custom baseURL directly
						// Using OpenAI compatible mode for Helicone
						model = new ChatOpenAI({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							configuration: {
								baseURL: HELICONE_URLS.groq,
								defaultHeaders: heliconeHeaders,
							},
						});
						break;
					}
					case 'mistral': {
						// Use gateway for Mistral
						model = new ChatOpenAI({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							topP: modelOptions.topP,
							configuration: {
								baseURL: HELICONE_URLS.gateway,
								defaultHeaders: {
									...heliconeHeaders,
									'Helicone-Target-Url': 'https://api.mistral.ai',
								},
							},
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
							configuration: {
								baseURL: HELICONE_URLS.gateway,
								defaultHeaders: {
									...heliconeHeaders,
									'Helicone-Target-Url': credentials.baseUrl as string,
								},
							},
						});
						break;
					}
					default:
						throw new NodeOperationError(this.getNode(), `Unknown provider: ${provider}`, { itemIndex });
				}

				// Get optional connections
				const rawTools = await this.getInputConnectionData('ai_tool' as any, itemIndex);
				let tools: Tool[] | undefined;
				if (rawTools) {
					const toolArray = Array.isArray(rawTools) ? rawTools : [rawTools];
					tools = toolArray.flatMap((t: any) => {
						if (t && typeof t === 'object' && 'response' in t) return t.response;
						return t;
					}).filter((t): t is Tool => t != null);
				}

				const memory = (await this.getInputConnectionData('ai_memory' as any, itemIndex)) as any | undefined;
				const outputParser = (await this.getInputConnectionData('ai_outputParser' as any, itemIndex)) as BaseOutputParser | undefined;

				// Get prompt
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

				const agentOptions = this.getNodeParameter('agentOptions', itemIndex, {}) as {
					maxIterations?: number;
					returnIntermediateSteps?: boolean;
				};

				// Build messages
				const messages: BaseMessage[] = [];

				if (memory) {
					try {
						const memoryVariables = await memory.loadMemoryVariables({});
						const chatHistory = memoryVariables.chat_history || memoryVariables.history || [];
						if (Array.isArray(chatHistory)) messages.push(...chatHistory);
					} catch {
						// Memory load failed
					}
				}

				if (systemMessage) messages.push(new SystemMessage(systemMessage));
				messages.push(new HumanMessage(userMessage));

				// Execute
				let response: any;
				const intermediateSteps: any[] = [];

				if (tools && tools.length > 0) {
					const hasBindTools = typeof model.bindTools === 'function';
					const modelWithTools = hasBindTools ? model.bindTools!(tools) : model;
					const currentMessages = [...messages];
					let iterations = 0;
					const maxIterations = agentOptions.maxIterations || 10;

					while (iterations < maxIterations) {
						iterations++;
						const aiResponse = await modelWithTools.invoke(currentMessages);
						currentMessages.push(aiResponse);
						accumulateTokenUsage(aiResponse);

						const toolCalls = aiResponse.tool_calls || (aiResponse as any).additional_kwargs?.tool_calls;

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
									const toolResult = await tool.invoke(toolArgs);
									const formattedResult = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);

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
									currentMessages.push(new ToolMessage({
										content: errorMessage,
										tool_call_id: toolCallId,
									}));
								}
							} else {
								const errorMessage = `Tool "${toolName}" not found`;
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

					if (!response) response = currentMessages[currentMessages.length - 1];
				} else {
					response = await model.invoke(messages);
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

				// Use accumulated token usage
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

				const outputJson: Record<string, any> = { output: outputContent };
				if (intermediateSteps.length > 0) outputJson.intermediateSteps = intermediateSteps;
				if (tokenUsage) outputJson.tokenUsage = tokenUsage;

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
