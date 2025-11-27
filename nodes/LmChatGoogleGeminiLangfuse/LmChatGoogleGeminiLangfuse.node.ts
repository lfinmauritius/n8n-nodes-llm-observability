import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
	jsonParse,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { CallbackHandler } from 'langfuse-langchain';
import { N8nLlmTracing } from '../LmChatOpenAiLangfuse/utils/N8nLlmTracing';

const GEMINI_MODELS = [
	// Gemini 2.5 models
	{ name: 'Gemini 2.5 Flash Preview', value: 'gemini-2.5-flash-preview-05-20' },
	{ name: 'Gemini 2.5 Pro Preview', value: 'gemini-2.5-pro-preview-05-06' },
	// Gemini 2.0 models
	{ name: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
	{ name: 'Gemini 2.0 Flash-Lite', value: 'gemini-2.0-flash-lite' },
	{ name: 'Gemini 2.0 Flash Thinking (Experimental)', value: 'gemini-2.0-flash-thinking-exp' },
	// Gemini 1.5 models
	{ name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
	{ name: 'Gemini 1.5 Flash-8B', value: 'gemini-1.5-flash-8b' },
	{ name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
	// Legacy models
	{ name: 'Gemini 1.0 Pro', value: 'gemini-1.0-pro' },
];

// Safety setting options
const SAFETY_CATEGORIES = [
	{ name: 'Harassment', value: 'HARM_CATEGORY_HARASSMENT' },
	{ name: 'Hate Speech', value: 'HARM_CATEGORY_HATE_SPEECH' },
	{ name: 'Sexually Explicit', value: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' },
	{ name: 'Dangerous Content', value: 'HARM_CATEGORY_DANGEROUS_CONTENT' },
];

const SAFETY_THRESHOLDS = [
	{ name: 'Block None', value: 'BLOCK_NONE' },
	{ name: 'Block Low and Above', value: 'BLOCK_LOW_AND_ABOVE' },
	{ name: 'Block Medium and Above', value: 'BLOCK_MEDIUM_AND_ABOVE' },
	{ name: 'Block High Only', value: 'BLOCK_ONLY_HIGH' },
];

export class LmChatGoogleGeminiLangfuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Gemini Chat Model with Langfuse',
		name: 'lmChatGoogleGeminiLangfuse',
		icon: { light: 'file:LmChatGoogleGeminiLangfuseLight.icon.svg', dark: 'file:LmChatGoogleGeminiLangfuseDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Google Gemini chat model with Langfuse tracing',
		defaults: {
			name: 'Google Gemini Chat Model with Langfuse',
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
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatgooglegemini/',
					},
				],
			},
		},

		inputs: [],
		outputs: ['ai_languageModel' as any],
		outputNames: ['Model'],
		credentials: [
			{ name: 'googleGeminiApiWithLangfuseApi', required: true },
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
				options: GEMINI_MODELS,
				default: 'gemini-2.0-flash',
				description: 'The Google Gemini model to use',
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
						displayName: 'Maximum Output Tokens',
						name: 'maxOutputTokens',
						default: 2048,
						description: 'The maximum number of tokens to generate in the response',
						type: 'number',
						typeOptions: {
							maxValue: 8192,
						},
					},
					{
						displayName: 'Safety Settings',
						name: 'safetySettings',
						type: 'fixedCollection',
						default: { values: [] },
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								name: 'values',
								displayName: 'Safety Setting',
								values: [
									{
										displayName: 'Category',
										name: 'category',
										type: 'options',
										options: SAFETY_CATEGORIES,
										default: 'HARM_CATEGORY_HARASSMENT',
									},
									{
										displayName: 'Threshold',
										name: 'threshold',
										type: 'options',
										options: SAFETY_THRESHOLDS,
										default: 'BLOCK_MEDIUM_AND_ABOVE',
									},
								],
							},
						],
						description: 'Configure safety settings to block certain types of content',
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
						displayName: 'Top K',
						name: 'topK',
						default: 40,
						typeOptions: { minValue: 1 },
						description:
							'The number of highest probability vocabulary tokens to keep for top-k filtering',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 0.95,
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
		const credentials = await this.getCredentials('googleGeminiApiWithLangfuseApi');

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
			maxOutputTokens?: number;
			temperature?: number;
			topK?: number;
			topP?: number;
			safetySettings?: {
				values: Array<{
					category: string;
					threshold: string;
				}>;
			};
		};

		// Build safety settings
		const safetySettings = options.safetySettings?.values?.map((setting) => ({
			category: setting.category,
			threshold: setting.threshold,
		}));

		const model = new ChatGoogleGenerativeAI({
			apiKey: credentials.apiKey as string,
			model: modelName,
			temperature: options.temperature ?? 0.7,
			maxOutputTokens: options.maxOutputTokens ?? 2048,
			topK: options.topK ?? 40,
			topP: options.topP ?? 0.95,
			safetySettings: safetySettings && safetySettings.length > 0 ? safetySettings as any : undefined,
			callbacks: [lfHandler, new N8nLlmTracing(this)],
			metadata: customMetadata,
		});

		return {
			response: model,
		};
	}
}
