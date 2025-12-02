import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class AzureOpenAiHeliconeApi implements ICredentialType {
	name = 'azureOpenAiHeliconeApi';
	displayName = 'Azure OpenAI + Helicone API';
	documentationUrl = 'https://docs.helicone.ai/integrations/azure/javascript';

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
			displayName: 'Azure Resource Name',
			name: 'resourceName',
			type: 'string',
			required: true,
			default: '',
			description: 'Your Azure OpenAI resource name (e.g., my-resource)',
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '2024-02-15-preview',
			required: true,
		},
		{
			displayName: 'Helicone API Key',
			name: 'heliconeApiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Helicone API key from helicone.ai dashboard',
		},
	];
}
