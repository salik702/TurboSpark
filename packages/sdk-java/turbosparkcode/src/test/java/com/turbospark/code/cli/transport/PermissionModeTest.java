package com.turbospark.code.cli.transport;

import com.turbospark.code.cli.protocol.data.PermissionMode;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class PermissionModeTest {

    @Test
    public void shouldBeReturnTurbosparkPermissionModeValue() {
        assertEquals("default", PermissionMode.DEFAULT.getValue());
        assertEquals("plan", PermissionMode.PLAN.getValue());
        assertEquals("auto-edit", PermissionMode.AUTO_EDIT.getValue());
        assertEquals("yolo", PermissionMode.YOLO.getValue());
    }

}
