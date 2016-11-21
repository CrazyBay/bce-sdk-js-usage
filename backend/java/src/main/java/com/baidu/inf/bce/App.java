package com.baidu.inf.bce;

import java.io.IOException;
import java.util.Map;

import fi.iki.elonen.NanoHTTPD;

public class App extends NanoHTTPD {
    public App(int port) {
        super(port);
    }

    @Override
    public Response serve(IHTTPSession session) {
        Map<String, String> params = session.getParms();
        String httpMethod = params.get("httpMethod");
        String path = params.get("path");
        String queries = params.get("queries");
        String headers = params.get("headers");
        String policy = params.get("policy");
        String sts = params.get("sts");
        String callback = params.get("callback");

        String responseBody = new SignatureDemo(Config.ak, Config.sk).doIt(httpMethod, path,
                queries, headers, policy, sts, callback);
        Response response = newFixedLengthResponse(responseBody);
        response.addHeader("Content-Type", "text/javascript");
        return response;
    }

    public static void main(String args[]) throws IOException {
        App app = new App(Config.port + 1);
        app.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);
    }
}
