import { AzureChatOpenAI } from '@langchain/openai';
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

export class LmChatAzureOpenAiLangfuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Azure OpenAI Chat Model with Langfuse',
		name: 'lmChatAzureOpenAiLangfuse',
		icon: { light: 'file:LmChatAzureOpenAiLangfuseLight.icon.svg', dark: 'file:LmChatAzureOpenAiLangfuseDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Azure OpenAI chat model with Langfuse tracing',
		defaults: {
			name: 'Azure OpenAI Chat Model with Langfuse',
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
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatazopenai/',
					},
				],
			},
		},

		inputs: [],
		outputs: ['ai_languageModel' as any],
		outputNames: ['Model'],
		credentials: [
			{ name: 'azureOpenAiApiWithLangfuseApi', required: true },
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
			// Deployment name (model)
			{
				displayName: 'Deployment Name',
				name: 'deploymentName',
				type: 'string',
				required: true,
				default: '',
				description: 'The name of your Azure OpenAI deployment (e.g., gpt-4, gpt-35-turbo)',
				hint: 'This is the deployment name you configured in Azure, not the model name',
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
						displayName: 'Frequency Penalty',
						name: 'frequencyPenalty',
						default: 0,
						typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
						description:
							"Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim",
						type: 'number',
					},
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						default: -1,
						description:
							'The maximum number of tokens to generate in the completion. Set to -1 to use the model default.',
						type: 'number',
						typeOptions: {
							maxValue: 128000,
						},
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						default: 0,
						typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
						description:
							"Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics",
						type: 'number',
					},
					{
						displayName: 'Response Format',
						name: 'responseFormat',
						default: 'text',
						type: 'options',
						options: [
							{
								name: 'Text',
								value: 'text',
								description: 'Regular text response',
							},
							{
								name: 'JSON',
								value: 'json_object',
								description:
									'Enables JSON mode, which should guarantee the message the model generates is valid JSON',
							},
						],
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
						displayName: 'Timeout',
						name: 'timeout',
						default: 60000,
						description: 'Maximum amount of time a request is allowed to take in milliseconds',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description:
							'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. We generally recommend altering this or temperature but not both.',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('azureOpenAiApiWithLangfuseApi');

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

		const deploymentName = this.getNodeParameter('deploymentName', itemIndex) as string;

		const options = this.getNodeParameter('options', itemIndex, {}) as {
			frequencyPenalty?: number;
			maxTokens?: number;
			presencePenalty?: number;
			temperature?: number;
			topP?: number;
			timeout?: number;
			responseFormat?: 'text' | 'json_object';
		};

		// Build Azure endpoint
		const azureEndpoint = (credentials.endpoint as string) ||
			`https://${credentials.resourceName}.openai.azure.com`;

		// Model kwargs for advanced options
		const modelKwargs: Record<string, any> = {};
		if (options.responseFormat) {
			modelKwargs.response_format = { type: options.responseFormat };
		}

		// Get proxy agent
		const proxyAgent = getProxyAgent(azureEndpoint);

		const model = new AzureChatOpenAI({
			azureOpenAIApiKey: credentials.apiKey as string,
			azureOpenAIApiInstanceName: credentials.resourceName as string,
			azureOpenAIApiDeploymentName: deploymentName,
			azureOpenAIApiVersion: credentials.apiVersion as string,
			azureOpenAIEndpoint: azureEndpoint,
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens !== -1 ? options.maxTokens : undefined,
			frequencyPenalty: options.frequencyPenalty,
			presencePenalty: options.presencePenalty,
			topP: options.topP,
			timeout: options.timeout ?? 60000,
			callbacks: [lfHandler, new N8nLlmTracing(this)],
			metadata: customMetadata,
			modelKwargs: Object.keys(modelKwargs).length > 0 ? modelKwargs : undefined,
			configuration: {
				httpAgent: proxyAgent,
			} as any,
		});

		return {
			response: model,
		};
	}
}
