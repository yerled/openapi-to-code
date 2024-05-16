import { OpenAPIObject } from 'openapi3-ts';
import { OpenapiDataParser } from '../parser';
import Handlebars from 'handlebars';
import { writeFile } from '../util';

export interface IGeneratorConfig {
  basePath?: string;
  namespace?: string;
}

export class BaseGenerator {
  protected config: IGeneratorConfig;

  protected data?: ReturnType<OpenapiDataParser['GetResult']>;

  constructor(parser: OpenapiDataParser, config: IGeneratorConfig) {
    this.data = parser.GetResult();
    this.config = Object.assign(
      { basePath: './src/server', namespace: 'API' } as IGeneratorConfig,
      config,
    );
  }

  protected genFile(params: {
    path: string;
    fileName: string;
    template: string;
    params: Record<string, any>;
  }) {
    try {
      const template = Handlebars.compile(params.template);
      return writeFile(params.path, params.fileName, template(params.params));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[GenSDK] file gen fail:', JSON.stringify(params));
      throw error;
    }
  }

  // 生成代码
  public Generate() {
    console.log('generate');
  }
}
