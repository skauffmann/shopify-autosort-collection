import { GraphQLClient } from 'graphql-request';
import { RequestConfig } from 'graphql-request/build/esm/types';

export class GraphQLClientRateLimitRetry {
  url: string;
  options: any;
  maxRetries: number;
  delay: number;
  client: GraphQLClient;

  constructor(url: string, options: RequestConfig, maxRetries: number = 5, delay: number = 1000) {
    this.url = url;
    this.options = options;
    this.maxRetries = maxRetries;
    this.delay = delay;
    this.client = new GraphQLClient(url, options);
  }

  async request(query: string, variables?: any) {
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        const data = await this.client.request(query, variables);
        return data;
      } catch (error) {
        if (error.response && error.response.errors) {
          const rateLimitError = error.response.errors.find(
            (err: any) => err.extensions && err.extensions.code === 'THROTTLED'
          );
          if (rateLimitError) {
            console.log('Rate limited. Retrying after delay...');
            await new Promise(resolve => setTimeout(resolve, this.delay * (retries + 1)));
            retries++;
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries reached. Request failed.');
  }
}
