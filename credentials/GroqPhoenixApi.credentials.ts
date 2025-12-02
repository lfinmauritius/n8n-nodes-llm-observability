import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class GroqPhoenixApi implements ICredentialType {
	name = 'groqPhoenixApi';
	displayName = 'Groq + Phoenix API';
	documentationUrl = 'https://arize.com/docs/phoenix';

	properties: INodeProperties[] = [
		{
			displayName: 'Groq API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
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
