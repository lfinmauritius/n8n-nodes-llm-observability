import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { jsonParse, NodeOperationError } from 'n8n-workflow';
import { CallbackHandler } from 'langfuse-langchain';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Tool } from '@langchain/core/tools';
import type { BaseOutputParser } from '@langchain/core/output_parsers';
import type { BaseMessage } from '@langchain/core/messages';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export class AiAgentLlmObs implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AI Agent via LLM Observability',
		name: 'aiAgentLlmObs',
		icon: { light: 'file:AiAgentLlmObsLight.icon.svg', dark: 'file:AiAgentLlmObsDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'AI Agent with integrated LLM Observability support (Langfuse)',
		defaults: {
			name: 'AI Agent LLM Obs',
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
				displayName: 'Model',
				maxConnections: 1,
				type: 'ai_languageModel_llmObs' as any,
				required: true,
			},
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
			{ name: 'langfuseApi', required: false },
		],
		properties: [
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
			// Observability Configuration
			{
				displayName: 'Observability',
				name: 'observability',
				type: 'collection',
				default: {},
				placeholder: 'Add Observability Option',
				options: [
					{
						displayName: 'Custom Metadata (JSON)',
						name: 'customMetadata',
						type: 'json',
						default: '{}',
						description: 'Additional metadata to attach to traces',
					},
					{
						displayName: 'Enable Langfuse',
						name: 'enableLangfuse',
						type: 'boolean',
						default: false,
						description: 'Whether to enable Langfuse observability for this agent',
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
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
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
				// Get the language model from input
				const model = (await this.getInputConnectionData(
					'ai_languageModel_llmObs' as any,
					itemIndex,
				)) as BaseChatModel;

				if (!model) {
					throw new NodeOperationError(
						this.getNode(),
						'No language model connected. Please connect an LLM Observability model to the Model input.',
						{ itemIndex },
					);
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
					// auto - take from previous node
					const inputData = items[itemIndex].json;
					userMessage = (inputData.chatInput || inputData.text || inputData.input || JSON.stringify(inputData)) as string;
					systemMessage = (inputData.systemMessage || 'You are a helpful assistant.') as string;
				}

				// Get observability configuration
				const observability = this.getNodeParameter('observability', itemIndex, {}) as {
					enableLangfuse?: boolean;
					sessionId?: string;
					userId?: string;
					customMetadata?: string | Record<string, any>;
					traceName?: string;
					tags?: string;
				};

				// Get options
				const options = this.getNodeParameter('options', itemIndex, {}) as {
					maxIterations?: number;
					returnIntermediateSteps?: boolean;
				};

				// Prepare the model with Langfuse if enabled
				let activeModel = model;

				if (observability.enableLangfuse) {
					const credentials = await this.getCredentials('langfuseApi');

					if (!credentials) {
						throw new NodeOperationError(
							this.getNode(),
							'Langfuse credentials are required when Langfuse observability is enabled.',
							{ itemIndex },
						);
					}

					// Parse custom metadata
					let customMetadata: Record<string, any> = {};
					if (typeof observability.customMetadata === 'string') {
						try {
							customMetadata = observability.customMetadata.trim()
								? jsonParse<Record<string, any>>(observability.customMetadata)
								: {};
						} catch {
							customMetadata = { _raw: observability.customMetadata };
						}
					} else if (observability.customMetadata && typeof observability.customMetadata === 'object') {
						customMetadata = observability.customMetadata;
					}

					// Parse tags
					const tags = observability.tags
						? observability.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
						: undefined;

					// Create Langfuse callback handler
					const langfuseHandler = new CallbackHandler({
						baseUrl: credentials.baseUrl as string,
						publicKey: credentials.publicKey as string,
						secretKey: credentials.secretKey as string,
						sessionId: observability.sessionId || undefined,
						userId: observability.userId || undefined,
						metadata: customMetadata,
						tags,
					});

					// Get existing callbacks
					const existingCallbacks = Array.isArray(model.callbacks)
						? model.callbacks
						: [];

					// Bind Langfuse to the model
					activeModel = model.bind({
						callbacks: [langfuseHandler, ...existingCallbacks],
						metadata: {
							...customMetadata,
							...(observability.traceName ? { trace_name: observability.traceName } : {}),
						},
					}) as unknown as BaseChatModel;
				}

				// Build messages
				const messages: BaseMessage[] = [];

				// Add memory context if available
				if (memory) {
					try {
						const memoryVariables = await memory.loadMemoryVariables({});
						const chatHistory = memoryVariables.chat_history || memoryVariables.history || [];
						if (Array.isArray(chatHistory)) {
							messages.push(...chatHistory);
						}
					} catch {
						// Memory load failed, continue without history
					}
				}

				// Add system message
				if (systemMessage) {
					messages.push(new SystemMessage(systemMessage));
				}

				// Add user message
				messages.push(new HumanMessage(userMessage));

				// Execute with tools if available
				let response: any;
				const intermediateSteps: any[] = [];

				if (tools && tools.length > 0) {
					// Use tool calling
					const modelWithTools = activeModel.bindTools?.(tools) || activeModel;

					const currentMessages = [...messages];
					let iterations = 0;
					const maxIterations = options.maxIterations || 10;

					while (iterations < maxIterations) {
						iterations++;

						const aiResponse = await modelWithTools.invoke(currentMessages);
						currentMessages.push(aiResponse);

						// Check if the model wants to use tools
						const toolCalls = aiResponse.tool_calls || (aiResponse as any).additional_kwargs?.tool_calls;

						if (!toolCalls || toolCalls.length === 0) {
							// No more tool calls, we're done
							response = aiResponse;
							break;
						}

						// Execute tool calls
						for (const toolCall of toolCalls) {
							const toolName = toolCall.name || toolCall.function?.name;
							const toolArgs = toolCall.args || (toolCall.function?.arguments
								? JSON.parse(toolCall.function.arguments)
								: {});

							const tool = tools.find((t) => t.name === toolName);

							if (tool) {
								try {
									const toolResult = await tool.invoke(toolArgs);

									intermediateSteps.push({
										action: { tool: toolName, toolInput: toolArgs },
										observation: toolResult,
									});

									// Add tool result to messages
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

						// Check if we've reached max iterations
						if (iterations >= maxIterations) {
							response = currentMessages[currentMessages.length - 1];
							break;
						}
					}

					if (!response) {
						response = currentMessages[currentMessages.length - 1];
					}
				} else {
					// Simple invoke without tools
					response = await activeModel.invoke(messages);
				}

				// Extract the response content
				let outputContent = response.content || response.text || response;

				// Apply output parser if available
				if (outputParser && typeof outputContent === 'string') {
					try {
						outputContent = await outputParser.parse(outputContent);
					} catch {
						// If parsing fails, keep original content
					}
				}

				// Save to memory if available
				if (memory) {
					try {
						await memory.saveContext(
							{ input: userMessage },
							{ output: typeof outputContent === 'string' ? outputContent : JSON.stringify(outputContent) },
						);
					} catch {
						// Memory save failed, continue
					}
				}

				// Build output
				const outputJson: Record<string, any> = {
					output: outputContent,
				};

				if (options.returnIntermediateSteps && intermediateSteps.length > 0) {
					outputJson.intermediateSteps = intermediateSteps;
				}

				returnData.push({
					json: outputJson,
					pairedItem: { item: itemIndex },
				});

			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
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
