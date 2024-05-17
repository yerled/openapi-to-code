import handlebars from 'handlebars';

handlebars.registerHelper({
  upper: (str: string) => str?.toUpperCase(),
  lower: (str: string) => str?.toLowerCase(),
  safe: (str: string) => new handlebars.SafeString(str),
  placeholder: (str: string, placeholder: any) => str || placeholder,
});
