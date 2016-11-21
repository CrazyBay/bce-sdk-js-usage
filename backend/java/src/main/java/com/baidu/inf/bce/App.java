package com.baidu.inf.bce;

import java.io.IOException;
import java.util.Map;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

import fi.iki.elonen.NanoHTTPD;

public class App extends NanoHTTPD {
    private static final DateFormat sdf = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");

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
        System.out.println("Java " + System.getProperty("java.version")
            + " Development Server started at " + sdf.format(new Date()));
        System.out.println("Listening on http://localhost:" + (Config.port + 1));
        System.out.println("Press Ctrl-C to quit.");
        App app = new App(Config.port + 1);
        app.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);
    }
}
