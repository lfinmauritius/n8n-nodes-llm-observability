import { ChatMistralAI } from '@langchain/mistralai';
import {
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { N8nLlmTracing } from '../LmChatOpenAiLangfuse/utils/N8nLlmTracing';

const MISTRAL_MODELS = [
	{ name: 'Mistral Large (Latest)', value: 'mistral-large-latest' },
	{ name: 'Mistral Small (Latest)', value: 'mistral-small-latest' },
	{ name: 'Codestral (Latest)', value: 'codestral-latest' },
	{ name: 'Ministral 8B (Latest)', value: 'ministral-8b-latest' },
	{ name: 'Pixtral Large (Latest)', value: 'pixtral-large-latest' },
	{ name: 'Open Mistral Nemo', value: 'open-mistral-nemo' },
	{ name: 'Open Mixtral 8x7B', value: 'open-mixtral-8x7b' },
];

export class LmChatMistral implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Mistral Chat Model',
		name: 'lmChatMistral',
		icon: { light: 'file:LmChatMistralLight.icon.svg', dark: 'file:LmChatMistralDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Mistral AI chat model',
		defaults: { name: 'Mistral Chat Model' },
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
		},

		inputs: [],
		outputs: ['ai_languageModel' as any],
		outputNames: ['Model'],
		credentials: [{ name: 'mistralApi', required: true }],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: MISTRAL_MODELS,
				default: 'mistral-small-latest',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				options: [
					{ displayName: 'Max Retries', name: 'maxRetries', type: 'number', default: 2 },
					{ displayName: 'Max Tokens', name: 'maxTokens', type: 'number', default: 4096 },
					{ displayName: 'Safe Mode', name: 'safeMode', type: 'boolean', default: false },
					{ displayName: 'Temperature', name: 'temperature', type: 'number', default: 0.7, typeOptions: { maxValue: 1, minValue: 0 } },
					{ displayName: 'Top P', name: 'topP', type: 'number', default: 1 },
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('mistralApi');
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as any;

		const model = new ChatMistralAI({
			apiKey: credentials.apiKey as string,
			model: modelName,
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 4096,
			topP: options.topP,
			safeMode: options.safeMode ?? false,
			maxRetries: options.maxRetries ?? 2,
			callbacks: [new N8nLlmTracing(this)],
		});

		return { response: model };
	}
}
