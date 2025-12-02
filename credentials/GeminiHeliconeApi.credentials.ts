import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class GeminiHeliconeApi implements ICredentialType {
	name = 'geminiHeliconeApi';
	displayName = 'Google Gemini + Helicone API';
	documentationUrl = 'https://docs.helicone.ai/getting-started/integration-method/gateway';

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
