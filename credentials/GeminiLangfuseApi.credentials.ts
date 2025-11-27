import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class GeminiLangfuseApi implements ICredentialType {
	name = 'geminiLangfuseApi';
	displayName = 'Google Gemini + Langfuse API';
	documentationUrl = 'https://ai.google.dev/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'Google AI API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
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
