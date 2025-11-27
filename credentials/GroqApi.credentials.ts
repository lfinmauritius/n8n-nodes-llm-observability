import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class GroqApi implements ICredentialType {
	name = 'groqApi';
	icon = 'file:GroqApi.credentials.svg' as const;
	displayName = 'Groq API';
	documentationUrl = 'https://console.groq.com/docs/api-reference';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];
}
