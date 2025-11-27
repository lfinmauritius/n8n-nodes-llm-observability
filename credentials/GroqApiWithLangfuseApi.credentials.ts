import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GroqApiWithLangfuseApi implements ICredentialType {
	name = 'groqApiWithLangfuseApi';
	icon = 'file:GroqApiWithLangfuseApi.credentials.svg' as const;

	displayName = 'Groq With Langfuse API';
	documentationUrl = 'https://langfuse.com/integrations/no-code/n8n';

	properties: INodeProperties[] = [
		// Groq Settings
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Groq API key from console.groq.com',
		},
		// Langfuse Settings
		{
			displayName: 'Langfuse Base URL',
			name: 'langfuseBaseUrl',
			type: 'string',
			default: 'https://cloud.langfuse.com',
			required: true,
			description: 'The base URL of your Langfuse instance',
		},
		{
			displayName: 'Langfuse Public Key',
			name: 'langfusePublicKey',
			type: 'string',
			default: '',
			typeOptions: { password: true },
			required: true,
		},
		{
			displayName: 'Langfuse Secret Key',
			name: 'langfuseSecretKey',
			type: 'string',
			default: '',
			typeOptions: { password: true },
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.groq.com/openai/v1',
			url: '/models',
		},
	};
}
