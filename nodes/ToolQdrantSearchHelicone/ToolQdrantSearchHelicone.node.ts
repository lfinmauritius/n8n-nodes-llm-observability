import type {
	ISupplyDataFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError, jsonParse } from 'n8n-workflow';
import { DynamicTool } from '@langchain/core/tools';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantClient } from '@qdrant/js-client-rest';

// Helicone proxy URL for OpenAI
const HELICONE_OPENAI_URL = 'https://oai.helicone.ai/v1';

export class ToolQdrantSearchHelicone implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Qdrant Search Tool Helicone',
		name: 'toolQdrantSearchHelicone',
		icon: { light: 'file:ToolQdrantSearchHeliconeLight.icon.svg', dark: 'file:ToolQdrantSearchHeliconeDark.icon.svg' },
		group: ['transform'],
		version: 1,
		description: 'Search Qdrant vector store with Helicone observability',
		defaults: {
			name: 'Qdrant Search Tool (Helicone)',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Tools'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://qdrant.tech/documentation/',
					},
				],
			},
		},
		inputs: [],
		outputs: ['ai_tool'] as any,
		outputNames: ['Tool'],
		credentials: [
			{
				name: 'qdrantHeliconeApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Tool Name',
				name: 'toolName',
				type: 'string',
				default: 'qdrant_search',
				required: true,
				description: 'Name of the tool (used by the agent to identify and call it)',
			},
			{
				displayName: 'Tool Description',
				name: 'toolDescription',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: 'Search for relevant documents in the knowledge base. Use this tool when you need to find information about a specific topic.',
				required: true,
				description: 'Description of what this tool does (helps the agent decide when to use it)',
			},
			{
				displayName: 'Collection Name',
				name: 'collectionName',
				type: 'string',
				default: '',
				required: true,
				description: 'Name of the Qdrant collection to search',
			},
			{
				displayName: 'Embedding Model',
				name: 'embeddingModel',
				type: 'string',
				default: 'text-embedding-3-small',
				required: true,
				description: 'OpenAI embedding model to use',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Content Payload Key',
						name: 'contentPayloadKey',
						type: 'string',
						default: 'content',
						description: 'The key to use for the content payload in Qdrant',
					},
					{
						displayName: 'Include Metadata in Results',
						name: 'includeMetadata',
						type: 'boolean',
						default: true,
						description: 'Whether to include document metadata in the results',
					},
					{
						displayName: 'Metadata Payload Key',
						name: 'metadataPayloadKey',
						type: 'string',
						default: 'metadata',
						description: 'The key to use for the metadata payload in Qdrant',
					},
					{
						displayName: 'Score Threshold',
						name: 'scoreThreshold',
						type: 'number',
						default: 0,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 2 },
						description: 'Minimum similarity score (0-1) for results',
					},
					{
						displayName: 'Search Filter (JSON)',
						name: 'searchFilterJson',
						type: 'json',
						typeOptions: {
							rows: 5,
						},
						default: '',
						description: 'Filter using <a href="https://qdrant.tech/documentation/concepts/filtering/" target="_blank">Qdrant filtering syntax</a>',
					},
					{
						displayName: 'Top K',
						name: 'topK',
						type: 'number',
						default: 4,
						description: 'Number of results to return',
					},
				],
			},
			{
				displayName: 'Helicone Options',
				name: 'heliconeOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Session ID',
						name: 'sessionId',
						type: 'string',
						default: '',
						description: 'Group related requests into a session',
					},
					{
						displayName: 'User ID',
						name: 'userId',
						type: 'string',
						default: '',
						description: 'User identifier for request attribution',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('qdrantHeliconeApi');

		// Get node parameters
		const toolName = this.getNodeParameter('toolName', itemIndex) as string;
		const toolDescription = this.getNodeParameter('toolDescription', itemIndex) as string;
		const collectionName = this.getNodeParameter('collectionName', itemIndex) as string;
		const embeddingModel = this.getNodeParameter('embeddingModel', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			topK?: number;
			scoreThreshold?: number;
			contentPayloadKey?: string;
			metadataPayloadKey?: string;
			searchFilterJson?: string;
			includeMetadata?: boolean;
		};
		const heliconeOptions = this.getNodeParameter('heliconeOptions', itemIndex, {}) as {
			sessionId?: string;
			userId?: string;
		};

		const topK = options.topK ?? 4;
		const scoreThreshold = options.scoreThreshold ?? 0;
		const contentPayloadKey = options.contentPayloadKey ?? 'content';
		const metadataPayloadKey = options.metadataPayloadKey ?? 'metadata';
		const includeMetadata = options.includeMetadata ?? true;

		// Parse search filter if provided
		let searchFilter: IDataObject | undefined;
		if (options.searchFilterJson && options.searchFilterJson.trim()) {
			try {
				searchFilter = jsonParse<IDataObject>(options.searchFilterJson);
			} catch {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON in Search Filter');
			}
		}

		// Build Helicone headers
		const heliconeHeaders: Record<string, string> = {
			'Helicone-Auth': `Bearer ${credentials.heliconeApiKey}`,
		};

		if (heliconeOptions.sessionId) {
			heliconeHeaders['Helicone-Session-Id'] = heliconeOptions.sessionId;
		}
		if (heliconeOptions.userId) {
			heliconeHeaders['Helicone-User-Id'] = heliconeOptions.userId;
		}
		heliconeHeaders['Helicone-Property-Tool'] = toolName;

		// Initialize Qdrant client
		const qdrantClient = new QdrantClient({
			url: credentials.qdrantUrl as string,
			apiKey: credentials.qdrantApiKey as string || undefined,
		});

		// Initialize OpenAI Embeddings with Helicone proxy
		const embeddings = new OpenAIEmbeddings({
			openAIApiKey: credentials.openaiApiKey as string,
			modelName: embeddingModel,
			configuration: {
				baseURL: HELICONE_OPENAI_URL,
				defaultHeaders: heliconeHeaders,
			},
		});

		// Create the search tool
		const searchTool = new DynamicTool({
			name: toolName,
			description: toolDescription,
			func: async (query: string) => {
				try {
					// Generate embedding (tracked by Helicone automatically via proxy)
					const queryEmbedding = await embeddings.embedQuery(query);

					// Search Qdrant
					const searchResults = await qdrantClient.search(collectionName, {
						vector: queryEmbedding,
						limit: topK,
						score_threshold: scoreThreshold > 0 ? scoreThreshold : undefined,
						with_payload: true,
						filter: searchFilter as any,
					});

					if (searchResults.length === 0) {
						return 'No relevant documents found.';
					}

					// Format results
					const formattedResults = searchResults.map((result, index) => {
						const payload = result.payload as Record<string, any>;
						const content = payload[contentPayloadKey] || JSON.stringify(payload);
						const score = result.score.toFixed(4);

						let resultText = `[${index + 1}] (Score: ${score})\n${content}`;

						// Include metadata if requested
						if (includeMetadata && payload[metadataPayloadKey]) {
							const metadata = payload[metadataPayloadKey];
							resultText += `\nMetadata: ${JSON.stringify(metadata)}`;
						}

						return resultText;
					});

					return formattedResults.join('\n\n---\n\n');
				} catch (error: any) {
					return `Error searching Qdrant: ${error.message}`;
				}
			},
		});

		return {
			response: searchTool,
		};
	}
}
