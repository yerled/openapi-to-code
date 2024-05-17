export const controllerTemplate = `
// @ts-ignore
/* eslint-disable */
{{{ controllerHeader }}}
 
{{#each module.routes}}
{{#with this}}
/** {{placeholder description "此处后端没有提供注释"}} {{upper method}} {{url}} */

{{/with}}
{{/each}}
`;
