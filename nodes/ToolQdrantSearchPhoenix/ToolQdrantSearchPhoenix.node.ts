import type {
	ISupplyDataFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError, jsonParse } from 'n8n-workflow';
import { DynamicTool } from '@langchain/core/tools';
import type { Embeddings } from '@langchain/core/embeddings';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { QdrantClient } from '@qdrant/js-client-rest';

export class ToolQdrantSearchPhoenix implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Qdrant Search Tool Phoenix',
		name: 'toolQdrantSearchPhoenix',
		icon: { light: 'file:ToolQdrantSearchPhoenixLight.icon.svg', dark: 'file:ToolQdrantSearchPhoenixDark.icon.svg' },
		group: ['transform'],
		version: 1,
		description: 'Search Qdrant vector store with Arize Phoenix tracing',
		defaults: {
			name: 'Qdrant Search Tool Phoenix',
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
				name: 'qdrantPhoenixApi',
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
				displayName: 'Phoenix Options',
				name: 'phoenixOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Session ID',
						name: 'sessionId',
						type: 'string',
						default: '',
						description: 'Group related traces together',
					},
					{
						displayName: 'User ID',
						name: 'userId',
						type: 'string',
						default: '',
						description: 'User identifier for trace attribution',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('qdrantPhoenixApi');

		// Get connected embedding model
		const embeddingsInput = await this.getInputConnectionData(
			'ai_embedding' as any,
			itemIndex,
		);

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
			contentPayloadKey?: string;
			metadataPayloadKey?: string;
			searchFilterJson?: string;
			includeMetadata?: boolean;
		};
		const phoenixOptions = this.getNodeParameter('phoenixOptions', itemIndex, {}) as {
			sessionId?: string;
			userId?: string;
		};

		const topK = options.topK ?? 4;
		const scoreThreshold = options.scoreThreshold ?? 0;
		const contentPayloadKey = options.contentPayloadKey ?? 'content';
		const metadataPayloadKey = options.metadataPayloadKey ?? 'metadata';
		const includeMetadata = options.includeMetadata ?? true;

		// Parse search filter
		let searchFilter: IDataObject | undefined;
		if (options.searchFilterJson && options.searchFilterJson.trim()) {
			try {
				searchFilter = jsonParse<IDataObject>(options.searchFilterJson);
			} catch {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON in Search Filter');
			}
		}

		// Initialize Qdrant client
		const qdrantClient = new QdrantClient({
			url: credentials.qdrantUrl as string,
			apiKey: credentials.qdrantApiKey as string || undefined,
		});

		// Initialize OpenTelemetry tracer for Phoenix
		const exporter = new OTLPTraceExporter({
			url: credentials.phoenixCollectorUrl as string,
			headers: credentials.phoenixApiKey
				? { Authorization: `Bearer ${credentials.phoenixApiKey}` }
				: undefined,
		});

		const tracerProvider = new NodeTracerProvider({
			resource: new Resource({
				'service.name': 'n8n-qdrant-search-phoenix',
				'project.name': credentials.phoenixProjectName as string,
			}),
		});

		tracerProvider.addSpanProcessor(new BatchSpanProcessor(exporter));
		tracerProvider.register();

		const tracer = trace.getTracer('n8n-qdrant-search-phoenix');

		// Create the search tool
		const searchTool = new DynamicTool({
			name: toolName,
			description: toolDescription,
			func: async (query: string) => {
				return await tracer.startActiveSpan(`${toolName}_search`, async (span) => {
					span.setAttribute('tool.name', toolName);
					span.setAttribute('collection', collectionName);
					span.setAttribute('topK', topK);
					if (phoenixOptions.sessionId) span.setAttribute('session.id', phoenixOptions.sessionId);
					if (phoenixOptions.userId) span.setAttribute('user.id', phoenixOptions.userId);

					try {
						// Embedding span
						const embeddingResult = await tracer.startActiveSpan('embedding', async (embSpan) => {
							embSpan.setAttribute('input.query', query);
							const startTime = Date.now();
							const queryEmbedding = await embeddings.embedQuery(query);
							const duration = Date.now() - startTime;
							embSpan.setAttribute('output.dimensions', queryEmbedding.length);
							embSpan.setAttribute('duration_ms', duration);
							embSpan.setStatus({ code: SpanStatusCode.OK });
							embSpan.end();
							return queryEmbedding;
						});

						// Qdrant search span
						const searchResults = await tracer.startActiveSpan('qdrant_search', async (searchSpan) => {
							searchSpan.setAttribute('collection', collectionName);
							searchSpan.setAttribute('topK', topK);
							searchSpan.setAttribute('scoreThreshold', scoreThreshold);
							if (searchFilter) searchSpan.setAttribute('filter', JSON.stringify(searchFilter));

							const startTime = Date.now();
							const results = await qdrantClient.search(collectionName, {
								vector: embeddingResult,
								limit: topK,
								score_threshold: scoreThreshold > 0 ? scoreThreshold : undefined,
								with_payload: true,
								filter: searchFilter as any,
							});
							const duration = Date.now() - startTime;

							searchSpan.setAttribute('results_count', results.length);
							searchSpan.setAttribute('duration_ms', duration);
							searchSpan.setStatus({ code: SpanStatusCode.OK });
							searchSpan.end();
							return results;
						});

						if (searchResults.length === 0) {
							span.setAttribute('output', 'No relevant documents found.');
							span.setStatus({ code: SpanStatusCode.OK });
							span.end();
							await tracerProvider.forceFlush();
							return 'No relevant documents found.';
						}

						// Format results
						const formattedResults = searchResults.map((result, index) => {
							const payload = result.payload as Record<string, any>;
							const content = payload[contentPayloadKey] || JSON.stringify(payload);
							const score = result.score.toFixed(4);

							let resultText = `[${index + 1}] (Score: ${score})\n${content}`;

							if (includeMetadata && payload[metadataPayloadKey]) {
								const metadata = payload[metadataPayloadKey];
								resultText += `\nMetadata: ${JSON.stringify(metadata)}`;
							}

							return resultText;
						});

						const output = formattedResults.join('\n\n---\n\n');
						span.setAttribute('output.length', output.length);
						span.setStatus({ code: SpanStatusCode.OK });
						span.end();

						await tracerProvider.forceFlush();
						return output;

					} catch (error: any) {
						span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
						span.end();
						await tracerProvider.forceFlush();
						return `Error searching Qdrant: ${error.message}`;
					}
				});
			},
		});

		return {
			response: searchTool,
		};
	}
}
