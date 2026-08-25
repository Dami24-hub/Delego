import { http, HttpResponse } from "msw";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.example.com";

export const healthHandlers = [
  http.get(`${BASE_URL}/health`, () =>
    HttpResponse.json({
      data: {
        status: "ok",
        service: "gateway",
        version: "0.0.1",
        timestamp: new Date().toISOString(),
      },
      error: null,
    })
  ),
];
