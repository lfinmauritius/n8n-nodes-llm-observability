import { ChatOpenAI } from '@langchain/openai';
import {
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { N8nLlmTracing } from '../utils/N8nLlmTracing';

const GROK_MODELS = [
	{ name: 'Grok 3 Beta', value: 'grok-3-beta' },
	{ name: 'Grok 3 Mini Beta', value: 'grok-3-mini-beta' },
	{ name: 'Grok 2', value: 'grok-2-1212' },
	{ name: 'Grok 2 Vision', value: 'grok-2-vision-1212' },
	{ name: 'Grok Beta', value: 'grok-beta' },
	{ name: 'Grok Vision Beta', value: 'grok-vision-beta' },
];

export class LmChatGrok implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Grok Chat Model (xAI)',
		name: 'lmChatGrok',
		icon: { light: 'file:LmChatGrokLight.icon.svg', dark: 'file:LmChatGrokDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'xAI Grok chat model',
		defaults: { name: 'Grok Chat Model (xAI)' },
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.x.ai/docs',
					},
				],
			},
		},

		inputs: [],
		outputs: ['ai_languageModel' as any],
		outputNames: ['Model'],
		credentials: [{ name: 'grokApi', required: true }],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: GROK_MODELS,
				default: 'grok-2-1212',
				description: 'The Grok model to use',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				options: [
					{ displayName: 'Frequency Penalty', name: 'frequencyPenalty', type: 'number', default: 0, typeOptions: { minValue: 0, maxValue: 2 } },
					{ displayName: 'Max Tokens', name: 'maxTokens', type: 'number', default: 4096 },
					{ displayName: 'Presence Penalty', name: 'presencePenalty', type: 'number', default: 0, typeOptions: { minValue: 0, maxValue: 2 } },
					{ displayName: 'Temperature', name: 'temperature', type: 'number', default: 0.7, typeOptions: { minValue: 0, maxValue: 2 } },
					{ displayName: 'Top P', name: 'topP', type: 'number', default: 1, typeOptions: { minValue: 0, maxValue: 1 } },
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('grokApi');
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			maxTokens?: number;
			temperature?: number;
			topP?: number;
			frequencyPenalty?: number;
			presencePenalty?: number;
		};

		// xAI uses OpenAI-compatible API
		const model = new ChatOpenAI({
			apiKey: credentials.apiKey as string,
			configuration: {
				baseURL: 'https://api.x.ai/v1',
			},
			model: modelName,
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 4096,
			topP: options.topP,
			frequencyPenalty: options.frequencyPenalty,
			presencePenalty: options.presencePenalty,
			callbacks: [new N8nLlmTracing(this)],
		});

		return { response: model };
	}
}
