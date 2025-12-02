import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MistralHeliconeApi implements ICredentialType {
	name = 'mistralHeliconeApi';
	displayName = 'Mistral + Helicone API';
	documentationUrl = 'https://docs.helicone.ai/getting-started/integration-method/gateway';

	properties: INodeProperties[] = [
		{
			displayName: 'Mistral API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
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
