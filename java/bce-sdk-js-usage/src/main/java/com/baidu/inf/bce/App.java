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

        String ak = System.getenv("AK");
        String sk = System.getenv("SK");
        String responseBody = new SignatureDemo(ak, sk).doIt(httpMethod, path,
                queries, headers, policy, sts, callback);
        Response response = newFixedLengthResponse(responseBody);
        response.addHeader("Content-Type", "text/javascript");
        return response;
    }

    public static void main(String args[]) throws IOException {
        App app = new App(7788);
        app.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);
    }
}
