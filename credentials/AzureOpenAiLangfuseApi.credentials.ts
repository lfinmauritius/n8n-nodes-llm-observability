import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class AzureOpenAiLangfuseApi implements ICredentialType {
	name = 'azureOpenAiLangfuseApi';
	displayName = 'Azure OpenAI + Langfuse API';
	documentationUrl = 'https://azure.microsoft.com/en-us/products/ai-services/openai-service';

	properties: INodeProperties[] = [
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
			description: 'The Azure OpenAI endpoint URL',
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '2024-02-15-preview',
			description: 'The Azure OpenAI API version',
		},
		{
			displayName: 'Langfuse Base URL',
			name: 'langfuseBaseUrl',
			type: 'string',
			default: 'https://cloud.langfuse.com',
			required: true,
		},
		{
			displayName: 'Langfuse Public Key',
			name: 'langfusePublicKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'Langfuse Secret Key',
			name: 'langfuseSecretKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];
}
