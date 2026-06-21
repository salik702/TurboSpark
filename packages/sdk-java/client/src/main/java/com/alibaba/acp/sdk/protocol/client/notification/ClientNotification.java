package com.turbospark.acp.sdk.protocol.client.notification;

import com.turbospark.acp.sdk.protocol.jsonrpc.MethodMessage;

public class ClientNotification<P> extends MethodMessage<P> {
    public ClientNotification() {
        super();
    }

    public ClientNotification(String method, P params) {
        super(method, params);
    }
}
