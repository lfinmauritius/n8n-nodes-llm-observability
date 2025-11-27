import { ChatBedrockConverse } from '@langchain/aws';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import {
	jsonParse,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { CallbackHandler } from 'langfuse-langchain';
import { N8nLlmTracing } from '../LmChatOpenAiLangfuse/utils/N8nLlmTracing';

const BEDROCK_MODELS = [
	// Amazon Titan models
	{ name: 'Amazon Titan Text G1 - Express', value: 'amazon.titan-text-express-v1' },
	{ name: 'Amazon Titan Text G1 - Lite', value: 'amazon.titan-text-lite-v1' },
	{ name: 'Amazon Titan Text Premier', value: 'amazon.titan-text-premier-v1:0' },
	// Anthropic Claude models
	{ name: 'Claude 3.5 Sonnet v2', value: 'anthropic.claude-3-5-sonnet-20241022-v2:0' },
	{ name: 'Claude 3.5 Sonnet', value: 'anthropic.claude-3-5-sonnet-20240620-v1:0' },
	{ name: 'Claude 3.5 Haiku', value: 'anthropic.claude-3-5-haiku-20241022-v1:0' },
	{ name: 'Claude 3 Opus', value: 'anthropic.claude-3-opus-20240229-v1:0' },
	{ name: 'Claude 3 Sonnet', value: 'anthropic.claude-3-sonnet-20240229-v1:0' },
	{ name: 'Claude 3 Haiku', value: 'anthropic.claude-3-haiku-20240307-v1:0' },
	{ name: 'Claude Instant', value: 'anthropic.claude-instant-v1' },
	{ name: 'Claude v2.1', value: 'anthropic.claude-v2:1' },
	{ name: 'Claude v2', value: 'anthropic.claude-v2' },
	// Meta Llama models
	{ name: 'Llama 3.2 90B Instruct', value: 'meta.llama3-2-90b-instruct-v1:0' },
	{ name: 'Llama 3.2 11B Instruct', value: 'meta.llama3-2-11b-instruct-v1:0' },
	{ name: 'Llama 3.2 3B Instruct', value: 'meta.llama3-2-3b-instruct-v1:0' },
	{ name: 'Llama 3.2 1B Instruct', value: 'meta.llama3-2-1b-instruct-v1:0' },
	{ name: 'Llama 3.1 405B Instruct', value: 'meta.llama3-1-405b-instruct-v1:0' },
	{ name: 'Llama 3.1 70B Instruct', value: 'meta.llama3-1-70b-instruct-v1:0' },
	{ name: 'Llama 3.1 8B Instruct', value: 'meta.llama3-1-8b-instruct-v1:0' },
	{ name: 'Llama 3 70B Instruct', value: 'meta.llama3-70b-instruct-v1:0' },
	{ name: 'Llama 3 8B Instruct', value: 'meta.llama3-8b-instruct-v1:0' },
	// Mistral models
	{ name: 'Mistral Large 2 (24.07)', value: 'mistral.mistral-large-2407-v1:0' },
	{ name: 'Mistral Large (24.02)', value: 'mistral.mistral-large-2402-v1:0' },
	{ name: 'Mistral Small (24.02)', value: 'mistral.mistral-small-2402-v1:0' },
	{ name: 'Mixtral 8x7B Instruct', value: 'mistral.mixtral-8x7b-instruct-v0:1' },
	{ name: 'Mistral 7B Instruct', value: 'mistral.mistral-7b-instruct-v0:2' },
	// Cohere models
	{ name: 'Cohere Command R+', value: 'cohere.command-r-plus-v1:0' },
	{ name: 'Cohere Command R', value: 'cohere.command-r-v1:0' },
	{ name: 'Cohere Command', value: 'cohere.command-text-v14' },
	{ name: 'Cohere Command Light', value: 'cohere.command-light-text-v14' },
	// AI21 Labs models
	{ name: 'AI21 Jamba 1.5 Large', value: 'ai21.jamba-1-5-large-v1:0' },
	{ name: 'AI21 Jamba 1.5 Mini', value: 'ai21.jamba-1-5-mini-v1:0' },
	{ name: 'AI21 Jamba Instruct', value: 'ai21.jamba-instruct-v1:0' },
	{ name: 'AI21 Jurassic-2 Ultra', value: 'ai21.j2-ultra-v1' },
	{ name: 'AI21 Jurassic-2 Mid', value: 'ai21.j2-mid-v1' },
];

export class LmChatAwsBedrockLangfuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AWS Bedrock Chat Model with Langfuse',
		name: 'lmChatAwsBedrockLangfuse',
		icon: { light: 'file:LmChatAwsBedrockLangfuseLight.icon.svg', dark: 'file:LmChatAwsBedrockLangfuseDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'AWS Bedrock chat model with Langfuse tracing',
		defaults: {
			name: 'AWS Bedrock Chat Model with Langfuse',
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
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatawsbedrock/',
					},
				],
			},
		},

		inputs: [],
		outputs: ['ai_languageModel' as any],
		outputNames: ['Model'],
		credentials: [
			{ name: 'awsBedrockApiWithLangfuseApi', required: true },
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
				options: BEDROCK_MODELS,
				default: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
				description: 'The AWS Bedrock model to use',
			},
			// Custom model ID option
			{
				displayName: 'Use Custom Model ID',
				name: 'useCustomModel',
				type: 'boolean',
				default: false,
				description: 'Whether to use a custom model ID (for inference profiles or new models)',
			},
			{
				displayName: 'Custom Model ID',
				name: 'customModelId',
				type: 'string',
				default: '',
				description: 'Custom model ID or inference profile ARN',
				displayOptions: {
					show: {
						useCustomModel: [true],
					},
				},
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
						default: 2000,
						description: 'The maximum number of tokens to generate in the response',
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
						displayName: 'Top P',
						name: 'topP',
						default: 1,
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
		const credentials = await this.getCredentials('awsBedrockApiWithLangfuseApi');

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

		// Get model ID
		const useCustomModel = this.getNodeParameter('useCustomModel', itemIndex) as boolean;
		const modelId = useCustomModel
			? (this.getNodeParameter('customModelId', itemIndex) as string)
			: (this.getNodeParameter('model', itemIndex) as string);

		const options = this.getNodeParameter('options', itemIndex, {}) as {
			maxTokens?: number;
			temperature?: number;
			topP?: number;
		};

		// Create AWS Bedrock client with credentials
		const bedrockClient = new BedrockRuntimeClient({
			region: credentials.region as string,
			credentials: {
				accessKeyId: credentials.accessKeyId as string,
				secretAccessKey: credentials.secretAccessKey as string,
				...(credentials.sessionToken && { sessionToken: credentials.sessionToken as string }),
			},
		});

		const model = new ChatBedrockConverse({
			client: bedrockClient,
			model: modelId,
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 2000,
			topP: options.topP,
			callbacks: [lfHandler, new N8nLlmTracing(this)],
			metadata: customMetadata,
		});

		return {
			response: model,
		};
	}
}
