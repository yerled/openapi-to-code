import Log from '../log';
import path from 'path';
import { OpenapiDataParser } from '../parser';
import { BaseGenerator, IGeneratorConfig } from './_base';

export type ServiceGeneratorConfig = IGeneratorConfig & {
  serviceFolder?: string;
};

export class ServiceGenerator extends BaseGenerator {
  config: ServiceGeneratorConfig;

  constructor(parser: OpenapiDataParser, config: ServiceGeneratorConfig) {
    super(
      parser,
      Object.assign(
        {
          serviceFolder: 'service',
        },
        config,
      ),
    );
  }

  public Generate() {
    // TODO clear old files

    this._generateInterface();
    this._generateService();
    this._generateIndex();

    // 打印日志
    Log(`✅ ServiceGenerator Generate success!`);
  }

  private _generateInterface() {
    this.genFile({
      path: path.join(this.config.basePath),
      fileName: 'typings.d.ts',
      template: '',
      params: {},
    });
  }

  private _generateService() {
    this.data?.forEach((module) => {
      this.genFile({
        path: path.join(this.config.basePath, module.name, this.config.serviceFolder),
        fileName: `${module.name}.ts`,
        template: '{{ name }}',
        params: module,
      });
    });
  }

  private _generateIndex() {}
}
