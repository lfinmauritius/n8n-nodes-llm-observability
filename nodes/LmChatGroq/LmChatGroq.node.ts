import { ChatGroq } from '@langchain/groq';
import {
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { N8nLlmTracing } from '../utils/N8nLlmTracing';

const GROQ_MODELS = [
	{ name: 'Llama 3.3 70B Versatile', value: 'llama-3.3-70b-versatile' },
	{ name: 'Llama 3.2 90B Vision Preview', value: 'llama-3.2-90b-vision-preview' },
	{ name: 'Llama 3.2 11B Vision Preview', value: 'llama-3.2-11b-vision-preview' },
	{ name: 'Llama 3.1 70B Versatile', value: 'llama-3.1-70b-versatile' },
	{ name: 'Llama 3.1 8B Instant', value: 'llama-3.1-8b-instant' },
	{ name: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
	{ name: 'Gemma 2 9B', value: 'gemma2-9b-it' },
];

export class LmChatGroq implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Groq Chat Model',
		name: 'lmChatGroq',
		icon: { light: 'file:LmChatGroqLight.icon.svg', dark: 'file:LmChatGroqDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Groq chat model - Ultra-fast LLM inference',
		defaults: { name: 'Groq Chat Model' },
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
		credentials: [{ name: 'groqApi', required: true }],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: GROQ_MODELS,
				default: 'llama-3.3-70b-versatile',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				options: [
					{ displayName: 'Max Tokens', name: 'maxTokens', type: 'number', default: 4096 },
					{ displayName: 'Temperature', name: 'temperature', type: 'number', default: 0.7, typeOptions: { maxValue: 2, minValue: 0 } },
					{ displayName: 'Top P', name: 'topP', type: 'number', default: 1, typeOptions: { maxValue: 1, minValue: 0 } },
					{ displayName: 'Stop Sequences', name: 'stop', type: 'string', default: '' },
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('groqApi');
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as any;

		const stopSequences = options.stop
			? options.stop.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
			: undefined;

		const model = new ChatGroq({
			apiKey: credentials.apiKey as string,
			model: modelName,
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 4096,
			topP: options.topP,
			stop: stopSequences,
			callbacks: [new N8nLlmTracing(this)],
		});

		return { response: model };
	}
}
