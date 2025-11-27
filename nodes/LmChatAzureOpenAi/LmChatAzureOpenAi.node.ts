import { AzureChatOpenAI } from '@langchain/openai';
import {
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { N8nLlmTracing } from '../utils/N8nLlmTracing';
import { getProxyAgent } from '../utils/httpProxyAgent';

export class LmChatAzureOpenAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Azure OpenAI Chat Model',
		name: 'lmChatAzureOpenAi',
		icon: { light: 'file:LmChatAzureOpenAiLight.icon.svg', dark: 'file:LmChatAzureOpenAiDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Azure OpenAI chat model',
		defaults: { name: 'Azure OpenAI Chat Model' },
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
		credentials: [{ name: 'azureOpenAiApi', required: true }],
		properties: [
			{
				displayName: 'Deployment Name',
				name: 'deploymentName',
				type: 'string',
				required: true,
				default: '',
				description: 'The name of your Azure OpenAI deployment',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				options: [
					{ displayName: 'Frequency Penalty', name: 'frequencyPenalty', type: 'number', default: 0 },
					{ displayName: 'Max Tokens', name: 'maxTokens', type: 'number', default: -1 },
					{ displayName: 'Presence Penalty', name: 'presencePenalty', type: 'number', default: 0 },
					{ displayName: 'Response Format', name: 'responseFormat', type: 'options', options: [{ name: 'Text', value: 'text' }, { name: 'JSON', value: 'json_object' }], default: 'text' },
					{ displayName: 'Temperature', name: 'temperature', type: 'number', default: 0.7 },
					{ displayName: 'Timeout', name: 'timeout', type: 'number', default: 60000 },
					{ displayName: 'Top P', name: 'topP', type: 'number', default: 1 },
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('azureOpenAiApi');
		const deploymentName = this.getNodeParameter('deploymentName', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as any;

		const azureEndpoint = (credentials.endpoint as string) ||
			`https://${credentials.resourceName}.openai.azure.com`;

		const modelKwargs: Record<string, any> = {};
		if (options.responseFormat) {
			modelKwargs.response_format = { type: options.responseFormat };
		}

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
			callbacks: [new N8nLlmTracing(this)],
			modelKwargs: Object.keys(modelKwargs).length > 0 ? modelKwargs : undefined,
			configuration: { httpAgent: proxyAgent } as any,
		});

		return { response: model };
	}
}
