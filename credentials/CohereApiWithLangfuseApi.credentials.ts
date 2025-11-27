import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CohereApiWithLangfuseApi implements ICredentialType {
	name = 'cohereApiWithLangfuseApi';
	icon = 'file:CohereApiWithLangfuseApi.credentials.svg' as const;

	displayName = 'Cohere With Langfuse API';
	documentationUrl = 'https://langfuse.com/integrations/no-code/n8n';

	properties: INodeProperties[] = [
		// Cohere Settings
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Cohere API key from dashboard.cohere.com',
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
			baseURL: 'https://api.cohere.ai',
			url: '/v1/models?page_size=1',
		},
	};
}
