import { ChatGroq } from '@langchain/groq';
import {
	jsonParse,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { CallbackHandler } from 'langfuse-langchain';
import { N8nLlmTracing } from '../LmChatOpenAiLangfuse/utils/N8nLlmTracing';

const GROQ_MODELS = [
	// Llama 3.3 models
	{ name: 'Llama 3.3 70B Versatile', value: 'llama-3.3-70b-versatile' },
	// Llama 3.2 models
	{ name: 'Llama 3.2 90B Vision Preview', value: 'llama-3.2-90b-vision-preview' },
	{ name: 'Llama 3.2 11B Vision Preview', value: 'llama-3.2-11b-vision-preview' },
	{ name: 'Llama 3.2 3B Preview', value: 'llama-3.2-3b-preview' },
	{ name: 'Llama 3.2 1B Preview', value: 'llama-3.2-1b-preview' },
	// Llama 3.1 models
	{ name: 'Llama 3.1 70B Versatile', value: 'llama-3.1-70b-versatile' },
	{ name: 'Llama 3.1 8B Instant', value: 'llama-3.1-8b-instant' },
	// Llama 3 models
	{ name: 'Llama 3 70B', value: 'llama3-70b-8192' },
	{ name: 'Llama 3 8B', value: 'llama3-8b-8192' },
	// Mixtral models
	{ name: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
	// Gemma models
	{ name: 'Gemma 2 9B', value: 'gemma2-9b-it' },
	{ name: 'Gemma 7B', value: 'gemma-7b-it' },
];

export class LmChatGroqLangfuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Groq Chat Model with Langfuse',
		name: 'lmChatGroqLangfuse',
		icon: { light: 'file:LmChatGroqLangfuseLight.icon.svg', dark: 'file:LmChatGroqLangfuseDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Groq chat model with Langfuse tracing - Ultra-fast LLM inference',
		defaults: {
			name: 'Groq Chat Model with Langfuse',
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
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatgroq/',
					},
				],
			},
		},

		inputs: [],
		outputs: ['ai_languageModel' as any],
		outputNames: ['Model'],
		credentials: [
			{ name: 'groqApiWithLangfuseApi', required: true },
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
				options: GROQ_MODELS,
				default: 'llama-3.3-70b-versatile',
				description: 'The Groq model to use',
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
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.7,
						typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
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
					{
						displayName: 'Stop Sequences',
						name: 'stop',
						type: 'string',
						default: '',
						description: 'Comma-separated list of sequences where the API will stop generating further tokens',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('groqApiWithLangfuseApi');

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
			stop?: string;
		};

		// Parse stop sequences
		const stopSequences = options.stop
			? options.stop.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
			: undefined;

		const model = new ChatGroq({
			apiKey: credentials.apiKey as string,
			model: modelName,
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 4096,
			topP: options.topP,
			stop: stopSequences,
			callbacks: [lfHandler, new N8nLlmTracing(this)],
			metadata: customMetadata,
		});

		return {
			response: model,
		};
	}
}
