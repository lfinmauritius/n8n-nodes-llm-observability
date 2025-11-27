import type {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AwsBedrockApiWithLangfuseApi implements ICredentialType {
	name = 'awsBedrockApiWithLangfuseApi';
	icon = 'file:AwsBedrockApiWithLangfuseApi.credentials.svg' as const;

	displayName = 'AWS Bedrock With Langfuse API';
	documentationUrl = 'https://langfuse.com/integrations/no-code/n8n';

	properties: INodeProperties[] = [
		// AWS Settings
		{
			displayName: 'AWS Region',
			name: 'region',
			type: 'string',
			required: true,
			default: 'us-east-1',
			description: 'The AWS region where Bedrock is available',
			hint: 'e.g., us-east-1, us-west-2, eu-west-1',
		},
		{
			displayName: 'Access Key ID',
			name: 'accessKeyId',
			type: 'string',
			required: true,
			default: '',
			description: 'Your AWS Access Key ID',
		},
		{
			displayName: 'Secret Access Key',
			name: 'secretAccessKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your AWS Secret Access Key',
		},
		{
			displayName: 'Session Token',
			name: 'sessionToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Optional: AWS Session Token (for temporary credentials)',
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

	// AWS Bedrock doesn't use standard HTTP auth - credentials are used by the SDK
	// No test request as it requires AWS SDK signature
}
