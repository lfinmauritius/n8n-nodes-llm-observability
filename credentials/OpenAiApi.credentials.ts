import type {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class OpenAiApi implements ICredentialType {
    name = 'openAiApi';
    icon = 'file:OpenAiApi.credentials.svg' as const;

    displayName = 'OpenAI API';
    documentationUrl = 'https://platform.openai.com/docs/api-reference';

    properties: INodeProperties[] = [
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: { password: true },
            required: true,
            default: '',
        },
        {
            displayName: 'Organization ID (optional)',
            name: 'organizationId',
            type: 'string',
            default: '',
            hint: 'Only required if you belong to multiple organisations',
        },
        {
            displayName: 'Base URL',
            name: 'url',
            type: 'string',
            default: 'https://api.openai.com/v1',
            description: 'Override the default base URL for the API',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '=Bearer {{$credentials.apiKey}}',
                'OpenAI-Organization': '={{$credentials.organizationId}}',
            },
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: '={{$credentials?.url}}',
            url: '/models',
        },
    };
}
