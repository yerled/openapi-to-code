import Log from '../log';
import path from 'path';
import { OpenapiDataParser } from '../parser';
import { BaseGenerator, IGeneratorConfig } from './_base';
import { controllerTemplate } from './services.template';

export type ServiceGeneratorConfig = IGeneratorConfig & {
  controllerHeader?: string;
  serviceFolder?: string;
};

const DEFAULT_SERVICE_FOLDER = 'services';

export class ServiceGenerator extends BaseGenerator {
  config: ServiceGeneratorConfig;

  constructor(parser: OpenapiDataParser, config: ServiceGeneratorConfig) {
    super(
      parser,
      Object.assign(
        {
          serviceFolder: DEFAULT_SERVICE_FOLDER,
        },
        config,
      ),
    );
  }

  public Generate() {
    // TODO clear old files

    this._generateInterface();
    this._generateController();
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

  private _generateController() {
    this.data?.forEach((module) => {
      this.genFile({
        path: path.join(this.config.basePath, module.name, this.config.serviceFolder),
        fileName: `${module.name}.ts`,
        template: controllerTemplate,
        params: {
          module,
          namespace: this.config.namespace,
          controllerHeader: this.config.controllerHeader,
        },
      });
    });
  }

  private _generateIndex() {}
}
