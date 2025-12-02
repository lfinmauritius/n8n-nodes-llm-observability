import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class QdrantPhoenixApi implements ICredentialType {
	name = 'qdrantPhoenixApi';
	displayName = 'Qdrant + Phoenix API';
	documentationUrl = 'https://qdrant.tech/documentation/';

	properties: INodeProperties[] = [
		// Qdrant Configuration
		{
			displayName: 'Qdrant URL',
			name: 'qdrantUrl',
			type: 'string',
			default: 'http://localhost:6333',
			required: true,
			description: 'URL of the Qdrant server',
		},
		{
			displayName: 'Qdrant API Key',
			name: 'qdrantApiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'API key for Qdrant (optional for local instances)',
		},
		// Phoenix Configuration
		{
			displayName: 'Phoenix Collector URL',
			name: 'phoenixCollectorUrl',
			type: 'string',
			default: 'http://localhost:6006/v1/traces',
			required: true,
			description: 'URL of the Phoenix OTLP collector endpoint',
		},
		{
			displayName: 'Project Name',
			name: 'phoenixProjectName',
			type: 'string',
			default: 'default',
			required: true,
			description: 'Project name for organizing traces in Phoenix',
		},
		{
			displayName: 'Phoenix API Key (Optional)',
			name: 'phoenixApiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'API key for Phoenix Cloud (optional for self-hosted)',
		},
	];
}
