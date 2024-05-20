import handlebars from 'handlebars';
import { APIProperty } from '../parser';
import { camelCase, capitalize } from 'lodash';

handlebars.registerHelper({
  upper: (str: string) => str?.toUpperCase(),
  lower: (str: string) => str?.toLowerCase(),
  capitalize: (str: string) => capitalize(str),
  camelCase: (str: string) => camelCase(str),
  safe: (str: string) => new handlebars.SafeString(str),
  placeholder: (str: string, placeholder: any) => str || placeholder,
  stringify: (obj: any) => JSON.stringify(obj, null, 2),
  property: (obj: APIProperty) =>
    `${obj.name}${obj.required === false ? '?' : ''}: ${obj.type};${
      obj.desc ? ' // ' + obj.desc : ''
    }`,
  stringTemplate: (str: string) => str?.replace(/{/g, '${'),
});
