import type {
	ISupplyDataFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { DynamicTool } from '@langchain/core/tools';
import type { Embeddings } from '@langchain/core/embeddings';
import { Langfuse } from 'langfuse';
import { QdrantClient } from '@qdrant/js-client-rest';

export class ToolQdrantSearchLangfuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Qdrant Search Tool Langfuse',
		name: 'toolQdrantSearchLangfuse',
		icon: { light: 'file:ToolQdrantSearchLangfuseLight.icon.svg', dark: 'file:ToolQdrantSearchLangfuseDark.icon.svg' },
		group: ['transform'],
		version: 1,
		description: 'Search Qdrant vector store with Langfuse embedding tracing',
		defaults: {
			name: 'Qdrant Search Tool',
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
		inputs: [
			{
				displayName: 'Embedding',
				maxConnections: 1,
				type: 'ai_embedding' as any,
				required: true,
			},
		],
		outputs: ['ai_tool'] as any,
		outputNames: ['Tool'],
		credentials: [
			{
				name: 'qdrantOpenAiLangfuseApi',
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
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Top K',
						name: 'topK',
						type: 'number',
						default: 4,
						description: 'Number of results to return',
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
						displayName: 'Content Field',
						name: 'contentField',
						type: 'string',
						default: 'content',
						description: 'Name of the payload field containing the document content',
					},
				],
			},
			{
				displayName: 'Langfuse Options',
				name: 'langfuseOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Session ID',
						name: 'sessionId',
						type: 'string',
						default: '',
						description: 'Group related traces together in Langfuse',
					},
					{
						displayName: 'User ID',
						name: 'userId',
						type: 'string',
						default: '',
						description: 'User identifier for trace attribution',
					},
					{
						displayName: 'Tags',
						name: 'tags',
						type: 'string',
						default: '',
						description: 'Comma-separated tags for filtering traces',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('qdrantOpenAiLangfuseApi');

		// Get connected embedding model
		const embeddingsInput = await this.getInputConnectionData(
			'ai_embedding' as any,
			itemIndex,
		);

		// Handle wrapped embedding response
		const embeddings = (embeddingsInput as any)?.response ?? embeddingsInput as Embeddings;
		if (!embeddings) {
			throw new NodeOperationError(this.getNode(), 'No embedding model connected');
		}

		// Get node parameters
		const toolName = this.getNodeParameter('toolName', itemIndex) as string;
		const toolDescription = this.getNodeParameter('toolDescription', itemIndex) as string;
		const collectionName = this.getNodeParameter('collectionName', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			topK?: number;
			scoreThreshold?: number;
			contentField?: string;
		};
		const langfuseOptions = this.getNodeParameter('langfuseOptions', itemIndex, {}) as {
			sessionId?: string;
			userId?: string;
			tags?: string;
		};

		const topK = options.topK ?? 4;
		const scoreThreshold = options.scoreThreshold ?? 0;
		const contentField = options.contentField ?? 'content';

		// Initialize Qdrant client
		const qdrantClient = new QdrantClient({
			url: credentials.qdrantUrl as string,
			apiKey: credentials.qdrantApiKey as string || undefined,
		});

		// Initialize Langfuse client for tracing
		const langfuse = new Langfuse({
			baseUrl: credentials.langfuseBaseUrl as string,
			publicKey: credentials.langfusePublicKey as string,
			secretKey: credentials.langfuseSecretKey as string,
		});

		const tags = langfuseOptions.tags
			? langfuseOptions.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
			: undefined;

		// Create the search tool
		const searchTool = new DynamicTool({
			name: toolName,
			description: toolDescription,
			func: async (query: string) => {
				// Create a trace for this search operation
				const trace = langfuse.trace({
					name: `${toolName}_search`,
					sessionId: langfuseOptions.sessionId || undefined,
					userId: langfuseOptions.userId || undefined,
					tags,
					metadata: {
						collection: collectionName,
						topK,
					},
				});

				try {
					// Create a span for embedding generation
					const embeddingSpan = trace.span({
						name: 'embedding',
						metadata: {
							query,
						},
					});

					const startTime = Date.now();
					const queryEmbedding = await embeddings.embedQuery(query);
					const embeddingDuration = Date.now() - startTime;

					embeddingSpan.end({
						output: {
							dimensions: queryEmbedding.length,
							duration_ms: embeddingDuration,
						},
					});

					// Create a span for Qdrant search
					const searchSpan = trace.span({
						name: 'qdrant_search',
						metadata: {
							collection: collectionName,
							topK,
							scoreThreshold,
						},
					});

					const searchStartTime = Date.now();
					const searchResults = await qdrantClient.search(collectionName, {
						vector: queryEmbedding,
						limit: topK,
						score_threshold: scoreThreshold > 0 ? scoreThreshold : undefined,
						with_payload: true,
					});
					const searchDuration = Date.now() - searchStartTime;

					searchSpan.end({
						output: {
							results_count: searchResults.length,
							duration_ms: searchDuration,
						},
					});

					if (searchResults.length === 0) {
						trace.update({ output: 'No relevant documents found.' });
						await langfuse.flushAsync();
						return 'No relevant documents found.';
					}

					// Format results
					const formattedResults = searchResults.map((result, index) => {
						const payload = result.payload as Record<string, any>;
						const content = payload[contentField] || JSON.stringify(payload);
						const score = result.score.toFixed(4);
						return `[${index + 1}] (Score: ${score})\n${content}`;
					});

					const output = formattedResults.join('\n\n---\n\n');
					trace.update({ output });

					// Flush Langfuse
					await langfuse.flushAsync();

					return output;
				} catch (error: any) {
					trace.update({
						output: `Error: ${error.message}`,
						metadata: { error: true },
					});
					await langfuse.flushAsync();
					return `Error searching Qdrant: ${error.message}`;
				}
			},
		});

		return {
			response: searchTool,
		};
	}
}
