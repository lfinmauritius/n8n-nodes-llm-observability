import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class QdrantHeliconeApi implements ICredentialType {
	name = 'qdrantHeliconeApi';
	displayName = 'Qdrant + Helicone API';
	documentationUrl = 'https://docs.helicone.ai';

	properties: INodeProperties[] = [
		{
			displayName: 'Qdrant URL',
			name: 'qdrantUrl',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://your-cluster.qdrant.io',
			description: 'URL of your Qdrant instance',
		},
		{
			displayName: 'Qdrant API Key',
			name: 'qdrantApiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'OpenAI API Key',
			name: 'openaiApiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'OpenAI API key for embeddings',
		},
		{
			displayName: 'Helicone API Key',
			name: 'heliconeApiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Helicone API key from helicone.ai dashboard',
		},
	];
}
