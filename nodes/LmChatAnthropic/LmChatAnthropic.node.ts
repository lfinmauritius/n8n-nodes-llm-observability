import { ChatAnthropic, type AnthropicInput } from '@langchain/anthropic';
import {
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { N8nLlmTracing } from '../utils/N8nLlmTracing';
import { getProxyAgent } from '../utils/httpProxyAgent';

const ANTHROPIC_MODELS = [
	{ name: 'Claude Sonnet 4 (Claude-Sonnet-4-20250514)', value: 'claude-sonnet-4-20250514' },
	{ name: 'Claude 3.7 Sonnet (Latest)', value: 'claude-3-7-sonnet-latest' },
	{ name: 'Claude 3.5 Sonnet (Latest)', value: 'claude-3-5-sonnet-latest' },
	{ name: 'Claude 3.5 Haiku (Latest)', value: 'claude-3-5-haiku-latest' },
	{ name: 'Claude 3 Opus (Latest)', value: 'claude-3-opus-latest' },
	{ name: 'Claude 3 Haiku (Claude-3-Haiku-20240307)', value: 'claude-3-haiku-20240307' },
];

export class LmChatAnthropic implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Anthropic Chat Model',
		name: 'lmChatAnthropic',
		icon: { light: 'file:LmChatAnthropicLight.icon.svg', dark: 'file:LmChatAnthropicDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Anthropic Claude chat model for use with AI Agents',
		defaults: {
			name: 'Anthropic Chat Model',
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
			{ name: 'anthropicApi', required: true },
		],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: ANTHROPIC_MODELS,
				default: 'claude-3-5-sonnet-latest',
				description: 'The Anthropic model to use',
			},
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
						description: 'Whether to enable extended thinking mode (Claude 3.5+ only)',
					},
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						default: 4096,
						description: 'The maximum number of tokens to generate',
						type: 'number',
						typeOptions: { maxValue: 200000 },
					},
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.7,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description: 'Controls randomness in the output',
						type: 'number',
					},
					{
						displayName: 'Thinking Budget (Tokens)',
						name: 'thinkingBudget',
						type: 'number',
						default: 10000,
						typeOptions: { minValue: 1024 },
						description: 'Maximum tokens for thinking process',
						displayOptions: {
							show: { thinking: [true] },
						},
					},
					{
						displayName: 'Top K',
						name: 'topK',
						default: -1,
						typeOptions: { minValue: -1 },
						description: 'Limits token selection - set to -1 to disable',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description: 'Controls diversity via nucleus sampling',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('anthropicApi');
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

		const configuration: Partial<AnthropicInput> = {
			anthropicApiKey: credentials.apiKey as string,
		};

		if (options.baseURL) {
			configuration.anthropicApiUrl = options.baseURL;
		} else if (credentials.url && credentials.url !== 'https://api.anthropic.com') {
			configuration.anthropicApiUrl = credentials.url as string;
		}

		if (credentials.customHeaders) {
			configuration.clientOptions = {
				defaultHeaders: {
					[credentials.headerName as string]: credentials.headerValue as string,
				},
			};
		}

		const invocationKwargs: Record<string, any> = {};
		if (options.thinking) {
			invocationKwargs.thinking = {
				type: 'enabled',
				budget_tokens: options.thinkingBudget ?? 10000,
			};
			delete options.temperature;
			delete options.topK;
			delete options.topP;
		}

		const proxyAgent = getProxyAgent(configuration.anthropicApiUrl ?? 'https://api.anthropic.com');

		const model = new ChatAnthropic({
			...configuration,
			model: modelName,
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 4096,
			topK: options.topK !== -1 ? options.topK : undefined,
			topP: options.topP,
			callbacks: [new N8nLlmTracing(this)],
			invocationKwargs: Object.keys(invocationKwargs).length > 0 ? invocationKwargs : undefined,
			clientOptions: {
				...configuration.clientOptions,
				httpAgent: proxyAgent,
			} as any,
		});

		return { response: model };
	}
}
