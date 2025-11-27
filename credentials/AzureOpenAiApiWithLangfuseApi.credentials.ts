import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AzureOpenAiApiWithLangfuseApi implements ICredentialType {
	name = 'azureOpenAiApiWithLangfuseApi';
	icon = 'file:AzureOpenAiApiWithLangfuseApi.credentials.svg' as const;

	displayName = 'Azure OpenAI With Langfuse API';
	documentationUrl = 'https://langfuse.com/integrations/no-code/n8n';

	properties: INodeProperties[] = [
		// Azure OpenAI Settings
		{
			displayName: 'Azure OpenAI API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'Resource Name',
			name: 'resourceName',
			type: 'string',
			required: true,
			default: '',
			description: 'The name of your Azure OpenAI resource (e.g., my-openai-resource)',
			hint: 'Found in your Azure portal under your OpenAI resource',
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '2024-08-01-preview',
			description: 'The API version to use',
		},
		{
			displayName: 'Custom Endpoint',
			name: 'endpoint',
			type: 'string',
			default: '',
			description: 'Optional: Override the default Azure endpoint URL. Leave empty to use the standard endpoint.',
			placeholder: 'https://my-resource.openai.azure.com',
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
				'api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.endpoint || "https://" + $credentials.resourceName + ".openai.azure.com"}}',
			url: '=/openai/deployments?api-version={{$credentials.apiVersion}}',
			method: 'GET',
		},
	};
}
