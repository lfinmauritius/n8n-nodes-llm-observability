import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { jsonParse } from 'n8n-workflow';
import { CallbackHandler } from 'langfuse-langchain';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

export class ObservabilityLangfuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Langfuse Observability',
		name: 'observabilityLangfuse',
		icon: { light: 'file:ObservabilityLangfuseLight.icon.svg', dark: 'file:ObservabilityLangfuseDark.icon.svg' },
		group: ['transform'],
		version: [1],
		description: 'Add Langfuse tracing to any LLM model for observability',
		defaults: {
			name: 'Langfuse Observability',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Miscellaneous'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://langfuse.com/docs',
					},
				],
			},
		},

		// This node takes a language model as input
		inputs: [
			{
				displayName: 'Model',
				maxConnections: 1,
				type: 'ai_languageModel' as any,
				required: true,
			},
		],
		// And outputs a language model (with Langfuse callbacks attached)
		outputs: ['ai_languageModel' as any],
		outputNames: ['Model'],
		credentials: [
			{ name: 'langfuseApi', required: true },
		],
		properties: [
			{
				displayName: 'Langfuse Metadata',
				name: 'langfuseMetadata',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Session ID',
						name: 'sessionId',
						type: 'string',
						default: '',
						description: 'Used in Langfuse trace grouping. Leave empty to auto-generate.',
					},
					{
						displayName: 'User ID',
						name: 'userId',
						type: 'string',
						default: '',
						description: 'Optional: for trace attribution in Langfuse',
					},
					{
						displayName: 'Custom Metadata (JSON)',
						name: 'customMetadata',
						type: 'json',
						default: '{}',
						description: 'Optional. Pass extra metadata to be attached to Langfuse traces.',
					},
					{
						displayName: 'Trace Name',
						name: 'traceName',
						type: 'string',
						default: '',
						description: 'Optional: custom name for the trace in Langfuse',
					},
					{
						displayName: 'Tags',
						name: 'tags',
						type: 'string',
						default: '',
						description: 'Optional: comma-separated tags for filtering traces in Langfuse',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('langfuseApi');

		// Get the input model from the connected LLM node
		const inputModel = (await this.getInputConnectionData(
			'ai_languageModel' as any,
			itemIndex,
		)) as BaseChatModel;

		if (!inputModel) {
			throw new Error('No language model connected. Please connect an LLM node to the input.');
		}

		// Get Langfuse metadata parameters
		const {
			sessionId = '',
			userId = '',
			customMetadata: customMetadataRaw = '{}',
			traceName = '',
			tags: tagsRaw = '',
		} = this.getNodeParameter('langfuseMetadata', itemIndex, {}) as {
			sessionId?: string;
			userId?: string;
			customMetadata?: string | Record<string, any>;
			traceName?: string;
			tags?: string;
		};

		// Parse custom metadata
		let customMetadata: Record<string, any> = {};
		if (typeof customMetadataRaw === 'string') {
			try {
				customMetadata = customMetadataRaw.trim()
					? jsonParse<Record<string, any>>(customMetadataRaw)
					: {};
			} catch {
				customMetadata = { _raw: customMetadataRaw };
			}
		} else if (customMetadataRaw && typeof customMetadataRaw === 'object') {
			customMetadata = customMetadataRaw;
		}

		// Parse tags
		const tags = tagsRaw
			? tagsRaw.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
			: undefined;

		// Create Langfuse callback handler
		const langfuseHandler = new CallbackHandler({
			baseUrl: credentials.baseUrl as string,
			publicKey: credentials.publicKey as string,
			secretKey: credentials.secretKey as string,
			sessionId: sessionId || undefined,
			userId: userId || undefined,
			metadata: customMetadata,
			tags,
		});

		// Add Langfuse callback to the model
		// Get existing callbacks as array or empty array
		const existingCallbacks = Array.isArray(inputModel.callbacks)
			? inputModel.callbacks
			: [];

		const modelWithLangfuse = inputModel.bind({
			callbacks: [langfuseHandler, ...existingCallbacks],
			metadata: {
				...customMetadata,
				...(traceName ? { trace_name: traceName } : {}),
			},
		});

		return {
			response: modelWithLangfuse,
		};
	}
}
