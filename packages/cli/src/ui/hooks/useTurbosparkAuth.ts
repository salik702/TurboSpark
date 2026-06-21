/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import {
  AuthType,
  qwenOAuth2Events,
  TurbosparkOAuth2Event,
  type DeviceAuthorizationData,
} from '@turbospark/turbospark-core';

export interface TurbosparkAuthState {
  deviceAuth: DeviceAuthorizationData | null;
  authStatus:
    | 'idle'
    | 'polling'
    | 'success'
    | 'error'
    | 'timeout'
    | 'rate_limit';
  authMessage: string | null;
}

export interface ExternalAuthState {
  title: string;
  message: string;
  detail?: string;
}

export const useTurbosparkAuth = (
  pendingAuthType: AuthType | undefined,
  isAuthenticating: boolean,
) => {
  const [qwenAuthState, setTurbosparkAuthState] = useState<TurbosparkAuthState>({
    deviceAuth: null,
    authStatus: 'idle',
    authMessage: null,
  });

  const isTurbosparkAuth = pendingAuthType === AuthType.QWEN_OAUTH;

  // Set up event listeners when authentication starts
  useEffect(() => {
    if (!isTurbosparkAuth || !isAuthenticating) {
      // Reset state when not authenticating or not Qwen auth
      setTurbosparkAuthState({
        deviceAuth: null,
        authStatus: 'idle',
        authMessage: null,
      });
      return;
    }

    setTurbosparkAuthState((prev) => ({
      ...prev,
      authStatus: 'idle',
    }));

    // Set up event listeners
    const handleDeviceAuth = (deviceAuth: DeviceAuthorizationData) => {
      setTurbosparkAuthState((prev) => ({
        ...prev,
        deviceAuth: {
          verification_uri: deviceAuth.verification_uri,
          verification_uri_complete: deviceAuth.verification_uri_complete,
          user_code: deviceAuth.user_code,
          expires_in: deviceAuth.expires_in,
          device_code: deviceAuth.device_code,
        },
        authStatus: 'polling',
      }));
    };

    const handleAuthProgress = (
      status: 'success' | 'error' | 'polling' | 'timeout' | 'rate_limit',
      message?: string,
    ) => {
      setTurbosparkAuthState((prev) => ({
        ...prev,
        authStatus: status,
        authMessage: message || null,
      }));
    };

    // Add event listeners
    qwenOAuth2Events.on(TurbosparkOAuth2Event.AuthUri, handleDeviceAuth);
    qwenOAuth2Events.on(TurbosparkOAuth2Event.AuthProgress, handleAuthProgress);

    // Cleanup event listeners when component unmounts or auth finishes
    return () => {
      qwenOAuth2Events.off(TurbosparkOAuth2Event.AuthUri, handleDeviceAuth);
      qwenOAuth2Events.off(TurbosparkOAuth2Event.AuthProgress, handleAuthProgress);
    };
  }, [isTurbosparkAuth, isAuthenticating]);

  const cancelTurbosparkAuth = useCallback(() => {
    // Emit cancel event to stop polling
    qwenOAuth2Events.emit(TurbosparkOAuth2Event.AuthCancel);

    setTurbosparkAuthState({
      deviceAuth: null,
      authStatus: 'idle',
      authMessage: null,
    });
  }, []);

  return {
    qwenAuthState,
    turbosparkAuthState: qwenAuthState,
    cancelTurbosparkAuth,
  };
};
