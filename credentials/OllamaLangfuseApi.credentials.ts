import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class OllamaLangfuseApi implements ICredentialType {
	name = 'ollamaLangfuseApi';
	displayName = 'Ollama + Langfuse API';
	documentationUrl = 'https://ollama.ai';

	properties: INodeProperties[] = [
		{
			displayName: 'Ollama Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'http://localhost:11434',
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
