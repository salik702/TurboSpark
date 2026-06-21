/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export const SERVICE_NAME = 'turbospark';

export const EVENT_USER_PROMPT = 'turbospark.user_prompt';
export const EVENT_USER_RETRY = 'turbospark.user_retry';
export const EVENT_TOOL_CALL = 'turbospark.tool_call';
export const EVENT_API_REQUEST = 'turbospark.api_request';
export const EVENT_API_ERROR = 'turbospark.api_error';
export const EVENT_API_CANCEL = 'turbospark.api_cancel';
export const EVENT_API_RESPONSE = 'turbospark.api_response';
export const EVENT_CLI_CONFIG = 'turbospark.config';
export const EVENT_EXTENSION_DISABLE = 'turbospark.extension_disable';
export const EVENT_EXTENSION_ENABLE = 'turbospark.extension_enable';
export const EVENT_EXTENSION_INSTALL = 'turbospark.extension_install';
export const EVENT_EXTENSION_UNINSTALL = 'turbospark.extension_uninstall';
export const EVENT_EXTENSION_UPDATE = 'turbospark.extension_update';
export const EVENT_FLASH_FALLBACK = 'turbospark.flash_fallback';
export const EVENT_RIPGREP_FALLBACK = 'turbospark.ripgrep_fallback';
export const EVENT_NEXT_SPEAKER_CHECK = 'turbospark.next_speaker_check';
export const EVENT_SLASH_COMMAND = 'turbospark.slash_command';
export const EVENT_IDE_CONNECTION = 'turbospark.ide_connection';
export const EVENT_CHAT_COMPRESSION = 'turbospark.chat_compression';
export const EVENT_INVALID_CHUNK = 'turbospark.chat.invalid_chunk';
export const EVENT_CONTENT_RETRY = 'turbospark.chat.content_retry';
export const EVENT_CONTENT_RETRY_FAILURE =
  'turbospark.chat.content_retry_failure';
// Phase 4b — HTTP-status retry telemetry emitted by `retryWithBackoff` for
// 429 / 5xx errors at LLM call sites. Distinct from EVENT_CONTENT_RETRY,
// which is fired by geminiChat for InvalidStreamError retries on a separate
// retry budget. See docs/design/telemetry-llm-request-timing-design.md.
export const EVENT_API_RETRY = 'turbospark.api_retry';
export const EVENT_CONVERSATION_FINISHED = 'turbospark.conversation_finished';
export const EVENT_MALFORMED_JSON_RESPONSE =
  'turbospark.malformed_json_response';
export const EVENT_FILE_OPERATION = 'turbospark.file_operation';
export const EVENT_MODEL_SLASH_COMMAND = 'turbospark.slash_command.model';
export const EVENT_SUBAGENT_EXECUTION = 'turbospark.subagent_execution';
export const EVENT_SKILL_LAUNCH = 'turbospark.skill_launch';
export const EVENT_AUTH = 'turbospark.auth';
export const EVENT_USER_FEEDBACK = 'turbospark.user_feedback';

// Prompt Suggestion Events
export const EVENT_PROMPT_SUGGESTION = 'turbospark.prompt_suggestion';
export const EVENT_SPECULATION = 'turbospark.speculation';

// Arena Events
export const EVENT_ARENA_SESSION_STARTED = 'turbospark.arena_session_started';
export const EVENT_ARENA_AGENT_COMPLETED = 'turbospark.arena_agent_completed';
export const EVENT_ARENA_SESSION_ENDED = 'turbospark.arena_session_ended';

// Performance Events
export const EVENT_STARTUP_PERFORMANCE = 'turbospark.startup.performance';
export const EVENT_MEMORY_USAGE = 'turbospark.memory.usage';
export const EVENT_PERFORMANCE_BASELINE = 'turbospark.performance.baseline';
export const EVENT_PERFORMANCE_REGRESSION = 'turbospark.performance.regression';

// Managed Auto-Memory Events
export const EVENT_MEMORY_EXTRACT = 'turbospark.memory.extract';
export const EVENT_MEMORY_DREAM = 'turbospark.memory.dream';
export const EVENT_MEMORY_RECALL = 'turbospark.memory.recall';

// Session Tracing Span Names
export const SPAN_INTERACTION = 'turbospark.interaction';
export const SPAN_LLM_REQUEST = 'turbospark.llm_request';
export const SPAN_TOOL = 'turbospark.tool';
export const SPAN_TOOL_EXECUTION = 'turbospark.tool.execution';
/** Brackets the time a tool spends in `awaiting_approval` waiting on the user. */
export const SPAN_TOOL_BLOCKED_ON_USER = 'turbospark.tool.blocked_on_user';
/** Wraps each pre/post-tool-use hook fire site for per-hook latency / decision tracking. */
export const SPAN_HOOK = 'turbospark.hook';
/**
 * Wraps a single subagent invocation. Parents the LLM/tool/hook spans the
 * subagent emits, so concurrent subagents (parallel AGENT tool calls) get
 * isolated subtrees instead of interleaving under the parent interaction
 * (#3731 Phase 3).
 */
export const SPAN_SUBAGENT = 'turbospark.subagent';
