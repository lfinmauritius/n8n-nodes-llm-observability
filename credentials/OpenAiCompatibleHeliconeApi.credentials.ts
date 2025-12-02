import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class OpenAiCompatibleHeliconeApi implements ICredentialType {
	name = 'openAiCompatibleHeliconeApi';
	displayName = 'OpenAI Compatible + Helicone API';
	documentationUrl = 'https://docs.helicone.ai/getting-started/integration-method/gateway';

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
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://api.example.com/v1',
			description: 'The base URL of your OpenAI-compatible API',
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
