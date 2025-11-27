import { ChatOllama } from '@langchain/ollama';
import {
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { N8nLlmTracing } from '../utils/N8nLlmTracing';

export class LmChatOllama implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ollama Chat Model',
		name: 'lmChatOllama',
		icon: { light: 'file:LmChatOllamaLight.icon.svg', dark: 'file:LmChatOllamaDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Ollama local chat model',
		defaults: { name: 'Ollama Chat Model' },
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
		credentials: [{ name: 'ollamaApi', required: true }],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				required: true,
				default: 'llama3.2',
				hint: 'Make sure this model is pulled on your Ollama instance',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				options: [
					{ displayName: 'Context Tokens', name: 'numCtx', type: 'number', default: 4096 },
					{ displayName: 'Format', name: 'format', type: 'options', options: [{ name: 'Default', value: 'default' }, { name: 'JSON', value: 'json' }], default: 'default' },
					{ displayName: 'Keep Alive', name: 'keepAlive', type: 'string', default: '5m' },
					{ displayName: 'Predict Tokens', name: 'numPredict', type: 'number', default: -1 },
					{ displayName: 'Repeat Penalty', name: 'repeatPenalty', type: 'number', default: 1.1 },
					{ displayName: 'Stop Sequences', name: 'stop', type: 'string', default: '' },
					{ displayName: 'Temperature', name: 'temperature', type: 'number', default: 0.7 },
					{ displayName: 'Top K', name: 'topK', type: 'number', default: 40 },
					{ displayName: 'Top P', name: 'topP', type: 'number', default: 0.9 },
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('ollamaApi');
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as any;

		const headers: Record<string, string> = {};
		if (credentials.apiKey) {
			headers['Authorization'] = `Bearer ${credentials.apiKey}`;
		}

		const stopSequences = options.stop
			? options.stop.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
			: undefined;

		const model = new ChatOllama({
			baseUrl: credentials.baseUrl as string,
			model: modelName,
			numCtx: options.numCtx ?? 4096,
			numPredict: options.numPredict !== -1 ? options.numPredict : undefined,
			temperature: options.temperature ?? 0.7,
			topK: options.topK ?? 40,
			topP: options.topP ?? 0.9,
			repeatPenalty: options.repeatPenalty ?? 1.1,
			stop: stopSequences,
			format: options.format === 'json' ? 'json' : undefined,
			keepAlive: options.keepAlive ?? '5m',
			headers,
			callbacks: [new N8nLlmTracing(this)],
		});

		return { response: model };
	}
}
