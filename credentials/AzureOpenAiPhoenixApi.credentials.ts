import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class AzureOpenAiPhoenixApi implements ICredentialType {
	name = 'azureOpenAiPhoenixApi';
	displayName = 'Azure OpenAI + Phoenix API';
	documentationUrl = 'https://arize.com/docs/phoenix';

	properties: INodeProperties[] = [
		// Azure OpenAI Configuration
		{
			displayName: 'Azure OpenAI API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'Azure Endpoint',
			name: 'endpoint',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://your-resource.openai.azure.com',
			description: 'Azure OpenAI resource endpoint or instance name',
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '2024-02-15-preview',
			description: 'Azure OpenAI API version',
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
