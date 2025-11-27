import { ChatMistralAI } from '@langchain/mistralai';
import {
	jsonParse,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { CallbackHandler } from 'langfuse-langchain';
import { N8nLlmTracing } from '../LmChatOpenAiLangfuse/utils/N8nLlmTracing';

const MISTRAL_MODELS = [
	// Premier models
	{ name: 'Mistral Large (Latest)', value: 'mistral-large-latest' },
	{ name: 'Mistral Large 2411', value: 'mistral-large-2411' },
	{ name: 'Mistral Large 2407', value: 'mistral-large-2407' },
	// Medium models
	{ name: 'Mistral Medium (Latest)', value: 'mistral-medium-latest' },
	// Small models
	{ name: 'Mistral Small (Latest)', value: 'mistral-small-latest' },
	{ name: 'Mistral Small 2409', value: 'mistral-small-2409' },
	// Codestral models
	{ name: 'Codestral (Latest)', value: 'codestral-latest' },
	{ name: 'Codestral 2405', value: 'codestral-2405' },
	// Ministral models
	{ name: 'Ministral 8B (Latest)', value: 'ministral-8b-latest' },
	{ name: 'Ministral 3B (Latest)', value: 'ministral-3b-latest' },
	// Open source models
	{ name: 'Pixtral Large (Latest)', value: 'pixtral-large-latest' },
	{ name: 'Pixtral 12B 2409', value: 'pixtral-12b-2409' },
	{ name: 'Open Mistral Nemo', value: 'open-mistral-nemo' },
	{ name: 'Open Mistral 7B', value: 'open-mistral-7b' },
	{ name: 'Open Mixtral 8x7B', value: 'open-mixtral-8x7b' },
	{ name: 'Open Mixtral 8x22B', value: 'open-mixtral-8x22b' },
];

export class LmChatMistralLangfuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Mistral Chat Model with Langfuse',
		name: 'lmChatMistralLangfuse',
		icon: { light: 'file:LmChatMistralLangfuseLight.icon.svg', dark: 'file:LmChatMistralLangfuseDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Mistral AI chat model with Langfuse tracing',
		defaults: {
			name: 'Mistral Chat Model with Langfuse',
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
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatmistralcloud/',
					},
				],
			},
		},

		inputs: [],
		outputs: ['ai_languageModel' as any],
		outputNames: ['Model'],
		credentials: [
			{ name: 'mistralApiWithLangfuseApi', required: true },
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
				options: MISTRAL_MODELS,
				default: 'mistral-small-latest',
				description: 'The Mistral model to use',
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
						displayName: 'Max Retries',
						name: 'maxRetries',
						default: 2,
						description: 'Maximum number of retries to attempt',
						type: 'number',
					},
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						default: 4096,
						description: 'The maximum number of tokens to generate in the response',
						type: 'number',
						typeOptions: {
							maxValue: 32768,
						},
					},
					{
						displayName: 'Random Seed',
						name: 'randomSeed',
						type: 'number',
						default: 0,
						description: 'Set a random seed for deterministic outputs (0 = disabled)',
					},
					{
						displayName: 'Safe Mode',
						name: 'safeMode',
						type: 'boolean',
						default: false,
						description: 'Whether to enable safe mode to filter potentially harmful content',
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
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 2 },
						description:
							'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('mistralApiWithLangfuseApi');

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
			maxTokens?: number;
			temperature?: number;
			topP?: number;
			safeMode?: boolean;
			randomSeed?: number;
			maxRetries?: number;
		};

		const model = new ChatMistralAI({
			apiKey: credentials.apiKey as string,
			model: modelName,
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 4096,
			topP: options.topP,
			safeMode: options.safeMode ?? false,
			randomSeed: options.randomSeed && options.randomSeed > 0 ? options.randomSeed : undefined,
			maxRetries: options.maxRetries ?? 2,
			callbacks: [lfHandler, new N8nLlmTracing(this)],
			metadata: customMetadata,
		});

		return {
			response: model,
		};
	}
}
