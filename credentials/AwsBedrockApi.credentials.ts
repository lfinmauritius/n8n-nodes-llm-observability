import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class AwsBedrockApi implements ICredentialType {
	name = 'awsBedrockApi';
	icon = 'file:AwsBedrockApi.credentials.svg' as const;
	displayName = 'AWS Bedrock API';
	documentationUrl = 'https://docs.aws.amazon.com/bedrock/';

	properties: INodeProperties[] = [
		{
			displayName: 'AWS Region',
			name: 'region',
			type: 'string',
			required: true,
			default: 'us-east-1',
		},
		{
			displayName: 'Access Key ID',
			name: 'accessKeyId',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'Secret Access Key',
			name: 'secretAccessKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'Session Token (optional)',
			name: 'sessionToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Required for temporary credentials',
		},
	];
}
