declare module 'xhr' {
  type XhrOptions =
    | string
    | {
        useXDR?: boolean;
        sync?: boolean;
        uri?: string;
        url?: string;
        method?: string;
        timeout?: number;
        headers?: any;
        body?: string | any;
        json?: boolean | any;
        username?: string;
        password?: string;
        withCredentials?: boolean;
        responseType?: string;
        beforeSend?: () => void;
      };

  interface XhrResponse {
    body: any;
    statusCode: number;
    method: String;
    headers: any;
    url: string;
  }

  type Callback<T> = (err: any, response: T, body: any) => void;

  function xhr(options: XhrOptions, callback: Callback<XhrResponse>): XMLHttpRequest;

  export = xhr;
}
