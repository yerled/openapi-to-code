import Handlebars from 'handlebars';
import { BaseGenerator, IGeneratorConfig } from './_base';
import { ModuleItem, OpenapiDataParser, RouteItem } from '../parser';
import Log from '../log';
import path from 'path';
import _ from 'lodash';
import { TableConfig, TablePage } from './pages.template';

export type PageGeneratorConfig = IGeneratorConfig & {
  pageFolder?: string;
};

const DEFAULT_PAGE_CONFIG: PageGeneratorConfig = {
  pageFolder: 'pages',
};

export class PageGenerator extends BaseGenerator {
  config: PageGeneratorConfig;

  constructor(parser: OpenapiDataParser, config: PageGeneratorConfig) {
    super(parser, _.merge(DEFAULT_PAGE_CONFIG, config));
  }

  public Generate() {
    // TODO clear old files

    this._generatePages();

    // 打印日志
    Log(`✅ PageGenerator Generate success!`);
  }

  private _generatePages() {
    this.data.modules?.forEach((module) => {
      module.routes.forEach((route) => {
        if (route.name === 'page') {
          this._generateTablePage(route, module);
        }
      });
    });
  }

  private _generateTablePage(route: RouteItem, module: ModuleItem) {
    this._generateTableConfig(route, module);
    this.genFile({
      path: path.join(this.config.basePath, module.name, this.config.pageFolder),
      fileName: `${_.capitalize(_.camelCase(`${module.name}`))}Table.tsx`,
      template: TablePage,
      params: {
        namespace: this.config.namespace,
        entity: route.response,
        module: module.name,
      },
    });
  }

  private _generateTableConfig(route: RouteItem, module: ModuleItem) {
    const capitalizedModuleName = _.capitalize(_.camelCase(`${module.name}`));
    this.genFile({
      path: path.join(this.config.basePath, module.name, this.config.pageFolder),
      fileName: `config.tsx`,
      template: TableConfig,
      params: {
        namespace: this.config.namespace,
        moduleName: module.name,
        moduleDesc: module.desc,
        capitalizedModuleName,
        entity: `${'Tag'}`,
      },
    });
  }
}
