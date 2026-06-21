package com.turbospark.code.cli;

import java.util.List;

import com.turbospark.code.cli.transport.TransportOptions;

import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.junit.jupiter.api.Assertions.*;

class TurbosparkCliTest {

    private static final Logger log = LoggerFactory.getLogger(TurbosparkCliTest.class);
    @Test
    void simpleQuery() {
        List<String> result = TurbosparkCli.simpleQuery("hello world");
        log.info("simpleQuery result: {}", result);
        assertNotNull(result);
    }

    @Test
    void simpleQueryWithModel() {
        List<String> result = TurbosparkCli.simpleQuery("hello world", new TransportOptions().setModel("qwen-plus"));
        log.info("simpleQueryWithModel result: {}", result);
        assertNotNull(result);
    }
}
