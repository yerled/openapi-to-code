import { OpenAPIObject } from 'openapi3-ts';
import { ModuleItem, OpenapiDataParser, ParserResult } from '../parser';
import Handlebars from 'handlebars';
import _ from 'lodash';
import { writeFile } from '../util';
import './_handlebars';

export interface IGeneratorConfig {
  _debug?: boolean;
  basePath?: string;
  namespace?: string;
}

export const DEFAULT_BASE_CONFIG: IGeneratorConfig = {
  basePath: './src-openapi',
  namespace: 'API',
};

export class BaseGenerator {
  protected config: IGeneratorConfig;

  protected data?: ParserResult;

  constructor(parser: OpenapiDataParser, config: IGeneratorConfig) {
    this.config = _.merge(DEFAULT_BASE_CONFIG, config);
    this.data = parser.GetResult();
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
    console.log('BaseGenerator Generate');
  }
}
