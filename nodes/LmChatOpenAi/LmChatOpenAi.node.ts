import { ChatOpenAI, type ClientOptions } from '@langchain/openai';
import {
    type INodeType,
    type INodeTypeDescription,
    type ISupplyDataFunctions,
    type SupplyData,
} from 'n8n-workflow';

import { searchModels } from './methods/loadModels';
import { N8nLlmTracing } from '../utils/N8nLlmTracing';

export class LmChatOpenAi implements INodeType {
    methods = {
        listSearch: {
            searchModels,
        },
    };

    description: INodeTypeDescription = {
        displayName: 'OpenAI Chat Model',
        name: 'lmChatOpenAi',
        icon: { light: 'file:LmChatOpenAiLight.icon.svg', dark: 'file:LmChatOpenAiDark.icon.svg' },
        group: ['transform'],
        version: [1],
        description: 'OpenAI Chat Model for use with AI Agents',
        defaults: {
            name: 'OpenAI Chat Model',
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
                        url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenai/',
                    },
                ],
            },
        },

        inputs: [],
        outputs: ['ai_languageModel_llmObs' as any],
        outputNames: ['Model'],
        credentials: [
            { name: 'openAiApi', required: true },
        ],
        requestDefaults: {
            ignoreHttpStatusErrors: true,
            baseURL:
                '={{ $credentials?.url?.split("/").slice(0,-1).join("/") || "https://api.openai.com" }}',
        },
        properties: [
            {
                displayName: 'Model',
                name: 'model',
                type: 'resourceLocator',
                default: { mode: 'list', value: 'gpt-4o-mini' },
                required: true,
                modes: [
                    {
                        displayName: 'From List',
                        name: 'list',
                        type: 'list',
                        placeholder: 'Select a model...',
                        typeOptions: {
                            searchListMethod: 'searchModels',
                            searchable: true,
                        },
                    },
                    {
                        displayName: 'ID',
                        name: 'id',
                        type: 'string',
                        placeholder: 'gpt-4o-mini',
                    },
                ],
                description: 'The model. Choose from the list, or specify an ID.',
            },
            {
                displayName:
                    'If using JSON response format, you must include word "json" in the prompt in your chain or agent.',
                name: 'notice',
                type: 'notice',
                default: '',
                displayOptions: {
                    show: {
                        '/options.responseFormat': ['json_object'],
                    },
                },
            },
            {
                displayName: 'Options',
                name: 'options',
                placeholder: 'Add Option',
                description: 'Additional options to add',
                type: 'collection',
                default: {},
                options: [
                    {
                        displayName: 'Base URL',
                        name: 'baseURL',
                        default: '',
                        description: 'Override the default base URL for the API',
                        type: 'string',
                    },
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
                        displayName: 'Max Retries',
                        name: 'maxRetries',
                        default: 2,
                        description: 'Maximum number of retries to attempt',
                        type: 'number',
                    },
                    {
                        displayName: 'Maximum Number of Tokens',
                        name: 'maxTokens',
                        default: -1,
                        description:
                            'The maximum number of tokens to generate in the completion. Set to -1 for unlimited.',
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
                        displayName: 'Reasoning Effort',
                        name: 'reasoningEffort',
                        default: 'medium',
                        description:
                            'Controls the amount of reasoning tokens to use (for o1/o3 models)',
                        type: 'options',
                        options: [
                            { name: 'Low', value: 'low' },
                            { name: 'Medium', value: 'medium' },
                            { name: 'High', value: 'high' },
                        ],
                        displayOptions: {
                            show: {
                                '/model': [{ _cnd: { regex: '(^o1.*)|(^o3.*)' } }],
                            },
                        },
                    },
                    {
                        displayName: 'Response Format',
                        name: 'responseFormat',
                        default: 'text',
                        type: 'options',
                        options: [
                            { name: 'Text', value: 'text' },
                            { name: 'JSON', value: 'json_object' },
                        ],
                    },
                    {
                        displayName: 'Sampling Temperature',
                        name: 'temperature',
                        default: 0.7,
                        typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
                        description: 'Controls randomness: Lowering results in less random completions',
                        type: 'number',
                    },
                    {
                        displayName: 'Timeout',
                        name: 'timeout',
                        default: 60000,
                        description: 'Maximum request time in milliseconds',
                        type: 'number',
                    },
                    {
                        displayName: 'Top P',
                        name: 'topP',
                        default: 1,
                        typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
                        description: 'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered',
                        type: 'number',
                    },
                ],
            },
        ],
    };

    async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
        const credentials = await this.getCredentials('openAiApi');

        const modelName = this.getNodeParameter('model.value', itemIndex) as string;

        const options = this.getNodeParameter('options', itemIndex, {}) as {
            baseURL?: string;
            frequencyPenalty?: number;
            maxTokens?: number;
            maxRetries?: number;
            timeout?: number;
            presencePenalty?: number;
            temperature?: number;
            topP?: number;
            responseFormat?: 'text' | 'json_object';
            reasoningEffort?: 'low' | 'medium' | 'high';
        };

        const configuration: ClientOptions = {};

        if (options.baseURL) {
            configuration.baseURL = options.baseURL;
        } else if (credentials.url) {
            configuration.baseURL = credentials.url as string;
        }

        const modelKwargs: {
            response_format?: object;
            reasoning_effort?: 'low' | 'medium' | 'high';
        } = {};
        if (options.responseFormat) modelKwargs.response_format = { type: options.responseFormat };
        if (options.reasoningEffort) modelKwargs.reasoning_effort = options.reasoningEffort;

        const model = new ChatOpenAI({
            callbacks: [new N8nLlmTracing(this)],
            apiKey: credentials.apiKey as string,
            configuration: { baseURL: configuration.baseURL },
            model: modelName,
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens !== -1 ? options.maxTokens : undefined,
            frequencyPenalty: options.frequencyPenalty,
            presencePenalty: options.presencePenalty,
            topP: options.topP,
            timeout: options.timeout ?? 60000,
            maxRetries: options.maxRetries ?? 2,
            modelKwargs: Object.keys(modelKwargs).length > 0 ? modelKwargs : undefined,
        });

        return {
            response: model,
        };
    }
}
