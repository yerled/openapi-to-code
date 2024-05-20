import handlebars from 'handlebars';

export const controllerTemplate = `
// @ts-ignore
/* eslint-disable */
{{{ controllerHeader }}}

{{#each module.routes}}
{{#if ../debug}}
/**
  params: {{{stringify params}}}
  body: {{{stringify body}}}
 */
{{/if}}
/** {{placeholder desc "此处后端没有提供注释"}} {{upper method}} {{url}} */
export async function {{ fullName }}(
{{#if params.length}}
params: {
  {{#each params}}
  {{property this}}
  {{/each}}
},
{{/if}}
{{#if body}}
body: {{body.type}},
{{/if}}
options?: {{ ../requestOptionsType }}
) {
  {{#if params.length}}
  const { {{#each _pathParams}}{{name}},{{/each}} {{#if _queryParams}}...queryParams{{/if}} } = params;
  {{/if}}
  return request<{{{_responseType}}}>(\`{{stringTemplate url}}\`, {
    method: '{{method}}',
    {{#if _queryParams.length}}
    params: {
      ...queryParams,
    },
    {{/if}}
    {{#if body}}
    data: body,
    {{/if}}
    ...options,
  });
}

{{/each}}

export const {{module.name}}Service = {
{{#each module.routes}}
  {{name}}: {{ fullName }},
{{/each}}
};
  
`;

export const interfaceTemplate = `
declare namespace {{ namespace }} {
  {{#each types}}
  type {{name}} = {
    {{#each props}}
    {{{property this}}}
    {{/each}}
  }
  
  {{/each}}
}
`;
