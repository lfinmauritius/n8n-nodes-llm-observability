import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class AzureOpenAiApi implements ICredentialType {
	name = 'azureOpenAiApi';
	icon = 'file:AzureOpenAiApi.credentials.svg' as const;
	displayName = 'Azure OpenAI API';
	documentationUrl = 'https://learn.microsoft.com/en-us/azure/ai-services/openai/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'Resource Name',
			name: 'resourceName',
			type: 'string',
			required: true,
			default: '',
			description: 'The name of your Azure OpenAI resource',
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			required: true,
			default: '2024-02-15-preview',
		},
		{
			displayName: 'Endpoint (optional)',
			name: 'endpoint',
			type: 'string',
			default: '',
			description: 'Full endpoint URL (overrides resource name)',
		},
	];
}
