import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class GrokApi implements ICredentialType {
	name = 'grokApi';
	icon = 'file:GrokApi.credentials.svg' as const;
	displayName = 'Grok (xAI) API';
	documentationUrl = 'https://docs.x.ai/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your xAI API key from console.x.ai',
		},
	];
}
