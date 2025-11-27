import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class OllamaApi implements ICredentialType {
	name = 'ollamaApi';
	icon = 'file:OllamaApi.credentials.svg' as const;
	displayName = 'Ollama API';
	documentationUrl = 'https://ollama.ai/';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'http://localhost:11434',
		},
		{
			displayName: 'API Key (optional)',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Only required if your Ollama instance requires authentication',
		},
	];
}
