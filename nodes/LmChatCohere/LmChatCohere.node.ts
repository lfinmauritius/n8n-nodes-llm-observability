import { ChatCohere } from '@langchain/cohere';
import {
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { N8nLlmTracing } from '../utils/N8nLlmTracing';

const COHERE_MODELS = [
	{ name: 'Command R+ (Latest)', value: 'command-r-plus' },
	{ name: 'Command R (Latest)', value: 'command-r' },
	{ name: 'Command', value: 'command' },
	{ name: 'Command Light', value: 'command-light' },
	{ name: 'Command A 03-2025', value: 'command-a-03-2025' },
];

export class LmChatCohere implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cohere Chat Model',
		name: 'lmChatCohere',
		icon: { light: 'file:LmChatCohereLight.icon.svg', dark: 'file:LmChatCohereDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Cohere chat model',
		defaults: { name: 'Cohere Chat Model' },
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
		credentials: [{ name: 'cohereApi', required: true }],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: COHERE_MODELS,
				default: 'command-r-plus',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				options: [
					{ displayName: 'Temperature', name: 'temperature', type: 'number', default: 0.3 },
					{ displayName: 'Max Retries', name: 'maxRetries', type: 'number', default: 2 },
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('cohereApi');
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as any;

		const model = new ChatCohere({
			apiKey: credentials.apiKey as string,
			model: modelName,
			temperature: options.temperature ?? 0.3,
			maxRetries: options.maxRetries ?? 2,
			callbacks: [new N8nLlmTracing(this)],
		});

		return { response: model };
	}
}
