import { ChatOpenAI } from '@langchain/openai';
import {
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { N8nLlmTracing } from '../utils/N8nLlmTracing';

export class LmChatVllm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'vLLM Chat Model',
		name: 'lmChatVllm',
		icon: { light: 'file:LmChatVllmLight.icon.svg', dark: 'file:LmChatVllmDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'vLLM chat model - High-throughput LLM serving',
		defaults: { name: 'vLLM Chat Model' },
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
		credentials: [{ name: 'vllmApi', required: true }],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				required: true,
				default: '',
				hint: 'e.g., meta-llama/Llama-3.1-8B-Instruct',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				options: [
					{ displayName: 'Frequency Penalty', name: 'frequencyPenalty', type: 'number', default: 0 },
					{ displayName: 'Max Retries', name: 'maxRetries', type: 'number', default: 2 },
					{ displayName: 'Max Tokens', name: 'maxTokens', type: 'number', default: 4096 },
					{ displayName: 'Presence Penalty', name: 'presencePenalty', type: 'number', default: 0 },
					{ displayName: 'Stop Sequences', name: 'stop', type: 'string', default: '' },
					{ displayName: 'Temperature', name: 'temperature', type: 'number', default: 0.7 },
					{ displayName: 'Timeout', name: 'timeout', type: 'number', default: 60000 },
					{ displayName: 'Top P', name: 'topP', type: 'number', default: 1 },
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('vllmApi');
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as any;

		const stopSequences = options.stop
			? options.stop.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
			: undefined;

		const model = new ChatOpenAI({
			apiKey: (credentials.apiKey as string) || 'dummy-key',
			configuration: { baseURL: credentials.baseUrl as string },
			model: modelName,
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 4096,
			topP: options.topP,
			frequencyPenalty: options.frequencyPenalty,
			presencePenalty: options.presencePenalty,
			stop: stopSequences,
			timeout: options.timeout ?? 60000,
			maxRetries: options.maxRetries ?? 2,
			callbacks: [new N8nLlmTracing(this)],
		});

		return { response: model };
	}
}
