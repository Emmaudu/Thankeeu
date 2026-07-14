const supabase = require('../utils/supabase');
const { RESERVED_SLUGS } = require('../utils/companySlug');

const APP_DOMAIN = (process.env.APP_DOMAIN || 'thankeeu.com').toLowerCase();

const cleanHost = (value = '') => {
  const host = String(value).split(',')[0].trim().toLowerCase();
  return host.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
};

const getRequestHost = (req) => cleanHost(req.headers['x-forwarded-host'] || req.headers.host || '');

const extractWorkspaceSlug = (host) => {
  const cleaned = cleanHost(host);
  if (!cleaned) return null;

  if (cleaned.endsWith('.localhost')) {
    const subdomain = cleaned.slice(0, -'.localhost'.length).split('.').pop();
    return subdomain && !RESERVED_SLUGS.has(subdomain) ? subdomain : null;
  }

  if (cleaned.endsWith(`.${APP_DOMAIN}`)) {
    const subdomain = cleaned.slice(0, -(APP_DOMAIN.length + 1)).split('.').pop();
    return subdomain && !RESERVED_SLUGS.has(subdomain) ? subdomain : null;
  }

  return null;
};

const tenantResolver = async (req, res, next) => {
  try {
    const headerSlug = req.headers['x-workspace-slug']
      ? String(req.headers['x-workspace-slug']).toLowerCase().trim()
      : null;
    const hostSlug = extractWorkspaceSlug(getRequestHost(req));
    const originSlug = extractWorkspaceSlug(req.headers.origin || req.headers.referer || '');
    const slug = headerSlug || hostSlug || originSlug;
    if (!slug) return next();

    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, email, contact_person, role, theme, logo_url, country, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!company) {
      return res.status(404).json({
        error: 'Workspace not found',
        code: 'WORKSPACE_NOT_FOUND',
      });
    }

    req.workspaceSlug = slug;
    req.tenantCompany = company;
    req.organization = company;
    next();
  } catch (err) {
    console.error('[tenantResolver]', err.message);
    res.status(500).json({ error: 'Failed to resolve workspace' });
  }
};

const requireTenantMatch = (req, companyId) => {
  return !req.tenantCompany || req.tenantCompany.id === companyId;
};

module.exports = {
  tenantResolver,
  extractWorkspaceSlug,
  requireTenantMatch,
};
