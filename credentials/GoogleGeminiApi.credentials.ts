import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class GoogleGeminiApi implements ICredentialType {
	name = 'googleGeminiApi';
	icon = 'file:GoogleGeminiApi.credentials.svg' as const;
	displayName = 'Google Gemini API';
	documentationUrl = 'https://ai.google.dev/docs';

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
