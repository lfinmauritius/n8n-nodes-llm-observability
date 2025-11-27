import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class CohereApi implements ICredentialType {
	name = 'cohereApi';
	icon = 'file:CohereApi.credentials.svg' as const;
	displayName = 'Cohere API';
	documentationUrl = 'https://docs.cohere.com/reference/about';

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
