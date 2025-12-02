import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class BedrockPhoenixApi implements ICredentialType {
	name = 'bedrockPhoenixApi';
	displayName = 'AWS Bedrock + Phoenix API';
	documentationUrl = 'https://arize.com/docs/phoenix';

	properties: INodeProperties[] = [
		{
			displayName: 'AWS Access Key ID',
			name: 'accessKeyId',
			type: 'string',
			required: true,
			default: '',
		},
		{
			displayName: 'AWS Secret Access Key',
			name: 'secretAccessKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'AWS Region',
			name: 'region',
			type: 'string',
			default: 'us-east-1',
			required: true,
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
