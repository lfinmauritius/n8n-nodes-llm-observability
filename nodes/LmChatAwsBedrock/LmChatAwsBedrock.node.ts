import { ChatBedrockConverse } from '@langchain/aws';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import {
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { N8nLlmTracing } from '../utils/N8nLlmTracing';

const BEDROCK_MODELS = [
	{ name: 'Claude 3.5 Sonnet V2', value: 'anthropic.claude-3-5-sonnet-20241022-v2:0' },
	{ name: 'Claude 3.5 Haiku', value: 'anthropic.claude-3-5-haiku-20241022-v1:0' },
	{ name: 'Claude 3 Opus', value: 'anthropic.claude-3-opus-20240229-v1:0' },
	{ name: 'Llama 3.2 90B Instruct', value: 'meta.llama3-2-90b-instruct-v1:0' },
	{ name: 'Llama 3.1 70B Instruct', value: 'meta.llama3-1-70b-instruct-v1:0' },
	{ name: 'Mistral Large 2', value: 'mistral.mistral-large-2407-v1:0' },
	{ name: 'Amazon Titan Text Premier', value: 'amazon.titan-text-premier-v1:0' },
];

export class LmChatAwsBedrock implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AWS Bedrock Chat Model',
		name: 'lmChatAwsBedrock',
		icon: { light: 'file:LmChatAwsBedrockLight.icon.svg', dark: 'file:LmChatAwsBedrockDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'AWS Bedrock chat model',
		defaults: { name: 'AWS Bedrock Chat Model' },
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
		},

		inputs: [],
		outputs: ['ai_languageModel_llmObs' as any],
		outputNames: ['Model'],
		credentials: [{ name: 'awsBedrockApi', required: true }],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: BEDROCK_MODELS,
				default: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
			},
			{
				displayName: 'Use Custom Model ID',
				name: 'useCustomModel',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Custom Model ID',
				name: 'customModelId',
				type: 'string',
				default: '',
				displayOptions: { show: { useCustomModel: [true] } },
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				options: [
					{ displayName: 'Max Tokens', name: 'maxTokens', type: 'number', default: 2000 },
					{ displayName: 'Temperature', name: 'temperature', type: 'number', default: 0.7 },
					{ displayName: 'Top P', name: 'topP', type: 'number', default: 1 },
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('awsBedrockApi');

		const useCustomModel = this.getNodeParameter('useCustomModel', itemIndex) as boolean;
		const modelId = useCustomModel
			? (this.getNodeParameter('customModelId', itemIndex) as string)
			: (this.getNodeParameter('model', itemIndex) as string);

		const options = this.getNodeParameter('options', itemIndex, {}) as any;

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
			callbacks: [new N8nLlmTracing(this)],
		});

		return { response: model };
	}
}
