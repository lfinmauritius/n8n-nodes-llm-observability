import { ChatAnthropic, type AnthropicInput } from '@langchain/anthropic';
import {
	jsonParse,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { CallbackHandler } from 'langfuse-langchain';
import { N8nLlmTracing } from '../LmChatOpenAiLangfuse/utils/N8nLlmTracing';
import { getProxyAgent } from '../LmChatOpenAiLangfuse/utils/httpProxyAgent';

const ANTHROPIC_MODELS = [
	// Claude 4 models
	{ name: 'Claude Sonnet 4 (Claude-Sonnet-4-20250514)', value: 'claude-sonnet-4-20250514' },
	// Claude 3.7 models
	{ name: 'Claude 3.7 Sonnet (Claude-3-7-Sonnet-20250219)', value: 'claude-3-7-sonnet-20250219' },
	{ name: 'Claude 3.7 Sonnet (Latest)', value: 'claude-3-7-sonnet-latest' },
	// Claude 3.5 models
	{ name: 'Claude 3.5 Sonnet (Claude-3-5-Sonnet-20241022)', value: 'claude-3-5-sonnet-20241022' },
	{ name: 'Claude 3.5 Sonnet (Latest)', value: 'claude-3-5-sonnet-latest' },
	{ name: 'Claude 3.5 Haiku (Claude-3-5-Haiku-20241022)', value: 'claude-3-5-haiku-20241022' },
	{ name: 'Claude 3.5 Haiku (Latest)', value: 'claude-3-5-haiku-latest' },
	// Claude 3 models
	{ name: 'Claude 3 Opus (Claude-3-Opus-20240229)', value: 'claude-3-opus-20240229' },
	{ name: 'Claude 3 Opus (Latest)', value: 'claude-3-opus-latest' },
	{ name: 'Claude 3 Sonnet (Claude-3-Sonnet-20240229)', value: 'claude-3-sonnet-20240229' },
	{ name: 'Claude 3 Haiku (Claude-3-Haiku-20240307)', value: 'claude-3-haiku-20240307' },
];

export class LmChatAnthropicLangfuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Anthropic Chat Model with Langfuse',
		name: 'lmChatAnthropicLangfuse',
		icon: { light: 'file:LmChatAnthropicLangfuseLight.icon.svg', dark: 'file:LmChatAnthropicLangfuseDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Anthropic Claude chat model with Langfuse tracing',
		defaults: {
			name: 'Anthropic Chat Model with Langfuse',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatanthropic/',
					},
				],
			},
		},

		inputs: [],
		outputs: ['ai_languageModel' as any],
		outputNames: ['Model'],
		credentials: [
			{ name: 'anthropicApiWithLangfuseApi', required: true },
		],
		properties: [
			// Langfuse metadata
			{
				displayName: 'Langfuse Metadata',
				name: 'langfuseMetadata',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Custom Metadata (JSON)',
						name: 'customMetadata',
						type: 'json',
						default: `{
	"project": "example-project",
	"env": "dev",
	"workflow": "main-flow"
}`,
						description: 'Optional. Pass extra metadata to be attached to Langfuse traces.',
					},
					{
						displayName: 'Session ID',
						name: 'sessionId',
						type: 'string',
						default: 'default-session-id',
						description: 'Used in Langfuse trace grouping (langfuse_session_id)',
					},
					{
						displayName: 'User ID',
						name: 'userId',
						type: 'string',
						default: '',
						description: 'Optional: for trace attribution (langfuse_user_id)',
					},
				],
			},
			// Model selection
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: ANTHROPIC_MODELS,
				default: 'claude-3-5-sonnet-latest',
				description: 'The Anthropic model to use',
			},
			// Options
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				description: 'Additional options to add',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Base URL',
						name: 'baseURL',
						default: '',
						description: 'Override the default base URL for the API',
						type: 'string',
					},
					{
						displayName: 'Enable Thinking',
						name: 'thinking',
						type: 'boolean',
						default: false,
						description:
							'Whether to enable extended thinking mode for complex reasoning tasks (Claude 3.5+ only)',
					},
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						default: 4096,
						description: 'The maximum number of tokens to generate in the completion',
						type: 'number',
						typeOptions: {
							maxValue: 200000,
						},
					},
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.7,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description:
							'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
						type: 'number',
					},
					{
						displayName: 'Thinking Budget (Tokens)',
						name: 'thinkingBudget',
						type: 'number',
						default: 10000,
						typeOptions: { minValue: 1024 },
						description: 'Maximum number of tokens for the thinking process',
						displayOptions: {
							show: {
								thinking: [true],
							},
						},
					},
					{
						displayName: 'Top K',
						name: 'topK',
						default: -1,
						typeOptions: { minValue: -1 },
						description:
							'Used to remove "long tail" low probability responses - set to -1 to disable',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description: 'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('anthropicApiWithLangfuseApi');

		const {
			sessionId,
			userId,
			customMetadata: customMetadataRaw = {},
		} = this.getNodeParameter('langfuseMetadata', itemIndex) as {
			sessionId: string;
			userId?: string;
			customMetadata?: string | Record<string, any>;
		};

		let customMetadata: Record<string, any> = {};

		if (typeof customMetadataRaw === 'string') {
			try {
				customMetadata = customMetadataRaw.trim()
					? jsonParse<Record<string, any>>(customMetadataRaw)
					: {};
			} catch {
				customMetadata = { _raw: customMetadataRaw };
			}
		} else if (customMetadataRaw && typeof customMetadataRaw === 'object') {
			customMetadata = customMetadataRaw as Record<string, any>;
		}

		// Langfuse handler
		const lfHandler = new CallbackHandler({
			baseUrl: credentials.langfuseBaseUrl as string,
			publicKey: credentials.langfusePublicKey as string,
			secretKey: credentials.langfuseSecretKey as string,
			sessionId,
			userId,
		});

		const modelName = this.getNodeParameter('model', itemIndex) as string;

		const options = this.getNodeParameter('options', itemIndex, {}) as {
			baseURL?: string;
			maxTokens?: number;
			temperature?: number;
			topK?: number;
			topP?: number;
			thinking?: boolean;
			thinkingBudget?: number;
		};

		// Build configuration
		const configuration: Partial<AnthropicInput> = {
			anthropicApiKey: credentials.apiKey as string,
		};

		// Handle base URL
		if (options.baseURL) {
			configuration.anthropicApiUrl = options.baseURL;
		} else if (credentials.url && credentials.url !== 'https://api.anthropic.com') {
			configuration.anthropicApiUrl = credentials.url as string;
		}

		// Handle custom headers
		if (credentials.customHeaders) {
			configuration.clientOptions = {
				defaultHeaders: {
					[credentials.headerName as string]: credentials.headerValue as string,
				},
			};
		}

		// Handle thinking mode
		const invocationKwargs: Record<string, any> = {};
		if (options.thinking) {
			invocationKwargs.thinking = {
				type: 'enabled',
				budget_tokens: options.thinkingBudget ?? 10000,
			};
			// When thinking is enabled, disable sampling parameters
			delete options.temperature;
			delete options.topK;
			delete options.topP;
		}

		// Get proxy agent
		const proxyAgent = getProxyAgent(configuration.anthropicApiUrl ?? 'https://api.anthropic.com');

		const model = new ChatAnthropic({
			...configuration,
			model: modelName,
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 4096,
			topK: options.topK !== -1 ? options.topK : undefined,
			topP: options.topP,
			callbacks: [lfHandler, new N8nLlmTracing(this)],
			metadata: customMetadata,
			invocationKwargs: Object.keys(invocationKwargs).length > 0 ? invocationKwargs : undefined,
			clientOptions: {
				...configuration.clientOptions,
				httpAgent: proxyAgent,
			} as any,
		});

		return {
			response: model,
		};
	}
}
