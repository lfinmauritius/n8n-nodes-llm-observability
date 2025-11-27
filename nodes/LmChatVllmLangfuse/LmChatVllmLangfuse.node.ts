import { ChatOpenAI } from '@langchain/openai';
import {
	jsonParse,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { CallbackHandler } from 'langfuse-langchain';
import { N8nLlmTracing } from '../LmChatOpenAiLangfuse/utils/N8nLlmTracing';

export class LmChatVllmLangfuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'vLLM Chat Model with Langfuse',
		name: 'lmChatVllmLangfuse',
		icon: { light: 'file:LmChatVllmLangfuseLight.icon.svg', dark: 'file:LmChatVllmLangfuseDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'vLLM chat model with Langfuse tracing - High-throughput LLM serving',
		defaults: {
			name: 'vLLM Chat Model with Langfuse',
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
						url: 'https://docs.vllm.ai/',
					},
				],
			},
		},

		inputs: [],
		outputs: ['ai_languageModel' as any],
		outputNames: ['Model'],
		credentials: [
			{ name: 'vllmApiWithLangfuseApi', required: true },
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
				default: '',
				description: 'The model name served by your vLLM instance',
				hint: 'e.g., meta-llama/Llama-3.1-8B-Instruct, mistralai/Mistral-7B-Instruct-v0.3',
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
							'Controls randomness: Lowering results in less random completions.',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 2 },
						description:
							'Controls diversity via nucleus sampling',
						type: 'number',
					},
					{
						displayName: 'Frequency Penalty',
						name: 'frequencyPenalty',
						default: 0,
						typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
						description:
							"Positive values penalize new tokens based on their existing frequency in the text",
						type: 'number',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						default: 0,
						typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
						description:
							"Positive values penalize new tokens based on whether they appear in the text so far",
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
						displayName: 'Timeout',
						name: 'timeout',
						default: 60000,
						description: 'Maximum amount of time a request is allowed to take in milliseconds',
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
		const credentials = await this.getCredentials('vllmApiWithLangfuseApi');

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
			frequencyPenalty?: number;
			presencePenalty?: number;
			stop?: string;
			timeout?: number;
			maxRetries?: number;
		};

		// Parse stop sequences
		const stopSequences = options.stop
			? options.stop.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
			: undefined;

		// vLLM uses OpenAI-compatible API
		const model = new ChatOpenAI({
			apiKey: (credentials.apiKey as string) || 'dummy-key', // vLLM may not require API key
			configuration: {
				baseURL: credentials.baseUrl as string,
			},
			model: modelName,
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 4096,
			topP: options.topP,
			frequencyPenalty: options.frequencyPenalty,
			presencePenalty: options.presencePenalty,
			stop: stopSequences,
			timeout: options.timeout ?? 60000,
			maxRetries: options.maxRetries ?? 2,
			callbacks: [lfHandler, new N8nLlmTracing(this)],
			metadata: customMetadata,
		});

		return {
			response: model,
		};
	}
}
