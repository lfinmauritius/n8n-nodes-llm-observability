import { ChatCohere } from '@langchain/cohere';
import {
	jsonParse,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { CallbackHandler } from 'langfuse-langchain';
import { N8nLlmTracing } from '../LmChatOpenAiLangfuse/utils/N8nLlmTracing';

const COHERE_MODELS = [
	// Command R+ models
	{ name: 'Command R+ (Latest)', value: 'command-r-plus' },
	{ name: 'Command R+ 08-2024', value: 'command-r-plus-08-2024' },
	{ name: 'Command R+ 04-2024', value: 'command-r-plus-04-2024' },
	// Command R models
	{ name: 'Command R (Latest)', value: 'command-r' },
	{ name: 'Command R 08-2024', value: 'command-r-08-2024' },
	{ name: 'Command R 03-2024', value: 'command-r-03-2024' },
	// Command models
	{ name: 'Command', value: 'command' },
	{ name: 'Command Nightly', value: 'command-nightly' },
	{ name: 'Command Light', value: 'command-light' },
	{ name: 'Command Light Nightly', value: 'command-light-nightly' },
	// Command A models
	{ name: 'Command A 03-2025', value: 'command-a-03-2025' },
];

export class LmChatCohereLangfuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cohere Chat Model with Langfuse',
		name: 'lmChatCohereLangfuse',
		icon: { light: 'file:LmChatCohereLangfuseLight.icon.svg', dark: 'file:LmChatCohereLangfuseDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Cohere chat model with Langfuse tracing',
		defaults: {
			name: 'Cohere Chat Model with Langfuse',
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
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatcohere/',
					},
				],
			},
		},

		inputs: [],
		outputs: ['ai_languageModel' as any],
		outputNames: ['Model'],
		credentials: [
			{ name: 'cohereApiWithLangfuseApi', required: true },
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
				options: COHERE_MODELS,
				default: 'command-r-plus',
				description: 'The Cohere model to use',
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
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.3,
						typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
						description:
							'Controls randomness: Lowering results in less random completions. Cohere recommends lower temperatures (0.0-0.3) for more focused outputs.',
						type: 'number',
					},
					{
						displayName: 'Max Retries',
						name: 'maxRetries',
						default: 2,
						description: 'Maximum number of retries to attempt',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('cohereApiWithLangfuseApi');

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
			temperature?: number;
			maxRetries?: number;
		};

		const model = new ChatCohere({
			apiKey: credentials.apiKey as string,
			model: modelName,
			temperature: options.temperature ?? 0.3,
			maxRetries: options.maxRetries ?? 2,
			callbacks: [lfHandler, new N8nLlmTracing(this)],
			metadata: customMetadata,
		});

		return {
			response: model,
		};
	}
}
