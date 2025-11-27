import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { N8nLlmTracing } from '../LmChatOpenAiLangfuse/utils/N8nLlmTracing';

const GEMINI_MODELS = [
	{ name: 'Gemini 2.5 Flash Preview', value: 'gemini-2.5-flash-preview-05-20' },
	{ name: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
	{ name: 'Gemini 2.0 Flash-Lite', value: 'gemini-2.0-flash-lite' },
	{ name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
	{ name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
];

export class LmChatGoogleGemini implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Gemini Chat Model',
		name: 'lmChatGoogleGemini',
		icon: { light: 'file:LmChatGoogleGeminiLight.icon.svg', dark: 'file:LmChatGoogleGeminiDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Google Gemini chat model',
		defaults: { name: 'Google Gemini Chat Model' },
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
		credentials: [{ name: 'googleGeminiApi', required: true }],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: GEMINI_MODELS,
				default: 'gemini-2.0-flash',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				options: [
					{ displayName: 'Max Output Tokens', name: 'maxOutputTokens', type: 'number', default: 2048 },
					{ displayName: 'Temperature', name: 'temperature', type: 'number', default: 0.7 },
					{ displayName: 'Top K', name: 'topK', type: 'number', default: 40 },
					{ displayName: 'Top P', name: 'topP', type: 'number', default: 0.95 },
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('googleGeminiApi');
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as any;

		const model = new ChatGoogleGenerativeAI({
			apiKey: credentials.apiKey as string,
			model: modelName,
			temperature: options.temperature ?? 0.7,
			maxOutputTokens: options.maxOutputTokens ?? 2048,
			topK: options.topK ?? 40,
			topP: options.topP ?? 0.95,
			callbacks: [new N8nLlmTracing(this)],
		});

		return { response: model };
	}
}
