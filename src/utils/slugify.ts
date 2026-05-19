
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .trim();
};

export const generateSlug = (name: string): string => {
  return slugify(name);
};
