const slugify = require('slugify');

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'assets',
  'blog',
  'cdn',
  'company',
  'games',
  'help',
  'mail',
  'support',
  'www',
]);

const normalizeCompanySlug = (value) => {
  const slug = slugify(String(value || ''), {
    lower: true,
    strict: true,
    trim: true,
  }).replace(/-+/g, '-').replace(/^-|-$/g, '');

  return slug || 'company';
};

const createBaseCompanySlug = (companyName) => {
  let slug = normalizeCompanySlug(companyName);
  if (RESERVED_SLUGS.has(slug)) slug = `${slug}-company`;
  return slug;
};

const generateUniqueCompanySlug = async (supabase, companyName) => {
  const base = createBaseCompanySlug(companyName);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return candidate;

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

module.exports = {
  RESERVED_SLUGS,
  normalizeCompanySlug,
  createBaseCompanySlug,
  generateUniqueCompanySlug,
};
