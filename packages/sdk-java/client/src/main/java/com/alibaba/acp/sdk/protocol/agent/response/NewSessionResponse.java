package com.turbospark.acp.sdk.protocol.agent.response;

import com.turbospark.acp.sdk.protocol.domain.session.SessionModeState;
import com.turbospark.acp.sdk.protocol.jsonrpc.Response;

import static com.turbospark.acp.sdk.protocol.agent.response.NewSessionResponse.NewSessionResponseResult;

public class NewSessionResponse extends Response<NewSessionResponseResult> {
    public static class NewSessionResponseResult {
        private String sessionId;
        private SessionModeState modes;

        // Getters and setters
        public String getSessionId() {
            return sessionId;
        }

        public void setSessionId(String sessionId) {
            this.sessionId = sessionId;
        }

        public SessionModeState getModes() {
            return modes;
        }

        public void setModes(SessionModeState modes) {
            this.modes = modes;
        }
    }
}
