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
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';

const LLM_PROVIDERS = [
	{ name: 'OpenAI', value: 'openai' },
	{ name: 'Azure OpenAI', value: 'azureOpenai' },
	{ name: 'Anthropic', value: 'anthropic' },
	{ name: 'Ollama', value: 'ollama' },
	{ name: 'OpenAI Compatible', value: 'openaiCompatible' },
];

export class AiAgentPhoenix implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AI Agent Phoenix',
		name: 'aiAgentPhoenix',
		icon: { light: 'file:AiAgentPhoenixLight.icon.svg', dark: 'file:AiAgentPhoenixDark.icon.svg' },
		group: ['transform'],
		version: 1,
		description: 'AI Agent with integrated LLM provider and Arize Phoenix observability',
		defaults: {
			name: 'AI Agent Phoenix',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Agents', 'Root Nodes'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://arize.com/docs/phoenix',
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
				name: 'openAiPhoenixApi',
				displayName: 'OpenAI + Phoenix API',
				required: true,
				displayOptions: { show: { provider: ['openai'] } },
			},
			{
				name: 'azureOpenAiPhoenixApi',
				displayName: 'Azure OpenAI + Phoenix API',
				required: true,
				displayOptions: { show: { provider: ['azureOpenai'] } },
			},
			{
				name: 'anthropicPhoenixApi',
				displayName: 'Anthropic + Phoenix API',
				required: true,
				displayOptions: { show: { provider: ['anthropic'] } },
			},
			{
				name: 'openAiPhoenixApi',
				displayName: 'Ollama + Phoenix API',
				required: true,
				displayOptions: { show: { provider: ['ollama'] } },
			},
			{
				name: 'openAiPhoenixApi',
				displayName: 'OpenAI Compatible + Phoenix API',
				required: true,
				displayOptions: { show: { provider: ['openaiCompatible'] } },
			},
		],
		properties: [
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
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'gpt-4o-mini',
				description: 'The model to use',
				displayOptions: { show: { provider: ['openai'] } },
			},
			{
				displayName: 'Deployment Name',
				name: 'model',
				type: 'string',
				default: '',
				required: true,
				description: 'The deployment name of your Azure OpenAI model',
				displayOptions: { show: { provider: ['azureOpenai'] } },
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'claude-3-5-sonnet-latest',
				description: 'The model to use',
				displayOptions: { show: { provider: ['anthropic'] } },
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'llama3.2',
				description: 'The model to use',
				displayOptions: { show: { provider: ['ollama'] } },
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: '',
				description: 'The model to use',
				displayOptions: { show: { provider: ['openaiCompatible'] } },
			},
			{
				displayName: 'Base URL',
				name: 'baseUrl',
				type: 'string',
				default: 'http://localhost:11434/v1',
				placeholder: 'http://localhost:11434/v1',
				description: 'The base URL of the API',
				displayOptions: { show: { provider: ['ollama'] } },
			},
			{
				displayName: 'Base URL',
				name: 'baseUrl',
				type: 'string',
				default: '',
				placeholder: 'http://localhost:8000/v1',
				description: 'The base URL of the API',
				displayOptions: { show: { provider: ['openaiCompatible'] } },
			},
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
				],
			},
			{
				displayName: 'Prompt',
				name: 'promptType',
				type: 'options',
				options: [
					{ name: 'Define Below', value: 'define' },
					{ name: 'Take From Previous Node', value: 'auto' },
				],
				default: 'define',
			},
			{
				displayName: 'System Message',
				name: 'systemMessage',
				type: 'string',
				typeOptions: { rows: 4 },
				default: 'You are a helpful assistant.',
				displayOptions: { show: { promptType: ['define'] } },
			},
			{
				displayName: 'User Message',
				name: 'text',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '={{ $json.chatInput }}',
				displayOptions: { show: { promptType: ['define'] } },
			},
			{
				displayName: 'Phoenix Options',
				name: 'phoenixOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Session ID',
						name: 'sessionId',
						type: 'string',
						default: '',
						description: 'Group related traces together',
					},
					{
						displayName: 'User ID',
						name: 'userId',
						type: 'string',
						default: '',
						description: 'User identifier for trace attribution',
					},
					{
						displayName: 'Tags',
						name: 'tags',
						type: 'string',
						default: '',
						description: 'Comma-separated tags for filtering traces',
					},
				],
			},
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
			let tracerProvider: NodeTracerProvider | null = null;

			try {
				const provider = this.getNodeParameter('provider', itemIndex) as string;
				const modelName = this.getNodeParameter('model', itemIndex) as string;
				const modelOptions = this.getNodeParameter('modelOptions', itemIndex, {}) as {
					temperature?: number;
					maxTokens?: number;
				};

				// Get credentials based on provider
				let credentialName: string;
				switch (provider) {
					case 'anthropic':
						credentialName = 'anthropicPhoenixApi';
						break;
					case 'azureOpenai':
						credentialName = 'azureOpenAiPhoenixApi';
						break;
					default:
						credentialName = 'openAiPhoenixApi';
				}
				const credentials = await this.getCredentials(credentialName);

				// Initialize OpenTelemetry tracer for Phoenix
				const exporter = new OTLPTraceExporter({
					url: credentials.phoenixCollectorUrl as string,
					headers: credentials.phoenixApiKey
						? { Authorization: `Bearer ${credentials.phoenixApiKey}` }
						: undefined,
				});

				tracerProvider = new NodeTracerProvider({
					resource: new Resource({
						'service.name': 'n8n-ai-agent-phoenix',
						'project.name': credentials.phoenixProjectName as string,
					}),
				});

				tracerProvider.addSpanProcessor(new BatchSpanProcessor(exporter));
				tracerProvider.register();

				const tracer = trace.getTracer('n8n-ai-agent-phoenix');

				// Create the model based on provider
				let model: BaseChatModel;

				switch (provider) {
					case 'openai': {
						model = new ChatOpenAI({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							configuration: credentials.url ? { baseURL: credentials.url as string } : undefined,
						});
						break;
					}
					case 'azureOpenai': {
						model = new AzureChatOpenAI({
							azureOpenAIApiKey: credentials.apiKey as string,
							azureOpenAIApiDeploymentName: modelName,
							azureOpenAIApiVersion: credentials.apiVersion as string,
							azureOpenAIBasePath: `${credentials.endpoint}/openai/deployments`,
							temperature: modelOptions.temperature ?? 0.7,
							modelKwargs: {
								max_completion_tokens: modelOptions.maxTokens ?? 4096,
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
						});
						break;
					}
					case 'ollama': {
						const baseUrl = this.getNodeParameter('baseUrl', itemIndex, 'http://localhost:11434/v1') as string;
						model = new ChatOpenAI({
							apiKey: 'ollama',
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							configuration: { baseURL: baseUrl },
						});
						break;
					}
					case 'openaiCompatible': {
						const baseUrl = this.getNodeParameter('baseUrl', itemIndex) as string;
						model = new ChatOpenAI({
							apiKey: credentials.apiKey as string,
							model: modelName,
							temperature: modelOptions.temperature ?? 0.7,
							maxTokens: modelOptions.maxTokens ?? 4096,
							configuration: { baseURL: baseUrl },
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

				// Get Phoenix options
				const phoenixOptions = this.getNodeParameter('phoenixOptions', itemIndex, {}) as {
					sessionId?: string;
					userId?: string;
					tags?: string;
				};

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

				// Execute with Phoenix tracing
				let response: any;
				const intermediateSteps: any[] = [];

				await tracer.startActiveSpan('llm_call', async (span) => {
					span.setAttribute('llm.provider', provider);
					span.setAttribute('llm.model', modelName);
					span.setAttribute('llm.temperature', modelOptions.temperature ?? 0.7);
					if (phoenixOptions.sessionId) span.setAttribute('session.id', phoenixOptions.sessionId);
					if (phoenixOptions.userId) span.setAttribute('user.id', phoenixOptions.userId);

					try {
						if (tools && tools.length > 0) {
							const hasBindTools = typeof model.bindTools === 'function';
							const modelWithTools = hasBindTools ? model.bindTools!(tools) : model;
							const currentMessages = [...messages];
							let iterations = 0;
							const maxIterations = agentOptions.maxIterations || 10;

							while (iterations < maxIterations) {
								iterations++;

								await tracer.startActiveSpan(`iteration_${iterations}`, async (iterSpan) => {
									const aiResponse = await modelWithTools.invoke(currentMessages);
									currentMessages.push(aiResponse);

									const toolCalls = aiResponse.tool_calls || (aiResponse as any).additional_kwargs?.tool_calls;

									if (!toolCalls || toolCalls.length === 0) {
										response = aiResponse;
										iterSpan.end();
										return;
									}

									const { ToolMessage } = await import('@langchain/core/messages');

									for (const toolCall of toolCalls) {
										const toolName = toolCall.name || toolCall.function?.name;
										const toolCallId = toolCall.id || toolName;
										const toolArgs = toolCall.args || (toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {});
										const tool = tools.find((t) => t.name === toolName);

										await tracer.startActiveSpan(`tool_${toolName}`, async (toolSpan) => {
											toolSpan.setAttribute('tool.name', toolName);
											toolSpan.setAttribute('tool.input', JSON.stringify(toolArgs));

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

													toolSpan.setAttribute('tool.output', formattedResult.substring(0, 1000));
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
													toolSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
												}
											}
											toolSpan.end();
										});
									}
									iterSpan.end();
								});

								if (response) break;
							}

							if (!response) response = currentMessages[currentMessages.length - 1];
						} else {
							response = await model.invoke(messages);
						}

						span.setStatus({ code: SpanStatusCode.OK });
					} catch (error: any) {
						span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
						throw error;
					} finally {
						span.end();
					}
				});

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

				const outputJson: Record<string, any> = { output: outputContent };
				if (intermediateSteps.length > 0) outputJson.intermediateSteps = intermediateSteps;

				// Flush traces
				if (tracerProvider) {
					try {
						await tracerProvider.forceFlush();
					} catch {
						// Ignore flush errors
					}
				}

				returnData.push({
					json: outputJson,
					pairedItem: { item: itemIndex },
				});

			} catch (error: any) {
				if (tracerProvider) {
					try {
						await tracerProvider.forceFlush();
					} catch {
						// Ignore
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
