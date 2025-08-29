import axios, { AxiosResponse } from "axios";

export class HttpError extends Error {
  public status: number;
  // eslint-disable-next-line
  public response: any;
  public url: string;

  // eslint-disable-next-line
  constructor(status: number, message: string, response: any, url: string) {
    super(message);
    this.status = status;
    this.response = response;
    this.url = url;
  }

  toString() {
    return `HttpError: ${this.status} - ${this.message} (URL: ${this.url})`;
  }
}

interface InitOptions {
  skipError?: boolean;
  allowStatus?: number[];
}

export async function getFromAnyServer(
  url: string,
  init: InitOptions = { skipError: false },
): Promise<AxiosResponse> {
  return axios
    .get(url, {
      headers: { "Content-Type": "application/json" },
    })
    .then((response) => responseHandler(response, url, init))
    .catch(errorHandler);
}

async function responseHandler(
  response: AxiosResponse,
  url: string,
  init: InitOptions = { skipError: false, allowStatus: [200, 201, 204] },
): Promise<AxiosResponse> {
  if (response.status !== 200 && !init.skipError) {
    const text = JSON.stringify(response.data);
    // eslint-disable-next-line
    let jsonResponse: any;

    try {
      jsonResponse = JSON.parse(text);
    } catch {
      throw new HttpError(response.status, text, text, url);
    }

    let message = "An error occurred";
    if (jsonResponse?.errors) {
      message = jsonResponse.errors
        .map((error: { detail: string }) => error.detail)
        .join("\n");
    } else if (jsonResponse?.message) {
      message = jsonResponse.message;
    }

    throw new HttpError(response.status, message, jsonResponse, url);
  }

  return response;
}

// eslint-disable-next-line
function errorHandler(error: any): never {
  if (axios.isAxiosError(error) && error.response) {
    const { status, data, config } = error.response;
    const message = data?.message || "An unexpected error occurred.";

    throw new HttpError(status, message, data, config.url || "Unknown URL");
  } else {
    throw new HttpError(
      0,
      "Network error or server is unreachable",
      null,
      "Unknown URL",
    );
  }
}
