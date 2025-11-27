import { ChatOllama } from '@langchain/ollama';
import {
	jsonParse,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { CallbackHandler } from 'langfuse-langchain';
import { N8nLlmTracing } from '../LmChatOpenAiLangfuse/utils/N8nLlmTracing';

export class LmChatOllamaLangfuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ollama Chat Model with Langfuse',
		name: 'lmChatOllamaLangfuse',
		icon: { light: 'file:LmChatOllamaLangfuseLight.icon.svg', dark: 'file:LmChatOllamaLangfuseDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Ollama local chat model with Langfuse tracing',
		defaults: {
			name: 'Ollama Chat Model with Langfuse',
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
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatollama/',
					},
				],
			},
		},

		inputs: [],
		outputs: ['ai_languageModel' as any],
		outputNames: ['Model'],
		credentials: [
			{ name: 'ollamaApiWithLangfuseApi', required: true },
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
			// Model name
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				required: true,
				default: 'llama3.2',
				description: 'The Ollama model to use (e.g., llama3.2, mistral, codellama, phi3)',
				hint: 'Make sure this model is pulled on your Ollama instance',
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
						displayName: 'Format',
						name: 'format',
						type: 'options',
						options: [
							{ name: 'Default', value: 'default' },
							{ name: 'JSON', value: 'json' },
						],
						default: 'default',
						description: 'The format to return the response in',
					},
					{
						displayName: 'Keep Alive',
						name: 'keepAlive',
						type: 'string',
						default: '5m',
						description: 'How long to keep the model loaded (e.g., 5m, 1h, -1 for forever)',
					},
					{
						displayName: 'Number of Context Tokens',
						name: 'numCtx',
						default: 4096,
						description: 'The number of context tokens to use',
						type: 'number',
					},
					{
						displayName: 'Number of Predict Tokens',
						name: 'numPredict',
						default: -1,
						description: 'Maximum number of tokens to predict (-1 = infinite)',
						type: 'number',
					},
					{
						displayName: 'Repeat Penalty',
						name: 'repeatPenalty',
						default: 1.1,
						typeOptions: { minValue: 0, numberPrecision: 2 },
						description: 'Penalizes repetitions in the output',
						type: 'number',
					},
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.7,
						typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
						description: 'Controls randomness: Lowering results in less random completions',
						type: 'number',
					},
					{
						displayName: 'Stop Sequences',
						name: 'stop',
						type: 'string',
						default: '',
						description: 'Comma-separated list of sequences where generation will stop',
					},
					{
						displayName: 'Top K',
						name: 'topK',
						default: 40,
						typeOptions: { minValue: 1 },
						description:
							'The number of highest probability tokens to keep for top-k filtering',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 0.9,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 2 },
						description:
							'Controls diversity via nucleus sampling',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('ollamaApiWithLangfuseApi');

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
			numCtx?: number;
			numPredict?: number;
			temperature?: number;
			topK?: number;
			topP?: number;
			repeatPenalty?: number;
			stop?: string;
			format?: 'default' | 'json';
			keepAlive?: string;
		};

		// Build headers with optional API key
		const headers: Record<string, string> = {};
		if (credentials.apiKey) {
			headers['Authorization'] = `Bearer ${credentials.apiKey}`;
		}

		// Parse stop sequences
		const stopSequences = options.stop
			? options.stop.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
			: undefined;

		const model = new ChatOllama({
			baseUrl: credentials.baseUrl as string,
			model: modelName,
			numCtx: options.numCtx ?? 4096,
			numPredict: options.numPredict !== -1 ? options.numPredict : undefined,
			temperature: options.temperature ?? 0.7,
			topK: options.topK ?? 40,
			topP: options.topP ?? 0.9,
			repeatPenalty: options.repeatPenalty ?? 1.1,
			stop: stopSequences,
			format: options.format === 'json' ? 'json' : undefined,
			keepAlive: options.keepAlive ?? '5m',
			headers,
			callbacks: [lfHandler, new N8nLlmTracing(this)],
			metadata: customMetadata,
		});

		return {
			response: model,
		};
	}
}
