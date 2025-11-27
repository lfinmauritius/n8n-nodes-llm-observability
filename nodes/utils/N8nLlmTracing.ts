import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { Serialized } from '@langchain/core/load/serializable';
import type { LLMResult } from '@langchain/core/outputs';
import type { ISupplyDataFunctions } from 'n8n-workflow';

export class N8nLlmTracing extends BaseCallbackHandler {
	name = 'N8nLlmTracing';
	executionFunctions: ISupplyDataFunctions;

	constructor(executionFunctions: ISupplyDataFunctions) {
		super();
		this.executionFunctions = executionFunctions;
	}

	async handleLLMStart(
		llm: Serialized,
		prompts: string[],
		_runId: string,
		_parentRunId?: string,
		extraParams?: Record<string, unknown>,
	): Promise<void> {
		const logger = this.executionFunctions.logger;
		logger.debug(`[N8nLlmTracing] LLM Start: ${llm.id?.join('/') || 'unknown'}`);
		logger.debug(`[N8nLlmTracing] Prompts: ${prompts.length}`);
		if (extraParams) {
			logger.debug(`[N8nLlmTracing] Extra params: ${JSON.stringify(extraParams)}`);
		}
	}

	async handleLLMEnd(output: LLMResult, _runId: string): Promise<void> {
		const logger = this.executionFunctions.logger;
		const generations = output.generations;
		const totalTokens = output.llmOutput?.tokenUsage?.totalTokens;
		logger.debug(`[N8nLlmTracing] LLM End: ${generations.length} generations`);
		if (totalTokens) {
			logger.debug(`[N8nLlmTracing] Total tokens: ${totalTokens}`);
		}
	}

	async handleLLMError(err: Error, _runId: string): Promise<void> {
		const logger = this.executionFunctions.logger;
		logger.error(`[N8nLlmTracing] LLM Error: ${err.message}`);
	}
}
