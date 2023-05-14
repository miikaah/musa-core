import https, { RequestOptions } from "https";

export type Options = RequestOptions & { body?: URLSearchParams };

export const httpsClient = async <T>(options: Options): Promise<T> => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        resolve(JSON.parse(responseData));
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body.toString());
    }

    req.end();
  });
};
