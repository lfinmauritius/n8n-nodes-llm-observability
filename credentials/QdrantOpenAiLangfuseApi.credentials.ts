import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class QdrantOpenAiLangfuseApi implements ICredentialType {
	name = 'qdrantOpenAiLangfuseApi';
	displayName = 'Qdrant + OpenAI + Langfuse API';
	documentationUrl = 'https://qdrant.tech/documentation/';

	properties: INodeProperties[] = [
		// Qdrant Configuration
		{
			displayName: 'Qdrant URL',
			name: 'qdrantUrl',
			type: 'string',
			default: 'http://localhost:6333',
			required: true,
			description: 'URL of the Qdrant server',
		},
		{
			displayName: 'Qdrant API Key',
			name: 'qdrantApiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'API key for Qdrant (optional for local instances)',
		},
		// OpenAI Embeddings Configuration
		{
			displayName: 'OpenAI API Key',
			name: 'openAiApiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'OpenAI API key for generating embeddings',
		},
		{
			displayName: 'OpenAI Base URL (optional)',
			name: 'openAiBaseUrl',
			type: 'string',
			default: '',
			description: 'Custom base URL for OpenAI API (for compatible endpoints)',
		},
		// Langfuse Configuration
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
