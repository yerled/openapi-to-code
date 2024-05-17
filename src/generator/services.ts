import Log from '../log';
import path from 'path';
import { OpenapiDataParser } from '../parser';
import { BaseGenerator, IGeneratorConfig } from './_base';
import { controllerTemplate, interfaceTemplate } from './services.template';
import _ from 'lodash';

export type ServiceGeneratorConfig = IGeneratorConfig & {
  controllerHeader?: string;
  serviceFolder?: string;
  requestOptionsType?: string;
};

const DEFAULT_SERVICE_CONFIG: ServiceGeneratorConfig = {
  controllerHeader: '',
  serviceFolder: 'services',
  requestOptionsType: 'Record<string, any>',
};

export class ServiceGenerator extends BaseGenerator {
  config: ServiceGeneratorConfig;

  constructor(parser: OpenapiDataParser, config: ServiceGeneratorConfig) {
    super(parser, _.merge(DEFAULT_SERVICE_CONFIG, config));
  }

  public Generate() {
    // TODO clear old files

    this._generateTypes();
    this._generateControllers();

    // 打印日志
    Log(`✅ ServiceGenerator Generate success!`);
  }

  private _generateTypes() {
    this.genFile({
      path: path.join(this.config.basePath),
      fileName: 'typings.d.ts',
      template: interfaceTemplate,
      params: {
        namespace: this.config.namespace,
        types: this.data?.types,
      },
    });
  }

  private _generateControllers() {
    this.data.modules?.forEach((module) => {
      this.genFile({
        path: path.join(this.config.basePath, module.name, this.config.serviceFolder),
        fileName: `${module.name}.ts`,
        template: controllerTemplate,
        params: {
          debug: this.config.debug,
          namespace: this.config.namespace,
          controllerHeader: this.config.controllerHeader,
          requestOptionsType: this.config.requestOptionsType,
          module: {
            ...module,
            routes: module.routes.map((route) => {
              return {
                ...route,
                _queryParams: route.params.filter((param) => param.in === 'query'),
                _pathParams: route.params.filter((param) => param.in === 'path'),
                _responseType: route.response.type,
              };
            }),
          },
        },
      });
    });
  }
}
